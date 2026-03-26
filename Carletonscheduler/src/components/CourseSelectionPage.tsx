import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, X, RotateCcw, Sparkles, ChevronRight, Calendar, AlertCircle, CheckCircle2, XCircle, Info } from 'lucide-react';
import { searchCourses, getCourseByCode, type Course } from '../utils/courseData';
import { HoverCard, HoverCardTrigger, HoverCardContent } from './ui/hover-card';
import type { ElectiveRequirement } from '../App';
import { getVisibleTerms, getTermLabel, getTermShortLabel } from '../utils/termUtils';

const DEBOUNCE_MS = 300;

function getElectiveTokenCategory(token: string): string | null {
  if (!token.startsWith('ELECTIVE:')) return null;
  const [, category] = token.split(':');
  return category || null;
}

function getElectiveTokenIndex(token: string): number | null {
  if (!token.startsWith('ELECTIVE:')) return null;
  const [, , rawIndex] = token.split(':');
  const index = Number(rawIndex);
  return Number.isFinite(index) ? index : null;
}

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
  onGenerateSchedules: (courses: string[], termOverride?: string) => void;
  onGenerateSmartSchedule: () => void;
  onStartOver: () => void;
  activeTerm: string;
  onTermChange: (term: string) => void;
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
  onStartOver,
  activeTerm,
  onTermChange
}: CourseSelectionPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [courseDetails, setCourseDetails] = useState<Map<string, Course>>(new Map());
  const [showResults, setShowResults] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [enrolledOpen, setEnrolledOpen] = useState(false);
  const [remainingOpen, setRemainingOpen] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-fetch details for remaining courses to know their semesters
  useEffect(() => {
    if (remainingCourses.length > 0) {
      const fetchAllRemaining = async () => {
        setIsLoadingDetails(true);
        const coursePromises = remainingCourses.map(code => getCourseByCode(code));
        const courses = await Promise.all(coursePromises);
        
        setCourseDetails(prev => {
          const newMap = new Map(prev);
          courses.forEach(course => {
            if (course) {
              newMap.set(course.code, course);
            }
          });
          return newMap;
        });
        setIsLoadingDetails(false);
      };
      fetchAllRemaining();
    }
  }, [remainingCourses]);

  const CURRENT_TERM = activeTerm;

  // Derive visible terms from the system clock
  const visibleTerms = getVisibleTerms();

  const getSemesterName = (termCode: string) => getTermLabel(termCode);

  const getSemesterShortName = (termCode: string) => getTermShortLabel(termCode);
  const getElectiveSlotCredits = (elective: ElectiveRequirement) => elective.selectionUnitCredits || 0.5;
  const getElectiveSlotCount = (elective: ElectiveRequirement) => Math.max(1, Math.round(elective.creditsNeeded / getElectiveSlotCredits(elective)));
  const getSelectedElectiveTokenCount = (category: string) =>
    selectedCourses.filter(code => getElectiveTokenCategory(code) === category).length;
  const getMissingElectiveTokenNumbers = (category: string, slotCount: number) => {
    const existing = new Set(
      selectedCourses
        .filter(code => getElectiveTokenCategory(code) === category)
        .map(code => getElectiveTokenIndex(code))
        .filter((index): index is number => index !== null)
    );
    const missing: number[] = [];
    for (let i = 1; i <= slotCount; i++) {
      if (!existing.has(i)) missing.push(i);
    }
    return missing;
  };

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

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

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

          // Auto-Switch Guard (Prompt 4.3): if the course is NOT offered in the
          // current activeTerm but IS available in another visible term, pivot the
          // UI to that term automatically.
          if (course.terms && course.terms.length > 0 && !course.terms.includes(CURRENT_TERM)) {
            const visibleCodes = visibleTerms.map(vt => vt.code);
            const matchingVisibleTerm = course.terms.find(t => visibleCodes.includes(t));
            if (matchingVisibleTerm) {
              onTermChange(matchingVisibleTerm);
              setToastMessage(`Switching view to ${getTermLabel(matchingVisibleTerm)} to match your selection.`);
            }
          }
        }
      }
    }
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  const addAllCourses = async (courseCodes: string[]) => {
    // Prompt 4.4: Only add courses offered in the currently active tab
    const filteredCodes = courseCodes.filter(code => {
      if (code.startsWith('ELECTIVE:')) return true; // Always include elective tokens
      const details = courseDetails.get(code);
      if (!details || !details.terms) return false;
      return details.terms.includes(CURRENT_TERM);
    });
    const toAdd = filteredCodes.filter(c => !selectedCourses.includes(c));
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

  // Get detailed prerequisite breakdown for the hover info box
  const getPrerequisiteBreakdown = (
    prerequisiteTree?: { id: string; nodeType: string; requiredCourseId: string | null; parentId: string | null }[]
  ): { code: string; met: boolean }[] => {
    if (!prerequisiteTree || prerequisiteTree.length === 0) return [];
    return prerequisiteTree
      .filter(node => node.nodeType === 'COURSE' && node.requiredCourseId)
      .map(node => ({
        code: node.requiredCourseId!,
        met: completedCourses.includes(node.requiredCourseId!),
      }));
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
    onGenerateSchedules([...coursesWithSections, ...electiveTokens], CURRENT_TERM);
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
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
         {/* Page Header */}
        <div style={{ marginBottom: '16px' }} className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900" style={{ marginBottom: '4px' }}>Course Selection</h2>
            <p className="text-gray-500">Select courses to generate conflict-free schedules</p>
          </div>
          <Button
            onClick={onStartOver}
            size="lg"
            variant="ghost"
            className="flex items-center gap-2 text-zinc-900 hover:text-black hover:bg-zinc-100 transition-all px-4"
          >
            <RotateCcw className="w-5 h-5" />
            Start Over
          </Button>
        </div>

        {/* Term Selection Tab Bar */}
        <div className="flex items-center gap-2 mb-6">
          {visibleTerms.map((vt) => {
            const isActive = vt.code === CURRENT_TERM;
            // Color coding: amber for current, blue for upcoming, gray for previous
            let bgColor = '#f3f4f6'; // default gray (previous)
            let textColor = '#6b7280';
            let borderColor = '#e5e7eb';
            let roleLabel = '';
            if (vt.role === 'current') {
              bgColor = isActive ? '#fffbeb' : '#f3f4f6';
              textColor = isActive ? '#92400e' : '#6b7280';
              borderColor = isActive ? '#f59e0b' : '#e5e7eb';
              roleLabel = 'Current';
            } else if (vt.role === 'upcoming') {
              bgColor = isActive ? '#eff6ff' : '#f3f4f6';
              textColor = isActive ? '#1e40af' : '#6b7280';
              borderColor = isActive ? '#3b82f6' : '#e5e7eb';
              roleLabel = 'Upcoming';
            } else {
              bgColor = isActive ? '#f3f4f6' : '#f9fafb';
              textColor = isActive ? '#374151' : '#9ca3af';
              borderColor = isActive ? '#9ca3af' : '#e5e7eb';
              roleLabel = 'Previous';
            }
            return (
              <button
                key={vt.code}
                onClick={() => onTermChange(vt.code)}
                className="px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all"
                style={{
                  background: bgColor,
                  color: textColor,
                  borderColor: borderColor,
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  opacity: isActive ? 1 : 0.8,
                }}
              >
                <span>{getTermLabel(vt.code)}</span>
                <span className="ml-1.5 text-[10px] font-medium opacity-70">({roleLabel})</span>
              </button>
            );
          })}
        </div>

        {/* Student Info Banner */}
        {hasAuditData && studentInfo && (
          <div className="bg-white border border-gray-200" style={{ marginBottom: '32px', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
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
                  className="flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" fill="currentColor" />
                  {isGenerating ? 'Generating...' : 'Auto-Generate Schedule'}
                </Button>
              )}
            </div>

            {/* Collapsible Sections */}
            <div className="space-y-3 text-sm border-t border-gray-100 pt-4">
              <div>
                <button
                  onClick={() => setCompletedOpen(!completedOpen)}
                  className="cursor-pointer text-gray-700 hover:text-gray-900 font-medium flex items-center gap-2 w-full text-left"
                >
                  <ChevronRight className="w-4 h-4 text-gray-400" style={{ transform: completedOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 200ms' }} />
                  Completed courses
                  <span className="text-xs text-gray-500">({completedCourses.length})</span>
                </button>
                {completedOpen && (
                  <div className="mt-3 flex flex-wrap gap-2" style={{ paddingLeft: '28px' }}>
                    {completedCourses.map((code) => (
                      <span key={code} className="px-2 py-1 bg-gray-50 text-gray-700 border border-gray-200 rounded-md text-xs font-medium">
                        {code}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {currentCourses.length > 0 && (
                <div>
                  <button
                    onClick={() => setEnrolledOpen(!enrolledOpen)}
                    className="cursor-pointer text-gray-700 hover:text-gray-900 font-medium flex items-center gap-2 w-full text-left"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-400" style={{ transform: enrolledOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 200ms' }} />
                    Currently enrolled
                    <span className="text-xs text-gray-500">({currentCourses.length})</span>
                  </button>
                  {enrolledOpen && (
                    <div className="mt-3 flex flex-wrap gap-2" style={{ paddingLeft: '28px' }}>
                      {currentCourses.map((course) => (
                        <span key={course.courseId} className="px-2 py-1 bg-gray-50 text-gray-700 border border-gray-200 rounded-md text-xs font-medium">
                          {course.courseId}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {remainingCourses.length > 0 && (
                <div>
                  <button
                    onClick={() => setRemainingOpen(!remainingOpen)}
                    className="cursor-pointer text-gray-700 hover:text-gray-900 font-medium flex items-center gap-2 w-full text-left"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-400" style={{ transform: remainingOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 200ms' }} />
                    Remaining requirements
                    <span className="text-xs text-gray-500">({remainingCourses.length})</span>
                    {isLoadingDetails && (
                      <span className="text-xs text-gray-400 italic animate-pulse">
                        Loading...
                      </span>
                    )}
                  </button>
                  {remainingOpen && (
                  <div className="mt-3" style={{ paddingLeft: '28px' }}>
                    {/* "Add all available" button - only adds courses offered this term with prereqs met */}
                    {(() => {
                      const electiveCourseSet = new Set(
                        electiveRequirements.flatMap(er => er.courseOptions)
                      );
                      
                      const addableCourses = remainingCourses.filter(c => {
                        if (electiveCourseSet.has(c)) return false;
                        const details = courseDetails.get(c);
                        if (!details || !details.terms || !details.terms.includes(CURRENT_TERM)) return false;
                        return areAllPrerequisitesMet(details.prerequisites || [], details.prerequisiteTree);
                      });

                      const electiveTokens = electiveRequirements.flatMap(er => {
                        const slotCount = getElectiveSlotCount(er);
                        return getMissingElectiveTokenNumbers(er.category, slotCount).map(index =>
                          `ELECTIVE:${er.category}:${index}`
                        );
                      });
                      const allItems = [...addableCourses, ...electiveTokens];
                      const hasUnselected = allItems.some(c => !selectedCourses.includes(c));

                      return hasUnselected ? (
                        <button
                          onClick={() => addAllCourses(allItems)}
                          className="text-xs font-semibold text-gray-900 hover:text-black hover:underline mb-4 flex items-center gap-1"
                        >
                          <span className="text-sm">+</span> Add all available courses ({addableCourses.length} courses)
                        </button>
                      ) : null;
                    })()}
                    {/* "Remove all added" button */}
                    {selectedCourses.length > 0 && (
                      <button
                        onClick={() => setSelectedCourses([])}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline mb-4 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Remove all added courses
                      </button>
                    )}

                    {/* All remaining core courses shown together */}
                    {(() => {
                      const electiveCourseSet = new Set(
                        electiveRequirements.flatMap(er => er.courseOptions)
                      );
                      const coreCourses = remainingCourses.filter(c => !electiveCourseSet.has(c));
                      
                      if (coreCourses.length === 0) return null;

                      return (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {coreCourses.map((code) => {
                            const details = courseDetails.get(code);
                            const hasTermData = details?.terms && details.terms.length > 0;
                            const isOfferedNow = hasTermData && details!.terms!.includes(CURRENT_TERM);
                            const prereqsMet = isOfferedNow && areAllPrerequisitesMet(details!.prerequisites || [], details!.prerequisiteTree);
                            const isSelected = selectedCourses.includes(code);
                            const eligible = isOfferedNow && prereqsMet;
                            const canAdd = eligible && !isSelected;
                            const isClickable = canAdd || isSelected;

                            // The actual button element (reused for both wrapped and unwrapped)
                            const courseButton = (
                              <button
                                onClick={() => {
                                  if (isSelected) removeCourse(code);
                                  else if (canAdd) addCourse(code);
                                }}
                                disabled={!isClickable}
                                className="px-3 py-1.5 rounded-md text-xs font-semibold border transition-all flex items-center gap-1.5"
                                style={{
                                  minWidth: '120px',
                                  minHeight: '32px',
                                  background: isSelected ? '#f4f4f5' : canAdd ? '#fff' : '#fafafa',
                                  color: isSelected ? '#a1a1aa' : canAdd ? '#18181b' : '#a1a1aa',
                                  borderColor: isSelected ? '#e4e4e7' : canAdd ? '#27272a' : '#e4e4e7',
                                  cursor: isClickable ? 'pointer' : 'default',
                                  opacity: isSelected ? 0.5 : (!canAdd ? 0.6 : 1),
                                }}
                              >
                                {code}
                                {hasTermData && details!.terms!.map(term => (
                                  <span
                                    key={term}
                                    className="text-[9px] font-bold"
                                    style={{
                                      color: term === CURRENT_TERM ? '#18181b' : '#a1a1aa',
                                    }}
                                  >
                                    {getSemesterShortName(term)}
                                  </span>
                                ))}
                                {isSelected && (
                                  <span className="text-[9px] text-gray-400 font-medium">Added</span>
                                )}
                              </button>
                            );

                            // If course can be added or is already selected, no hover card needed
                            if (isClickable) {
                              return <span key={code}>{courseButton}</span>;
                            }

                            // Determine the reason and build the hover info
                            const prereqBreakdown = getPrerequisiteBreakdown(details?.prerequisiteTree);
                            const missingPrereqs = prereqBreakdown.filter(p => !p.met);

                            let reasonType: 'no-data' | 'not-offered' | 'missing-prereqs' = 'no-data';
                            if (!hasTermData) {
                              reasonType = 'no-data';
                            } else if (!isOfferedNow) {
                              reasonType = 'not-offered';
                            } else {
                              reasonType = 'missing-prereqs';
                            }

                            return (
                              <HoverCard key={code} openDelay={150} closeDelay={100}>
                                <HoverCardTrigger asChild>
                                  {courseButton}
                                </HoverCardTrigger>
                                <HoverCardContent
                                  side="top"
                                  align="center"
                                  className="w-72 p-0 rounded-lg border border-gray-200 shadow-lg bg-white"
                                >
                                  {/* Header */}
                                  <div className="px-4 pt-3 pb-2 border-b border-gray-100">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-semibold text-gray-900">{code}</span>
                                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                                        {details?.credits ? `${details.credits} cr.` : ''}
                                      </span>
                                    </div>
                                    {details?.name && details.name !== code && (
                                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{details.name}</p>
                                    )}
                                  </div>

                                  {/* Reason */}
                                  <div className="px-4 py-2.5">
                                    {reasonType === 'no-data' && (
                                      <div className="flex items-start gap-2">
                                        <Info className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                          No schedule data available yet. Check back when the timetable is published.
                                        </p>
                                      </div>
                                    )}

                                    {reasonType === 'not-offered' && (
                                      <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                          <Calendar className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                          <p className="text-xs text-gray-500 leading-relaxed">
                                            Not offered in {getSemesterName(CURRENT_TERM)}.{' '}
                                            {hasTermData && details!.terms!.length > 0 && (
                                              <span className="font-medium text-gray-600">
                                                Next available: {getSemesterName(details!.terms![0])}
                                              </span>
                                            )}
                                          </p>
                                        </div>
                                        {hasTermData && (
                                          <div className="flex items-center gap-1.5 flex-wrap ml-5">
                                            <span className="text-[10px] text-gray-400">All terms:</span>
                                            {details!.terms!.map(term => (
                                              <span
                                                key={term}
                                                className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium"
                                              >
                                                {getSemesterName(term)}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {reasonType === 'missing-prereqs' && (
                                      <div className="space-y-2.5">
                                        <div className="flex items-start gap-2">
                                          <AlertCircle className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                          <p className="text-xs text-gray-500 leading-relaxed">
                                            You need to complete {missingPrereqs.length === 1 ? '1 prerequisite' : `${missingPrereqs.length} prerequisites`} before registering.
                                          </p>
                                        </div>

                                        {prereqBreakdown.length > 0 && (
                                          <div className="space-y-1 ml-1">
                                            {prereqBreakdown.map(prereq => (
                                              <div key={prereq.code} className="flex items-center gap-2">
                                                {prereq.met ? (
                                                  <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                                                ) : (
                                                  <XCircle className="w-3 h-3 text-gray-300 shrink-0" />
                                                )}
                                                <span className={`text-xs font-medium ${prereq.met ? 'text-gray-900' : 'text-gray-400'}`}>
                                                  {prereq.code}
                                                </span>
                                                {prereq.met && (
                                                  <span className="text-[10px] text-green-600">Completed</span>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Elective Categories */}
                    {electiveRequirements.length > 0 && (
                      <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Elective Requirements</p>
                        {electiveRequirements.map((elective) => {
                          const selectedCount = getSelectedElectiveTokenCount(elective.category);
                          const slotCount = getElectiveSlotCount(elective);
                          const nextTokenNumber = getMissingElectiveTokenNumbers(elective.category, slotCount)[0];
                          const nextToken = nextTokenNumber ? `ELECTIVE:${elective.category}:${nextTokenNumber}` : '';
                          const isFullySelected = selectedCount >= slotCount;
                          return (
                            <div key={elective.category}>
                              <button
                                onClick={() => !isFullySelected && addCourse(nextToken)}
                                disabled={isFullySelected}
                                className="w-full text-left rounded-lg border flex items-center gap-2"
                                style={{
                                  padding: '10px 14px',
                                  background: isFullySelected ? '#f3f4f6' : '#fff',
                                  borderColor: isFullySelected ? '#d1d5db' : '#e5e7eb',
                                  cursor: isFullySelected ? 'default' : 'pointer',
                                  opacity: isFullySelected ? 0.7 : 1,
                                }}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900">{elective.label}</p>
                                  <p className="text-xs text-gray-500" style={{ marginTop: '2px' }}>
                                    {selectedCount}/{slotCount} selected · {elective.creditsNeeded} cr. total · {elective.courseOptions.length} options
                                  </p>
                                </div>
                                {isFullySelected && <span className="text-xs text-gray-400">Added</span>}
                              </button>
                              {!isFullySelected && (
                                <p className="text-xs text-gray-400" style={{ marginTop: '4px', marginLeft: '4px' }}>
                                  A course will be auto-picked when you generate. Swap on the schedule page.
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Fallback: if no elective categories detected, show flat list */}
                    {electiveRequirements.length === 0 && remainingCourses.length > 0 && (() => {
                      const electiveCourseSet = new Set(
                        electiveRequirements.flatMap(er => er.courseOptions)
                      );
                      const hasCoreCourses = remainingCourses.some(c => !electiveCourseSet.has(c));
                      // Only show fallback if there were no core courses rendered above
                      if (hasCoreCourses) return null;
                      return (
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
                      );
                    })()}
                  </div>
                  )}
                </div>
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
                    {/* Prompt 4.2: Prioritize courses offered in the activeTerm */}
                    {[...searchResults].sort((a, b) => {
                      const aInTerm = a.terms?.includes(CURRENT_TERM) ? 1 : 0;
                      const bInTerm = b.terms?.includes(CURRENT_TERM) ? 1 : 0;
                      return bInTerm - aInTerm;
                    }).map((course) => (
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
                            {course.name && course.name !== course.code && (
                              <span className="text-gray-600 ml-2">{course.name}</span>
                            )}
                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                              <span>{course.credits} credits</span>
                              {course.sectionTypes && course.sectionTypes.length > 0 && (
                                <span className="text-gray-300">|</span>
                              )}
                              {course.sectionTypes && course.sectionTypes.length > 0 && (
                                <span>{course.sectionTypes.join(', ')}</span>
                              )}
                              
                              {/* Semester Tags */}
                              {course.terms && course.terms.length > 0 && (
                                <>
                                  <span className="text-gray-300">|</span>
                                  <div className="flex gap-1">
                                    {course.terms.map(term => {
                                      const isCurrent = term === CURRENT_TERM;
                                      return (
                                        <span 
                                          key={term}
                                          className={`px-1.5 py-0.5 rounded ${isCurrent ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600'}`}
                                        >
                                          {getSemesterName(term)}{isCurrent ? ' (Available now)' : ''}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </>
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
                      const category = getElectiveTokenCategory(courseCode) || courseCode.replace('ELECTIVE:', '');
                      const requirement = electiveRequirements.find(er => er.category === category);
                      const label = requirement?.label || category;
                      const creditInfo = requirement ? `${requirement.selectionUnitCredits || 0.5} cr.` : '';

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
              <p className="text-sm text-gray-500" style={{ marginBottom: '12px' }}>
                {selectedCourses.length === 0
                  ? 'Select courses to generate schedules'
                  : coursesWithSectionsCount === selectedCourses.length
                  ? `${selectedCourses.length} courses ready to schedule`
                  : `${coursesWithSectionsCount} of ${selectedCourses.length} courses have available sections`
                }
              </p>
              {/* Planning-for badge */}
              <div
                className="flex items-center gap-2 text-xs font-semibold rounded-md px-3 py-1.5 mb-4"
                style={{
                  background: '#eff6ff',
                  color: '#1e40af',
                  border: '1px solid #bfdbfe',
                }}
              >
                <Calendar className="w-3.5 h-3.5" />
                Planning for {getTermLabel(CURRENT_TERM)}
              </div>
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

      {/* Toast notification for auto-switch guard */}
      {toastMessage && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2"
          style={{
            background: '#1e293b',
            color: '#f8fafc',
            animation: 'fadeInUp 200ms ease-out',
          }}
        >
          <Calendar className="w-4 h-4 shrink-0" />
          {toastMessage}
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-gray-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
