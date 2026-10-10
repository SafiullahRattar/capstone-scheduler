import type { PrismaClient } from '@prisma/client'
import { validatePrerequisites } from '../../cli/prerequisite-validator'
import { fetchSectionMeetings } from './section-meetings'
import { matchesDeliveryPreference, normalizeDeliveryMode, type DeliveryMode, type DeliveryPreference } from '../../shared/delivery-mode'
import type { BlockedTime } from '../../shared/blocked-times'

export interface TimeSlot {
  day: string
  startTime: string
  endTime: string
}

export interface Section {
  id: string
  courseId: string
  crn: string | null
  sectionCode: string
  sectionType: string
  instructor: string | null
  location: string | null
  capacity: number | null
  enrolled: number | null
  deliveryMode: DeliveryMode
  timeSlots: TimeSlot[]
}

type CourseSections = { courseId: string; sections: Section[] }

export interface ScheduleSelection {
  courseId: string
  section: Section
  /** Every section of this type meeting at exactly the same times, including `section`, when there is more than one. */
  alternatives?: Section[]
}

export interface GeneratedSchedule {
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
      requirementExplanation?: string
      plannedPrerequisites?: string[]
    }
  }
}

export interface GenerateSchedulesOptions {
  courseIds: string[]
  term?: string
  maxSchedules: number
  completedCourses?: string[]
  plannedCourses?: string[]
  courseGrades?: Record<string, string>
  includePrerequisites?: boolean
  deliveryPreference?: DeliveryPreference
  lockedSectionIds?: Record<string, string[]>
  blockedTimes?: BlockedTime[]
}

export function parseDays(daysStr: string | null): string[] {
  if (!daysStr) return []

  const dayMap: { [key: string]: string } = {
    M: 'Monday',
    T: 'Tuesday',
    W: 'Wednesday',
    R: 'Thursday',
    F: 'Friday'
  }

  return daysStr.split('').map(d => dayMap[d] || d).filter(Boolean)
}

export function hasTimeConflict(slot1: TimeSlot, slot2: TimeSlot): boolean {
  if (slot1.day !== slot2.day) return false

  const parseTime = (time: string): number => {
    const padded = time.replace(':', '').padStart(4, '0')
    const hours = parseInt(padded.substring(0, 2))
    const minutes = parseInt(padded.substring(2, 4))
    return hours * 60 + minutes
  }

  const start1 = parseTime(slot1.startTime)
  const end1 = parseTime(slot1.endTime)
  const start2 = parseTime(slot2.startTime)
  const end2 = parseTime(slot2.endTime)

  return start1 < end2 && start2 < end1
}

function getTimeSlots(section: Section): TimeSlot[] {
  return section.deliveryMode === 'ONLINE_ASYNC' ? [] : section.timeSlots
}

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

