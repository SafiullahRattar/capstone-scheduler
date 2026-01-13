import { useState } from 'react';
import { AcademicHistoryImport } from './components/AcademicHistoryImport';
import { CourseSelectionPage } from './components/CourseSelectionPage';
import { ScheduleReviewPage } from './components/ScheduleReviewPage';
import { generateSchedules, type GeneratedSchedule } from './utils/scheduleGenerator';

type AppPage = 'import' | 'course-selection' | 'schedule-review';

export default function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>('import');
  const [hasAuditData, setHasAuditData] = useState(false);
  const [completedCourses, setCompletedCourses] = useState<string[]>([]);
  const [currentCourses, setCurrentCourses] = useState<Array<{courseId: string; term: string}>>([]);
  const [remainingCourses, setRemainingCourses] = useState<string[]>([]);
  const [studentInfo, setStudentInfo] = useState<{name: string; studentId: string; program: string} | undefined>();
  const [generatedSchedules, setGeneratedSchedules] = useState<GeneratedSchedule[]>([]);

  const handleManualEntry = () => {
    console.log('Navigate to manual entry');
    // TODO: Navigate to manual entry page
    // For now, go to course selection with some sample completed courses
    setHasAuditData(true);
    setCompletedCourses(['ECOR 1010', 'ECOR 1042', 'ECOR 1043', 'ECOR 1044', 'ECOR 1045', 'MATH 1004', 'MATH 1104', 'COMP 1405']);
    setCurrentPage('course-selection');
  };

  const handleSkip = () => {
    console.log('Skip to course selection');
    setHasAuditData(false);
    setCompletedCourses([]);
    setCurrentPage('course-selection');
  };

  const handleUploadComplete = async (file: File) => {
    console.log('File uploaded:', file.name, 'Type:', file.type, 'Size:', file.size);
    
    try {
      // Create form data to upload file
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('Sending request to http://localhost:3001/api/audit/parse');
      
      // Call backend API to parse audit file
      const response = await fetch('http://localhost:3001/api/audit/parse', {
        method: 'POST',
        body: formData
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Audit parsing failed:', error);
        alert(`Failed to parse audit file: ${error.message || 'Unknown error'}. Please try manual entry.`);
        return;
      }
      
      const data = await response.json();
      console.log('Parsed audit data:', data);
      
      // Extract completed courses from parsed data
      // Backend returns array of {courseId, grade} objects, we need just the courseIds
      const completedCourseIds = (data.completedCourses || []).map((course: any) => course.courseId);
      
      // Extract current courses
      const currentCoursesData = data.currentCourses || [];
      
      // Extract remaining courses (courses student still needs to take)
      const remainingCoursesData = data.remainingCourses || [];
      
      // Store student info
      setStudentInfo({
        name: data.studentName || 'Student',
        studentId: data.studentId || '',
        program: data.program || 'Engineering'
      });
      
      console.log(`📊 Audit Summary: ${completedCourseIds.length} completed, ${currentCoursesData.length} current, ${remainingCoursesData.length} remaining`);
      
      setHasAuditData(true);
      setCompletedCourses(completedCourseIds);
      setCurrentCourses(currentCoursesData);
      setRemainingCourses(remainingCoursesData);
      setCurrentPage('course-selection');
    } catch (error) {
      console.error('Error uploading audit file:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Error: ${errorMessage}\n\nPlease check the console for details or try manual entry.`);
    }
  };

  const handleGenerateSchedules = async (courses: string[]) => {
    console.log('Generate schedules for:', courses);
    
    try {
      // Generate schedules using backend API
      const schedules = await generateSchedules(courses, completedCourses);
      
      if (schedules.length === 0) {
        alert('No schedules could be generated. This may be because:\n- Course sections are not yet loaded in the database\n- The selected courses have time conflicts\n- Some courses are not available this term');
        return;
      }
      
      setGeneratedSchedules(schedules);
      setCurrentPage('schedule-review');
    } catch (error) {
      console.error('Schedule generation error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate schedules: ${message}\n\nThis usually means some courses don't have sections available in the database.`);
    }
  };

  const handleFinalizeSchedule = (schedule: GeneratedSchedule) => {
    console.log('Finalized schedule:', schedule);
    alert('Schedule finalized! This would typically save or export your schedule.');
  };

  const handleBackToCourseSelection = () => {
    setCurrentPage('course-selection');
  };

  const handleGenerateSmartSchedule = async () => {
    console.log('Generating smart schedule based on remaining courses:', remainingCourses);
    
    try {
      // If we have remaining courses from the audit, use those
      if (remainingCourses.length > 0) {
        // Call backend to find which remaining courses have sections available
        const response = await fetch('http://localhost:3001/api/audit/suggest-courses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            remainingCourses,
            completedCourses: completedCourses.map(c => ({ courseId: c })),
            maxSuggestions: 10
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          console.error('Failed to get course suggestions:', error);
          alert('Failed to find available courses. Please try manual selection.');
          return;
        }
        
        const data = await response.json();
        console.log('Course suggestions:', data);
        
        // Prioritize courses that are ready to take (prerequisites met)
        const readyToTake = data.readyToTake || [];
        
        if (readyToTake.length === 0) {
          alert(`No courses from your remaining requirements are available with met prerequisites.\n\nFound ${data.totalFound} courses in database but all have unmet prerequisites.\n\nPlease try manual course selection.`);
          return;
        }
        
        // Take up to 5 courses (typical full-time load)
        const coursesToSchedule = readyToTake.slice(0, 5).map((course: any) => course.code);
        console.log('Scheduling courses:', coursesToSchedule);
        
        // Generate schedules with these courses
        await handleGenerateSchedules(coursesToSchedule);
      } else {
        // Fallback: No remaining courses, use general recommendations
        const response = await fetch('http://localhost:3001/api/courses/recommend-next', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            completedCourses,
            program: studentInfo?.program
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          console.error('Failed to get course recommendations:', error);
          alert('Failed to generate course recommendations. Please try manual selection.');
          return;
        }
        
        const data = await response.json();
        console.log('Recommended courses:', data);
        
        if (data.recommendations.length === 0) {
          alert('No course recommendations available. This could mean:\n- All available courses have unmet prerequisites\n- You have completed all available courses\n\nPlease try manual course selection.');
          return;
        }
        
        // Take top 5 recommended courses (typical full-time course load)
        const topCourses = data.recommendations.slice(0, 5).map((course: any) => course.code);
        
        // Generate schedules with these courses
        await handleGenerateSchedules(topCourses);
      }
    } catch (error) {
      console.error('Error generating smart schedule:', error);
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
