import { useState, useRef, useEffect, useCallback, type Dispatch, type SetStateAction } from 'react';
import { X, BookOpen, GraduationCap, ArrowRight, Loader2, Search } from 'lucide-react';
import { Button } from './ui/button';
import { searchCourses, getCourseByCode, type Course } from '../utils/courseData';
import type { ElectiveRequirement } from '../types/electives';
import type { AuditRequirement, RequirementChoices } from '../types/audit';
import { AuditRequirementTree } from './course-selection/AuditRequirementTree';
import { getRegistrationTerms, getTermLabel } from '../utils/termUtils';
import { buildElectiveToken, getElectiveSlotCount, getElectiveTokenCategory, getElectiveTokenIndex } from '../utils/electiveUtils';
import {
  validatePrerequisitesFromTree,
  type PrerequisiteValidationResult,
  type StudentTranscript
} from '@shared/prerequisite-evaluator';
import { fetchElectiveCatalog } from '../utils/electiveCatalog';
import { mergeElectiveRequirements } from '../utils/electiveRequirements';
import { TermTabs } from './TermTabs';
import { PrerequisiteOverrideDialog } from './PrerequisiteOverrideDialog';
import { describePrerequisiteIssues } from '@shared/prerequisite-reasons';
import {
  CourseSelectionHeader,
  GenerateScheduleSidebar,
  ManualElectivePicker,
  SearchPanel,
  SelectedCoursesPanel,
} from './course-selection/CourseSelectionSections';

const DEBOUNCE_MS = 300;

interface CourseSelectionPageProps {
  priorScheduledCourses: string[];
  prerequisiteOverrides: string[];
  onPrerequisiteOverridesChange: Dispatch<SetStateAction<string[]>>;
  hasAuditData: boolean;
  completedCourses: string[];
  currentCourses: Array<{ courseId: string; term: string }>;
  remainingCourses?: string[];
  electiveRequirements?: ElectiveRequirement[];
  onElectiveRequirementsChange: (requirements: ElectiveRequirement[]) => void;
  studentInfo?: {
    name: string;
    studentId: string;
    program: string;
  };
  onGenerateSchedules: (courses: string[], termOverride?: string) => Promise<void>;
  activeTerm: string;
  onChangeTerm: (term: string) => void;
  /** Courses planned in other terms, mapped to that term. */
  plannedInOtherTerms?: Record<string, string>;
  /** Elective slots already planned in other terms, by category. */
  otherTermElectiveCounts?: Record<string, { count: number; term: string }>;
  selectedCourses: string[];
  onSelectionChange: Dispatch<SetStateAction<string[]>>;
  auditRequirements: AuditRequirement[];
  requirementChoices: RequirementChoices;
  onRequirementChoicesChange: Dispatch<SetStateAction<RequirementChoices>>;
  courseGrades: Record<string, string>;
}

