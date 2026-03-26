import { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar, X } from 'lucide-react';
import { searchCourses, getCourseByCode, type Course } from '../utils/courseData';
import type { ElectiveRequirement } from '../types/electives';
import { getVisibleTerms, getTermLabel, getTermShortLabel } from '../utils/termUtils';
import {
  getElectiveTokenCategory,
} from '../utils/electiveUtils';
import {
  AuditSummaryCard,
  CourseSelectionHeader,
  GenerateScheduleSidebar,
  SearchPanel,
  SelectedCoursesPanel,
  TermSelectionTabs,
} from './course-selection/CourseSelectionSections';

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
      <main className="max-w-6xl mx-auto px-6" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
        <CourseSelectionHeader onStartOver={onStartOver} />
        <TermSelectionTabs
          visibleTerms={visibleTerms}
          currentTerm={CURRENT_TERM}
          onTermChange={onTermChange}
          getTermLabel={getTermLabel}
        />
        <AuditSummaryCard
          hasAuditData={hasAuditData}
          studentInfo={studentInfo}
          completedCourses={completedCourses}
          currentCourses={currentCourses}
          remainingCourses={remainingCourses}
          electiveRequirements={electiveRequirements}
          selectedCourses={selectedCourses}
          courseDetails={courseDetails}
          currentTerm={CURRENT_TERM}
          completedOpen={completedOpen}
          enrolledOpen={enrolledOpen}
          remainingOpen={remainingOpen}
          isLoadingDetails={isLoadingDetails}
          isGenerating={isGenerating}
          onToggleCompleted={() => setCompletedOpen(!completedOpen)}
          onToggleEnrolled={() => setEnrolledOpen(!enrolledOpen)}
          onToggleRemaining={() => setRemainingOpen(!remainingOpen)}
          onGenerateSmartSchedule={async () => {
            setIsGenerating(true);
            try {
              await onGenerateSmartSchedule();
            } finally {
              setIsGenerating(false);
            }
          }}
          onAddCourse={addCourse}
          onAddAllCourses={addAllCourses}
          onRemoveCourse={removeCourse}
          onClearSelected={() => setSelectedCourses([])}
          areAllPrerequisitesMet={areAllPrerequisitesMet}
          getPrerequisiteBreakdown={getPrerequisiteBreakdown}
          getTermLabel={getSemesterName}
          getTermShortLabel={getSemesterShortName}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          <div className="space-y-6">
            <SearchPanel
              searchRef={searchRef}
              searchQuery={searchQuery}
              searchResults={searchResults}
              showResults={showResults}
              isSearching={isSearching}
              selectedCourses={selectedCourses}
              currentTerm={CURRENT_TERM}
              onSearch={handleSearch}
              onFocus={() => searchQuery.length >= 2 && searchResults.length > 0 && setShowResults(true)}
              onAddCourse={addCourse}
              getTermLabel={getSemesterName}
            />
            <SelectedCoursesPanel
              selectedCourses={selectedCourses}
              completedCourses={completedCourses}
              courseDetails={courseDetails}
              electiveRequirements={electiveRequirements}
              hasAuditData={hasAuditData}
              onRemoveCourse={removeCourse}
              areAllPrerequisitesMet={areAllPrerequisitesMet}
              checkPrerequisiteStatus={checkPrerequisiteStatus}
            />
          </div>

          <GenerateScheduleSidebar
            selectedCourses={selectedCourses}
            coursesWithSectionsCount={coursesWithSectionsCount}
            currentTerm={CURRENT_TERM}
            hasAuditData={hasAuditData}
            onGenerateSchedules={handleGenerateSchedules}
            getTermLabel={getTermLabel}
          />
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
