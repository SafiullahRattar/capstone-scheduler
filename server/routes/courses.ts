/**
 * @file server/routes/courses.ts
 * @description Course management API endpoints
 * 
 * Design Pattern: Repository Pattern
 * - Abstracts database operations behind a clean API
 * - Makes testing easier by allowing mock repositories
 * 
 * Algorithm Documentation:
 * - Search uses Prisma's full-text search capabilities
 * - Results are paginated to prevent overwhelming the client
 * - Includes related data (prerequisites, sections) via eager loading
 */

import { Router, Request, Response } from 'express'
import { prisma } from '../index'

const router = Router()

/**
 * GET /api/courses/search
 * Search for courses by code or title
 * 
 * Query Parameters:
 * - q: Search query string
 * - limit: Max results to return (default 20, max 100)
 * 
 * Algorithm: Case-insensitive substring match on course code and title
 * Complexity: O(n) where n is number of courses (optimized by database index)
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, limit = '20' } = req.query
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Query parameter "q" is required' 
      })
    }

    const limitNum = Math.min(parseInt(limit as string) || 20, 100)
    
    // Search algorithm: OR condition on code and title
    // Uses Prisma's contains operator with case-insensitive mode
    // Only return courses that have sections available
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          {
            id: {
              contains: q.toUpperCase(),
              mode: 'insensitive'
            }
          },
          {
            title: {
              contains: q,
              mode: 'insensitive'
            }
          }
        ],
        sections: {
          some: {} // Only courses with at least one section
        }
      },
      include: {
        prerequisiteExpression: true,
        _count: {
          select: { sections: true }
        }
      },
      take: limitNum,
      orderBy: {
        id: 'asc'
      }
    })

    // Get section type information for each course
    const coursesWithSectionInfo = await Promise.all(
      courses.map(async (course) => {
        const sections = await prisma.section.findMany({
          where: { courseId: course.id },
          select: { sectionType: true },
          distinct: ['sectionType']
        })
        
        return {
          course,
          sectionTypes: sections.map(s => s.sectionType).sort()
        }
      })
    )
    
    // Transform database results to match frontend Course interface
    const transformedCourses = coursesWithSectionInfo.map(({ course, sectionTypes }) => ({
      code: course.id,
      name: course.title || 'No title available',
      credits: course.credits || 3,
      description: course.description || '',
      prerequisites: [], // Will be populated separately if needed
      type: 'core' as const, // This would come from a program-course mapping table
      sectionTypes: sectionTypes // NEW: e.g., ["LAB", "LEC"]
    }))

    res.json({
      results: transformedCourses,
      count: courses.length,
      query: q
    })
  } catch (error) {
    console.error('Course search error:', error)
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to search courses' 
    })
  }
})

/**
 * GET /api/courses/:courseId
 * Get detailed course information including prerequisites
 * 
 * Algorithm: Single database query with joins
 * - Fetches course data
 * - Eagerly loads prerequisite expression
 * - Recursively builds prerequisite tree from nodes
 */
