import type { PrismaClient } from '@prisma/client'
import { applyBlockedTimes, applyDeliveryPreference, hasTimeConflict, parseDays, type Section, type TimeSlot } from './schedule-generation'
import { normalizeDeliveryMode, type DeliveryPreference } from '../../shared/delivery-mode'
import type { BlockedTime } from '../../shared/blocked-times'
import { eligibleConflictCourseCategories, normalizeConflictTranscript, standingFromEarnedCredits, type UnmetCourseCategory } from '../../shared/conflict-eligibility'

export interface ConflictCourse {
  courseId: string
  name: string
  sections: Section[]
}

export interface CourseConflict {
  courseId: string
  name: string
  hasConflictFreeOption: boolean
  overlappingSections: Array<{ sectionCode: string; sectionType: string; crn: string | null; timeSlots: TimeSlot[] }>
  sections: Array<ConflictSectionSummary & { conflictingTimeSlots: TimeSlot[]; fittingBundle: ConflictSectionSummary[] | null }>
  fittingBundles: ConflictSectionSummary[][]
  lectureBundles: ConflictSectionSummary[][]
  moreFittingBundles: boolean
}

export interface ConflictSectionSummary {
  id: string
  sectionCode: string
  sectionType: string
  crn: string | null
  deliveryMode: Section['deliveryMode']
  timeSlots: TimeSlot[]
}

const slotsFor = (section: Section) => section.deliveryMode === 'ONLINE_ASYNC' ? [] : section.timeSlots
const overlaps = (slots: TimeSlot[], occupied: TimeSlot[]) => slots.some(slot => occupied.some(other => hasTimeConflict(slot, other)))

/** Tests a complete lecture/lab/tutorial combination, not individual sections alone. */
export function hasConflictFreeBundle(sections: Section[], occupied: TimeSlot[]): boolean {
  return findFittingBundles(sections, occupied, 1).length > 0
}

/** Finds complete bundles, optionally forcing a particular section into the bundle. */
export function findFittingBundles(sections: Section[], occupied: TimeSlot[], limit = 13, requiredSectionId?: string, requiredLabId?: string): Section[][] {
  const groups = new Map<string, Section[]>()
  sections.forEach(section => groups.set(section.sectionType, [...(groups.get(section.sectionType) || []), section]))
  const requiredSection = requiredSectionId ? sections.find(section => section.id === requiredSectionId) : undefined
  if (requiredSectionId && !requiredSection) return []
  if (requiredSection) groups.set(requiredSection.sectionType, [requiredSection])
  if (requiredLabId) {
    const lab = sections.find(section => section.id === requiredLabId && section.sectionType === 'LAB')
    if (!lab) return []
    groups.set('LAB', [lab])
  }
  const priorities: Record<string, number> = { LEC: 0, LAB: 1, TUT: 2 }
  const types = Array.from(groups.entries()).sort(([a], [b]) => (priorities[a] ?? 3) - (priorities[b] ?? 3)).map(([, group]) => group)
  if (!types.length || limit < 1) return []
  const result: Section[][] = []
  function visit(index: number, chosen: Section[], chosenSlots: TimeSlot[]): void {
    if (result.length >= limit) return
    if (index === types.length) { result.push([...chosen]); return }
    for (const section of types[index]) {
      const slots = slotsFor(section)
      if (!overlaps(slots, occupied) && !overlaps(slots, chosenSlots)) visit(index + 1, [...chosen, section], [...chosenSlots, ...slots])
      if (result.length >= limit) return
    }
  }
  visit(0, [], [])
  return result
}

const summarizeSection = (section: Section): ConflictSectionSummary => ({ id: section.id, sectionCode: section.sectionCode, sectionType: section.sectionType, crn: section.crn, deliveryMode: section.deliveryMode, timeSlots: slotsFor(section) })

export function findCourseConflicts(anchor: Section[], candidates: ConflictCourse[], calendarSlots: TimeSlot[] = []): CourseConflict[] {
  const anchorSlots = anchor.flatMap(slotsFor)
  const occupied = [...anchorSlots, ...calendarSlots]
  const ownCourses = new Set(anchor.map(section => section.courseId))
  if (!anchorSlots.length) return []
  return candidates.flatMap(course => {
    if (ownCourses.has(course.courseId)) return []
    const overlappingSections = course.sections.flatMap(section => {
      const timeSlots = slotsFor(section).filter(slot => anchorSlots.some(other => hasTimeConflict(slot, other)))
      return timeSlots.length ? [{ sectionCode: section.sectionCode, sectionType: section.sectionType, crn: section.crn, timeSlots }] : []
    })
    if (!overlappingSections.length) return []
    const fitting = findFittingBundles(course.sections, occupied)
    const lectureBundles = course.sections.filter(section => section.sectionType === 'LEC').flatMap(lecture => {
      const labs = course.sections.filter(section => section.sectionType === 'LAB')
      return labs.length
        ? labs.flatMap(lab => findFittingBundles(course.sections, occupied, 1, lecture.id, lab.id))
        : findFittingBundles(course.sections, occupied, 1, lecture.id)
    }).map(bundle => bundle.map(summarizeSection))
    const sections = course.sections.map(section => {
      const conflictingTimeSlots = slotsFor(section).filter(slot => occupied.some(other => hasTimeConflict(slot, other)))
      const bundle = conflictingTimeSlots.length ? undefined : findFittingBundles(course.sections, occupied, 1, section.id)[0]
      return { ...summarizeSection(section), conflictingTimeSlots, fittingBundle: bundle ? bundle.map(summarizeSection) : null }
    })
    return [{ courseId: course.courseId, name: course.name, overlappingSections, sections, hasConflictFreeOption: fitting.length > 0, fittingBundles: fitting.slice(0, 12).map(bundle => bundle.map(summarizeSection)), lectureBundles, moreFittingBundles: fitting.length > 12 }]
  }).sort((a, b) => Number(a.hasConflictFreeOption) - Number(b.hasConflictFreeOption) || a.courseId.localeCompare(b.courseId))
}

