/*
 * Schedule generation using backtracking to find all conflict-free timetables.
 */

import { Router, Request, Response } from 'express'
import { prisma } from '../index'
import { checkElectiveFit, generateSchedulesForCourses } from '../lib/schedule-generation'
import type { DeliveryPreference } from '../../shared/delivery-mode'
import { inspectCourseConflicts } from '../lib/course-conflicts'
import type { UnmetCourseCategory } from '../../shared/conflict-eligibility'

const router = Router()

function parseDeliveryPreference(value: unknown): DeliveryPreference {
  return value === 'online' || value === 'in-person' ? value : 'any'
}

function parseSectionLocks(value: unknown): Record<string, string[]> {
  if (value === undefined) return {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid selected section bundles');
  const entries = Object.entries(value);
  if (entries.length > 8 || entries.some(([course, ids]) => !/^[A-Z]{3,4}\d{4}$/.test(course) || !Array.isArray(ids) || !ids.length || ids.length > 20 || ids.some(id => typeof id !== 'string' || !id))) throw new Error('Invalid selected section bundles');
  return Object.fromEntries(entries) as Record<string, string[]>;
}

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { courseIds, term, maxSchedules = 50, completedCourses = [], plannedCourses = [], courseGrades = {}, deliveryPreference, lockedSectionIds } = req.body
    if (!Array.isArray(plannedCourses) || plannedCourses.length > 5000 || plannedCourses.some(code => typeof code !== 'string' || !/^[A-Z]{3,4}\d{4}$/.test(code)) || !courseGrades || typeof courseGrades !== 'object' || Array.isArray(courseGrades) || Object.values(courseGrades).some(grade => typeof grade !== 'string')) return res.status(400).json({ message: 'Valid planned prerequisites and course grades are required' })

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

    const { schedules, deliveryFallbacks } = await generateSchedulesForCourses(prisma, {
      courseIds,
      term,
      maxSchedules,
      completedCourses,
      plannedCourses,
      courseGrades,
      includePrerequisites: true,
      deliveryPreference: parseDeliveryPreference(deliveryPreference),
      lockedSectionIds: parseSectionLocks(lockedSectionIds)
    })

    res.json({
      schedules,
      deliveryFallbacks,
      count: schedules.length,
      requested: courseIds.length,
      maxSchedules
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate schedules'
    if (message === 'Invalid selected section bundles' || message.startsWith('Selected sections are no longer')) {
      return res.status(400).json({ error: 'Bad Request', message })
    }
    const isMissingSections = message.startsWith('No sections found for courses:')
    if (isMissingSections) {
      return res.status(404).json({
        error: 'Not Found',
        message
      })
    }

    console.error('Generate schedules error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate schedules'
    })
  }
})

router.post('/elective-fit', async (req: Request, res: Response) => {
  try {
    const { fixedCourseIds = [], candidateIds, term, pairwise = false, deliveryPreference, lockedSectionIds } = req.body

    if (!Array.isArray(fixedCourseIds) || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'candidateIds array is required'
      })
    }

    if (fixedCourseIds.length > 7 || candidateIds.length > 100) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Too many courses to check'
      })
    }

    const result = await checkElectiveFit(prisma, {
      fixedCourseIds,
      candidateIds,
      term,
      pairwise: Boolean(pairwise) && fixedCourseIds.length <= 6,
      deliveryPreference: parseDeliveryPreference(deliveryPreference),
      lockedSectionIds: parseSectionLocks(lockedSectionIds)
    })

    res.json(result)
  } catch (error) {
    console.error('Elective fit error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check elective fit'
    })
  }
})

router.post('/course-conflicts', async (req: Request, res: Response) => {
  const { courseId, term, sectionIds = [], crns = [], deliveryPreference, hasAuditData = false, unmetCategories = [], completedCourses = [], priorScheduledCourses = [], courseGrades = {}, completedCourseCredits = {}, excludedCourseIds = [], calendarSlots = [] } = req.body
  if (typeof courseId !== 'string' || !/^[A-Z]{3,4}\d{4}$/.test(courseId) || typeof term !== 'string' || !/^\d{6}$/.test(term)
    || !Array.isArray(sectionIds) || !Array.isArray(crns) || sectionIds.length + crns.length > 40
    || (!sectionIds.length && !crns.length) || [...sectionIds, ...crns].some(value => typeof value !== 'string' || !value)) {
    return res.status(400).json({ message: 'A course, term, and selected class sections are required' })
  }
  if (!Array.isArray(calendarSlots) || calendarSlots.length > 2000 || calendarSlots.some(slot => !slot || typeof slot.day !== 'string' || !slot.day || typeof slot.startTime !== 'string' || typeof slot.endTime !== 'string' || !/^\d{1,2}:?\d{2}$/.test(slot.startTime) || !/^\d{1,2}:?\d{2}$/.test(slot.endTime))) {
    return res.status(400).json({ message: 'Valid calendar meeting times are required for section previews' })
  }
  const validCourseList = (value: unknown): value is string[] => Array.isArray(value) && value.length <= 5000 && value.every(code => typeof code === 'string' && /^[A-Z]{3,4}\d{4}$/.test(code))
  if (typeof hasAuditData !== 'boolean' || !Array.isArray(unmetCategories) || unmetCategories.length > 100
    || unmetCategories.some(category => !category || typeof category.id !== 'string' || typeof category.label !== 'string' || !validCourseList(category.courseOptions))
    || !validCourseList(completedCourses) || !validCourseList(priorScheduledCourses) || !validCourseList(excludedCourseIds) || !courseGrades || typeof courseGrades !== 'object' || Array.isArray(courseGrades)
    || Object.values(courseGrades).some(grade => typeof grade !== 'string')
    || !completedCourseCredits || typeof completedCourseCredits !== 'object' || Array.isArray(completedCourseCredits)
    || Object.values(completedCourseCredits).some(credit => typeof credit !== 'number' || !Number.isFinite(credit) || credit < 0)
    || new Set(unmetCategories.flatMap(category => category.courseOptions)).size > 5000) {
    return res.status(400).json({ message: 'Valid unmet audit categories and completed-course information are required' })
  }
  try {
    res.json(await inspectCourseConflicts(prisma, {
      courseId, term, sectionIds, crns, deliveryPreference: parseDeliveryPreference(deliveryPreference),
      hasAuditData, unmetCategories: unmetCategories as UnmetCourseCategory[], completedCourses, priorScheduledCourses, courseGrades, completedCourseCredits, excludedCourseIds, calendarSlots,
    }))
  } catch (error) {
    console.error('Course conflict inspection error:', error)
    res.status(500).json({ message: error instanceof Error ? error.message : 'Could not inspect course conflicts' })
  }
})

export default router
