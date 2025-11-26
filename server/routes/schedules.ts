/**
 * @file server/routes/schedules.ts
 * @description Schedule generation and conflict detection endpoints
 * 
 * Key Algorithm: Schedule Generation with Constraint Satisfaction
 * 
 * Problem: Given n courses, each with m sections, find all valid combinations
 * where no two sections have time conflicts.
 * 
 * This is a Constraint Satisfaction Problem (CSP):
 * - Variables: Section choice for each course
 * - Domain: All available sections for each course
 * - Constraints: No time conflicts between selected sections
 * 
 * Algorithm: Backtracking with Forward Checking
 * - Time Complexity: O(b^d) where b = avg sections per course, d = num courses
 * - Space Complexity: O(d) for recursion stack
 * - Optimizations: Early conflict detection, pruning invalid branches
 * 
 * For Defense: Explain why backtracking is appropriate here vs other algorithms
 * (branch and bound, dynamic programming, genetic algorithms)
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

/**
 * Parse days string (e.g., "MWF") into array of day names
 */
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

/**
 * Check if two time slots conflict
 * 
 * Algorithm: Interval overlap detection
 * Two intervals [a1, a2] and [b1, b2] overlap if: a1 < b2 AND b1 < a2
 * 
 * Time Complexity: O(1)
 */
function hasTimeConflict(slot1: TimeSlot, slot2: TimeSlot): boolean {
  if (slot1.day !== slot2.day) return false
  
  // Convert time strings to minutes since midnight
  const parseTime = (time: string): number => {
    if (time.length === 4) {
      // Format: "0835"
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

/**
 * Convert section to time slots
 */
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

/**
 * Check if a section conflicts with existing selections
 * 
 * Time Complexity: O(n * m) where n = selections, m = avg time slots per section
 */
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

/**
 * Group sections by type for a single course
 * Returns: { LEC: [...], LAB: [...], TUT: [...], ... }
 */
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

/**
 * Generate all combinations of section selections for a course
 * If a course has LEC + LAB, returns all (lecture, lab) pairs
 * 
 * Example: 3 LEC × 2 LAB = 6 combinations
 */
function generateSectionCombinations(
  courseId: string,
  sectionsByType: { [type: string]: Section[] }
): Section[][] {
  const types = Object.keys(sectionsByType)
  
  if (types.length === 0) return []
  if (types.length === 1) {
    // Only one type (e.g., just LEC) - return each section as a single-item array
    return sectionsByType[types[0]].map(section => [section])
  }
  
  // Multiple types - generate all combinations
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

/**
 * Check if a combination of sections (for one course) has internal conflicts
 */
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

/**
 * Generate all valid schedules using backtracking
 * 
 * Algorithm: Recursive backtracking with constraint propagation
 * 
 * NEW: For each course, we now consider all required section types:
 * - If course has only LEC: pick 1 lecture
 * - If course has LEC + LAB: pick 1 lecture AND 1 lab
 * - If course has LEC + LAB + TUT: pick 1 of each
 * 
 * This ensures complete course registrations
 */
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
      
      // Backtrack - remove all sections we just added
      for (let i = 0; i < sectionCombination.length; i++) {
        currentSelections.pop()
      }
    }
  }
}

/**
 * POST /api/schedules/generate
 * Generate all valid schedules for selected courses
 * 
 * Request Body:
 * - courseIds: Array of course IDs
 * - term: Term (e.g., "Fall 2024")
 * - maxSchedules: Max number of schedules to return (default 50)
 * 
 * Response: Array of valid schedules with no time conflicts
 */
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
    
    // Fetch all sections for requested courses
    const courseSections = await Promise.all(
      courseIds.map(async (courseId: string) => {
        const sections = await prisma.section.findMany({
          where: {
            courseId: courseId.toUpperCase(),
            ...(term && { term })
          }
        })
        
        // Deduplicate sections by sectionId + sectionCode + days + startTime + endTime
        // This handles cases where the same section was imported multiple times
        const uniqueSections = sections.reduce((acc, section) => {
          const key = `${section.sectionId}-${section.sectionCode}-${section.days}-${section.startTime}-${section.endTime}`
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
    
    // Check if all courses have sections
    const coursesWithoutSections = courseSections.filter(cs => cs.sections.length === 0)
    if (coursesWithoutSections.length > 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: `No sections found for courses: ${coursesWithoutSections.map(cs => cs.courseId).join(', ')}`
      })
    }
    
    // Generate schedules using backtracking
    const schedules: GeneratedSchedule[] = []
    generateSchedulesRecursive(courseSections, 0, [], maxSchedules, schedules)
    
    // Validate prerequisites for each schedule
    const transcript = {
      completedCourses: completedCourses.map((c: string) => c.toUpperCase()),
      currentYear: 'FOURTH_YEAR' as const // Assume 4th year for now
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
