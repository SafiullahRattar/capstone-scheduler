/*
 * Schedule generation using backtracking to find all conflict-free timetables.
 * 
 * Given a list of courses, try all possible section combinations and keep the ones
 * where no two sections have overlapping times.
 * 
 * We use backtracking because it's efficient for this problem - we can stop exploring
 * a branch as soon as we detect a conflict, rather than generating all combinations first.
 */

import { Router, Request, Response } from 'express'
import { prisma } from '../index'
import { validatePrerequisites } from '../../cli/prerequisite-validator'

const router = Router()

interface TimeSlot {
  day: string
  startTime: string
  endTime: string
}

interface Section {
  id: string
  courseId: string
  crn: string | null
  sectionCode: string
  sectionType: string
  instructor: string | null
  days: string | null
  startTime: string | null
  endTime: string | null
  location: string | null
  capacity: number | null
  enrolled: number | null
}

interface ScheduleSelection {
  courseId: string
  section: Section
}

interface GeneratedSchedule {
  id: number
  selections: ScheduleSelection[]
  hasConflicts: boolean
  score?: number
  prerequisiteInfo?: {
    [courseId: string]: {
      isValid: boolean
      reason?: string
      missingCourses?: string[]
      expressionEvaluated: string
    }
  }
}

// Convert day abbreviations (MWF) to full names (Monday, Wednesday, Friday)
function parseDays(daysStr: string | null): string[] {
  if (!daysStr) return []
  
  const dayMap: { [key: string]: string } = {
    'M': 'Monday',
    'T': 'Tuesday',
    'W': 'Wednesday',
    'R': 'Thursday',
    'F': 'Friday'
  }
  
  return daysStr.split('').map(d => dayMap[d] || d).filter(d => d)
}

// Check if two time slots overlap on the same day
// Two classes conflict if they're on the same day and one starts before the other ends
function hasTimeConflict(slot1: TimeSlot, slot2: TimeSlot): boolean {
  if (slot1.day !== slot2.day) return false
  
  // Convert times like "0835" to minutes (8*60 + 35 = 515 minutes since midnight)
  const parseTime = (time: string): number => {
    if (time.length === 4) {
      const hours = parseInt(time.substring(0, 2))
      const minutes = parseInt(time.substring(2, 4))
      return hours * 60 + minutes
    }
    return 0
  }
  
  const start1 = parseTime(slot1.startTime)
  const end1 = parseTime(slot1.endTime)
  const start2 = parseTime(slot2.startTime)
  const end2 = parseTime(slot2.endTime)
  
  return start1 < end2 && start2 < end1
}

// Turn a section's schedule into individual time slots (one per day it meets)
function getTimeSlots(section: Section): TimeSlot[] {
  if (!section.days || !section.startTime || !section.endTime) {
    return []
  }
  
  const days = parseDays(section.days)
  return days.map(day => ({
    day,
    startTime: section.startTime!,
    endTime: section.endTime!
  }))
}

// Check if adding this section would create a time conflict with what's already in the schedule
function hasConflictWithSelections(
  section: Section,
  currentSelections: ScheduleSelection[]
): boolean {
  const newTimeSlots = getTimeSlots(section)
  
  for (const selection of currentSelections) {
    const existingTimeSlots = getTimeSlots(selection.section)
    
    for (const newSlot of newTimeSlots) {
      for (const existingSlot of existingTimeSlots) {
        if (hasTimeConflict(newSlot, existingSlot)) {
          return true
        }
      }
    }
  }
  
  return false
}

// Organize course sections by type (lecture, lab, tutorial)
function groupSectionsByType(sections: Section[]): { [type: string]: Section[] } {
  const grouped: { [type: string]: Section[] } = {}
  
  for (const section of sections) {
    if (!grouped[section.sectionType]) {
      grouped[section.sectionType] = []
    }
    grouped[section.sectionType].push(section)
  }
  
  return grouped
}

// Generate all possible combinations when a course needs multiple section types
// For example, if AERO2001 has 3 lectures and 2 labs, create all 6 LEC+LAB pairs
function generateSectionCombinations(
  courseId: string,
  sectionsByType: { [type: string]: Section[] }
): Section[][] {
  const types = Object.keys(sectionsByType)
  
  if (types.length === 0) return []
  if (types.length === 1) {
    return sectionsByType[types[0]].map(section => [section])
  }
  
  const combinations: Section[][] = []
  
  function buildCombination(typeIndex: number, current: Section[]) {
    if (typeIndex === types.length) {
      combinations.push([...current])
      return
    }
    
    const currentType = types[typeIndex]
    for (const section of sectionsByType[currentType]) {
      current.push(section)
      buildCombination(typeIndex + 1, current)
      current.pop()
    }
  }
  
  buildCombination(0, [])
  return combinations
}

