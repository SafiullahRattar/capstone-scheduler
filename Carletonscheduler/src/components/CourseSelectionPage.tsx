import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, X, CheckCircle, AlertTriangle, Calendar, Sparkles } from 'lucide-react';
import { searchCourses, getCourseByCode, type Course } from '../utils/courseData';
import { ElectiveRecommendations } from './ElectiveRecommendations';

interface CourseSelectionPageProps {
  hasAuditData: boolean;
  completedCourses: string[];
  currentCourses: Array<{ courseId: string; term: string }>;
  studentInfo?: {
    name: string;
    studentId: string;
    program: string;
  };
  onGenerateSchedules: (courses: string[]) => void;
  onGenerateSmartSchedule: () => void;
  onElectiveRecommendations: () => void;
}

export function CourseSelectionPage({
  hasAuditData,
  completedCourses,
  currentCourses,
  studentInfo,
  onGenerateSchedules,
  onGenerateSmartSchedule,
  onElectiveRecommendations
}: CourseSelectionPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [courseDetails, setCourseDetails] = useState<Map<string, Course>>(new Map());
  const [showResults, setShowResults] = useState(false);
  const [showElectives, setShowElectives] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await searchCourses(query);
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const addCourse = async (courseCode: string) => {
    if (!selectedCourses.includes(courseCode)) {
      setSelectedCourses([...selectedCourses, courseCode]);
      // Fetch and cache course details
      const course = await getCourseByCode(courseCode);
      if (course) {
        setCourseDetails(new Map(courseDetails.set(courseCode, course)));
      }
    }
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  const removeCourse = (courseCode: string) => {
    setSelectedCourses(selectedCourses.filter(code => code !== courseCode));
  };

  const checkPrerequisiteStatus = (prerequisite: string): 'met' | 'not-met' | 'unknown' => {
    if (!hasAuditData) return 'unknown';
    return completedCourses.includes(prerequisite) ? 'met' : 'not-met';
  };

  const areAllPrerequisitesMet = (prerequisites: string[]): boolean => {
    if (!hasAuditData || prerequisites.length === 0) return true;
    return prerequisites.every(prereq => completedCourses.includes(prereq));
  };

  const handleGenerateSchedules = () => {
    onGenerateSchedules(selectedCourses);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-slate-900 mb-2">Course Selection</h1>
          <p className="text-slate-600">
            Search and select the courses you want to take this term
          </p>
        </div>

        {/* Student Info and Smart Schedule Generation */}
        {hasAuditData && studentInfo && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg shadow-lg p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h2 className="text-slate-900 mb-1">Welcome, {studentInfo.name}!</h2>
                <p className="text-sm text-slate-600">
                  {studentInfo.program} • Student ID: {studentInfo.studentId}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Completed {completedCourses.length} courses
                </p>
              </div>
              <Button
                onClick={onGenerateSmartSchedule}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate Smart Schedule
              </Button>
            </div>
            
            {/* Completed Courses Collapsible */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-slate-700 hover:text-slate-900 font-medium">
                View Completed Courses ({completedCourses.length})
              </summary>
              <div className="mt-3 flex flex-wrap gap-2">
                {completedCourses.map((courseCode) => (
                  <span
                    key={courseCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    {courseCode}
                  </span>
                ))}
              </div>
            </details>

            {/* Current Courses Collapsible */}
            {currentCourses.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-slate-700 hover:text-slate-900 font-medium">
                  View Current Courses ({currentCourses.length})
                </summary>
                <div className="mt-3 flex flex-wrap gap-2">
                  {currentCourses.map((course) => (
                    <span
                      key={course.courseId}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      {course.courseId}
                      <span className="text-xs opacity-75">({course.term})</span>
                    </span>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Selection Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Search Bar */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-slate-900 mb-4">Search Courses</h2>
              
              <div ref={searchRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search by course code or name (e.g., ECOR 1010)"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => searchQuery && setShowResults(true)}
                    className="pl-10"
                  />
                </div>

                {/* Search Results Dropdown */}
                {showResults && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl border border-slate-200 max-h-96 overflow-y-auto">
                    {searchResults.map((course) => (
                      <button
                        key={course.code}
                        onClick={() => addCourse(course.code)}
                        disabled={selectedCourses.includes(course.code)}
                        className="w-full p-4 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-slate-900">{course.code}</p>
                            <p className="text-sm text-slate-600 mt-1">{course.name}</p>
                            <p className="text-xs text-slate-500 mt-1">{course.credits} credits</p>
                          </div>
                          {selectedCourses.includes(course.code) && (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {showResults && searchQuery && searchResults.length === 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl border border-slate-200 p-4">
                    <p className="text-slate-600 text-center">No courses found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Courses List */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-slate-900 mb-4">
                Selected Courses ({selectedCourses.length})
              </h2>

              {selectedCourses.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No courses selected yet</p>
                  <p className="text-sm mt-1">Search and add courses to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedCourses.map((courseCode) => {
                    const course = courseDetails.get(courseCode);
                    if (!course) return null;

                    const hasUnmetPrerequisites = !areAllPrerequisitesMet(course.prerequisites);

                    return (
                      <div
                        key={courseCode}
                        className={`border rounded-lg p-4 ${
                          hasUnmetPrerequisites && hasAuditData
                            ? 'border-yellow-300 bg-yellow-50'
                            : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-slate-900">{course.code}</h3>
                              {hasUnmetPrerequisites && hasAuditData && (
                                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                              )}
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{course.name}</p>
                            
                            {/* Prerequisites */}
                            {course.prerequisites.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-slate-200">
                                <p className="text-xs text-slate-500 mb-2">Prerequisites:</p>
                                <div className="flex flex-wrap gap-2">
                                  {course.prerequisites.map((prereq) => {
                                    const status = checkPrerequisiteStatus(prereq);
                                    return (
                                      <div
                                        key={prereq}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs ${
                                          status === 'met'
                                            ? 'bg-green-100 text-green-700'
                                            : status === 'not-met'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-slate-100 text-slate-700'
                                        }`}
                                      >
                                        {hasAuditData && (
                                          <>
                                            {status === 'met' ? (
                                              <CheckCircle className="w-3 h-3" />
                                            ) : status === 'not-met' ? (
                                              <AlertTriangle className="w-3 h-3" />
                                            ) : null}
                                          </>
                                        )}
                                        <span>{prereq}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => removeCourse(courseCode)}
                            className="text-slate-400 hover:text-red-600 transition-colors"
                            aria-label="Remove course"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Elective Recommendations Section */}
            {hasAuditData && (
              <ElectiveRecommendations
                completedCourses={completedCourses}
                selectedCourses={selectedCourses}
                onAddCourse={addCourse}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Generate Schedules CTA */}
            <div className="bg-blue-600 text-white rounded-lg shadow-lg p-6">
              <h3 className="mb-2">Ready to Build?</h3>
              <p className="text-sm text-blue-100 mb-4">
                Generate conflict-free schedules based on your selected courses
              </p>
              <Button
                onClick={handleGenerateSchedules}
                disabled={selectedCourses.length === 0}
                variant="secondary"
                className="w-full"
              >
                Generate Schedules
              </Button>
            </div>

            {/* Optional Features */}
            {hasAuditData && (
              <div className="bg-white rounded-lg shadow-lg p-6 space-y-3">
                <h3 className="text-slate-900 mb-4">Optional Features</h3>
                
                <button
                  onClick={() => setShowElectives(!showElectives)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-900">Elective Recommendations</p>
                    <p className="text-xs text-slate-600">View compatible electives</p>
                  </div>
                </button>
              </div>
            )}

            {/* Info Card */}
            {!hasAuditData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-slate-700">
                  💡 Upload your Academic Audit to see prerequisite status for each course
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
