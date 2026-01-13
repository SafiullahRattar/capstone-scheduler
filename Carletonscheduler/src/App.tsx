import { useState, useEffect, useCallback } from 'react';
import { AcademicHistoryImport } from './components/AcademicHistoryImport';
import { CourseSelectionPage } from './components/CourseSelectionPage';
import { ScheduleReviewPage } from './components/ScheduleReviewPage';
import { generateSchedules, type GeneratedSchedule } from './utils/scheduleGenerator';
import { API_BASE_URL, SCHEDULE_CONFIG } from './config/constants';

type AppPage = 'import' | 'course-selection' | 'schedule-review';

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
  completedCourses: Array<{ courseId: string; grade?: string }>;
  currentCourses: CurrentCourse[];
  remainingCourses: string[];
  studentName?: string;
  studentId?: string;
  program?: string;
}

interface CourseSuggestion {
  code: string;
  name?: string;
}

interface AppState {
  currentPage: AppPage;
  hasAuditData: boolean;
  completedCourses: string[];
  currentCourses: CurrentCourse[];
  remainingCourses: string[];
  studentInfo?: StudentInfo;
  generatedSchedules: GeneratedSchedule[];
}

const STORAGE_KEY = 'scheduler-state';

const pageToPath: Record<AppPage, string> = {
  'import': '/',
  'course-selection': '/courses',
  'schedule-review': '/schedules'
};

const pathToPage: Record<string, AppPage> = {
  '/': 'import',
  '/courses': 'course-selection',
  '/schedules': 'schedule-review'
};

function getInitialPage(): AppPage {
  const path = window.location.pathname;
  return pathToPage[path] || 'import';
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
  const initialPage = getInitialPage();
  
  // If URL is explicitly '/', clear state and start fresh
  if (initialPage === 'import') {
    clearState();
  }
  
  const savedState = initialPage === 'import' ? null : loadState();
  
  // If URL says we're on a page that requires data, but we have no saved state, redirect to import
  const hasRequiredData = savedState && (
    (initialPage === 'course-selection') ||
    (initialPage === 'schedule-review' && (savedState.generatedSchedules?.length ?? 0) > 0)
  );
  
  const [currentPage, setCurrentPage] = useState<AppPage>(
    hasRequiredData ? initialPage : (initialPage === 'import' ? 'import' : (savedState?.currentPage || 'import'))
  );
  const [hasAuditData, setHasAuditData] = useState(savedState?.hasAuditData || false);
  const [completedCourses, setCompletedCourses] = useState<string[]>(savedState?.completedCourses || []);
  const [currentCourses, setCurrentCourses] = useState<CurrentCourse[]>(savedState?.currentCourses || []);
  const [remainingCourses, setRemainingCourses] = useState<string[]>(savedState?.remainingCourses || []);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | undefined>(savedState?.studentInfo);
  const [generatedSchedules, setGeneratedSchedules] = useState<GeneratedSchedule[]>(savedState?.generatedSchedules || []);

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
      studentInfo,
      generatedSchedules
    };
    saveState(state);
  }, [currentPage, hasAuditData, completedCourses, currentCourses, remainingCourses, studentInfo, generatedSchedules]);

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
      if (event.state?.page) {
        setCurrentPage(event.state.page);
      } else {
        // Fallback: parse URL
        const page = pathToPage[window.location.pathname] || 'import';
        setCurrentPage(page);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleStartOver = () => {
    setHasAuditData(false);
    setCompletedCourses([]);
    setCurrentCourses([]);
    setRemainingCourses([]);
    setStudentInfo(undefined);
    setGeneratedSchedules([]);
    clearState();
    navigateTo('import');
  };

  const handleManualEntry = () => {
    setHasAuditData(true);
    setCompletedCourses([
      'ECOR 1010', 'ECOR 1042', 'ECOR 1043', 'ECOR 1044', 
      'ECOR 1045', 'MATH 1004', 'MATH 1104', 'COMP 1405'
    ]);
    navigateTo('course-selection');
  };

  const handleUploadComplete = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/audit/parse`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Failed to parse audit file: ${error.message || 'Unknown error'}. Please try manual entry.`);
        return;
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
      navigateTo('course-selection');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error uploading file: ${message}. Please try manual entry.`);
    }
  };

  const handleGenerateSchedules = async (courses: string[]) => {
    try {
      const schedules = await generateSchedules(courses, completedCourses);

      if (schedules.length === 0) {
        alert('No schedules could be generated. The selected courses may have time conflicts or no available sections.');
        return;
      }

      setGeneratedSchedules(schedules);
      navigateTo('schedule-review');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate schedules: ${message}`);
    }
  };

  const handleBackToCourseSelection = () => {
    navigateTo('course-selection');
  };

  const fetchCourseSuggestions = async (): Promise<CourseSuggestion[]> => {
    const response = await fetch(`${API_BASE_URL}/audit/suggest-courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        remainingCourses,
        completedCourses: completedCourses.map(c => ({ courseId: c })),
        maxSuggestions: SCHEDULE_CONFIG.MAX_SUGGESTIONS
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get course suggestions');
    }

    const data = await response.json();
    return data.readyToTake || [];
  };

  const fetchCourseRecommendations = async (): Promise<CourseSuggestion[]> => {
    const response = await fetch(`${API_BASE_URL}/courses/recommend-next`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        completedCourses,
        program: studentInfo?.program
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get recommendations');
    }

    const data = await response.json();
    return data.recommendations || [];
  };

  const handleGenerateSmartSchedule = async () => {
    try {
      const suggestions = remainingCourses.length > 0
        ? await fetchCourseSuggestions()
        : await fetchCourseRecommendations();

      if (suggestions.length === 0) {
        alert('No courses available with met prerequisites. Please try manual selection.');
        return;
      }

      const coursesToSchedule = suggestions
        .slice(0, SCHEDULE_CONFIG.DEFAULT_COURSE_LOAD)
        .map(course => course.code);

      await handleGenerateSchedules(coursesToSchedule);
    } catch {
      alert('An error occurred while generating your schedule. Please try manual selection.');
    }
  };

  if (currentPage === 'schedule-review') {
    return (
      <ScheduleReviewPage
        schedules={generatedSchedules}
        onBack={handleBackToCourseSelection}
      />
    );
  }

  if (currentPage === 'course-selection') {
    return (
      <CourseSelectionPage
        hasAuditData={hasAuditData}
        completedCourses={completedCourses}
        currentCourses={currentCourses}
        remainingCourses={remainingCourses}
        studentInfo={studentInfo}
        onGenerateSchedules={handleGenerateSchedules}
        onGenerateSmartSchedule={handleGenerateSmartSchedule}
        onStartOver={handleStartOver}
      />
    );
  }

  return (
    <AcademicHistoryImport
      onManualEntry={handleManualEntry}
      onUploadComplete={handleUploadComplete}
    />
  );
}