// Make sure a course's lecture doesn't conflict with its own lab/tutorial
function hasInternalConflicts(sections: Section[]): boolean {
  for (let i = 0; i < sections.length; i++) {
    for (let j = i + 1; j < sections.length; j++) {
      const slots1 = getTimeSlots(sections[i])
      const slots2 = getTimeSlots(sections[j])
      
      for (const slot1 of slots1) {
        for (const slot2 of slots2) {
          if (hasTimeConflict(slot1, slot2)) {
            return true
          }
        }
      }
    }
  }
  return false
}

// Main backtracking function - recursively try section combinations until we find valid schedules
// For courses with multiple section types (LEC+LAB), we try all combinations
function generateSchedulesRecursive(
  courseSections: { courseId: string; sections: Section[] }[],
  currentIndex: number,
  currentSelections: ScheduleSelection[],
  maxSchedules: number,
  result: GeneratedSchedule[]
): void {
  // Base case: Found a complete schedule
  if (currentIndex === courseSections.length) {
    result.push({
      id: result.length + 1,
      selections: [...currentSelections],
      hasConflicts: false
    })
    return
  }
  
  // Stop if we've generated enough schedules
  if (result.length >= maxSchedules) {
    return
  }
  
  const { courseId, sections } = courseSections[currentIndex]
  
  // Group sections by type (LEC, LAB, TUT, etc.)
  const sectionsByType = groupSectionsByType(sections)
  
  // Generate all valid combinations (e.g., all LEC+LAB pairs)
  const combinations = generateSectionCombinations(courseId, sectionsByType)
  
  // Try each combination
  for (const sectionCombination of combinations) {
    // Skip if sections within this combination conflict with each other
    if (hasInternalConflicts(sectionCombination)) {
      continue
    }
    
    // Check if any section in this combination conflicts with existing selections
    let hasConflict = false
    for (const section of sectionCombination) {
      if (hasConflictWithSelections(section, currentSelections)) {
        hasConflict = true
        break
      }
    }
    
    if (!hasConflict) {
      // Add all sections in this combination
      for (const section of sectionCombination) {
        currentSelections.push({ courseId, section })
      }
      
      generateSchedulesRecursive(
        courseSections,
        currentIndex + 1,
        currentSelections,
        maxSchedules,
        result
      )
      
      // Backtrack by removing the sections we just tried
      for (let i = 0; i < sectionCombination.length; i++) {
        currentSelections.pop()
      }
    }
  }
}

// API endpoint to generate schedules
// Takes a list of course IDs and returns all possible conflict-free schedules
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { courseIds, term, maxSchedules = 50, completedCourses = [] } = req.body
    
    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'courseIds array is required'
      })
    }
    
    if (courseIds.length > 8) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Maximum 8 courses allowed to prevent timeout'
      })
    }
    
    // Get sections from database
    const courseSections = await Promise.all(
      courseIds.map(async (courseId: string) => {
        const sections = await prisma.section.findMany({
          where: {
            courseId: courseId.toUpperCase(),
            ...(term && { term })
          }
        })
        
        // Remove duplicate sections (in case same section was imported twice)
        const uniqueSections = sections.reduce((acc, section) => {
          const key = `${section.crn}-${section.sectionCode}-${section.days}-${section.startTime}-${section.endTime}`
          if (!acc.has(key)) {
            acc.set(key, section)
          }
          return acc
        }, new Map())
        
        return {
          courseId: courseId.toUpperCase(),
          sections: Array.from(uniqueSections.values()) as Section[]
        }
      })
    )
    
    // Make sure all courses have at least one section
    const coursesWithoutSections = courseSections.filter(cs => cs.sections.length === 0)
    if (coursesWithoutSections.length > 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: `No sections found for courses: ${coursesWithoutSections.map(cs => cs.courseId).join(', ')}`
      })
    }
    
    // Run backtracking algorithm
    const schedules: GeneratedSchedule[] = []
    generateSchedulesRecursive(courseSections, 0, [], maxSchedules, schedules)
    
    // Check prerequisites for courses in each schedule
    const transcript = {
      completedCourses: completedCourses.map((c: string) => c.toUpperCase()),
      currentYear: 'FOURTH_YEAR' as const
    }
    
    for (const schedule of schedules) {
      const prerequisiteInfo: { [courseId: string]: any } = {}
      
      for (const selection of schedule.selections) {
        const result = await validatePrerequisites(selection.courseId, transcript)
        prerequisiteInfo[selection.courseId] = {
          isValid: result.isValid,
          reason: result.reason,
          missingCourses: result.missingCourses,
          expressionEvaluated: result.expressionEvaluated
        }
      }
      
      schedule.prerequisiteInfo = prerequisiteInfo
    }
    
    res.json({
      schedules,
      count: schedules.length,
      requested: courseIds.length,
      maxSchedules
    })
  } catch (error) {
    console.error('Generate schedules error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate schedules'
    })
  }
})

export default router
