import { API_BASE_URL, SCHEDULE_CONFIG } from '../config/constants';
import { normalizeDeliveryMode, type DeliveryMode, type DeliveryPreference } from './deliveryMode';
import type { UnmetCourseCategory } from '@shared/conflict-eligibility';

export interface TimeSlot {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string;
  endTime: string;
}

export interface Section {
  id?: string;
  crn: string;
  sectionCode: string;
  /** Carleton section type code, e.g. LEC, LAB, TUT, IND. */
  type: string;
  instructor: string;
  timeSlots: TimeSlot[];
  capacity: number;
  enrolled: number;
  deliveryMode: DeliveryMode;
}

export interface CourseSchedule {
  courseCode: string;
  sections: Section[];
}

export interface PrerequisiteInfo {
  requirementExplanation?: string;
  plannedPrerequisites?: string[];
  isValid: boolean;
  reason?: string;
  missingCourses?: string[];
  expressionEvaluated: string;
}

export interface GeneratedSchedule {
  id: number;
  selections: {
    courseCode: string;
    section: Section;
  }[];
  hasUnmetPrerequisites: boolean;
  prerequisiteInfo?: {
    [courseId: string]: PrerequisiteInfo;
  };
}

interface ApiSection {
  id?: string;
  crn: string | null;
  sectionCode: string;
  sectionType: string;
  timeSlots: TimeSlot[];
  instructor: string | null;
  capacity: number | null;
  enrolled: number | null;
  deliveryMode?: string | null;
}

interface ApiScheduleSelection {
  courseId: string;
  section: ApiSection;
}

interface ApiSchedule {
  selections: ApiScheduleSelection[];
  prerequisiteInfo?: { [courseId: string]: PrerequisiteInfo };
}

/**
 * Generate all possible schedules using the backend API
 * Falls back to error message if API fails
 *
 * @param activeTerm - Carleton term code (e.g. "202630") so the backend
 *                     only returns sections for the requested semester.
 */
export async function generateSchedules(
  courseCodes: string[],
  completedCourses: string[],
  activeTerm?: string,
  deliveryPreference: DeliveryPreference = 'any',
  lockedSectionIds: Record<string, string[]> = {},
  plannedCourses: string[] = [],
  courseGrades: Record<string, string> = {}
): Promise<{ schedules: GeneratedSchedule[]; deliveryFallbacks: string[] }> {
  try {
    const response = await fetch(`${API_BASE_URL}/schedules/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseIds: courseCodes,
        completedCourses: completedCourses,
        maxSchedules: SCHEDULE_CONFIG.MAX_SCHEDULES,
        deliveryPreference,
        lockedSectionIds,
        plannedCourses,
        courseGrades,
        ...(activeTerm && { term: activeTerm })
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate schedules');
    }

    const data = await response.json();
    
    const schedules: GeneratedSchedule[] = data.schedules.map((schedule: ApiSchedule, index: number) => {
      const hasPrerequisites = schedule.prerequisiteInfo && 
        Object.values(schedule.prerequisiteInfo).some((info: PrerequisiteInfo) => 
          info.expressionEvaluated && info.expressionEvaluated !== 'None'
        );
      
      return {
        id: index + 1,
        selections: schedule.selections.map((sel: ApiScheduleSelection) => ({
          courseCode: sel.courseId,
          section: mapApiSectionToFrontend(sel.section)
        })),
        hasUnmetPrerequisites: hasPrerequisites || false,
        prerequisiteInfo: schedule.prerequisiteInfo || {}
      };
    });

    return { schedules, deliveryFallbacks: data.deliveryFallbacks || [] };
  } catch (error) {
    throw error;
  }
}

export interface ElectiveFitResult {
  fits: Record<string, boolean>;
  blocks: Record<string, string[]>;
  pairwiseComplete: boolean;
}

export interface ConflictSectionSummary {
  id: string;
  sectionCode: string;
  sectionType: string;
  crn: string | null;
  deliveryMode: DeliveryMode;
  timeSlots: TimeSlot[];
}

export interface ScheduleHoverPreview {
  courseId: string;
  name: string;
  sections: ConflictSectionSummary[];
  fits: boolean;
}

export interface CourseConflictReport {
  courseId: string;
  term: string;
  hasFixedMeetings: boolean;
  hasAuditData: boolean;
  categories: Array<{ id: string; label: string }>;
  eligibleCourseCount: number;
  courses: Array<{
    courseId: string;
    name: string;
    hasConflictFreeOption: boolean;
    categories: Array<{ id: string; label: string }>;
    overlappingSections: Array<{ sectionCode: string; sectionType: string; crn: string | null; timeSlots: TimeSlot[] }>;
    sections: Array<ConflictSectionSummary & { conflictingTimeSlots: TimeSlot[]; fittingBundle: ConflictSectionSummary[] | null }>;
    fittingBundles: ConflictSectionSummary[][];
    lectureBundles?: ConflictSectionSummary[][];
    moreFittingBundles: boolean;
  }>;
}

export interface ConflictInspectionContext {
  priorScheduledCourses: string[];
  hasAuditData: boolean;
  unmetCategories: UnmetCourseCategory[];
  completedCourses: string[];
  courseGrades: Record<string, string>;
  completedCourseCredits: Record<string, number>;
  excludedCourseIds: string[];
}

export async function inspectScheduledCourse(courseId: string, schedule: GeneratedSchedule, term: string, deliveryPreference: DeliveryPreference, context: ConflictInspectionContext, signal?: AbortSignal): Promise<CourseConflictReport> {
  const sections = schedule.selections.filter(selection => selection.courseCode === courseId).map(selection => selection.section);
  const response = await fetch(`${API_BASE_URL}/schedules/course-conflicts`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal,
    body: JSON.stringify({ courseId, term, deliveryPreference, ...context, sectionIds: sections.map(section => section.id).filter(Boolean), crns: sections.map(section => section.crn).filter(Boolean), calendarSlots: schedule.selections.flatMap(selection => selection.section.timeSlots) }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Could not inspect course conflicts');
  }
  return response.json();
}

/**
 * Ask the backend which elective candidates still fit alongside the fixed courses
 * (any section combination), and with `pairwise`, which candidates rule each other out.
 */
export async function checkElectiveFit(
  fixedCourseIds: string[],
  candidateIds: string[],
  activeTerm: string,
  pairwise: boolean,
  deliveryPreference: DeliveryPreference = 'any',
  lockedSectionIds: Record<string, string[]> = {}
): Promise<ElectiveFitResult> {
  const response = await fetch(`${API_BASE_URL}/schedules/elective-fit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fixedCourseIds, candidateIds, term: activeTerm, pairwise, deliveryPreference, lockedSectionIds }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to check elective fit');
  }

  return response.json();
}

