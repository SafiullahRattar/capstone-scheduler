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
 * Generate all valid schedules using backtracking
 * 
 * Algorithm: Recursive backtracking with constraint propagation
 * 
 * Pseudocode:
 * function generateSchedules(courses, currentIndex, currentSelections):
 *   if currentIndex == len(courses):
 *     return [currentSelections]  # Found a complete schedule
 *   
 *   allSchedules = []
 *   for section in courses[currentIndex].sections:
 *     if not hasConflict(section, currentSelections):
 *       newSelections = currentSelections + [section]
 *       allSchedules += generateSchedules(courses, currentIndex + 1, newSelections)
 *   
 *   return allSchedules
 * 
 * Optimization: Stop early if maxSchedules reached (prevents timeout on large inputs)
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
  
  // Try each section for current course
  for (const section of sections) {
    // Check if this section conflicts with existing selections
    if (!hasConflictWithSelections(section, currentSelections)) {
      // Add this section and recurse
      currentSelections.push({ courseId, section })
      generateSchedulesRecursive(
        courseSections,
        currentIndex + 1,
        currentSelections,
        maxSchedules,
        result
      )
      currentSelections.pop() // Backtrack
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
    const { courseIds, term, maxSchedules = 50 } = req.body
    
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
        
        return {
          courseId: courseId.toUpperCase(),
          sections: sections as Section[]
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
