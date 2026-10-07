import { useState, useEffect, useRef, useMemo, useCallback, type Dispatch, type SetStateAction } from 'react';
import { CalendarDays, Clock3, BookOpen, Loader2, Plus, Check, ChevronRight, Lock } from 'lucide-react';
import { checkElectiveFit, inspectScheduledCourse, hasTimeConflict, type CourseConflictReport, type ElectiveFitResult, type GeneratedSchedule, type ScheduleHoverPreview } from '../utils/scheduleGenerator';
import { TIMETABLE_CONFIG, COURSE_COLORS } from '../config/constants';
import { getCourseByCode, getCourseSections, type CourseSection } from '../utils/courseData';
import type { ElectiveRequirement } from '../types/electives';
import { getTermLabel } from '../utils/termUtils';
import { getSelectionUnitCredits } from '../utils/electiveUtils';
import { type DeliveryMode, type DeliveryPreference } from '../utils/deliveryMode';
import { sectionRequirements } from '../utils/sectionRequirements';
import { CourseTermTags } from './schedule-review/CourseTermTags';
import { TermTabs } from './TermTabs';
import {
  ElectiveBlockDialog,
  ScheduleCalendarSection,
  ScheduleSidebar,
} from './schedule-review/ScheduleReviewSections';
import { CourseConflictDialog } from './schedule-review/CourseConflictDialog';
import type { AuditRequirement } from '../types/audit';
import { collectUnmetCourseCategories, conflictCategoriesForTerm, eligibleConflictCourseCategories, normalizeConflictTranscript, standingFromEarnedCredits } from '@shared/conflict-eligibility';
import { validatePrerequisitesFromTree, type PrerequisiteValidationResult } from '@shared/prerequisite-evaluator';
import { describePrerequisiteIssues } from '@shared/prerequisite-reasons';
import { PrerequisiteOverrideDialog } from './PrerequisiteOverrideDialog';
import { HalfTermCourseTag } from './HalfTermCourseTag';

interface ScheduleReviewPageProps {
  priorScheduledCourses: string[];
  prerequisiteOverrides: string[];
  onPrerequisiteOverridesChange: Dispatch<SetStateAction<string[]>>;
  schedules: GeneratedSchedule[];
  onBack: () => void;
  electiveRequirements?: ElectiveRequirement[];
  selectedElectives?: Record<string, string[]>;
  selectedElectiveCredits?: Record<string, number>;
  onElectiveChange?: (category: string, courseCodes: string[], allSelectedCourses: string[]) => Promise<void>;
  completedCourses?: string[];
  activeTerm: string;
  onChangeTerm: (term: string) => void;
  deliveryPreference?: DeliveryPreference;
  deliveryFallbacks?: string[];
  onDeliveryPreferenceChange?: (preference: DeliveryPreference) => Promise<void>;
  /** Courses planned in other terms, mapped to that term. */
  plannedInOtherTerms?: Record<string, string>;
  plannedCoreCourses?: string[];
  onScheduledCoursesChange?: (courseIds: string[]) => Promise<void>;
  hasAuditData?: boolean;
  auditRequirements?: AuditRequirement[];
  remainingCourses?: string[];
  currentCourses?: Array<{ courseId: string }>;
  courseGrades?: Record<string, string>;
  completedCourseCredits?: Record<string, number>;
}
interface ElectiveCourseInfo {
  code: string;
  name: string;
  credits: number;
  status: 'available' | 'tba' | 'conflicting' | 'prereq' | 'planned';
  prerequisites: string[];
  missingPrerequisites: string[];
  blocks: string[];
  deliveryModes: DeliveryMode[];
  sectionTypes: string[];
  plannedTerm?: string;
}

interface ElectiveFitMeta {
  key: string;
  pairwiseComplete: boolean;
  nextPickThisTerm: boolean;
}