function generateSectionCombinations(
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

function generateSchedulesRecursive(
  courseSections: { courseId: string; sections: Section[] }[],
  currentIndex: number,
  currentSelections: ScheduleSelection[],
  maxSchedules: number,
  result: GeneratedSchedule[]
): void {
  if (result.length >= maxSchedules) {
    return
  }

  if (currentIndex === courseSections.length) {
    result.push({
      id: result.length + 1,
      selections: [...currentSelections],
      hasConflicts: false
    })
    return
  }

  const { courseId, sections } = courseSections[currentIndex]
  const sectionsByType = groupSectionsByType(sections)
  const combinations = generateSectionCombinations(sectionsByType)

  for (const sectionCombination of combinations) {
    if (result.length >= maxSchedules) {
      return
    }

    if (hasInternalConflicts(sectionCombination)) {
      continue
    }

    let hasConflict = false
    for (const section of sectionCombination) {
      if (hasConflictWithSelections(section, currentSelections)) {
        hasConflict = true
        break
      }
    }

    if (!hasConflict) {
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

      if (result.length >= maxSchedules) {
        for (let i = 0; i < sectionCombination.length; i++) {
          currentSelections.pop()
        }
        return
      }

      for (let i = 0; i < sectionCombination.length; i++) {
        currentSelections.pop()
      }
    }
  }
}

export async function loadCourseSectionsForScheduling(
  prisma: PrismaClient,
  courseIds: string[],
  term?: string
): Promise<{ courseId: string; sections: Section[] }[]> {
  return Promise.all(
    courseIds.map(async (courseId: string) => {
      const sections = await prisma.section.findMany({
        where: {
          courseId: courseId.toUpperCase(),
          ...(term && { term })
        }
      })

      const meetingsBySection = await fetchSectionMeetings(prisma, sections.map(section => section.id))

      const normalizedSections = sections.map((section) => ({
        id: section.id,
        courseId: section.courseId,
        crn: section.crn,
        sectionCode: section.sectionCode,
        sectionType: section.sectionType,
        instructor: section.instructor,
        location: section.location,
        capacity: section.capacity,
        enrolled: section.enrolled,
        deliveryMode: normalizeDeliveryMode(section.deliveryMode),
        timeSlots: normalizeDeliveryMode(section.deliveryMode) === 'ONLINE_ASYNC' ? [] : (meetingsBySection.get(section.id) || []).flatMap((meeting) => {
          if (!meeting.days || !meeting.startTime || !meeting.endTime) {
            return []
          }

          return parseDays(meeting.days).map(day => ({
            day,
            startTime: meeting.startTime,
            endTime: meeting.endTime
          }))
        })
      }))

      return {
        courseId: courseId.toUpperCase(),
        sections: normalizedSections as Section[]
      }
    })
  )
}

/**
 * Keeps only sections matching the delivery preference. When a course has no matching
 * section of some type (e.g. its labs are only on campus), that type uses its hybrid
 * sections, or all of them if there are none, and the course is reported in `fallbacks`.
 */
export function applyDeliveryPreference(
  courseSections: CourseSections[],
  preference: DeliveryPreference = 'any'
): { courseSections: CourseSections[]; fallbacks: string[] } {
  if (preference === 'any') return { courseSections, fallbacks: [] }
  const fallbacks: string[] = []
  const filtered = courseSections.map(course => {
    const sections = Object.values(groupSectionsByType(course.sections)).flatMap(group => {
      const matching = group.filter(section => matchesDeliveryPreference(section.deliveryMode, preference))
      if (matching.length > 0) return matching
      if (!fallbacks.includes(course.courseId)) fallbacks.push(course.courseId)
      // Hybrid is the closest substitute for either strict choice.
      const hybrid = group.filter(section => section.deliveryMode === 'HYBRID')
      return hybrid.length > 0 ? hybrid : group
    })
    return { ...course, sections }
  })
  return { courseSections: filtered, fallbacks }
}

/**
 * Drops sections that meet during any blocked time. A course left without some section
 * type it needs (e.g. every lab is blocked) gets no sections and is listed in `blockedCourses`.
 */
export function applyBlockedTimes(
  courseSections: CourseSections[],
  blockedTimes: BlockedTime[] = []
): { courseSections: CourseSections[]; blockedCourses: string[] } {
  if (blockedTimes.length === 0) return { courseSections, blockedCourses: [] }
  const blockedCourses: string[] = []
  const filtered = courseSections.map(course => {
    const groups = Object.values(groupSectionsByType(course.sections)).map(group =>
      group.filter(section => !getTimeSlots(section).some(slot => blockedTimes.some(blocked => hasTimeConflict(slot, blocked))))
    )
    if (groups.some(group => group.length === 0)) {
      blockedCourses.push(course.courseId)
      return { ...course, sections: [] }
    }
    return { ...course, sections: groups.flat() }
  })
  return { courseSections: filtered, blockedCourses }
}

/**
 * Keeps one section per group of sections of the same course and type that meet at the same
 * times in the same delivery mode. They are interchangeable, so the rest would only produce
 * timetables that look identical. Returns the groups so callers can offer the choice back.
 */
export function collapseEquivalentSections(courseSections: CourseSections[]): { courseSections: CourseSections[]; alternatives: Map<string, Section[]> } {
  const alternatives = new Map<string, Section[]>()
  const collapsed = courseSections.map(course => {
    const groups = new Map<string, Section[]>()
    for (const section of course.sections) {
      const times = getTimeSlots(section).map(slot => `${slot.day} ${slot.startTime}-${slot.endTime}`).sort().join(',')
      const key = `${section.sectionType}|${section.deliveryMode}|${times}`
      groups.set(key, [...(groups.get(key) || []), section])
    }
    const representatives = Array.from(groups.values()).map(group => {
      const sorted = [...group].sort((a, b) => a.sectionCode.localeCompare(b.sectionCode, undefined, { numeric: true }))
      if (sorted.length > 1) alternatives.set(sorted[0].id, sorted)
      return sorted[0]
    })
    return { ...course, sections: representatives }
  })
  return { courseSections: collapsed, alternatives }
}

/** A pinned bundle must include exactly one section of every required type. */
export function applyLockedSections(courseSections: CourseSections[], locks: Record<string, string[]> = {}): CourseSections[] {
  return courseSections.map(course => {
    const ids = locks[course.courseId];
    if (!ids) return course;
    const requested = new Set(ids);
    const selected = course.sections.filter(section => requested.has(section.id));
    const types = new Set(course.sections.map(section => section.sectionType));
    if (requested.size !== ids.length || selected.length !== ids.length || selected.length !== types.size || new Set(selected.map(section => section.sectionType)).size !== types.size) {
      throw new Error(`Selected sections are no longer a complete available bundle for ${course.courseId}`);
    }
    return { ...course, sections: selected };
  });
}

export async function generateSchedulesForCourses(
  prisma: PrismaClient,
  options: GenerateSchedulesOptions
): Promise<{ schedules: GeneratedSchedule[]; deliveryFallbacks: string[] }> {
  const {
    courseIds,
    term,
    maxSchedules,
    completedCourses = [],
    plannedCourses = [],
    courseGrades = {},
    includePrerequisites = true,
    deliveryPreference = 'any',
    lockedSectionIds = {},
    blockedTimes = []
  } = options

  const loaded = await loadCourseSectionsForScheduling(prisma, courseIds, term)
  const coursesWithoutSections = loaded.filter(cs => cs.sections.length === 0)
  if (coursesWithoutSections.length > 0) {
    throw new Error(`No sections found for courses: ${coursesWithoutSections.map(cs => cs.courseId).join(', ')}`)
  }

  const { courseSections: available, blockedCourses } = applyBlockedTimes(loaded, blockedTimes)
  if (blockedCourses.length > 0) {
    throw new Error(`Every section option meets during your blocked times for: ${blockedCourses.join(', ')}`)
  }
  // Blocked times are a hard limit, so the delivery preference only chooses among what is left.
  const { courseSections: preferredSections, fallbacks: deliveryFallbacks } = applyDeliveryPreference(available, deliveryPreference)
  const { courseSections, alternatives } = collapseEquivalentSections(applyLockedSections(preferredSections, lockedSectionIds))

  const schedules: GeneratedSchedule[] = []
  generateSchedulesRecursive(courseSections, 0, [], maxSchedules, schedules)
  for (const schedule of schedules) {
    schedule.selections = schedule.selections.map(selection => {
      const options = alternatives.get(selection.section.id)
      return options ? { ...selection, alternatives: options } : selection
    })
  }

  if (!includePrerequisites) {
    return { schedules, deliveryFallbacks }
  }

  const transcript = {
    completedCourses: completedCourses.map((c: string) => c.toUpperCase()),
    plannedCourses: plannedCourses.map(c => c.toUpperCase()),
    courseGrades,
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
        plannedPrerequisites: result.plannedPrerequisites,
        requirementExplanation: result.requirementExplanation,
        expressionEvaluated: result.expressionEvaluated
      }
    }

    schedule.prerequisiteInfo = prerequisiteInfo
  }

  return { schedules, deliveryFallbacks }
}

