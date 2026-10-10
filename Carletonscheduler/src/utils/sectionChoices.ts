import type { GeneratedSchedule } from './scheduleGenerator';

/**
 * Switches a course to another section that meets at the same times, in every option where
 * that section is one of the alternatives, so the choice holds while browsing options.
 */
export function chooseEquivalentSection(schedules: GeneratedSchedule[], courseCode: string, sectionType: string, sectionCode: string): GeneratedSchedule[] {
  return schedules.map(schedule => ({
    ...schedule,
    selections: schedule.selections.map(selection => {
      if (selection.courseCode !== courseCode || selection.section.type !== sectionType) return selection;
      const chosen = selection.alternatives?.find(alternative => alternative.sectionCode === sectionCode);
      return chosen ? { ...selection, section: chosen } : selection;
    }),
  }));
}

/** Re-applies section picks from earlier options (anything other than the default first alternative) to newly generated ones. */
export function carryOverSectionChoices(previous: GeneratedSchedule[], next: GeneratedSchedule[]): GeneratedSchedule[] {
  const picks = new Map<string, { courseCode: string; type: string; sectionCode: string }>();
  for (const selection of previous.flatMap(schedule => schedule.selections)) {
    if (selection.alternatives && selection.alternatives[0]?.sectionCode !== selection.section.sectionCode) {
      picks.set(`${selection.courseCode}|${selection.section.type}`, { courseCode: selection.courseCode, type: selection.section.type, sectionCode: selection.section.sectionCode });
    }
  }
  return Array.from(picks.values()).reduce((schedules, pick) => chooseEquivalentSection(schedules, pick.courseCode, pick.type, pick.sectionCode), next);
}