export function ScheduleReviewPage({
  priorScheduledCourses,
  prerequisiteOverrides,
  onPrerequisiteOverridesChange,
  schedules,
  onBack,
  electiveRequirements = [],
  selectedElectives = {},
  selectedElectiveCredits = {},
  onElectiveChange,
  completedCourses = [],
  activeTerm,
  onChangeTerm,
  deliveryPreference = 'any',
  plannedInOtherTerms = {},
  plannedCoreCourses = [],
  onScheduledCoursesChange,
  hasAuditData = false,
  auditRequirements = [],
  remainingCourses = [],
  currentCourses = [],
  courseGrades = {},
  completedCourseCredits = {},
}: ScheduleReviewPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [interactionError, setInteractionError] = useState<string | null>(null);
  const [electiveCourseDetails, setElectiveCourseDetails] = useState<Record<string, ElectiveCourseInfo[]>>({});
  const [loadingElectives, setLoadingElectives] = useState<Record<string, boolean>>({});
  const [swappingElective, setSwappingElective] = useState<string | null>(null);
  const [electiveSearchTerms, setElectiveSearchTerms] = useState<Record<string, string>>({});
  const [showUnavailable, setShowUnavailable] = useState<Record<string, boolean>>({});
  const [electiveFitMeta, setElectiveFitMeta] = useState<Record<string, ElectiveFitMeta>>({});
  const requestedFitKeys = useRef<Record<string, string>>({});
  const [pendingElective, setPendingElective] = useState<{ category: string; code: string; credits: number } | null>(null);
  const [pendingOverride, setPendingOverride] = useState<{ code: string; issues: string[]; category?: string; credits?: number } | null>(null);
  const [changingCore, setChangingCore] = useState<string | null>(null);
  const [coreDetails, setCoreDetails] = useState<Record<string, string>>({});
  const [coreSectionTypes, setCoreSectionTypes] = useState<Record<string, string[]>>({});
  const [corePrerequisiteInfo, setCorePrerequisiteInfo] = useState<Record<string, PrerequisiteValidationResult>>({});
  const [coreFits, setCoreFits] = useState<Record<string, boolean>>({});
  const [inspectedCourse, setInspectedCourse] = useState<string | null>(null);
  const [conflictReport, setConflictReport] = useState<CourseConflictReport | null>(null);
  const [loadingConflicts, setLoadingConflicts] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [hoverPreview, setHoverPreview] = useState<ScheduleHoverPreview | null>(null);
  const closeInspection = useCallback(() => { setHoverPreview(null); setInspectedCourse(null); setConflictReport(null); }, []);
  const inspectCourse = useCallback((code: string) => { setHoverPreview(null); setInspectedCourse(code); }, []);
  const safeIndex = Math.min(currentIndex, schedules.length - 1);
  const currentSchedule = schedules[safeIndex];
  const reviewedSchedule = { ...currentSchedule, prerequisiteInfo: { ...currentSchedule.prerequisiteInfo, ...corePrerequisiteInfo } };
  const scheduledCodes = Array.from(new Set(currentSchedule.selections.map(selection => selection.courseCode)));
  const trayCourseCodes = Array.from(new Set([...plannedCoreCourses, ...Object.keys(plannedInOtherTerms)]));
  const courseColors = new Map(scheduledCodes.map((code, index) => [code, COURSE_COLORS[index % COURSE_COLORS.length]]));
  const builderBusy = changingCore !== null || swappingElective !== null;
  const unmetCategories = useMemo(() => hasAuditData ? conflictCategoriesForTerm(
    collectUnmetCourseCategories(auditRequirements, electiveRequirements, remainingCourses),
    electiveRequirements.map(requirement => requirement.category),
    selectedElectiveCredits,
    plannedCoreCourses,
    inspectedCourse,
    selectedElectives,
  ) : [], [hasAuditData, auditRequirements, electiveRequirements, remainingCourses, selectedElectiveCredits, plannedCoreCourses.join('|'), inspectedCourse, selectedElectives]);
  const excludedCourseIds = useMemo(() => Array.from(new Set([
    ...currentSchedule.selections.map(selection => selection.courseCode),
    ...currentCourses.map(course => course.courseId),
    ...Object.keys(plannedInOtherTerms),
  ])), [currentSchedule, currentCourses, JSON.stringify(plannedInOtherTerms)]);
  const inspectionContext = useMemo(() => ({ hasAuditData, unmetCategories, completedCourses, priorScheduledCourses, courseGrades, completedCourseCredits, excludedCourseIds }), [hasAuditData, unmetCategories, completedCourses, priorScheduledCourses.join('|'), courseGrades, completedCourseCredits, excludedCourseIds]);

  useEffect(() => {
    setHoverPreview(null);
    if (!inspectedCourse) return;
    if (!currentSchedule.selections.some(selection => selection.courseCode === inspectedCourse)) { setInspectedCourse(null); return; }
    const controller = new AbortController();
    setConflictReport(null);
    setConflictError(null);
    setLoadingConflicts(true);
    inspectScheduledCourse(inspectedCourse, currentSchedule, activeTerm, deliveryPreference, inspectionContext, controller.signal).then(report => {
      if (!controller.signal.aborted) setConflictReport(report);
    }).catch(error => {
      if (!controller.signal.aborted) setConflictError(error instanceof Error ? error.message : 'Could not load course conflicts.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoadingConflicts(false);
    });
    return () => controller.abort();
  }, [inspectedCourse, currentSchedule, activeTerm, deliveryPreference, inspectionContext]);

  useEffect(() => {
    let cancelled = false;
    setCoreSectionTypes({});
    Promise.all(Array.from(new Set([...trayCourseCodes, ...scheduledCodes])).map(async code => ({ course: await getCourseByCode(code), sections: await getCourseSections(code, plannedInOtherTerms[code] || activeTerm) }))).then(results => {
      const courses = results.map(result => result.course);
      if (!cancelled) setCoreDetails(Object.fromEntries(courses.filter(course => course !== undefined).map(course => [course.code, course.name])));
      if (!cancelled) setCoreSectionTypes(Object.fromEntries(results.flatMap(({ course, sections }) => course ? [[course.code, Array.from(new Set(sections.map(section => section.type)))]] : [])));
      if (!cancelled) setCorePrerequisiteInfo(Object.fromEntries(courses.filter(course => course !== undefined).map(course => [course.code, validatePrerequisitesFromTree(course.prerequisiteExpression, course.prerequisiteTree || [], { completedCourses, plannedCourses: priorScheduledCourses, courseGrades, currentYear: 'FOURTH_YEAR', hasSpecialPermission: false })])));
    });
    return () => { cancelled = true; };
  }, [trayCourseCodes.join('|'), scheduledCodes.join('|'), activeTerm, JSON.stringify(plannedInOtherTerms), completedCourses.join('|'), priorScheduledCourses.join('|'), courseGrades]);

  useEffect(() => {
    let cancelled = false;
    const candidates = plannedCoreCourses.filter(code => !scheduledCodes.includes(code) && !plannedInOtherTerms[code]);
    setCoreFits({});
    if (!candidates.length) return;
    if (scheduledCodes.length >= 8) {
      setCoreFits(Object.fromEntries(candidates.map(code => [code, false])));
      return;
    }
    checkElectiveFit(scheduledCodes, candidates, activeTerm, false, deliveryPreference).then(result => {
      if (!cancelled) setCoreFits(result.fits);
    }).catch(() => { /* The add operation still checks the full bundle if this preview fails. */ });
    return () => { cancelled = true; };
  }, [plannedCoreCourses.join('|'), currentSchedule, activeTerm, deliveryPreference, JSON.stringify(plannedInOtherTerms)]);

  const toggleCoreCourse = async (code: string, overrideConfirmed = false) => {
    if (!onScheduledCoursesChange || builderBusy) return;
    if (plannedInOtherTerms[code]) {
      setInteractionError(`${code} is already selected for ${getTermLabel(plannedInOtherTerms[code])}.`);
      return;
    }
    if (!scheduledCodes.includes(code) && hasAuditData && !overrideConfirmed && !prerequisiteOverrides.includes(code)) {
      const course = await getCourseByCode(code);
      const validation = validatePrerequisitesFromTree(course?.prerequisiteExpression, course?.prerequisiteTree || [], { completedCourses, plannedCourses: priorScheduledCourses, courseGrades, currentYear: 'FOURTH_YEAR', hasSpecialPermission: false });
      if (!validation.isValid) { setPendingOverride({ code, issues: describePrerequisiteIssues(validation) }); return; }
    }
    const next = scheduledCodes.includes(code) ? scheduledCodes.filter(item => item !== code) : [...scheduledCodes, code];
    setChangingCore(code);
    try {
      await onScheduledCoursesChange(next);
      setCurrentIndex(0);
      setInteractionError(null);
    } catch (error) {
      setInteractionError(error instanceof Error ? error.message : 'This course could not be added.');
    } finally { setChangingCore(null); }
  };

  // Only show elective categories that the user selected on the previous page
  const activeElectiveRequirements = electiveRequirements.filter(
    er => (selectedElectiveCredits[er.category] || 0) > 0 && er.courseOptions && er.courseOptions.length > 0
  );
  const [activeElectiveCategory, setActiveElectiveCategory] = useState<string>(
    activeElectiveRequirements.length > 0 ? activeElectiveRequirements[0].category : ''
  );

  const nonElectiveCourses = getNonElectiveCourses(currentSchedule, electiveRequirements, selectedElectives);

  // Picks a new course in this category would replace, mirroring handleElectiveToggle.
  const getReplacedPicks = (requirement: ElectiveRequirement): string[] => {
    const picks = selectedElectives[requirement.category] || [];
    const unitCredits = getSelectionUnitCredits(requirement);
    const target = selectedElectiveCredits[requirement.category] || requirement.creditsNeeded;
    if (unitCredits >= target) return picks;
    const pickedCredits = picks.reduce((sum, code) => sum + getElectiveCredits(requirement.category, code), 0);
    return pickedCredits + unitCredits > target ? picks.slice(-1) : [];
  };

  const getElectiveCredits = (category: string, code: string) =>
    (electiveCourseDetails[category] || []).find(e => e.code === code)?.credits || 0.5;

  const getFitInputs = (requirement: ElectiveRequirement) => {
    const replaced = getReplacedPicks(requirement);
    const keptPicks = (selectedElectives[requirement.category] || []).filter(code => !replaced.includes(code));
    const otherPicks = electiveRequirements
      .filter(er => er.category !== requirement.category)
      .flatMap(er => selectedElectives[er.category] || []);
    const fixedCourseIds = Array.from(new Set([...nonElectiveCourses, ...otherPicks, ...keptPicks])).sort();
    const unitCredits = getSelectionUnitCredits(requirement);
    const keptCredits = keptPicks.length * unitCredits;
    const target = selectedElectiveCredits[requirement.category] || requirement.creditsNeeded;
    return {
      fixedCourseIds,
      // Only worth checking pairs if the requirement still needs credits after one more pick.
      pairwise: keptCredits + unitCredits < requirement.creditsNeeded,
      nextPickThisTerm: keptCredits + unitCredits < target,
      key: `${activeTerm}|${deliveryPreference}|${fixedCourseIds.join(',')}|${(selectedElectives[requirement.category] || []).join(',')}|${priorScheduledCourses.join(',')}`,
    };
  };

  useEffect(() => {
    setElectiveCourseDetails({});
    setLoadingElectives({});
    setElectiveFitMeta({});
    requestedFitKeys.current = {};
  }, [activeTerm]);

  useEffect(() => {
    for (const er of activeElectiveRequirements) {
      const category = er.category;
      const { fixedCourseIds, pairwise, nextPickThisTerm, key } = getFitInputs(er);
      if (electiveFitMeta[category]?.key === key || requestedFitKeys.current[category] === key) continue;
      requestedFitKeys.current[category] = key;

      const loadDetails = async () => {
        setLoadingElectives(prev => ({ ...prev, [category]: true }));
        const transcript = normalizeConflictTranscript({ completedCourses, plannedCourses: priorScheduledCourses, courseGrades, currentYear: 'FIRST_YEAR', hasSpecialPermission: false });
        const missingCredits = transcript.completedCourses.filter(code => completedCourseCredits[code] === undefined);
        const completedMetadata = await Promise.all(missingCredits.map(getCourseByCode));
        const creditLookup = new Map(completedMetadata.filter(course => course !== undefined).map(course => [course.code, course.credits]));
        transcript.currentYear = standingFromEarnedCredits(transcript.completedCourses.reduce((total, code) => total + (completedCourseCredits[code] ?? creditLookup.get(code) ?? 0), 0));
        const loaded: { code: string; course: NonNullable<Awaited<ReturnType<typeof getCourseByCode>>>; sections: CourseSection[] }[] = [];
        const coursesToLoad = er.courseOptions.slice(0, 100);

        for (let batchStart = 0; batchStart < coursesToLoad.length; batchStart += 20) {
          const batch = coursesToLoad.slice(batchStart, batchStart + 20);
          const courses = await Promise.all(batch.map(code => getCourseByCode(code)));
          await Promise.all(batch.map(async (code, i) => {
            const course = courses[i];
            if (!course || !(course.terms || []).includes(activeTerm)) return;
            loaded.push({ code, course, sections: await getCourseSections(code, activeTerm) });
          }));
        }

        const picks = selectedElectives[category] || [];
        const candidateIds = loaded.map(item => item.code).filter(code => !picks.includes(code) && !plannedInOtherTerms[code]);
        let fit: ElectiveFitResult | null = null;
        if (candidateIds.length > 0) {
          try {
            fit = await checkElectiveFit(fixedCourseIds, candidateIds, activeTerm, pairwise, deliveryPreference);
          } catch {
            fit = null;
          }
        }
        const fixedSections = fit ? [] : await Promise.all(fixedCourseIds.map(code => getCourseSections(code, activeTerm)));

        const eligibleCodes = eligibleConflictCourseCategories(loaded.map(({ code, course }) => ({ courseId: code, prerequisiteExpression: course.prerequisiteExpression, prerequisiteNodes: course.prerequisiteTree || [] })), [{ id: category, label: er.label, courseOptions: loaded.map(item => item.code) }], transcript);
        const details: ElectiveCourseInfo[] = loaded.map(({ code, course, sections }) => {
          const prereqsMet = eligibleCodes.has(code);
          const prerequisiteResult = validatePrerequisitesFromTree(course.prerequisiteExpression || (course.prerequisiteTree?.length ? 'Recorded prerequisites' : undefined), course.prerequisiteTree || [], transcript);
          const hasAnyTimedSections = sections.some(section => section.timeSlots.length > 0);
          const isPicked = picks.includes(code);
          const fits = isPicked || (fit ? fit.fits[code.toUpperCase()] !== false : hasValidCourseCombination([...fixedSections, sections]));
          const plannedTerm = isPicked ? undefined : plannedInOtherTerms[code];
          return {
            code,
            name: course.name || code,
            credits: course.credits || 0.5,
            plannedTerm,
            status: plannedTerm
              ? 'planned'
              : hasAnyTimedSections && !fits
              ? 'conflicting'
              : !prereqsMet
                ? 'prereq'
                : !hasAnyTimedSections
                  ? 'tba'
                  : 'available',
            prerequisites: course.prerequisites,
            missingPrerequisites: describePrerequisiteIssues(prerequisiteResult),
            blocks: isPicked ? [] : (fit?.blocks[code.toUpperCase()] || []),
            deliveryModes: Array.from(new Set(sections.map(section => section.deliveryMode))),
            sectionTypes: Array.from(new Set(sections.map(section => section.type))),
          };
        });

        details.sort((a, b) => {
          const rank = { available: 0, tba: 1, conflicting: 2, prereq: 3, planned: 4 } as const;
          const aRank = rank[a.status];
          const bRank = rank[b.status];
          if (aRank !== bRank) return aRank - bRank;
          return a.code.localeCompare(b.code);
        });

        // A newer check for this category started while this one ran.
        if (requestedFitKeys.current[category] !== key) return;
        setElectiveCourseDetails(prev => ({ ...prev, [category]: details }));
        setElectiveFitMeta(prev => ({ ...prev, [category]: { key, pairwiseComplete: fit?.pairwiseComplete ?? true, nextPickThisTerm } }));
        setLoadingElectives(prev => ({ ...prev, [category]: false }));
      };
      loadDetails();
    }
  }, [activeElectiveRequirements, completedCourses, courseGrades, completedCourseCredits, activeTerm, currentSchedule, electiveRequirements, selectedElectives, selectedElectiveCredits, electiveFitMeta, deliveryPreference, priorScheduledCourses.join('|')]);

  const handlePrevious = () => setCurrentIndex(prev => (prev > 0 ? prev - 1 : schedules.length - 1));
  const handleNext = () => setCurrentIndex(prev => (prev < schedules.length - 1 ? prev + 1 : 0));

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemId);
      setInteractionError(null);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch {
      setInteractionError('Clipboard access is unavailable. You can select and copy the registration numbers directly.');
    }
  };

  const handleElectiveToggle = async (category: string, courseCode: string, courseCredits: number) => {
    if (!onElectiveChange || builderBusy) return;
    if (plannedInOtherTerms[courseCode]) {
      setInteractionError(`${courseCode} is already selected for ${getTermLabel(plannedInOtherTerms[courseCode])}.`);
      return;
    }
    const requirement = electiveRequirements.find(er => er.category === category);
    if (!requirement) return;
    const creditsTarget = selectedElectiveCredits[category] || requirement.creditsNeeded;

    const currentPicks = selectedElectives[category] || [];
    const isSelected = currentPicks.includes(courseCode);

    let newPicks: string[];
    if (isSelected) {
      newPicks = currentPicks.filter(c => c !== courseCode);
    } else if (courseCredits >= creditsTarget) {
      newPicks = [courseCode];
    } else {
      const currentCredits = currentPicks.reduce((sum, code) => sum + getElectiveCredits(category, code), 0);
      if (currentCredits + courseCredits > creditsTarget) {
        newPicks = [...currentPicks.slice(0, -1), courseCode];
      } else {
        newPicks = [...currentPicks, courseCode];
      }
    }

    setSwappingElective(courseCode);

    const allElectivePicks: string[] = [];
    for (const er of electiveRequirements) {
      if (er.category === category) allElectivePicks.push(...newPicks);
      else allElectivePicks.push(...(selectedElectives[er.category] || []));
    }

    try {
      const courseIds = [...new Set([...nonElectiveCourses, ...allElectivePicks])];
      await onElectiveChange(category, newPicks, courseIds);
      setCurrentIndex(0);
      setInteractionError(null);
    } catch (error) {
      setInteractionError(error instanceof Error ? error.message : 'The elective could not be changed.');
    } finally {
      setSwappingElective(null);
    }
  };

  // Ask before adding an elective that rules out others for the remaining credits.
  const requestElectiveToggle = (category: string, courseCode: string, courseCredits: number, overrideConfirmed = false) => {
    if (builderBusy) return;
    const info = (electiveCourseDetails[category] || []).find(e => e.code === courseCode);
    const isSelected = (selectedElectives[category] || []).includes(courseCode);
    if (!isSelected && info?.status === 'prereq' && !overrideConfirmed && !prerequisiteOverrides.includes(courseCode)) {
      setPendingOverride({ code: courseCode, category, credits: courseCredits, issues: info.missingPrerequisites });
      return;
    }
    if (!isSelected && info && info.blocks.length > 0) {
      setPendingElective({ category, code: courseCode, credits: courseCredits });
      return;
    }
    handleElectiveToggle(category, courseCode, courseCredits);
  };

  const handleElectiveRemove = async (category: string, courseCode: string) => {
    if (!onElectiveChange || builderBusy) return;
    const currentPicks = selectedElectives[category] || [];
    const newPicks = currentPicks.filter(c => c !== courseCode);

    // Build the updated course list

    const allElectivePicks: string[] = [];
    for (const er of electiveRequirements) {
      if (er.category === category) allElectivePicks.push(...newPicks);
      else allElectivePicks.push(...(selectedElectives[er.category] || []));
    }

    const allCourses = [...new Set([...nonElectiveCourses, ...allElectivePicks])];
    setSwappingElective(courseCode);
    try {
      await onElectiveChange(category, newPicks, allCourses);
      setCurrentIndex(0);
      setInteractionError(null);
    } catch (error) {
      setInteractionError(error instanceof Error ? error.message : 'The elective could not be removed.');
    } finally {
      setSwappingElective(null);
    }
  };

  const parseTime = (time: string): number => {
    const normalized = time.replace(':', '').padStart(4, '0');
    return Number(normalized.slice(0, 2)) * 60 + Number(normalized.slice(2));
  };

  const deselectCourse = (code: string) => {
    if (builderBusy || !scheduledCodes.includes(code)) return;
    const requirement = electiveRequirements.find(item => (selectedElectives[item.category] || []).includes(code));
    if (requirement) handleElectiveRemove(requirement.category, code);
    else toggleCoreCourse(code);
  };

  // Fit all generated options, keeping the time range stable when switching.
  const inspectionSlots = inspectedCourse ? (conflictReport?.courses || []).filter(candidate => unmetCategories.some(category => category.courseOptions.includes(candidate.courseId) && candidate.categories.some(tag => tag.id === category.id))).flatMap(candidate => (candidate.sections || []).flatMap(section => section.timeSlots)) : [];
  const allSlots = [...schedules.flatMap(schedule => schedule.selections.flatMap(selection => selection.section.timeSlots)), ...inspectionSlots];
  const visibleStartHour = allSlots.length ? Math.max(0, Math.floor(Math.min(...allSlots.map(slot => parseTime(slot.startTime))) / 60) - 1) : TIMETABLE_CONFIG.START_HOUR;
  const visibleEndHour = allSlots.length ? Math.min(24, Math.ceil(Math.max(...allSlots.map(slot => parseTime(slot.endTime))) / 60) + 1) : 18;
  const visibleTimeSlots: string[] = [];
  for (let h = visibleStartHour; h < visibleEndHour; h++) {
    visibleTimeSlots.push(`${h.toString().padStart(2, '0')}:00`);
  }

  const HOUR_PX = 48;

  const currentSlots = currentSchedule.selections.flatMap(selection => selection.section.timeSlots);
  const campusDays = new Set(currentSlots.map(slot => slot.day)).size;
  const weeklyHours = Math.round(currentSlots.reduce((sum, slot) => sum + parseTime(slot.endTime) - parseTime(slot.startTime), 0) / 6) / 10;
  const courseCount = new Set(currentSchedule.selections.map(selection => selection.courseCode)).size;

  const getPos = (startTime: string, endTime: string) => {
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    const dayStart = visibleStartHour * 60;
    return {
      top: ((start - dayStart) / 60) * HOUR_PX,
      height: ((end - start) / 60) * HOUR_PX,
    };
  };

  return (
    <main className="page-container scheduler-page">
      <section className="glass-panel schedule-course-tray" aria-labelledby="schedule-course-tray-heading">
        <div className="schedule-course-tray-heading">
          <div className="schedule-course-tray-title"><h2 id="schedule-course-tray-heading">Add to your timetable</h2><TermTabs activeTerm={activeTerm} onChangeTerm={onChangeTerm} disabled={builderBusy} label="Schedule term" /></div>
          <div className="schedule-metrics">
            <span><BookOpen size={16} /> {courseCount} {courseCount === 1 ? 'course' : 'courses'}</span>
            <span><CalendarDays size={16} /> {campusDays} days / week</span>
            <span><Clock3 size={16} /> {weeklyHours} scheduled hours</span>
          </div>
        </div>
        <div className="schedule-course-buttons">
          {trayCourseCodes.map(code => {
            const added = scheduledCodes.includes(code);
            const colors = courseColors.get(code);
            const sectionTypes = coreSectionTypes[code] || currentSchedule.selections.filter(selection => selection.courseCode === code).map(selection => selection.section.type);
            const plannedTerm = plannedInOtherTerms[code];
            const fits = !plannedTerm && (added || coreFits[code] !== false);
            return <button key={code} className={`schedule-course-button course-has-term-tags${added ? ' is-added has-course-color' : ''}${!fits ? ' does-not-fit' : ''}`} style={colors ? { background: colors.bg, borderColor: colors.border, color: colors.text } : undefined} aria-label={plannedTerm ? `${code} already selected for ${getTermLabel(plannedTerm)}` : `${added ? 'Remove' : 'Add'} ${code} ${added ? 'from' : 'to'} timetable`} aria-pressed={added} disabled={builderBusy || !fits} onClick={() => toggleCoreCourse(code)}>
              <CourseTermTags code={code} activeTerm={activeTerm} requiredTypes={sectionTypes} />
              {changingCore === code ? <Loader2 size={17} className="animate-spin" /> : plannedTerm ? <Lock size={17} /> : added ? <Check size={17} /> : <Plus size={17} />}
              <span><span className="course-title-row"><strong>{code}</strong><HalfTermCourseTag code={code} />{prerequisiteOverrides.includes(code) && <span className="prerequisite-override-badge" title="Prerequisite override · planning only">Override</span>}</span><small>{plannedTerm ? `Already selected for ${getTermLabel(plannedTerm)}` : !fits ? scheduledCodes.length >= 8 ? 'The timetable already contains 8 courses' : "No timetable fits all selected courses" : coreDetails[code] || 'All required sections'}</small><small>{sectionRequirements(sectionTypes)}</small>{hasAuditData && !plannedTerm && corePrerequisiteInfo[code]?.isValid === false && <small className="prerequisite-override-label">{describePrerequisiteIssues(corePrerequisiteInfo[code]).join(' · ')}</small>}</span>
            </button>;
          })}
          {activeElectiveRequirements.map(requirement => {
            const picks = (selectedElectives[requirement.category] || []).filter(code => scheduledCodes.includes(code));
            const added = picks.length > 0;
            const colors = courseColors.get(picks[0]);
            const busy = swappingElective !== null && (selectedElectives[requirement.category] || []).includes(swappingElective);
            return <button key={requirement.category} className={`schedule-course-button is-elective${added ? ' is-added has-course-color course-has-term-tags' : ''}`} style={colors ? { background: colors.bg, borderColor: colors.border, color: colors.text, ...(picks.length > 1 ? { paddingTop: picks.length * 22 + 12 } : {}) } : undefined} aria-pressed={added} disabled={builderBusy} onClick={() => { closeInspection(); setActiveElectiveCategory(requirement.category); document.getElementById('schedule-elective-picker')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }}>
              {picks.length === 1 && <CourseTermTags code={picks[0]} activeTerm={activeTerm} requiredTypes={currentSchedule.selections.filter(selection => selection.courseCode === picks[0]).map(selection => selection.section.type)} />}
              {picks.length > 1 && <div className="course-multi-term-tags">{picks.map(code => <div key={code}><small>{code}</small><CourseTermTags code={code} activeTerm={activeTerm} requiredTypes={currentSchedule.selections.filter(selection => selection.courseCode === code).map(selection => selection.section.type)} /></div>)}</div>}
              {busy ? <Loader2 size={17} className="animate-spin" /> : added ? <Check size={17} /> : <BookOpen size={17} />}
              <span><span className="course-title-row"><strong>{requirement.label}</strong>{picks.some(code => prerequisiteOverrides.includes(code)) && <span className="prerequisite-override-badge" title="Prerequisite override · planning only">Override</span>}</span><small>{selectedElectiveCredits[requirement.category]} credits · {added ? picks.join(', ') : 'Choose a course'}</small>{picks.map(code => <small key={code}>{picks.length > 1 ? `${code} · ` : ''}{sectionRequirements(currentSchedule.selections.filter(selection => selection.courseCode === code).map(selection => selection.section.type))}{' '}<HalfTermCourseTag code={code} /></small>)}</span><ChevronRight size={15} />
            </button>;
          })}
        </div>
      </section>
      {interactionError && <p className="inline-error" role="alert">{interactionError}</p>}
      <div className="schedule-layout">
        <ScheduleCalendarSection
          schedules={schedules}
          currentIndex={safeIndex}
          currentSchedule={currentSchedule}
          visibleTimeSlots={visibleTimeSlots}
          hourPx={HOUR_PX}
          getPos={getPos}
          onBack={onBack}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSelectSchedule={setCurrentIndex}
          onInspectCourse={inspectCourse}
          hoverPreview={hoverPreview}
        />
        {inspectedCourse ? <CourseConflictDialog course={inspectedCourse} report={conflictReport} scopeCategories={unmetCategories} loading={loadingConflicts} error={conflictError} term={activeTerm} onClose={closeInspection} onPreview={setHoverPreview} onDeselect={deselectCourse} busy={builderBusy} /> : <ScheduleSidebar
          currentSchedule={reviewedSchedule}
          copiedItem={copiedItem}
          activeTerm={activeTerm}
          prerequisiteOverrides={prerequisiteOverrides}
          onCopyToClipboard={copyToClipboard}
          activeElectiveRequirements={activeElectiveRequirements}
          activeElectiveCategory={activeElectiveCategory}
          setActiveElectiveCategory={setActiveElectiveCategory}
          selectedElectives={selectedElectives}
          selectedElectiveCredits={selectedElectiveCredits}
          electiveCourseDetails={electiveCourseDetails}
          loadingElectives={loadingElectives}
          electiveSearchTerms={electiveSearchTerms}
          setElectiveSearchTerms={setElectiveSearchTerms}
          showUnavailable={showUnavailable}
          setShowUnavailable={setShowUnavailable}
          swappingElective={swappingElective}
          electiveFitMeta={electiveFitMeta}
          onElectiveToggle={requestElectiveToggle}
          onElectiveRemove={handleElectiveRemove}
          busy={builderBusy}
          onInspectCourse={inspectCourse}
        />}
      </div>
      <ElectiveBlockDialog
        pending={pendingElective}
        details={pendingElective ? electiveCourseDetails[pendingElective.category] || [] : []}
        nextPickThisTerm={pendingElective ? electiveFitMeta[pendingElective.category]?.nextPickThisTerm ?? false : false}
        onCancel={() => setPendingElective(null)}
        onConfirm={() => {
          if (!pendingElective) return;
          const { category, code, credits } = pendingElective;
          setPendingElective(null);
          handleElectiveToggle(category, code, credits);
        }}
      />
      <PrerequisiteOverrideDialog course={pendingOverride?.code || null} issues={pendingOverride?.issues || []} onCancel={() => setPendingOverride(null)} onConfirm={() => {
        if (!pendingOverride) return;
        const { code, category, credits } = pendingOverride;
        onPrerequisiteOverridesChange(previous => Array.from(new Set([...previous, code])));
        setPendingOverride(null);
        if (category) requestElectiveToggle(category, code, credits || 0.5, true);
        else toggleCoreCourse(code, true);
      }} />
    </main>
  );
}

function getNonElectiveCourses(
  schedule: GeneratedSchedule,
  electiveRequirements: ElectiveRequirement[],
  selectedElectives: Record<string, string[]>
): string[] {
  const picked = new Set(electiveRequirements.flatMap(er => selectedElectives[er.category] || []));
  return Array.from(new Set(schedule.selections.map(selection => selection.courseCode).filter(code => !picked.has(code))));
}

function hasValidCourseCombination(courses: CourseSection[][]): boolean {
  if (courses.some(sections => !sections.length)) return false;
  const groups = courses.flatMap(sections => {
    const byType = new Map<string, CourseSection[]>();
    for (const section of sections) byType.set(section.type, [...(byType.get(section.type) || []), section]);
    return Array.from(byType.values());
  }).sort((a, b) => a.length - b.length);
  const slots = (section: CourseSection) => section.deliveryMode === 'ONLINE_ASYNC' ? [] : section.timeSlots;
  const build = (index: number, chosen: CourseSection[]): boolean => index === groups.length || groups[index].some(section =>
    !slots(section).some(slot => chosen.some(other => slots(other).some(meeting => hasTimeConflict(slot, meeting)))) && build(index + 1, [...chosen, section]));
  return groups.length > 0 && build(0, []);
}