export function estimateCourseBranching(sections: Section[]): number {
  const sectionsByType = groupSectionsByType(sections)
  const combinations = generateSectionCombinations(sectionsByType)
  return combinations.filter(combo => !hasInternalConflicts(combo)).length
}


export interface ElectiveFitResult {
  fits: Record<string, boolean>
  blocks: Record<string, string[]>
  pairwiseComplete: boolean
}

function hasAnySchedule(courseSections: CourseSections[]): boolean {
  // Most constrained courses first, so impossible sets fail fast.
  const ordered = [...courseSections].sort((a, b) => estimateCourseBranching(a.sections) - estimateCourseBranching(b.sections))
  const result: GeneratedSchedule[] = []
  generateSchedulesRecursive(ordered, 0, [], 1, result)
  return result.length > 0
}

/**
 * For each candidate elective, checks whether some conflict-free timetable exists
 * alongside the fixed courses, with every course free to use any of its sections.
 * With `pairwise`, also lists which other fitting candidates each one rules out.
 */
export function evaluateElectiveFit(
  fixed: CourseSections[],
  candidates: CourseSections[],
  pairwise: boolean,
  budgetMs = 3000
): ElectiveFitResult {
  const fits: Record<string, boolean> = {}
  const blocks: Record<string, string[]> = {}

  for (const candidate of candidates) {
    fits[candidate.courseId] = candidate.sections.length > 0 && hasAnySchedule([...fixed, candidate])
    blocks[candidate.courseId] = []
  }

  if (!pairwise) return { fits, blocks, pairwiseComplete: true }

  const fitting = candidates.filter(candidate => fits[candidate.courseId])
  const deadline = Date.now() + budgetMs
  for (let i = 0; i < fitting.length; i++) {
    for (let j = i + 1; j < fitting.length; j++) {
      if (Date.now() > deadline) return { fits, blocks, pairwiseComplete: false }
      const a = fitting[i]
      const b = fitting[j]
      if (!hasAnySchedule([...fixed, a, b])) {
        blocks[a.courseId].push(b.courseId)
        blocks[b.courseId].push(a.courseId)
      }
    }
  }

  return { fits, blocks, pairwiseComplete: true }
}

export async function checkElectiveFit(
  prisma: PrismaClient,
  options: { fixedCourseIds: string[]; candidateIds: string[]; term?: string; pairwise: boolean; deliveryPreference?: DeliveryPreference; lockedSectionIds?: Record<string, string[]>; blockedTimes?: BlockedTime[] }
): Promise<ElectiveFitResult> {
  const fixedIds = options.fixedCourseIds.map(id => id.toUpperCase())
  const candidateIds = Array.from(new Set(options.candidateIds.map(id => id.toUpperCase()))).filter(id => !fixedIds.includes(id))
  const [fixed, candidates] = await Promise.all([
    loadCourseSectionsForScheduling(prisma, fixedIds, options.term),
    loadCourseSectionsForScheduling(prisma, candidateIds, options.term),
  ])
  const preference = options.deliveryPreference || 'any'
  const usable = (courses: CourseSections[]) => applyDeliveryPreference(applyBlockedTimes(courses, options.blockedTimes).courseSections, preference).courseSections
  return evaluateElectiveFit(
    applyLockedSections(usable(fixed.filter(course => course.sections.length > 0)), options.lockedSectionIds),
    usable(candidates),
    options.pairwise
  )
}
