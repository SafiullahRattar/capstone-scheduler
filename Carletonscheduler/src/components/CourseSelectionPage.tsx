import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, X, Check, AlertCircle, Plus, RotateCcw } from 'lucide-react';
import { searchCourses, getCourseByCode, type Course } from '../utils/courseData';

interface CourseSelectionPageProps {
  hasAuditData: boolean;
  completedCourses: string[];
  currentCourses: Array<{ courseId: string; term: string }>;
  remainingCourses?: string[];
  studentInfo?: {
    name: string;
    studentId: string;
    program: string;
  };
  onGenerateSchedules: (courses: string[]) => void;
  onGenerateSmartSchedule: () => void;
  onStartOver: () => void;
}

export function CourseSelectionPage({
  hasAuditData,
  completedCourses,
  currentCourses,
  remainingCourses = [],
  studentInfo,
  onGenerateSchedules,
  onGenerateSmartSchedule,
  onStartOver
}: CourseSelectionPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [courseDetails, setCourseDetails] = useState<Map<string, Course>>(new Map());
  const [showResults, setShowResults] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
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
      const course = await getCourseByCode(courseCode);
      if (course) {
        setCourseDetails(new Map(courseDetails.set(courseCode, course)));
      }
    }
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  const addAllCourses = async (courseCodes: string[]) => {
    const toAdd = courseCodes.filter(c => !selectedCourses.includes(c));
    if (toAdd.length === 0) return;
    
    setSelectedCourses(prev => [...prev, ...toAdd]);
    
    const coursePromises = toAdd.map(code => getCourseByCode(code));
    const courses = await Promise.all(coursePromises);
    
    setCourseDetails(prev => {
      const newMap = new Map(prev);
      courses.forEach((course, index) => {
        if (course) {
          newMap.set(toAdd[index], course);
        }
      });
      return newMap;
    });
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
    const coursesWithSections = selectedCourses.filter(code => {
      const course = courseDetails.get(code);
      return course && course.hasSections !== false;
    });
    
    if (coursesWithSections.length === 0) {
      alert('None of the selected courses have sections available in the database.\n\nPlease select different courses or check back later.');
      return;
    }
    
    if (coursesWithSections.length < selectedCourses.length) {
      const skipped = selectedCourses.filter(code => !coursesWithSections.includes(code));
      alert(`The following courses will be skipped (no sections available):\n${skipped.join(', ')}\n\nGenerating schedule with ${coursesWithSections.length} courses.`);
    }
    
    onGenerateSchedules(coursesWithSections);
  };

  const coursesWithSectionsCount = selectedCourses.filter(code => {
    const course = courseDetails.get(code);
    return course && course.hasSections !== false;
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header Bar */}
      <header className="bg-[#bf112b] shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-white text-lg font-semibold tracking-tight">Carleton Course Scheduler</h1>
          <button
            onClick={onStartOver}
            className="text-white/80 hover:text-white text-sm flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Start Over
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Course Selection</h2>
          <p className="text-gray-600">Select courses to generate conflict-free schedules</p>
        </div>

        {/* Student Info Banner */}
        {hasAuditData && studentInfo && (
          <div className="mb-8 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="font-semibold text-gray-900 text-lg">{studentInfo.name}</p>
                <p className="text-sm text-gray-600">{studentInfo.program} | {studentInfo.studentId}</p>
                <div className="flex gap-6 mt-3">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-gray-900">{completedCourses.length}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-gray-900">{currentCourses.length}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-[#bf112b]">{remainingCourses.length}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Remaining</div>
                  </div>
                </div>
              </div>
              {remainingCourses.length > 0 && (
                <Button
                  onClick={async () => {
                    setIsGenerating(true);
                    try {
                      await onGenerateSmartSchedule();
                    } finally {
                      setIsGenerating(false);
                    }
                  }}
                  disabled={isGenerating}
                  className="shadow-sm"
                >
                  {isGenerating ? 'Generating...' : 'Auto-Generate Schedule'}
                </Button>
              )}
            </div>
            
            {/* Collapsible Sections */}
            <div className="space-y-3 text-sm border-t border-gray-100 pt-4">
              <details className="group">
                <summary className="cursor-pointer text-gray-700 hover:text-gray-900 font-medium flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-xs group-open:bg-gray-200 transition-colors">
                    {completedCourses.length}
                  </span>
                  Completed courses
                </summary>
                <div className="mt-3 flex flex-wrap gap-2 pl-7">
                  {completedCourses.map((code) => (
                    <span key={code} className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-md text-xs font-medium">
                      {code}
                    </span>
                  ))}
                </div>
              </details>

              {currentCourses.length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer text-gray-700 hover:text-gray-900 font-medium flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center text-xs text-blue-700">
                      {currentCourses.length}
                    </span>
                    Currently enrolled
                  </summary>
                  <div className="mt-3 flex flex-wrap gap-2 pl-7">
                    {currentCourses.map((course) => (
                      <span key={course.courseId} className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-medium">
                        {course.courseId}
                      </span>
                    ))}
                  </div>
                </details>
              )}

              {remainingCourses.length > 0 && (
                <details open className="group">
                  <summary className="cursor-pointer text-gray-700 hover:text-gray-900 font-medium flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-amber-100 flex items-center justify-center text-xs text-amber-700">
                      {remainingCourses.length}
                    </span>
                    Remaining requirements
                  </summary>
                  <div className="mt-3 pl-7">
                    {remainingCourses.some(c => !selectedCourses.includes(c)) && (
                      <button
                        onClick={() => addAllCourses(remainingCourses)}
                        className="mb-3 text-xs font-medium text-[#bf112b] hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add all remaining courses
                      </button>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {remainingCourses.map((code) => {
                        const isSelected = selectedCourses.includes(code);
                        return (
                          <button
                            key={code}
                            onClick={() => !isSelected && addCourse(code)}
                            disabled={isSelected}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                              isSelected
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 cursor-pointer'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                            {code}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </details>
              )}

              {remainingCourses.length === 0 && hasAuditData && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">All degree requirements completed or in progress</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Search Courses</h3>
              <div ref={searchRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by course code or name..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => searchQuery && setShowResults(true)}
                    className="pl-10 h-11"
                  />
                </div>

                {showResults && searchResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto">
                    {searchResults.map((course) => (
                      <button
                        key={course.code}
                        onClick={() => addCourse(course.code)}
                        disabled={selectedCourses.includes(course.code)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-gray-900">{course.code}</span>
                            <span className="text-gray-600 ml-2">{course.name}</span>
                            <div className="text-xs text-gray-500 mt-1">
                              {course.credits} credits
                              {course.sectionTypes && course.sectionTypes.length > 0 && (
                                <span className="ml-2 text-gray-400">| {course.sectionTypes.join(', ')}</span>
                              )}
                            </div>
                          </div>
                          {selectedCourses.includes(course.code) ? (
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                              <Check className="w-4 h-4 text-green-600" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#bf112b] group-hover:text-white transition-colors">
                              <Plus className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {showResults && searchQuery && searchResults.length === 0 && (
                  <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-500 shadow-lg">
                    No courses found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>

            {/* Selected Courses */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Selected Courses 
                {selectedCourses.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-[#bf112b] text-white text-sm rounded-full">
                    {selectedCourses.length}
                  </span>
                )}
              </h3>

              {selectedCourses.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">
                    No courses selected yet.<br />
                    <span className="text-sm">Search above or add from remaining requirements.</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedCourses.map((courseCode) => {
                    const course = courseDetails.get(courseCode);
                    if (!course) return null;

                    const hasUnmetPrereqs = !areAllPrerequisitesMet(course.prerequisites);
                    const noSections = course.hasSections === false;

                    return (
                      <div
                        key={courseCode}
                        className={`border rounded-lg p-4 transition-all ${
                          noSections
                            ? 'border-red-200 bg-red-50'
                            : hasUnmetPrereqs && hasAuditData
                            ? 'border-amber-200 bg-amber-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900">{course.code}</span>
                              {noSections && (
                                <span className="text-xs px-2 py-0.5 bg-red-200 text-red-800 rounded-full font-medium">
                                  No sections available
                                </span>
                              )}
                              {hasUnmetPrereqs && hasAuditData && !noSections && (
                                <span className="text-xs px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full font-medium flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Prerequisites not met
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{course.name}</p>
                            
                            {course.prerequisites.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Prerequisites: </span>
                                <span className="text-xs">
                                  {course.prerequisites.map((prereq, i) => {
                                    const status = checkPrerequisiteStatus(prereq);
                                    return (
                                      <span key={prereq}>
                                        <span className={`font-medium ${
                                          status === 'met' ? 'text-green-600' :
                                          status === 'not-met' ? 'text-amber-600' :
                                          'text-gray-600'
                                        }`}>
                                          {prereq}
                                        </span>
                                        {i < course.prerequisites.length - 1 && ', '}
                                      </span>
                                    );
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeCourse(courseCode)}
                            className="ml-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500 transition-all"
                            aria-label="Remove course"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-3">Generate Schedule</h3>
              <p className="text-sm text-gray-600 mb-5">
                {selectedCourses.length === 0 
                  ? 'Select courses to generate schedules'
                  : coursesWithSectionsCount === selectedCourses.length
                  ? `${selectedCourses.length} courses ready to schedule`
                  : `${coursesWithSectionsCount} of ${selectedCourses.length} courses have available sections`
                }
              </p>
              <Button
                onClick={handleGenerateSchedules}
                disabled={selectedCourses.length === 0}
                className="w-full h-11 text-base shadow-sm"
              >
                Generate Schedules
              </Button>
            </div>

            {!hasAuditData && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-800">
                <p className="font-medium mb-1">Tip</p>
                <p>Upload your Academic Audit on the previous page to see prerequisite validation.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