export async function inspectCourseConflicts(prisma: PrismaClient, options: {
  courseId: string; term: string; sectionIds: string[]; crns: string[]; deliveryPreference: DeliveryPreference;
  hasAuditData: boolean; unmetCategories: UnmetCourseCategory[]; completedCourses: string[]; courseGrades: Record<string, string>; excludedCourseIds: string[];
  completedCourseCredits: Record<string, number>;
  priorScheduledCourses?: string[];
  calendarSlots?: TimeSlot[];
  blockedTimes?: BlockedTime[];
}) {
  const categories = options.hasAuditData ? options.unmetCategories : []
  const transcript = normalizeConflictTranscript({ completedCourses: options.completedCourses, plannedCourses: options.priorScheduledCourses, courseGrades: options.courseGrades, currentYear: 'FIRST_YEAR', hasSpecialPermission: false })
  const missingCreditIds = transcript.completedCourses.filter(code => options.completedCourseCredits[code] === undefined)
  const catalogueCredits = missingCreditIds.length ? await prisma.course.findMany({ where: { id: { in: missingCreditIds } }, select: { id: true, credits: true } }) : []
  const creditValues = new Map(catalogueCredits.map(course => [course.id, course.credits || 0]))
  transcript.currentYear = standingFromEarnedCredits(transcript.completedCourses.reduce((sum, code) => sum + (options.completedCourseCredits[code] ?? creditValues.get(code) ?? 0), 0))
  const candidateIds = Array.from(new Set(categories.flatMap(category => category.courseOptions)))
  const rows = await prisma.section.findMany({
    where: { term: options.term, courseId: { in: Array.from(new Set([options.courseId, ...candidateIds])) } },
    include: { course: { select: { id: true, title: true, prerequisiteExpression: true, prerequisiteNodes: true } }, meetings: true }
  })
  const prerequisiteCourses = Array.from(new Map(rows.map(row => [row.courseId, {
    courseId: row.courseId, prerequisiteExpression: row.course.prerequisiteExpression?.expression, prerequisiteNodes: row.course.prerequisiteNodes,
  }])).values())
  const eligible = eligibleConflictCourseCategories(prerequisiteCourses, categories, transcript, options.excludedCourseIds)
  const courses = new Map<string, ConflictCourse>()
  for (const row of rows) {
    const section: Section = {
      id: row.id, courseId: row.courseId, crn: row.crn, sectionCode: row.sectionCode, sectionType: row.sectionType,
      instructor: row.instructor, location: row.location, capacity: row.capacity, enrolled: row.enrolled,
      deliveryMode: normalizeDeliveryMode(row.deliveryMode),
      timeSlots: normalizeDeliveryMode(row.deliveryMode) === 'ONLINE_ASYNC' ? [] : row.meetings.flatMap(meeting => {
        if (!meeting.days || !meeting.startTime || !meeting.endTime) return []
        return parseDays(meeting.days).map(day => ({ day, startTime: meeting.startTime!, endTime: meeting.endTime! }))
      })
    }
    if (!courses.has(row.courseId)) courses.set(row.courseId, { courseId: row.courseId, name: row.course.title || row.courseId, sections: [] })
    courses.get(row.courseId)!.sections.push(section)
  }
  const source = courses.get(options.courseId)
  if (!source) throw new Error('The selected course is not offered in this term')
  const ids = new Set(options.sectionIds)
  const crns = new Set(options.crns)
  const anchor = source.sections.filter(section => ids.size ? ids.has(section.id) : section.crn && crns.has(section.crn))
  if (!anchor.length || (ids.size && anchor.length !== ids.size)) throw new Error('The selected class sections are no longer available')
  // The inspected course's own sections stay as they are; only the alternatives offered must avoid blocked times.
  const preferred = applyDeliveryPreference(applyBlockedTimes(Array.from(courses.values()), options.blockedTimes).courseSections, options.deliveryPreference).courseSections
  const candidates = preferred.filter(course => eligible.has(course.courseId)).map(course => ({ ...course, name: courses.get(course.courseId)!.name }))
  return {
    courseId: options.courseId,
    term: options.term,
    hasFixedMeetings: anchor.some(section => slotsFor(section).length > 0),
    hasAuditData: options.hasAuditData,
    categories: categories.map(({ id, label }) => ({ id, label })),
    eligibleCourseCount: candidates.length,
    courses: findCourseConflicts(anchor, candidates, options.calendarSlots).map(course => ({ ...course, categories: eligible.get(course.courseId)! })),
  }
}