router.get('/:courseId', async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params
    
    const course = await prisma.course.findUnique({
      where: { id: courseId.toUpperCase() },
      include: {
        prerequisiteExpression: true,
        prerequisiteNodes: {
          where: { nodeType: 'COURSE' },
          select: { requiredCourseId: true }
        },
        _count: {
          select: { sections: true }
        }
      }
    })

    if (!course) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Course ${courseId} not found`
      })
    }

    // Extract prerequisite course IDs from prerequisite nodes
    const prerequisites = course.prerequisiteNodes
      .filter(node => node.requiredCourseId)
      .map(node => node.requiredCourseId as string)

    const transformedCourse = {
      code: course.id,
      name: course.title || 'No title available',
      credits: course.credits || 3,
      description: course.description || '',
      prerequisites,
      prerequisiteExpression: course.prerequisiteExpression?.expression,
      sectionCount: course._count.sections
    }

    res.json(transformedCourse)
  } catch (error) {
    console.error('Get course error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch course details'
    })
  }
})

/**
 * GET /api/courses/:courseId/sections
 * Get all sections for a specific course with schedule information
 * 
 * Purpose: Provides timetable data for schedule generation
 * Returns: Section code, type, instructor, days, times, capacity
 */
router.get('/:courseId/sections', async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params
    const { term } = req.query
    
    const where: any = { courseId: courseId.toUpperCase() }
    if (term) {
      where.term = term
    }
    
    const sections = await prisma.section.findMany({
      where,
      orderBy: [
        { sectionType: 'asc' },
        { sectionCode: 'asc' }
      ]
    })

    if (sections.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: `No sections found for course ${courseId}`
      })
    }

    res.json({
      courseId: courseId.toUpperCase(),
      sections: sections.map(section => ({
        sectionId: section.id,
        sectionCode: section.sectionCode,
        type: section.sectionType,
        instructor: section.instructor || 'TBA',
        days: section.days,
        startTime: section.startTime,
        endTime: section.endTime,
        location: section.location,
        term: section.term,
        capacity: section.capacity,
        enrolled: section.enrolled,
        status: section.status
      }))
    })
  } catch (error) {
    console.error('Get sections error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch course sections'
    })
  }
})

/**
 * POST /api/courses/recommend-next
 * Recommend next courses to take based on completed courses
 * 
 * Body:
 * - completedCourses: Array of course IDs that have been completed
 * - program: Optional program name for program-specific recommendations
 * 
 * Algorithm:
 * 1. Find all courses where prerequisites are met
 * 2. Exclude already completed courses
 * 3. Filter to courses that have sections available
 * 4. Rank by: prerequisite complexity, availability, common next courses
 */
router.post('/recommend-next', async (req: Request, res: Response) => {
  try {
    const { completedCourses, program } = req.body
    
    if (!Array.isArray(completedCourses)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'completedCourses must be an array'
      })
    }

    // Get all courses with their prerequisites
    const allCourses = await prisma.course.findMany({
      include: {
        prerequisiteNodes: {
          where: { nodeType: 'COURSE' },
          select: { requiredCourseId: true }
        },
        _count: {
          select: { sections: true }
        }
      }
    })

    // Helper function to check if prerequisites are met
    const arePrerequisitesMet = (prerequisites: string[], completed: string[]): boolean => {
      if (prerequisites.length === 0) return true
      return prerequisites.every(prereq => completed.includes(prereq))
    }

    // Filter courses where:
    // 1. Not already completed
    // 2. Prerequisites are met
    // 3. Has sections available
    const recommendedCourses = allCourses
      .filter(course => {
        // Skip if already completed
        if (completedCourses.includes(course.id)) return false
        
        // Get prerequisites
        const prerequisites = course.prerequisiteNodes
          .filter(node => node.requiredCourseId)
          .map(node => node.requiredCourseId as string)
        
        // Check if prerequisites are met
        if (!arePrerequisitesMet(prerequisites, completedCourses)) return false
        
        // Must have sections available
        if (course._count.sections === 0) return false
        
        return true
      })
      .map(course => {
        const prerequisites = course.prerequisiteNodes
          .filter(node => node.requiredCourseId)
          .map(node => node.requiredCourseId as string)
        
        return {
          code: course.id,
          name: course.title || 'No title available',
          credits: course.credits || 3,
          description: course.description || '',
          prerequisites,
          sectionCount: course._count.sections,
          // Score based on: having sections, prerequisite count (prefer next logical step)
          score: course._count.sections * 10 + (5 - Math.min(prerequisites.length, 5))
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20) // Return top 20 recommendations

    res.json({
      recommendations: recommendedCourses,
      count: recommendedCourses.length,
      completedCount: completedCourses.length
    })
  } catch (error) {
    console.error('Course recommendation error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate course recommendations'
    })
  }
})

export default router
