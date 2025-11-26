import { useState } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { AcademicHistoryImport } from './components/AcademicHistoryImport';
import { CourseSelectionPage } from './components/CourseSelectionPage';
import { ScheduleReviewPage } from './components/ScheduleReviewPage';
import { generateSchedules, type GeneratedSchedule } from './utils/scheduleGenerator';
import { type SchedulePreferences } from './components/DefinePreferences';

type AppPage = 'login' | 'import' | 'course-selection' | 'schedule-review';

export default function App() {
  const [carletonId, setCarletonId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentPage, setCurrentPage] = useState<AppPage>('login');
  const [hasAuditData, setHasAuditData] = useState(false);
  const [completedCourses, setCompletedCourses] = useState<string[]>([]);
  const [currentCourses, setCurrentCourses] = useState<Array<{courseId: string; term: string}>>([]);
  const [studentInfo, setStudentInfo] = useState<{name: string; studentId: string; program: string} | undefined>();
  const [generatedSchedules, setGeneratedSchedules] = useState<GeneratedSchedule[]>([]);
  const [hasPreferences, setHasPreferences] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    console.log('Login attempted with:', { carletonId, password });
    setCurrentPage('import');
  };

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
    console.log('File uploaded:', file.name);
    
    try {
      // Create form data to upload file
      const formData = new FormData();
      formData.append('file', file);
      
      // Call backend API to parse audit file
      const response = await fetch('http://localhost:3001/api/audit/parse', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Audit parsing failed:', error);
        alert('Failed to parse audit file. Please try manual entry.');
        return;
      }
      
      const data = await response.json();
      console.log('Parsed audit data:', data);
      
      // Extract completed courses from parsed data
      // Backend returns array of {courseId, grade} objects, we need just the courseIds
      const completedCourseIds = (data.completedCourses || []).map((course: any) => course.courseId);
      
      // Extract current courses
      const currentCoursesData = data.currentCourses || [];
      
      // Store student info
      setStudentInfo({
        name: data.studentName || 'Student',
        studentId: data.studentId || '',
        program: data.program || 'Engineering'
      });
      
      setHasAuditData(true);
      setCompletedCourses(completedCourseIds);
      setCurrentCourses(currentCoursesData);
      setCurrentPage('course-selection');
    } catch (error) {
      console.error('Error uploading audit file:', error);
      alert('An error occurred while processing your file. Please try again or use manual entry.');
    }
  };

  const handleGenerateSchedules = async (courses: string[], preferences?: SchedulePreferences) => {
    console.log('Generate schedules for:', courses);
    console.log('With preferences:', preferences);
    
    // Generate schedules using backend API
    const schedules = await generateSchedules(courses, completedCourses);
    
    if (schedules.length === 0) {
      alert('No schedules could be generated. This may be because:\n- Course sections are not yet loaded in the database\n- The selected courses have time conflicts\n- Some courses are not available this term');
      return;
    }
    
    // Rank schedules if preferences provided
    if (preferences) {
      setHasPreferences(true);
      schedules.forEach((schedule, index) => {
        schedule.rank = index + 1;
      });
      // Sort by score
      schedules.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else {
      setHasPreferences(false);
    }
    
    setGeneratedSchedules(schedules);
    setCurrentPage('schedule-review');
  };

  const handleDefinePreferences = () => {
    console.log('Navigate to preferences');
    // Preferences modal is handled within CourseSelectionPage
  };

  const handleElectiveRecommendations = () => {
    console.log('Navigate to elective recommendations');
    // Electives section is shown within CourseSelectionPage
  };

  const handleFinalizeSchedule = (schedule: GeneratedSchedule) => {
    console.log('Finalized schedule:', schedule);
    alert('Schedule finalized! This would typically save or export your schedule.');
  };

  const handleBackToCourseSelection = () => {
    setCurrentPage('course-selection');
  };

  const handleGenerateSmartSchedule = async () => {
    console.log('Generating smart schedule based on completed courses:', completedCourses);
    
    try {
      // Call backend to get recommended next courses
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
    } catch (error) {
      console.error('Error generating smart schedule:', error);
      alert('An error occurred while generating your schedule. Please try manual selection.');
    }
  };

  if (currentPage === 'schedule-review') {
    return (
      <ScheduleReviewPage
        schedules={generatedSchedules}
        hasPreferences={hasPreferences}
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
        studentInfo={studentInfo}
        onGenerateSchedules={handleGenerateSchedules}
        onGenerateSmartSchedule={handleGenerateSmartSchedule}
        onDefinePreferences={handleDefinePreferences}
        onElectiveRecommendations={handleElectiveRecommendations}
      />
    );
  }

  if (currentPage === 'import') {
    return (
      <AcademicHistoryImport
        onManualEntry={handleManualEntry}
        onSkip={handleSkip}
        onUploadComplete={handleUploadComplete}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-slate-900">Carleton Login</h1>
          <p className="text-slate-600 mt-2">Enter your credentials to continue</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Carleton ID Input */}
          <div className="space-y-2">
            <Label htmlFor="carletonId">Carleton ID</Label>
            <Input
              id="carletonId"
              type="text"
              placeholder="Enter your Carleton ID"
              value={carletonId}
              onChange={(e) => setCarletonId(e.target.value)}
              required
            />
          </div>

          {/* Password Input with Toggle */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>

        {/* Additional Links */}
        <div className="mt-6 text-center space-y-2">
          <a href="#" className="text-sm text-blue-600 hover:text-blue-700 block">
            Forgot your password?
          </a>
          <p className="text-sm text-slate-600">
            Need help? <a href="#" className="text-blue-600 hover:text-blue-700">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
}