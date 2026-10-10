import { useLayoutEffect, useRef, useState } from 'react';
import { diffSchedules, type ScheduleDiff } from './scheduleDiff';
import type { GeneratedSchedule } from './scheduleGenerator';

const CHANGE_HIGHLIGHT_MS = 1800;

export type ScheduleChange = ScheduleDiff & { id: number };

/**
 * Tracks what differs from the schedule shown just before, since options often differ by one
 * lab or tutorial. `change` drives the calendar animation and clears itself; `summary` stays.
 */
export function useScheduleChange(currentSchedule: GeneratedSchedule) {
  const previousSchedule = useRef(currentSchedule);
  const [change, setChange] = useState<ScheduleChange | null>(null);
  const [summary, setSummary] = useState<string[]>([]);
  const signature = currentSchedule.selections.map(selection => `${selection.courseCode}|${selection.section.type}|${selection.section.sectionCode}`).sort().join(',');
  useLayoutEffect(() => {
    const previous = previousSchedule.current;
    previousSchedule.current = currentSchedule;
    if (previous === currentSchedule) return;
    const diff = diffSchedules(previous, currentSchedule);
    setSummary(diff.summary);
    if (!diff.changedSlots.size) return;
    setChange({ ...diff, id: Date.now() });
    const timer = window.setTimeout(() => setChange(null), CHANGE_HIGHLIGHT_MS);
    return () => window.clearTimeout(timer);
  }, [signature]);
  return { change, summary };
}
