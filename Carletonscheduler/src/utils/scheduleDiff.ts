import type { GeneratedSchedule, TimeSlot } from './scheduleGenerator';

type Selection = GeneratedSchedule['selections'][number];

export interface MovedFrom {
  day: TimeSlot['day'];
  startTime: string;
  endTime: string;
}

export interface ScheduleDiff {
  /** Calendar blocks that are new in this schedule, with where they moved from when that is known. */
  changedSlots: Map<string, MovedFrom | null>;
  summary: string[];
}

const sectionKey = (selection: Selection) => `${selection.courseCode}|${selection.section.type}|${selection.section.sectionCode}`;
const sortedSlots = (selection: Selection) => selection.section.deliveryMode === 'ONLINE_ASYNC' ? [] : [...selection.section.timeSlots].sort((a, b) => a.day.localeCompare(b.day) || a.startTime.localeCompare(b.startTime));

export function slotKey(selection: Selection, slot: TimeSlot): string {
  return `${sectionKey(selection)}|${slot.day}|${slot.startTime}`;
}

const sameTimes = (a: TimeSlot[], b: TimeSlot[]) =>
  a.length === b.length && a.every((slot, index) => slot.day === b[index].day && slot.startTime === b[index].startTime && slot.endTime === b[index].endTime);

/** Compares two schedules section by section, pairing each replaced section with its replacement of the same type. */
export function diffSchedules(previous: GeneratedSchedule, next: GeneratedSchedule): ScheduleDiff {
  const changedSlots = new Map<string, MovedFrom | null>();
  const summary: string[] = [];
  const previousKeys = new Set(previous.selections.map(sectionKey));
  const nextKeys = new Set(next.selections.map(sectionKey));
  const previousCourses = new Set(previous.selections.map(selection => selection.courseCode));
  const nextCourses = new Set(next.selections.map(selection => selection.courseCode));
  const removed = previous.selections.filter(selection => !nextKeys.has(sectionKey(selection)));
  const added = next.selections.filter(selection => !previousKeys.has(sectionKey(selection)));

  for (const selection of added) {
    const slots = sortedSlots(selection);
    const replaced = removed.filter(old => old.courseCode === selection.courseCode && old.section.type === selection.section.type);
    const before = replaced.length === 1 ? replaced[0] : undefined;
    const beforeSlots = before ? sortedSlots(before) : [];
    // Only slide meetings when the old and new sections line up one to one.
    slots.forEach((slot, index) => changedSlots.set(slotKey(selection, slot), beforeSlots.length === slots.length ? beforeSlots[index] : null));

    if (!previousCourses.has(selection.courseCode)) continue;
    const label = `${selection.courseCode} ${selection.section.type}`;
    if (!before) summary.push(`${label} ${selection.section.sectionCode}`);
    else summary.push(`${label} ${before.section.sectionCode} → ${selection.section.sectionCode}${sameTimes(beforeSlots, slots) ? ' (same time)' : ''}`);
  }

  for (const course of nextCourses) if (!previousCourses.has(course)) summary.push(`Added ${course}`);
  for (const course of previousCourses) if (!nextCourses.has(course)) summary.push(`Removed ${course}`);

  return { changedSlots, summary };
}