export function CourseSelectionPage({
  priorScheduledCourses,
  prerequisiteOverrides,
  onPrerequisiteOverridesChange,
  hasAuditData,
  completedCourses,
  currentCourses,
  remainingCourses = [],
  electiveRequirements = [],
  onElectiveRequirementsChange,
  studentInfo,
  onGenerateSchedules,
  activeTerm,
  onChangeTerm,
  plannedInOtherTerms = {},
  otherTermElectiveCounts = {},
  selectedCourses,
  onSelectionChange: setSelectedCourses,
  auditRequirements,
  requirementChoices,
  onRequirementChoicesChange: setRequirementChoices,
  courseGrades,
}: CourseSelectionPageProps) {
  const [catalogElectiveRequirements, setCatalogElectiveRequirements] = useState<ElectiveRequirement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [catalogView, setCatalogView] = useState<'requirements' | 'electives' | 'search'>(hasAuditData ? 'requirements' : 'search');
  const [isBuilding, setIsBuilding] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [courseDetails, setCourseDetails] = useState<Map<string, Course>>(new Map());
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [prerequisiteValidation, setPrerequisiteValidation] = useState<Record<string, PrerequisiteValidationResult>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pendingOverride, setPendingOverride] = useState<{ course: Course; requirementId?: string; issues: string[] } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const availableElectiveRequirements = mergeElectiveRequirements(electiveRequirements, catalogElectiveRequirements);

  useEffect(() => {
    const missing = selectedCourses.filter(code => !code.startsWith('ELECTIVE:') && !courseDetails.has(code));
    if (!missing.length) return;
    let cancelled = false;
    Promise.all(missing.map(getCourseByCode)).then(courses => {
      if (cancelled) return;
      setCourseDetails(prev => {
        const next = new Map(prev);
        courses.forEach(course => { if (course) next.set(course.code, course); });
        return next;
      });
    });
    return () => { cancelled = true; };
  }, [selectedCourses, courseDetails]);

  useEffect(() => { setGenerationError(null); }, [selectedCourses, activeTerm]);

  useEffect(() => {
    let cancelled = false;

    const loadElectiveCatalog = async () => {
      const catalog = await fetchElectiveCatalog();
      if (!cancelled) {
        setCatalogElectiveRequirements(catalog);
      }
    };

    loadElectiveCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  // Pre-fetch details for remaining courses to know their semesters
  useEffect(() => {
    if (remainingCourses.length > 0) {
      const fetchAllRemaining = async () => {
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
      };
      fetchAllRemaining();
    }
  }, [remainingCourses]);

  const CURRENT_TERM = activeTerm;

  // Derive visible terms from the system clock
  const visibleTerms = getRegistrationTerms();
  if (!visibleTerms.some(term => term.code === activeTerm)) {
    visibleTerms.unshift({ code: activeTerm, role: 'previous' });
  }

  const getSemesterName = (termCode: string) => getTermLabel(termCode);

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
    
    const results = await searchCourses(query, CURRENT_TERM);
    setSearchResults(results);
    setShowResults(true);
    setIsSearching(false);
  }, [CURRENT_TERM]);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
      performSearch(searchQuery);
    }
  }, [performSearch]);

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

  const commitCourse = (courseCode: string, requirementId?: string) => {
    setSelectedCourses(previous => previous.includes(courseCode) ? previous : [...previous, courseCode]);
    if (requirementId) setRequirementChoices(previous => ({ ...previous, [requirementId]: Array.from(new Set([...(previous[requirementId] || []), courseCode])) }));
  };

  const addCourse = async (courseCode: string, requirementId?: string) => {
    if (selectedCourses.includes(courseCode)) { commitCourse(courseCode, requirementId); return; }
    if (plannedInOtherTerms[courseCode]) {
      setToastMessage(`${courseCode} is already selected for ${getTermLabel(plannedInOtherTerms[courseCode])}.`);
      return;
    }
    // Don't fetch details for elective category tokens
    if (courseCode.startsWith('ELECTIVE:')) { commitCourse(courseCode, requirementId); return; }
    const course = await getCourseByCode(courseCode);
    if (!course) return;
    setCourseDetails(previous => new Map(previous).set(courseCode, course));
    if (hasAuditData && !prerequisiteOverrides.includes(courseCode)) {
      const validation = validatePrerequisitesFromTree(course.prerequisiteExpression, course.prerequisiteTree || [], { completedCourses, plannedCourses: priorScheduledCourses, courseGrades, currentYear: 'FOURTH_YEAR', hasSpecialPermission: false });
      if (!validation.isValid) {
        setPendingOverride({ course, requirementId, issues: describePrerequisiteIssues(validation) });
        return;
      }
    }
    commitCourse(courseCode, requirementId);

    // Each term has its own plan, so point out a better term instead of switching away.
    if (course.terms && course.terms.length > 0 && !course.terms.includes(CURRENT_TERM)) {
      const visibleCodes = visibleTerms.map(vt => vt.code);
      const matchingVisibleTerm = course.terms.find(t => visibleCodes.includes(t));
      if (matchingVisibleTerm) {
        setToastMessage(`${courseCode} has no ${getTermLabel(CURRENT_TERM)} sections. It's offered in ${getTermLabel(matchingVisibleTerm)}.`);
      }
    }
  };

  const removeCourse = (courseCode: string) => {
    setSelectedCourses(previous => previous.filter(code => code !== courseCode));
    onPrerequisiteOverridesChange(previous => previous.filter(code => code !== courseCode));
  };

  const chooseRequirementCourse = async (requirementId: string, code: string) => {
    await addCourse(code, requirementId);
  };

  const unchooseRequirementCourse = (requirementId: string, code: string) => {
    setRequirementChoices(previous => ({ ...previous, [requirementId]: (previous[requirementId] || []).filter(item => item !== code) }));
    if (!Object.entries(requirementChoices).some(([id, codes]) => id !== requirementId && codes.includes(code))) removeCourse(code);
  };

  const includeAuditElective = (requirementId: string, elective: ElectiveRequirement, courseCount: number) => {
    const slotsLeft = getElectiveSlotCount(elective) - (otherTermElectiveCounts[elective.category]?.count || 0);
    if (slotsLeft <= 0) return;
    const count = Math.min(Math.max(1, courseCount), slotsLeft);
    const tokens = Array.from({ length: count }, (_, index) => buildElectiveToken(elective.category, index + 1));
    setSelectedCourses(previous => [...previous.filter(code => getElectiveTokenCategory(code) !== elective.category), ...tokens]);
    setRequirementChoices(previous => ({ ...previous, [requirementId]: tokens }));
    onElectiveRequirementsChange(mergeElectiveRequirements(electiveRequirements, [elective]));
  };

  const removeAuditElective = (category: string) => {
    setSelectedCourses(previous => previous.filter(code => getElectiveTokenCategory(code) !== category));
  };

  const addElectiveCategory = (category: string) => {
    const requirement = availableElectiveRequirements.find(item => item.category === category);
    const otherTerm = otherTermElectiveCounts[category];
    const usedHere = selectedCourses.filter(code => getElectiveTokenCategory(code) === category).length;
    if (requirement && requirement.creditsNeeded > 0 && otherTerm && usedHere + otherTerm.count >= getElectiveSlotCount(requirement)) {
      setToastMessage(`${requirement.label} is already fully planned, including ${getTermLabel(otherTerm.term)}.`);
      return;
    }
    const existingIndices = selectedCourses
      .filter((code) => getElectiveTokenCategory(code) === category)
      .map((code) => getElectiveTokenIndex(code))
      .filter((index): index is number => index !== null);

    const nextIndex = existingIndices.length > 0 ? Math.max(...existingIndices) + 1 : 1;
    const token = buildElectiveToken(category, nextIndex);

    const mergedRequirements = mergeElectiveRequirements(electiveRequirements, catalogElectiveRequirements);
    if (mergedRequirements.length !== electiveRequirements.length) {
      onElectiveRequirementsChange(mergedRequirements);
    }

    setSelectedCourses((prev) => prev.includes(token) ? prev : [...prev, token]);
  };

  useEffect(() => {
    if (!hasAuditData) {
      setPrerequisiteValidation({});
      return;
    }

    const courseCodes = Array.from(new Set([
      ...remainingCourses,
      ...selectedCourses.filter(code => !code.startsWith('ELECTIVE:')),
    ]));

    if (courseCodes.length === 0) {
      setPrerequisiteValidation({});
      return;
    }

    let isCancelled = false;

    const loadValidation = async () => {
      try {
        const transcript: StudentTranscript = {
          completedCourses: completedCourses.map(courseId => courseId.toUpperCase()),
          plannedCourses: priorScheduledCourses,
          courseGrades,
          currentYear: 'FOURTH_YEAR',
          hasSpecialPermission: false,
        };

        const results = Object.fromEntries(
          courseCodes.map((courseId) => {
            const course = courseDetails.get(courseId);
            return [
              courseId,
              validatePrerequisitesFromTree(
                course?.prerequisiteExpression,
                course?.prerequisiteTree || [],
                transcript
              ),
            ] as const;
          })
        );

        if (!isCancelled) {
          setPrerequisiteValidation(results);
        }
      } catch {
        if (!isCancelled) {
          setPrerequisiteValidation({});
        }
      }
    };

    loadValidation();

    return () => {
      isCancelled = true;
    };
  }, [hasAuditData, remainingCourses, selectedCourses, completedCourses, courseDetails, courseGrades, priorScheduledCourses.join('|')]);

  const areAllPrerequisitesMet = (courseCode: string): boolean => {
    if (!hasAuditData) return true;
    const validation = prerequisiteValidation[courseCode];
    if (!validation) return true;
    return validation.isValid;
  };

  const handleGenerateSchedules = async () => {
    if (isBuilding) return;
    setGenerationError(null);
    // Separate elective tokens from regular courses
    const electiveTokens = selectedCourses.filter(code => code.startsWith('ELECTIVE:'));
    const regularCourses = selectedCourses.filter(code => !code.startsWith('ELECTIVE:'));
    
    const coursesWithSections = regularCourses.filter(code => {
      const course = courseDetails.get(code);
      return course && course.hasSections !== false && course.terms?.includes(CURRENT_TERM);
    });
    
    if (coursesWithSections.length === 0 && electiveTokens.length === 0) {
      setGenerationError(`No sections are loaded for these courses in ${getTermLabel(CURRENT_TERM)}. Choose another term or course.`);
      return;
    }
    
    const skippedRegular = regularCourses.filter(code => !coursesWithSections.includes(code));
    if (skippedRegular.length > 0) {
      setGenerationError(`${skippedRegular.join(', ')} ${skippedRegular.length === 1 ? 'has' : 'have'} no sections in ${getTermLabel(CURRENT_TERM)}. Remove ${skippedRegular.length === 1 ? 'it' : 'them'} or change terms.`);
      return;
    }
    
    // Pass both regular courses and elective tokens to App.tsx
    setIsBuilding(true);
    try {
      await onGenerateSchedules([...coursesWithSections, ...electiveTokens], CURRENT_TERM);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Could not generate schedules. Please try again.');
    } finally {
      setIsBuilding(false);
    }
  };

  const coursesWithSectionsCount = selectedCourses.filter(code => {
    if (code.startsWith('ELECTIVE:')) return true; // Elective tokens always count
    const course = courseDetails.get(code);
    return course && course.hasSections !== false && course.terms?.includes(CURRENT_TERM);
  }).length;

  return (
    <div className="scheduler-page">
      <main className="page-container planner-container">
        <div className="planner-toolbar">
        <CourseSelectionHeader />
        <TermTabs activeTerm={CURRENT_TERM} onChangeTerm={onChangeTerm} disabled={isBuilding} label="Courses term" />
        </div>
        <div className="course-layout">
          <div className="course-discovery">
            {hasAuditData && <div className="catalog-navigation" aria-label="Course sources">
              <button aria-pressed={catalogView === 'requirements'} onClick={() => setCatalogView('requirements')}><GraduationCap size={16} /> Degree map</button>
              <button aria-pressed={catalogView === 'search'} onClick={() => setCatalogView('search')}><Search size={16} /> Search catalogue</button>
              <button aria-pressed={catalogView === 'electives'} onClick={() => setCatalogView('electives')}><BookOpen size={16} /> Electives</button>
            </div>}
            {(!hasAuditData || catalogView === 'search') && <SearchPanel
              searchRef={searchRef}
              searchQuery={searchQuery}
              searchResults={searchResults}
              showResults={showResults}
              isSearching={isSearching}
              selectedCourses={selectedCourses}
              plannedInOtherTerms={plannedInOtherTerms}
              currentTerm={CURRENT_TERM}
              onSearch={handleSearch}
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
              onAddCourse={addCourse}
              getTermLabel={getSemesterName}
            />}
            {hasAuditData && (catalogView === 'requirements' || catalogView === 'electives') && <AuditRequirementTree
              program={studentInfo?.program}
              requirements={auditRequirements}
              completedCourses={completedCourses}
              currentCourses={currentCourses}
              remainingCourses={remainingCourses}
              electives={availableElectiveRequirements}
              courseDetails={courseDetails}
              courseGrades={courseGrades}
              priorScheduledCourses={priorScheduledCourses}
              prerequisiteOverrides={prerequisiteOverrides}
              selectedCourses={selectedCourses}
              choices={requirementChoices}
              activeTerm={activeTerm}
              onChoose={chooseRequirementCourse}
              onUnchoose={unchooseRequirementCourse}
              plannedInOtherTerms={plannedInOtherTerms}
              otherTermElectiveCounts={otherTermElectiveCounts}
              onIncludeElective={includeAuditElective}
              onRemoveElective={removeAuditElective}
              electivesOnly={catalogView === 'electives'}
            />}
            {!hasAuditData && <ManualElectivePicker
              electiveRequirements={availableElectiveRequirements}
              selectedCourses={selectedCourses}
              otherTermElectiveCounts={otherTermElectiveCounts}
              onAddElectiveCategory={addElectiveCategory}
              onRemoveCourse={removeCourse}
            />}
          </div>
          <aside className="selection-column" id="selected-courses" aria-label="Your course plan">
            <SelectedCoursesPanel
              selectedCourses={selectedCourses}
              completedCourses={completedCourses}
              courseDetails={courseDetails}
              electiveRequirements={availableElectiveRequirements}
              hasAuditData={hasAuditData}
              prerequisiteOverrides={prerequisiteOverrides}
              onRemoveCourse={removeCourse}
              areAllPrerequisitesMet={areAllPrerequisitesMet}
              prerequisiteValidation={prerequisiteValidation}
              currentTerm={CURRENT_TERM}
              onClear={() => { setSelectedCourses([]); onPrerequisiteOverridesChange([]); }}
            >
          <GenerateScheduleSidebar
            selectedCourses={selectedCourses}
            coursesWithSectionsCount={coursesWithSectionsCount}
            currentTerm={CURRENT_TERM}
            hasAuditData={hasAuditData}
            onGenerateSchedules={handleGenerateSchedules}
            getTermLabel={getTermLabel}
            isGenerating={isBuilding}
            error={generationError}
          />
            </SelectedCoursesPanel>
          </aside>
        </div>
        <div className="mobile-planbar">
          {generationError && <p role="alert" className="mobile-plan-error">{generationError}</p>}
          <button onClick={() => document.getElementById('selected-courses')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>{selectedCourses.length} selected <span>View plan</span></button>
          <Button onClick={handleGenerateSchedules} disabled={selectedCourses.length === 0 || isBuilding}>
            {isBuilding ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />} {isBuilding ? 'Finding schedules' : 'Find schedules'}
          </Button>
        </div>
      </main>
      <PrerequisiteOverrideDialog course={pendingOverride?.course.code || null} issues={pendingOverride?.issues || []} onCancel={() => setPendingOverride(null)} onConfirm={() => {
        if (!pendingOverride) return;
        const { course, requirementId } = pendingOverride;
        onPrerequisiteOverridesChange(previous => Array.from(new Set([...previous, course.code])));
        commitCourse(course.code, requirementId);
        setPendingOverride(null);
      }} />

      {/* Toast notification */}
      {toastMessage && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3"
          style={{
            padding: '14px 20px',
            background: 'var(--popover)',
            color: '#fff',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          {toastMessage}
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
