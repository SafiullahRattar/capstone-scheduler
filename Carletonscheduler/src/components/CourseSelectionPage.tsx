import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, X } from 'lucide-react';
import { searchCourses, getCourseByCode, type Course } from '../utils/courseData';
import type { ElectiveRequirement } from '../App';

const DEBOUNCE_MS = 300;

interface CourseSelectionPageProps {
  hasAuditData: boolean;
  completedCourses: string[];
  currentCourses: Array<{ courseId: string; term: string }>;
  remainingCourses?: string[];
  electiveRequirements?: ElectiveRequirement[];
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
  electiveRequirements = [],
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
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }
    
    const results = await searchCourses(query);
    setSearchResults(results);
    setShowResults(true);
    setIsSearching(false);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Clear previous debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }
    
    // Show searching indicator
    setIsSearching(true);
    
    // Debounce the actual search
    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, DEBOUNCE_MS);
  };

  const addCourse = async (courseCode: string) => {
    if (!selectedCourses.includes(courseCode)) {
      setSelectedCourses([...selectedCourses, courseCode]);
      // Don't fetch details for elective category tokens
      if (!courseCode.startsWith('ELECTIVE:')) {
        const course = await getCourseByCode(courseCode);
        if (course) {
          setCourseDetails(new Map(courseDetails.set(courseCode, course)));
        }
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
    
    // Only fetch details for non-elective-token courses
    const realCourses = toAdd.filter(c => !c.startsWith('ELECTIVE:'));
    const coursePromises = realCourses.map(code => getCourseByCode(code));
    const courses = await Promise.all(coursePromises);
    
    setCourseDetails(prev => {
      const newMap = new Map(prev);
      courses.forEach((course, index) => {
        if (course) {
          newMap.set(realCourses[index], course);
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

  const evaluatePrerequisiteNode = (
    node: { id: string; nodeType: string; requiredCourseId: string | null; parentId: string | null },
    allNodes: { id: string; nodeType: string; requiredCourseId: string | null; parentId: string | null }[]
  ): { met: boolean; childStatuses?: { nodeId: string; met: boolean }[] } => {
    if (node.nodeType === 'COURSE') {
      const met = node.requiredCourseId ? completedCourses.includes(node.requiredCourseId) : false;
      return { met };
    }

    if (node.nodeType === 'YEAR_STANDING' || node.nodeType === 'PERMISSION' || node.nodeType === 'OTHER_REQUIREMENT') {
      return { met: true };
    }

    if (node.nodeType === 'AND') {
      const children = allNodes.filter(child => child.parentId === node.id);
      const results = children.map(child => evaluatePrerequisiteNode(child, allNodes));
      const allMet = results.every(r => r.met);
      return {
        met: allMet,
        childStatuses: results.map((r, i) => ({ nodeId: children[i].id, met: r.met }))
      };
    }

    if (node.nodeType === 'OR') {
      const children = allNodes.filter(child => child.parentId === node.id);
      const results = children.map(child => evaluatePrerequisiteNode(child, allNodes));
      const anyMet = results.some(r => r.met);
      return {
        met: anyMet,
        childStatuses: results.map((r, i) => ({ nodeId: children[i].id, met: r.met }))
      };
    }

    return { met: false };
  };

  const areAllPrerequisitesMet = (
    prerequisites: string[],
    prerequisiteTree?: { id: string; nodeType: string; requiredCourseId: string | null; parentId: string | null }[]
  ): boolean => {
    if (!hasAuditData) return true;
    if (prerequisites.length === 0) return true;
    if (!prerequisiteTree || prerequisiteTree.length === 0) return true;

    const hasCourseRequirements = prerequisiteTree.some(node => node.nodeType === 'COURSE' && node.requiredCourseId);
    if (!hasCourseRequirements) return true;

    const rootNode = prerequisiteTree.find(node => !node.parentId);
    if (!rootNode) {
      return prerequisites.every(prereq => completedCourses.includes(prereq));
    }

    const result = evaluatePrerequisiteNode(rootNode, prerequisiteTree);
    return result.met;
  };

  const handleGenerateSchedules = () => {
    // Separate elective tokens from regular courses
    const electiveTokens = selectedCourses.filter(code => code.startsWith('ELECTIVE:'));
    const regularCourses = selectedCourses.filter(code => !code.startsWith('ELECTIVE:'));
    
    const coursesWithSections = regularCourses.filter(code => {
      const course = courseDetails.get(code);
      return course && course.hasSections !== false;
    });
    
    if (coursesWithSections.length === 0 && electiveTokens.length === 0) {
      alert('None of the selected courses have sections available in the database.\n\nPlease select different courses or check back later.');
      return;
    }
    
    const skippedRegular = regularCourses.filter(code => !coursesWithSections.includes(code));
    if (skippedRegular.length > 0) {
      alert(`The following courses will be skipped (no sections available):\n${skippedRegular.join(', ')}\n\nGenerating schedule with ${coursesWithSections.length} courses${electiveTokens.length > 0 ? ` + ${electiveTokens.length} elective category(s)` : ''}.`);
    }
    
    // Pass both regular courses and elective tokens to App.tsx
    onGenerateSchedules([...coursesWithSections, ...electiveTokens]);
  };

  const coursesWithSectionsCount = selectedCourses.filter(code => {
    if (code.startsWith('ELECTIVE:')) return true; // Elective tokens always count
    const course = courseDetails.get(code);
    return course && course.hasSections !== false;
  }).length;

  return (
    <div className="min-h-screen" style={{ background: '#f9fafb' }}>
      {/* Header Bar */}
      <header style={{ borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Carleton Course Scheduler</h1>
          <button
            onClick={onStartOver}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Start Over
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '32px' }}>
          <h2 className="text-2xl font-semibold text-gray-900" style={{ marginBottom: '4px' }}>Course Selection</h2>
          <p className="text-gray-500">Select courses to generate conflict-free schedules</p>
        </div>

        {/* Student Info Banner */}
        {hasAuditData && studentInfo && (
          <div className="bg-white border border-gray-200" style={{ marginBottom: '32px', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <div className="flex items-start justify-between gap-4" style={{ marginBottom: '16px' }}>
              <div>
                <p className="font-semibold text-gray-900 text-lg">{studentInfo.name}</p>
                <p className="text-sm text-gray-500">{studentInfo.program} | {studentInfo.studentId}</p>
                <div className="flex gap-6 mt-3">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-gray-900">{completedCourses.length}</div>
                    <div className="text-xs text-gray-500" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-gray-900">{currentCourses.length}</div>
                    <div className="text-xs text-gray-500" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold" style={{ color: '#111827' }}>{remainingCourses.length}</div>
                    <div className="text-xs text-gray-500" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Remaining</div>
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
                >
                  {isGenerating ? 'Generating...' : 'Auto-Generate Schedule'}
                </Button>
              )}
            </div>

            {/* Collapsible Sections */}
            <div className="space-y-3 text-sm border-t border-gray-100 pt-4">
              <details className="group">
                <summary className="cursor-pointer text-gray-700 hover:text-gray-900 font-medium flex items-center gap-2">
                  <span className="text-xs text-gray-500">({completedCourses.length})</span>
                  Completed courses
                </summary>
                <div className="mt-3 flex flex-wrap gap-2" style={{ paddingLeft: '28px' }}>
                  {completedCourses.map((code) => (
                    <span key={code} className="px-2 py-1 bg-gray-50 text-gray-700 border border-gray-200 rounded-md text-xs font-medium">
                      {code}
                    </span>
                  ))}
                </div>
              </details>

              {currentCourses.length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer text-gray-700 hover:text-gray-900 font-medium flex items-center gap-2">
                    <span className="text-xs text-gray-500">({currentCourses.length})</span>
                    Currently enrolled
                  </summary>
                  <div className="mt-3 flex flex-wrap gap-2" style={{ paddingLeft: '28px' }}>
                    {currentCourses.map((course) => (
                      <span key={course.courseId} className="px-2 py-1 bg-gray-50 text-gray-700 border border-gray-200 rounded-md text-xs font-medium">
                        {course.courseId}
                      </span>
                    ))}
                  </div>
                </details>
              )}

              {remainingCourses.length > 0 && (
                <details open className="group">
                  <summary className="cursor-pointer text-gray-700 hover:text-gray-900 font-medium flex items-center gap-2">
                    <span className="text-xs text-gray-500">({remainingCourses.length})</span>
                    Remaining requirements
                  </summary>
                  <div className="mt-3" style={{ paddingLeft: '28px' }}>
                    {/* "Add all remaining" button */}
                    {(() => {
                      const electiveCourseSet = new Set(
                        electiveRequirements.flatMap(er => er.courseOptions)
                      );
                      const coreCourses = remainingCourses.filter(c => !electiveCourseSet.has(c));
                      const electiveTokens = electiveRequirements.map(er => `ELECTIVE:${er.category}`);
                      const allItems = [...coreCourses, ...electiveTokens];
                      const hasUnselected = allItems.some(c => !selectedCourses.includes(c));

                      return hasUnselected ? (
                        <button
                          onClick={() => addAllCourses(allItems)}
                          className="text-xs font-medium hover:underline"
                          style={{ marginBottom: '16px', color: '#374151' }}
                        >
                          + Add all remaining
                        </button>
                      ) : null;
                    })()}

                    {/* Core required courses */}
                    {(() => {
                      const electiveCourseSet = new Set(
                        electiveRequirements.flatMap(er => er.courseOptions)
                      );
                      const coreCourses = remainingCourses.filter(c => !electiveCourseSet.has(c));

                      return coreCourses.length > 0 ? (
                        <div style={{ marginBottom: '16px' }}>
                          <p className="text-xs font-medium text-gray-500" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Core Courses</p>
                          <div className="flex flex-wrap gap-2">
                            {coreCourses.map((code) => {
                              const isSelected = selectedCourses.includes(code);
                              return (
                                <button
                                  key={code}
                                  onClick={() => !isSelected && addCourse(code)}
                                  disabled={isSelected}
                                  className="px-2 py-1 rounded-md text-xs font-medium border"
                                  style={{
                                    background: isSelected ? '#f3f4f6' : '#fff',
                                    color: isSelected ? '#6b7280' : '#374151',
                                    borderColor: isSelected ? '#d1d5db' : '#e5e7eb',
                                    cursor: isSelected ? 'default' : 'pointer',
                                    opacity: isSelected ? 0.7 : 1,
                                  }}
                                >
                                  {code}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null;
                    })()}

                    {/* Elective Categories */}
                    {electiveRequirements.map((elective) => {
                      const token = `ELECTIVE:${elective.category}`;
                      const isSelected = selectedCourses.includes(token);
                      return (
                        <div key={elective.category} style={{ marginBottom: '10px' }}>
                          <button
                            onClick={() => !isSelected && addCourse(token)}
                            disabled={isSelected}
                            className="w-full text-left rounded-lg border flex items-center gap-2"
                            style={{
                              padding: '10px 14px',
                              background: isSelected ? '#f3f4f6' : '#fff',
                              borderColor: isSelected ? '#d1d5db' : '#e5e7eb',
                              cursor: isSelected ? 'default' : 'pointer',
                              opacity: isSelected ? 0.7 : 1,
                            }}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{elective.label}</p>
                              <p className="text-xs text-gray-500" style={{ marginTop: '2px' }}>
                                {elective.creditsNeeded} cr. needed · {elective.courseOptions.length} options
                              </p>
                            </div>
                            {isSelected && <span className="text-xs text-gray-400">Added</span>}
                          </button>
                          {!isSelected && (
                            <p className="text-xs text-gray-400" style={{ marginTop: '4px', marginLeft: '4px' }}>
                              A course will be auto-picked when you generate. Swap on the schedule page.
                            </p>
                          )}
                        </div>
                      );
                    })}

                    {/* Fallback: if no elective categories detected, show flat list */}
                    {electiveRequirements.length === 0 && (
                      <>
                        {remainingCourses.some(c => !selectedCourses.includes(c)) && (
                          <button
                            onClick={() => addAllCourses(remainingCourses)}
                            className="text-xs font-medium hover:underline"
                            style={{ marginBottom: '12px', color: '#374151' }}
                          >
                            + Add all remaining courses
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
                                className="px-2 py-1 rounded-md text-xs font-medium border"
                                style={{
                                  background: isSelected ? '#f3f4f6' : '#fff',
                                  color: isSelected ? '#6b7280' : '#374151',
                                  borderColor: isSelected ? '#d1d5db' : '#e5e7eb',
                                  cursor: isSelected ? 'default' : 'pointer',
                                  opacity: isSelected ? 0.7 : 1,
                                }}
                              >
                                {code}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </details>
              )}

              {remainingCourses.length === 0 && hasAuditData && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-gray-700 font-medium text-sm">All degree requirements completed or in progress</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          {/* Main Content */}
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-white border border-gray-200 p-6" style={{ borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <h3 className="font-semibold text-gray-900 mb-4">Search Courses</h3>
              <div ref={searchRef} className="relative">
                <div className="relative">
                  <Search className="absolute w-4 h-4 text-gray-400" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <Input
                    type="text"
                    placeholder="Search by course code or name (min 2 chars)..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && searchResults.length > 0 && setShowResults(true)}
                    className="pl-10"
                    style={{ height: '44px' }}
                  />
                  {isSearching && (
                    <div className="absolute" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                      <div
                        className="w-4 h-4 border-2 border-gray-300 rounded-full"
                        style={{
                          borderTopColor: '#374151',
                          animation: 'spin 1s linear infinite'
                        }}
                      />
                    </div>
                  )}
                </div>

                {showResults && searchResults.length > 0 && (
                  <div className="absolute w-full mt-2 bg-white border border-gray-200 shadow-lg overflow-y-auto" style={{ zIndex: 20, borderRadius: '12px', maxHeight: '320px' }}>
                    {searchResults.map((course) => (
                      <button
                        key={course.code}
                        onClick={() => addCourse(course.code)}
                        disabled={selectedCourses.includes(course.code)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100"
                        style={{ opacity: selectedCourses.includes(course.code) ? 0.5 : 1, cursor: selectedCourses.includes(course.code) ? 'not-allowed' : 'pointer' }}
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
                          {selectedCourses.includes(course.code) && (
                            <span className="text-xs text-gray-400">Added</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {showResults && searchQuery && searchResults.length === 0 && (
                  <div className="absolute w-full mt-2 bg-white border border-gray-200 p-6 text-center text-gray-500 shadow-lg" style={{ zIndex: 20, borderRadius: '12px' }}>
                    No courses found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>

            {/* Selected Courses */}
            <div className="bg-white border border-gray-200 p-6" style={{ borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <h3 className="font-semibold text-gray-900 mb-4">
                Selected Courses
                {selectedCourses.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded-full">
                    {selectedCourses.length}
                  </span>
                )}
              </h3>

              {selectedCourses.length === 0 ? (
                <div style={{ padding: '48px 0', textAlign: 'center' }}>
                  <p className="text-gray-500">
                    No courses selected yet.
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Search above or add from remaining requirements.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedCourses.map((courseCode) => {
                    // Handle elective category tokens
                    if (courseCode.startsWith('ELECTIVE:')) {
                      const category = courseCode.replace('ELECTIVE:', '');
                      const requirement = electiveRequirements.find(er => er.category === category);
                      const label = requirement?.label || category;
                      const creditInfo = requirement ? `${requirement.creditsNeeded} cr.` : '';

                      return (
                        <div
                          key={courseCode}
                          className="border border-gray-200 rounded-lg p-4"
                          style={{ background: '#f9fafb' }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <span className="font-semibold text-gray-900">{label}</span>
                              {creditInfo && (
                                <span className="text-xs text-gray-500 ml-2">({creditInfo})</span>
                              )}
                              <p className="text-xs text-gray-400" style={{ marginTop: '4px' }}>
                                A course will be auto-selected when you generate the schedule
                              </p>
                            </div>
                            <button
                              onClick={() => removeCourse(courseCode)}
                              className="ml-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200"
                              aria-label="Remove elective category"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    }

                    const course = courseDetails.get(courseCode);
                    if (!course) return null;

                    const isCompleted = completedCourses.includes(courseCode);
                    const hasUnmetPrereqs = isCompleted
                      ? false
                      : !areAllPrerequisitesMet(course.prerequisites, course.prerequisiteTree);
                    const noSections = course.hasSections === false;

                    return (
                      <div
                        key={courseCode}
                        className="border rounded-lg p-4"
                        style={{
                          borderColor: noSections ? '#fca5a5' : isCompleted ? '#d1d5db' : hasUnmetPrereqs && hasAuditData ? '#fcd34d' : '#e5e7eb',
                          background: '#fff',
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900">{course.code}</span>
                              {isCompleted && (
                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                                  Already completed
                                </span>
                              )}
                              {noSections && !isCompleted && (
                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                                  No sections available
                                </span>
                              )}
                              {hasUnmetPrereqs && hasAuditData && !noSections && !isCompleted && (
                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                                  Prerequisites not met
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{course.name}</p>

                            {!isCompleted && course.prerequisites.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <span className="text-xs font-medium text-gray-500" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prerequisites: </span>
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
                            className="ml-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200"
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
            <div className="bg-white border border-gray-200 p-6" style={{ borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', position: 'sticky', top: '24px' }}>
              <h3 className="font-semibold text-gray-900 mb-3">Generate Schedule</h3>
              <p className="text-sm text-gray-500" style={{ marginBottom: '20px' }}>
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
                className="w-full text-base"
                style={{ height: '44px' }}
              >
                Generate Schedules
              </Button>
            </div>

            {!hasAuditData && (
              <div className="bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600" style={{ borderRadius: '12px' }}>
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