/**
 * Map backend section format to frontend Section interface
 */
function mapApiSectionToFrontend(apiSection: ApiSection): Section {
  const timeSlots: TimeSlot[] = apiSection.timeSlots.map((slot) => ({
    day: slot.day,
    startTime: formatTime(slot.startTime),
    endTime: formatTime(slot.endTime)
  }));

  return {
    id: apiSection.id,
    crn: apiSection.crn || '',
    sectionCode: apiSection.sectionCode,
    type: apiSection.sectionType,
    instructor: apiSection.instructor || 'TBA',
    timeSlots,
    capacity: apiSection.capacity || 0,
    enrolled: apiSection.enrolled || 0,
    deliveryMode: normalizeDeliveryMode(apiSection.deliveryMode)
  };
}

/** Pins complete, already-added courses while a new course is being considered. */
export function getLockedSectionIds(schedule: GeneratedSchedule, courseIds?: string[]): Record<string, string[]> {
  const allowed = courseIds ? new Set(courseIds) : null;
  const result: Record<string, string[]> = {};
  for (const selection of schedule.selections) {
    if (!selection.section.id || (allowed && !allowed.has(selection.courseCode))) continue;
    (result[selection.courseCode] ||= []).push(selection.section.id);
  }
  return result;
}

/**
 * Format time from "0835" to "08:35"
 */
function formatTime(time: string | null): string {
  if (!time) return '00:00';
  const normalized = time.replace(':', '').padStart(4, '0');
  if (!/^\d{4}$/.test(normalized)) return '00:00';
  return `${normalized.substring(0, 2)}:${normalized.substring(2, 4)}`;
}

/**
 * Check for time conflicts between two time slots
 */
export function hasTimeConflict(slot1: TimeSlot, slot2: TimeSlot): boolean {
  if (slot1.day !== slot2.day) return false;
  
  const start1 = parseTime(slot1.startTime);
  const end1 = parseTime(slot1.endTime);
  const start2 = parseTime(slot2.startTime);
  const end2 = parseTime(slot2.endTime);

  return start1 < end2 && start2 < end1;
}

/**
 * Parse time string "HH:MM" to minutes since midnight
 */
function parseTime(time: string): number {
  const normalized = time.replace(':', '').padStart(4, '0');
  const hours = Number(normalized.slice(0, 2));
  const minutes = Number(normalized.slice(2));
  return hours * 60 + minutes;
}
