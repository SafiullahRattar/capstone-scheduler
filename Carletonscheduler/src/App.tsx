import { useState, useEffect, useCallback, useRef } from 'react';
import { AcademicHistoryImport } from './components/AcademicHistoryImport';
import { CourseSelectionPage } from './components/CourseSelectionPage';
import { ScheduleReviewPage } from './components/ScheduleReviewPage';
import { LoginPage } from './components/LoginPage';
import { AppShell } from './components/AppShell';
import { AdminPage } from './components/admin';
import { generateSchedules, type GeneratedSchedule } from './utils/scheduleGenerator';
import { carryOverSectionChoices, chooseEquivalentSection } from './utils/sectionChoices';
import { API_BASE_URL, authenticatedFetch } from './config/constants';
import { getDefaultActiveTerm, getTermLabel } from './utils/termUtils';
import type { ElectiveRequirement } from './types/electives';
import { normalizeDeliveryMode, type DeliveryPreference } from './utils/deliveryMode';
import type { AuditRequirement, RequirementChoices } from './types/audit';
import type { BlockedTime } from '@shared/blocked-times';
import { collectRequestedElectiveCounts, getElectiveTokenCategory, getSelectionUnitCredits } from './utils/electiveUtils';
import { fetchElectiveCatalog } from './utils/electiveCatalog';
import { mergeElectiveRequirements } from './utils/electiveRequirements';

type AppPage = 'import' | 'course-selection' | 'schedule-review' | 'admin';

interface StudentInfo {
  name: string;
  studentId: string;
  program: string;
}

interface CurrentCourse {
  courseId: string;
  term: string;
}

interface ParsedAuditData {
  completedCourses: Array<{ courseId: string; grade?: string; credits?: number }>;
  currentCourses: CurrentCourse[];
  remainingCourses: string[];
  electiveRequirements?: ElectiveRequirement[];
  requirements?: AuditRequirement[];
  studentName?: string;
  studentId?: string;
  program?: string;
}

// A term's plan while another term is active.
interface TermPlan {
  prerequisiteOverrides?: string[];
  chosenCourses: string[];
  requirementChoices: RequirementChoices;
  generatedSchedules: GeneratedSchedule[];
  selectedElectives: Record<string, string[]>;
  selectedElectiveCredits: Record<string, number>;
  generatedCourses: string[];
  deliveryFallbacks: string[];
}

const EMPTY_TERM_PLAN: TermPlan = {
  prerequisiteOverrides: [],
  chosenCourses: [],
  requirementChoices: {},
  generatedSchedules: [],
  selectedElectives: {},
  selectedElectiveCredits: {},
  generatedCourses: [],
  deliveryFallbacks: [],
};

// Schedules saved before delivery modes existed have none; treat them as in person.
function withDeliveryModes(schedules: GeneratedSchedule[]): GeneratedSchedule[] {
  return schedules.map(schedule => ({
    ...schedule,
    selections: schedule.selections.map(selection => ({
      ...selection,
      section: { ...selection.section, deliveryMode: normalizeDeliveryMode(selection.section.deliveryMode) },
    })),
  }));
}

interface AppState {
  prerequisiteOverrides?: string[];
  currentPage: AppPage;
  hasAuditData: boolean;
  completedCourses: string[];
  currentCourses: CurrentCourse[];
  remainingCourses: string[];
  electiveRequirements: ElectiveRequirement[];
  studentInfo?: StudentInfo;
  generatedSchedules: GeneratedSchedule[];
  selectedElectives: Record<string, string[]>; // category -> selected course codes
  selectedElectiveCredits: Record<string, number>; // category -> requested elective credits from selection page
  activeTerm: string;
  chosenCourses: string[];
  hasEnteredPlanner: boolean;
  auditRequirements: AuditRequirement[];
  requirementChoices: RequirementChoices;
  courseGrades: Record<string, string>;
  completedCourseCredits?: Record<string, number>;
  deliveryPreference?: DeliveryPreference;
  blockedTimes?: BlockedTime[];
  generatedCourses?: string[];
  deliveryFallbacks?: string[];
  termPlans?: Record<string, TermPlan>;
}

const STORAGE_KEY = 'scheduler-state';

const pageToPath: Record<AppPage, string> = {
  'import': '/',
  'course-selection': '/courses',
  'schedule-review': '/schedules',
  'admin': '/admin'
};

