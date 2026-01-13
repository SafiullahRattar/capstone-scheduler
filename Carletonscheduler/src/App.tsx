import { useState } from 'react';
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

export default function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>('import');
  const [hasAuditData, setHasAuditData] = useState(false);
  const [completedCourses, setCompletedCourses] = useState<string[]>([]);
  const [currentCourses, setCurrentCourses] = useState<CurrentCourse[]>([]);
  const [remainingCourses, setRemainingCourses] = useState<string[]>([]);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | undefined>();
  const [generatedSchedules, setGeneratedSchedules] = useState<GeneratedSchedule[]>([]);

  const handleManualEntry = () => {
    setHasAuditData(true);
    setCompletedCourses([
      'ECOR 1010', 'ECOR 1042', 'ECOR 1043', 'ECOR 1044', 
      'ECOR 1045', 'MATH 1004', 'MATH 1104', 'COMP 1405'
    ]);
    setCurrentPage('course-selection');
  };

  const handleSkip = () => {
    setHasAuditData(false);
    setCompletedCourses([]);
    setCurrentPage('course-selection');
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
      setCurrentPage('course-selection');
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
      setCurrentPage('schedule-review');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate schedules: ${message}`);
    }
  };

  const handleFinalizeSchedule = (_schedule: GeneratedSchedule) => {
    alert('Schedule finalized! This would typically save or export your schedule.');
  };

  const handleBackToCourseSelection = () => {
    setCurrentPage('course-selection');
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
        onFinalize={handleFinalizeSchedule}
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
      />
    );
  }

  return (
    <AcademicHistoryImport
      onManualEntry={handleManualEntry}
      onSkip={handleSkip}
      onUploadComplete={handleUploadComplete}
    />
  );
}