const pathToPage: Record<string, AppPage> = {
  '/': 'import',
  '/term': 'course-selection',
  '/courses': 'course-selection',
  '/schedules': 'schedule-review',
  '/admin': 'admin'
};

function getInitialPage(): AppPage {
  const path = window.location.pathname;
  return pathToPage[path] || 'import';
}

function getAllowedPage(page: AppPage | 'term-selection', hasEntered: boolean, hasSchedules: boolean): AppPage {
  if (page === 'import' || page === 'admin') return page;
  if (!hasEntered) return 'import';
  if (page === 'term-selection') return 'course-selection';
  if (page === 'schedule-review' && !hasSchedules) return 'course-selection';
  return page;
}

function loadState(): Partial<AppState> | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function saveState(state: AppState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

function clearState() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('auth_token'));
  const [user, setUser] = useState<any>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(isAuthenticated);

  const initialPage = getInitialPage();
  
  const savedState = loadState();
  
  const [hasEnteredPlanner, setHasEnteredPlanner] = useState(savedState?.hasEnteredPlanner === true);
  
  const [currentPage, setCurrentPage] = useState<AppPage>(
    getAllowedPage(initialPage, hasEnteredPlanner, (savedState?.generatedSchedules?.length ?? 0) > 0)
  );
  const [hasAuditData, setHasAuditData] = useState(savedState?.hasAuditData || false);
  const [completedCourses, setCompletedCourses] = useState<string[]>(savedState?.completedCourses || []);
  const [currentCourses, setCurrentCourses] = useState<CurrentCourse[]>(savedState?.currentCourses || []);
  const [remainingCourses, setRemainingCourses] = useState<string[]>(savedState?.remainingCourses || []);
  const [electiveRequirements, setElectiveRequirements] = useState<ElectiveRequirement[]>(savedState?.electiveRequirements || []);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | undefined>(savedState?.studentInfo);
  const [generatedSchedules, setGeneratedSchedules] = useState<GeneratedSchedule[]>(() => withDeliveryModes(savedState?.generatedSchedules || []));
  const [selectedElectives, setSelectedElectives] = useState<Record<string, string[]>>(savedState?.selectedElectives || {});
  const [selectedElectiveCredits, setSelectedElectiveCredits] = useState<Record<string, number>>(savedState?.selectedElectiveCredits || {});
  const [activeTerm, setActiveTerm] = useState<string>(savedState?.activeTerm || getDefaultActiveTerm());
  const [chosenCourses, setChosenCourses] = useState<string[]>(savedState?.chosenCourses || []);
  const [prerequisiteOverrides, setPrerequisiteOverrides] = useState<string[]>(savedState?.prerequisiteOverrides || []);
  const [auditRequirements, setAuditRequirements] = useState<AuditRequirement[]>(savedState?.auditRequirements || []);
  const [requirementChoices, setRequirementChoices] = useState<RequirementChoices>(savedState?.requirementChoices || {});
  const [courseGrades, setCourseGrades] = useState<Record<string, string>>(savedState?.courseGrades || {});
  const [completedCourseCredits, setCompletedCourseCredits] = useState<Record<string, number>>(savedState?.completedCourseCredits || {});
  const [deliveryPreference, setDeliveryPreference] = useState<DeliveryPreference>(savedState?.deliveryPreference || 'any');
  // Shared by every term, like a work shift the student has to plan around.
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>(savedState?.blockedTimes || []);
  // Courses the current schedules were generated from, so they can be regenerated with a new delivery preference.
  const [generatedCourses, setGeneratedCourses] = useState<string[]>(savedState?.generatedCourses || []);
  const [deliveryFallbacks, setDeliveryFallbacks] = useState<string[]>(savedState?.deliveryFallbacks || []);
  // Plans for every term except the active one, which lives in the state above.
  const [termPlans, setTermPlans] = useState<Record<string, TermPlan>>(() => Object.fromEntries(
    Object.entries(savedState?.termPlans || {}).map(([term, plan]) => [term, { ...plan, generatedSchedules: withDeliveryModes(plan.generatedSchedules) }])
  ));
  const previousPlan = useRef([...chosenCourses].sort().join('|'));

  useEffect(() => {
    const plan = [...chosenCourses].sort().join('|');
    if (plan === previousPlan.current) return;
    previousPlan.current = plan;
    setGeneratedSchedules([]);
    setSelectedElectives({});
    setSelectedElectiveCredits({});
  }, [chosenCourses]);

  const handleBlockedTimesChange = (next: BlockedTime[]) => {
    setBlockedTimes(next);
    // The current timetable may use sections in the newly blocked times, so it is rebuilt from scratch.
    setGeneratedSchedules([]);
    setGeneratedCourses([]);
    setDeliveryFallbacks([]);
    setSelectedElectives({});
  };

  // Removing a course from the plan also removes its requirement associations.
  useEffect(() => {
    setRequirementChoices(previous => {
      const next = Object.fromEntries(Object.entries(previous).map(([id, codes]) => [id, codes.filter(code => chosenCourses.includes(code))]));
      return Object.keys(previous).some(id => previous[id].length !== next[id].length) ? next : previous;
    });
  }, [chosenCourses]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsCheckingSession(false);
      return;
    }

    authenticatedFetch(`${API_BASE_URL}/auth/me`)
      .then(async response => {
        if (!response.ok) throw new Error('Invalid session');
        setUser(await response.json());
      })
      .catch(() => {
        localStorage.removeItem('auth_token');
        setIsAuthenticated(false);
        setUser(null);
      })
      .finally(() => setIsCheckingSession(false));
  }, [isAuthenticated]);

  // Navigate to a page and update URL
  const navigateTo = useCallback((page: AppPage, replace = false) => {
    const path = pageToPath[page];
    if (replace) {
      window.history.replaceState({ page }, '', path);
    } else {
      window.history.pushState({ page }, '', path);
    }
    setCurrentPage(page);
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    const state: AppState = {
      currentPage,
      hasAuditData,
      completedCourses,
      currentCourses,
      remainingCourses,
      electiveRequirements,
      studentInfo,
      generatedSchedules,
      selectedElectives,
      selectedElectiveCredits,
      activeTerm,
      chosenCourses,
      prerequisiteOverrides,
      hasEnteredPlanner,
      auditRequirements,
      requirementChoices,
      courseGrades,
      completedCourseCredits,
      deliveryPreference,
      blockedTimes,
      generatedCourses,
      deliveryFallbacks,
      termPlans,
    };
    saveState(state);
  }, [currentPage, hasAuditData, completedCourses, currentCourses, remainingCourses, electiveRequirements, studentInfo, generatedSchedules, selectedElectives, selectedElectiveCredits, activeTerm, chosenCourses, prerequisiteOverrides, hasEnteredPlanner, auditRequirements, requirementChoices, courseGrades, completedCourseCredits, deliveryPreference, blockedTimes, generatedCourses, deliveryFallbacks, termPlans]);

  // Sync URL with current page on mount
  useEffect(() => {
    const currentPath = window.location.pathname;
    const expectedPath = pageToPath[currentPage];
    if (currentPath !== expectedPath) {
      window.history.replaceState({ page: currentPage }, '', expectedPath);
    }
  }, []);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const page: AppPage = event.state?.page || pathToPage[window.location.pathname] || 'import';
      const allowedPage = getAllowedPage(page, hasEnteredPlanner, generatedSchedules.length > 0);
      if (page !== allowedPage) {
        navigateTo(allowedPage, true);
      } else {
        setCurrentPage(page);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasEnteredPlanner, generatedSchedules.length, navigateTo]);

  const handleStartOver = () => {
    setHasEnteredPlanner(false);
    setHasAuditData(false);
    setCompletedCourses([]);
    setCurrentCourses([]);
    setRemainingCourses([]);
    setElectiveRequirements([]);
    setAuditRequirements([]);
    setRequirementChoices({});
    setCourseGrades({});
    setCompletedCourseCredits({});
    setBlockedTimes([]);
    setGeneratedCourses([]);
    setDeliveryFallbacks([]);
    setStudentInfo(undefined);
    setGeneratedSchedules([]);
    setSelectedElectives({});
    setSelectedElectiveCredits({});
    setChosenCourses([]);
    setPrerequisiteOverrides([]);
    setTermPlans({});
    setActiveTerm(getDefaultActiveTerm());
    clearState();
    navigateTo('import');
  };

  const handleManualEntry = () => {
    setHasEnteredPlanner(true);
    navigateTo('course-selection');
  };

  // Saves the active term's plan and restores the target term's plan, or starts it blank.
  const handleTermChange = (term: string) => {
    if (term === activeTerm) return;
    const current: TermPlan = { chosenCourses, prerequisiteOverrides, requirementChoices, generatedSchedules, selectedElectives, selectedElectiveCredits, generatedCourses, deliveryFallbacks };
    const next = termPlans[term] || EMPTY_TERM_PLAN;
    const { [term]: _restored, ...others } = termPlans;
    const hasPlan = current.chosenCourses.length > 0 || current.generatedSchedules.length > 0;
    setTermPlans(hasPlan ? { ...others, [activeTerm]: current } : others);

    // Restoring a plan must not trip the "plan changed" reset of generated schedules.
    previousPlan.current = [...next.chosenCourses].sort().join('|');
    setActiveTerm(term);
    setChosenCourses(next.chosenCourses);
    setPrerequisiteOverrides(next.prerequisiteOverrides || []);
    setRequirementChoices(next.requirementChoices);
    setGeneratedSchedules(next.generatedSchedules);
    setSelectedElectives(next.selectedElectives);
    setSelectedElectiveCredits(next.selectedElectiveCredits);
    setGeneratedCourses(next.generatedCourses);
    setDeliveryFallbacks(next.deliveryFallbacks);
  };

  const handleScheduleTermChange = (term: string) => {
    if (term === activeTerm) return;
    const next = termPlans[term];
    handleTermChange(term);
    if (!next?.generatedSchedules.length) setGeneratedSchedules([{ id: 1, selections: [], hasUnmetPrerequisites: false, prerequisiteInfo: {} }]);
  };

  // Courses already planned in other terms, mapped to the term they're planned for.
  const plannedInOtherTerms: Record<string, string> = {};
  const otherTermElectiveCounts: Record<string, { count: number; term: string }> = {};
  for (const [term, plan] of Object.entries(termPlans)) {
    for (const code of plan.chosenCourses) {
      const category = getElectiveTokenCategory(code);
      if (category) {
        otherTermElectiveCounts[category] = { count: (otherTermElectiveCounts[category]?.count || 0) + 1, term };
      } else {
        plannedInOtherTerms[code] = term;
      }
    }
    for (const code of Object.values(plan.selectedElectives).flat()) plannedInOtherTerms[code] = term;
  }
  const priorScheduledCourses = Array.from(new Set(Object.entries(termPlans)
    .filter(([term]) => Number(term) < Number(activeTerm))
    .flatMap(([, plan]) => plan.generatedSchedules[0]?.selections.map(selection => selection.courseCode) || [])));

  const handleUploadComplete = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/audit/parse`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'The audit could not be read. Try another file or browse courses without an audit.');
      }

      const data: ParsedAuditData = await response.json();
      const completedCourseIds = data.completedCourses.map(course => course.courseId);

      setStudentInfo({
        name: data.studentName || 'Student',
        studentId: data.studentId || '',
        program: data.program || 'Engineering'
      });
      setHasAuditData(true);
      setCompletedCourses(completedCourseIds);
      setCurrentCourses(data.currentCourses || []);
      setRemainingCourses(data.remainingCourses || []);
      setElectiveRequirements(data.electiveRequirements || []);
      setAuditRequirements(data.requirements || []);
      setRequirementChoices({});
      setCourseGrades(Object.fromEntries(data.completedCourses.flatMap(course => course.grade ? [[course.courseId, course.grade]] : [])));
      setCompletedCourseCredits(Object.fromEntries(data.completedCourses.flatMap(course => course.credits !== undefined ? [[course.courseId, course.credits]] : [])));
      setChosenCourses([]);
      setPrerequisiteOverrides([]);
      setTermPlans({});
      setGeneratedSchedules([]);
      setHasEnteredPlanner(true);
      setSelectedElectives({});
      setSelectedElectiveCredits({});
      navigateTo('course-selection');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(message);
    }
  };

  const handleGenerateSchedules = async (courses: string[], termOverride?: string) => {
    const termToUse = termOverride || activeTerm;
    try {
      const regularCourses = courses.filter(course => !course.startsWith('ELECTIVE:'));
      const requestedElectiveCounts = collectRequestedElectiveCounts(courses);
      const requestedCredits: Record<string, number> = {};
      let effectiveElectiveRequirements = electiveRequirements;

      const missingCategories = Array.from(requestedElectiveCounts.keys()).filter((category) =>
        !effectiveElectiveRequirements.some((item) => item.category === category)
      );

      if (missingCategories.length > 0) {
        const catalogRequirements = await fetchElectiveCatalog();
        effectiveElectiveRequirements = mergeElectiveRequirements(
          effectiveElectiveRequirements,
          catalogRequirements.filter((item) => missingCategories.includes(item.category))
        );
        setElectiveRequirements(effectiveElectiveRequirements);
      }

      for (const [category, tokenCount] of requestedElectiveCounts.entries()) {
        const requirement = effectiveElectiveRequirements.find(item => item.category === category);
        if (!requirement) continue;

        const selectionUnitCredits = getSelectionUnitCredits(requirement);
        const maxRequestableCredits = requirement.creditsNeeded > 0
          ? requirement.creditsNeeded
          : tokenCount * selectionUnitCredits;
        requestedCredits[category] = Math.min(tokenCount * selectionUnitCredits, maxRequestableCredits);
      }

      setSelectedElectives({});
      setSelectedElectiveCredits(requestedCredits);

      if (regularCourses.length === 0 && Object.keys(requestedCredits).length === 0) {
        throw new Error('Add a course or elective to your plan before generating schedules.');
      }

      // Planned courses become buttons in the builder, not automatic calendar entries.
      setActiveTerm(termToUse);
      setGeneratedCourses([]);
      setDeliveryFallbacks([]);
      setGeneratedSchedules([{ id: 1, selections: [], hasUnmetPrerequisites: false, prerequisiteInfo: {} }]);
      navigateTo('schedule-review');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(message);
    }
  };

  const updateScheduledCourses = async (courses: string[], nextElectives?: Record<string, string[]>) => {
    const courseIds = Array.from(new Set(courses)).sort();
    const elsewhere = courseIds.find(code => plannedInOtherTerms[code]);
    if (elsewhere) throw new Error(`${elsewhere} is already selected for ${getTermLabel(plannedInOtherTerms[elsewhere])}. Remove it from that term before selecting it here.`);
    const electiveState = nextElectives || Object.fromEntries(Object.entries(selectedElectives).map(([category, picks]) => [category, picks.filter(code => courseIds.includes(code))]));
    if (courseIds.length === 0) {
      setGeneratedSchedules([{ id: 1, selections: [], hasUnmetPrerequisites: false, prerequisiteInfo: {} }]);
      setGeneratedCourses([]);
      setDeliveryFallbacks([]);
      setSelectedElectives(electiveState);
      return;
    }
    const { schedules, deliveryFallbacks: fallbacks } = await generateSchedules(courseIds, completedCourses, activeTerm, deliveryPreference, {}, priorScheduledCourses, courseGrades, blockedTimes);
    if (!schedules.length) throw new Error(`No complete section combination fits all selected courses. ${blockedTimes.length ? 'Remove a course or a blocked time' : 'Remove a course'} to make room.`);
    setGeneratedSchedules(previous => carryOverSectionChoices(previous, schedules));
    setGeneratedCourses(courseIds);
    setDeliveryFallbacks(fallbacks);
    setSelectedElectives(electiveState);
  };

  const handleDeliveryPreferenceChange = async (preference: DeliveryPreference) => {
    const courses = generatedCourses.length > 0
      ? generatedCourses
      : Array.from(new Set(generatedSchedules[0]?.selections.map(selection => selection.courseCode) || []));
    if (courses.length === 0) {
      setDeliveryPreference(preference);
      return;
    }
    const { schedules, deliveryFallbacks: fallbacks } = await generateSchedules(courses, completedCourses, activeTerm, preference, {}, priorScheduledCourses, courseGrades, blockedTimes);
    if (schedules.length === 0) {
      throw new Error(`No conflict-free schedule works with ${preference === 'online' ? 'online' : 'in-person'} sections. Try another delivery option.`);
    }
    setDeliveryPreference(preference);
    setGeneratedSchedules(previous => carryOverSectionChoices(previous, schedules));
    setDeliveryFallbacks(fallbacks);
  };

  const handleChooseSection = (courseCode: string, sectionType: string, sectionCode: string) => {
    setGeneratedSchedules(previous => chooseEquivalentSection(previous, courseCode, sectionType, sectionCode));
  };

  const handleBackToCourseSelection = () => {
    navigateTo('course-selection');
  };

  const handleLoginSuccess = (token: string, userData: any) => {
    setIsAuthenticated(true);
    setUser(userData);
    setIsCheckingSession(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setUser(null);
    handleStartOver();
  };

  if (isCheckingSession) return null;

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <AppShell
      currentPage={currentPage}
      user={user}
      onLogout={handleLogout}
      onAdmin={() => navigateTo('admin')}
      onReturn={() => navigateTo(getAllowedPage('course-selection', hasEnteredPlanner, generatedSchedules.length > 0))}
      onNavigate={navigateTo}
      hasSchedules={generatedSchedules.length > 0}
      hasAuditData={hasAuditData}
      onImportAudit={() => navigateTo('import')}
    >

      {currentPage === 'schedule-review' && (
        <ScheduleReviewPage
          key={activeTerm}
          schedules={generatedSchedules}
          priorScheduledCourses={priorScheduledCourses}
          prerequisiteOverrides={prerequisiteOverrides}
          onPrerequisiteOverridesChange={setPrerequisiteOverrides}
          onBack={handleBackToCourseSelection}
          electiveRequirements={electiveRequirements}
          selectedElectives={selectedElectives}
          selectedElectiveCredits={selectedElectiveCredits}
          activeTerm={activeTerm}
          onChangeTerm={handleScheduleTermChange}
          deliveryPreference={deliveryPreference}
          blockedTimes={blockedTimes}
          deliveryFallbacks={deliveryFallbacks}
          plannedInOtherTerms={plannedInOtherTerms}
          plannedCoreCourses={chosenCourses.filter(code => !code.startsWith('ELECTIVE:'))}
          onScheduledCoursesChange={updateScheduledCourses}
          onDeliveryPreferenceChange={handleDeliveryPreferenceChange}
          onChooseSection={handleChooseSection}
          onSchedulesChange={setGeneratedSchedules}
          onElectiveChange={async (category: string, courseCodes: string[], allSelectedCourses: string[]) => {
            await updateScheduledCourses(allSelectedCourses, { ...selectedElectives, [category]: courseCodes });
          }}
          completedCourses={completedCourses}
          hasAuditData={hasAuditData}
          auditRequirements={auditRequirements}
          remainingCourses={remainingCourses}
          currentCourses={currentCourses}
          courseGrades={courseGrades}
          completedCourseCredits={completedCourseCredits}
        />
      )}

      {currentPage === 'course-selection' && (
        <CourseSelectionPage
          key={activeTerm}
          hasAuditData={hasAuditData}
          prerequisiteOverrides={prerequisiteOverrides}
          priorScheduledCourses={priorScheduledCourses}
          onPrerequisiteOverridesChange={setPrerequisiteOverrides}
          completedCourses={completedCourses}
          currentCourses={currentCourses}
          remainingCourses={remainingCourses}
          electiveRequirements={electiveRequirements}
          onElectiveRequirementsChange={setElectiveRequirements}
          studentInfo={studentInfo}
          onGenerateSchedules={handleGenerateSchedules}
          blockedTimes={blockedTimes}
          onBlockedTimesChange={handleBlockedTimesChange}
          activeTerm={activeTerm}
          onChangeTerm={handleTermChange}
          plannedInOtherTerms={plannedInOtherTerms}
          otherTermElectiveCounts={otherTermElectiveCounts}
          selectedCourses={chosenCourses}
          onSelectionChange={setChosenCourses}
          auditRequirements={auditRequirements}
          requirementChoices={requirementChoices}
          onRequirementChoicesChange={setRequirementChoices}
          courseGrades={courseGrades}
        />
      )}

      {currentPage === 'import' && (
        <AcademicHistoryImport
          onManualEntry={handleManualEntry}
          onUploadComplete={handleUploadComplete}
        />
      )}


      {currentPage === 'admin' && user?.role === 'ADMIN' && (
        <AdminPage />
      )}

      {currentPage === 'admin' && user?.role !== 'ADMIN' && (
        <div className="flex min-h-screen items-center justify-center">Administrator access required.</div>
      )}
    </AppShell>
  );
}
