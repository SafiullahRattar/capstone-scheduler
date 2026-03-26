import { type RefObject } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Info,
  RotateCcw,
  Search,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card';
import type { Course } from '../../utils/courseData';
import type { ElectiveRequirement } from '../../types/electives';
import {
  buildElectiveToken,
  getElectiveSlotCount,
  getElectiveTokenCategory,
  getMissingElectiveTokenNumbers,
  getSelectedElectiveTokenCount,
  getSelectionUnitCredits,
} from '../../utils/electiveUtils';

interface VisibleTerm {
  code: string;
  role: 'previous' | 'current' | 'upcoming';
}

interface StudentInfo {
  name: string;
  studentId: string;
  program: string;
}

interface CurrentCourse {
  courseId: string;
  term: string;
}

interface CourseSelectionHeaderProps {
  onStartOver: () => void;
}

export function CourseSelectionHeader({ onStartOver }: CourseSelectionHeaderProps) {
  return (
    <>
      <header style={{ borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Carleton Course Scheduler</h1>
        </div>
      </header>

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
    </>
  );
}

interface TermSelectionTabsProps {
  visibleTerms: VisibleTerm[];
  currentTerm: string;
  onTermChange: (term: string) => void;
  getTermLabel: (term: string) => string;
}

export function TermSelectionTabs({
  visibleTerms,
  currentTerm,
  onTermChange,
  getTermLabel,
}: TermSelectionTabsProps) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {visibleTerms.map((vt) => {
        const isActive = vt.code === currentTerm;
        let bgColor = '#f3f4f6';
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
              borderColor,
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
  );
}

interface AuditSummaryCardProps {
  hasAuditData: boolean;
  studentInfo?: StudentInfo;
  completedCourses: string[];
  currentCourses: CurrentCourse[];
  remainingCourses: string[];
  electiveRequirements: ElectiveRequirement[];
  selectedCourses: string[];
  courseDetails: Map<string, Course>;
  currentTerm: string;
  completedOpen: boolean;
  enrolledOpen: boolean;
  remainingOpen: boolean;
  isLoadingDetails: boolean;
  isGenerating: boolean;
  onToggleCompleted: () => void;
  onToggleEnrolled: () => void;
  onToggleRemaining: () => void;
  onGenerateSmartSchedule: () => Promise<void>;
  onAddCourse: (courseCode: string) => void | Promise<void>;
  onAddAllCourses: (courseCodes: string[]) => void | Promise<void>;
  onRemoveCourse: (courseCode: string) => void;
  onClearSelected: () => void;
  areAllPrerequisitesMet: (
    prerequisites: string[],
    prerequisiteTree?: { id: string; nodeType: string; requiredCourseId: string | null; parentId: string | null }[],
  ) => boolean;
  getPrerequisiteBreakdown: (
    prerequisiteTree?: { id: string; nodeType: string; requiredCourseId: string | null; parentId: string | null }[],
  ) => { code: string; met: boolean }[];
  getTermLabel: (term: string) => string;
  getTermShortLabel: (term: string) => string;
}

export function AuditSummaryCard({
  hasAuditData,
  studentInfo,
  completedCourses,
  currentCourses,
  remainingCourses,
  electiveRequirements,
  selectedCourses,
  courseDetails,
  currentTerm,
  completedOpen,
  enrolledOpen,
  remainingOpen,
  isLoadingDetails,
  isGenerating,
  onToggleCompleted,
  onToggleEnrolled,
  onToggleRemaining,
  onGenerateSmartSchedule,
  onAddCourse,
  onAddAllCourses,
  onRemoveCourse,
  onClearSelected,
  areAllPrerequisitesMet,
  getPrerequisiteBreakdown,
  getTermLabel,
  getTermShortLabel,
}: AuditSummaryCardProps) {
  if (!hasAuditData || !studentInfo) {
    return null;
  }

  const electiveCourseSet = new Set(electiveRequirements.flatMap(er => er.courseOptions));
  const addableCourses = remainingCourses.filter((code) => {
    if (electiveCourseSet.has(code)) return false;
    const details = courseDetails.get(code);
    if (!details || !details.terms || !details.terms.includes(currentTerm)) return false;
    return areAllPrerequisitesMet(details.prerequisites || [], details.prerequisiteTree);
  });

  const electiveTokens = electiveRequirements.flatMap((elective) => {
    const slotCount = getElectiveSlotCount(elective);
    return getMissingElectiveTokenNumbers(selectedCourses, elective.category, slotCount).map(index =>
      buildElectiveToken(elective.category, index),
    );
  });

  const allItems = [...addableCourses, ...electiveTokens];
  const hasUnselected = allItems.some(item => !selectedCourses.includes(item));
  const coreCourses = remainingCourses.filter(code => !electiveCourseSet.has(code));

  return (
    <div
      className="bg-white border border-gray-200"
      style={{ marginBottom: '32px', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
    >
      <div className="flex items-start justify-between gap-4" style={{ marginBottom: '16px' }}>
        <div>
          <p className="font-semibold text-gray-900 text-lg">{studentInfo.name}</p>
          <p className="text-sm text-gray-500">{studentInfo.program} | {studentInfo.studentId}</p>
          <div className="flex gap-6 mt-3">
            <SummaryStat label="Completed" value={completedCourses.length} />
            <SummaryStat label="In Progress" value={currentCourses.length} />
            <SummaryStat label="Remaining" value={remainingCourses.length} />
          </div>
        </div>
        {remainingCourses.length > 0 && (
          <Button
            onClick={onGenerateSmartSchedule}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" fill="currentColor" />
            {isGenerating ? 'Generating...' : 'Auto-Generate Schedule'}
          </Button>
        )}
      </div>

      <div className="space-y-3 text-sm border-t border-gray-100 pt-4">
        <CollapsibleCourseList
          title="Completed courses"
          count={completedCourses.length}
          open={completedOpen}
          onToggle={onToggleCompleted}
          items={completedCourses}
        />

        {currentCourses.length > 0 && (
          <CollapsibleCourseList
            title="Currently enrolled"
            count={currentCourses.length}
            open={enrolledOpen}
            onToggle={onToggleEnrolled}
            items={currentCourses.map(course => course.courseId)}
          />
        )}

        {remainingCourses.length > 0 && (
          <div>
            <button
              onClick={onToggleRemaining}
              className="cursor-pointer text-gray-700 hover:text-gray-900 font-medium flex items-center gap-2 w-full text-left"
            >
              <ChevronRight className="w-4 h-4 text-gray-400" style={{ transform: remainingOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 200ms' }} />
              Remaining requirements
              <span className="text-xs text-gray-500">({remainingCourses.length})</span>
              {isLoadingDetails && <span className="text-xs text-gray-400 italic animate-pulse">Loading...</span>}
            </button>

            {remainingOpen && (
              <div className="mt-3" style={{ paddingLeft: '28px' }}>
                {hasUnselected && (
                  <button
                    onClick={() => onAddAllCourses(allItems)}
                    className="text-xs font-semibold text-gray-900 hover:text-black hover:underline mb-4 flex items-center gap-1"
                  >
                    <span className="text-sm">+</span> Add all available courses ({addableCourses.length} courses)
                  </button>
                )}

                {selectedCourses.length > 0 && (
                  <button
                    onClick={onClearSelected}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline mb-4 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Remove all added courses
                  </button>
                )}

                {coreCourses.length > 0 && (
                  <RemainingCoreCourseList
                    coreCourses={coreCourses}
                    selectedCourses={selectedCourses}
                    courseDetails={courseDetails}
                    currentTerm={currentTerm}
                    onAddCourse={onAddCourse}
                    onRemoveCourse={onRemoveCourse}
                    areAllPrerequisitesMet={areAllPrerequisitesMet}
                    getPrerequisiteBreakdown={getPrerequisiteBreakdown}
                    getTermLabel={getTermLabel}
                    getTermShortLabel={getTermShortLabel}
                  />
                )}

                {electiveRequirements.length > 0 && (
                  <ElectiveRequirementList
                    electiveRequirements={electiveRequirements}
                    selectedCourses={selectedCourses}
                    onAddCourse={onAddCourse}
                  />
                )}

                {electiveRequirements.length === 0 && coreCourses.length === 0 && (
                  <FallbackRemainingCourseList
                    remainingCourses={remainingCourses}
                    selectedCourses={selectedCourses}
                    onAddAllCourses={onAddAllCourses}
                    onAddCourse={onAddCourse}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {remainingCourses.length === 0 && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-gray-700 font-medium text-sm">All degree requirements completed or in progress</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}

function CollapsibleCourseList({
  title,
  count,
  open,
  onToggle,
  items,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  items: string[];
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="cursor-pointer text-gray-700 hover:text-gray-900 font-medium flex items-center gap-2 w-full text-left"
      >
        <ChevronRight className="w-4 h-4 text-gray-400" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 200ms' }} />
        {title}
        <span className="text-xs text-gray-500">({count})</span>
      </button>
      {open && (
        <div className="mt-3 flex flex-wrap gap-2" style={{ paddingLeft: '28px' }}>
          {items.map((item) => (
            <span key={item} className="px-2 py-1 bg-gray-50 text-gray-700 border border-gray-200 rounded-md text-xs font-medium">
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface RemainingCoreCourseListProps {
  coreCourses: string[];
  selectedCourses: string[];
  courseDetails: Map<string, Course>;
  currentTerm: string;
  onAddCourse: (courseCode: string) => void | Promise<void>;
  onRemoveCourse: (courseCode: string) => void;
  areAllPrerequisitesMet: (
    prerequisites: string[],
    prerequisiteTree?: { id: string; nodeType: string; requiredCourseId: string | null; parentId: string | null }[],
  ) => boolean;
  getPrerequisiteBreakdown: (
    prerequisiteTree?: { id: string; nodeType: string; requiredCourseId: string | null; parentId: string | null }[],
  ) => { code: string; met: boolean }[];
  getTermLabel: (term: string) => string;
  getTermShortLabel: (term: string) => string;
}

function RemainingCoreCourseList({
  coreCourses,
  selectedCourses,
  courseDetails,
  currentTerm,
  onAddCourse,
  onRemoveCourse,
  areAllPrerequisitesMet,
  getPrerequisiteBreakdown,
  getTermLabel,
  getTermShortLabel,
}: RemainingCoreCourseListProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {coreCourses.map((code) => {
        const details = courseDetails.get(code);
        const hasTermData = details?.terms && details.terms.length > 0;
        const isOfferedNow = hasTermData && details!.terms!.includes(currentTerm);
        const prereqsMet = isOfferedNow && areAllPrerequisitesMet(details!.prerequisites || [], details!.prerequisiteTree);
        const isSelected = selectedCourses.includes(code);
        const eligible = isOfferedNow && prereqsMet;
        const canAdd = eligible && !isSelected;
        const isClickable = canAdd || isSelected;

        const courseButton = (
          <button
            onClick={() => {
              if (isSelected) onRemoveCourse(code);
              else if (canAdd) onAddCourse(code);
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
                style={{ color: term === currentTerm ? '#18181b' : '#a1a1aa' }}
              >
                {getTermShortLabel(term)}
              </span>
            ))}
            {isSelected && <span className="text-[9px] text-gray-400 font-medium">Added</span>}
          </button>
        );

        if (isClickable) {
          return <span key={code}>{courseButton}</span>;
        }

        const prereqBreakdown = getPrerequisiteBreakdown(details?.prerequisiteTree);
        const missingPrereqs = prereqBreakdown.filter(prereq => !prereq.met);

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
            <HoverCardTrigger asChild>{courseButton}</HoverCardTrigger>
            <HoverCardContent
              side="top"
              align="center"
              className="w-72 p-0 rounded-lg border border-gray-200 shadow-lg bg-white"
            >
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
                        Not offered in {getTermLabel(currentTerm)}.{' '}
                        {hasTermData && details!.terms!.length > 0 && (
                          <span className="font-medium text-gray-600">
                            Next available: {getTermLabel(details!.terms![0])}
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
                            {getTermLabel(term)}
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
                            {prereq.met && <span className="text-[10px] text-green-600">Completed</span>}
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
}

function ElectiveRequirementList({
  electiveRequirements,
  selectedCourses,
  onAddCourse,
}: {
  electiveRequirements: ElectiveRequirement[];
  selectedCourses: string[];
  onAddCourse: (courseCode: string) => void | Promise<void>;
}) {
  return (
    <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Elective Requirements</p>
      {electiveRequirements.map((elective) => {
        const selectedCount = getSelectedElectiveTokenCount(selectedCourses, elective.category);
        const slotCount = getElectiveSlotCount(elective);
        const nextTokenNumber = getMissingElectiveTokenNumbers(selectedCourses, elective.category, slotCount)[0];
        const nextToken = nextTokenNumber ? buildElectiveToken(elective.category, nextTokenNumber) : '';
        const isFullySelected = selectedCount >= slotCount;

        return (
          <div key={elective.category}>
            <button
              onClick={() => !isFullySelected && onAddCourse(nextToken)}
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
  );
}

function FallbackRemainingCourseList({
  remainingCourses,
  selectedCourses,
  onAddAllCourses,
  onAddCourse,
}: {
  remainingCourses: string[];
  selectedCourses: string[];
  onAddAllCourses: (courseCodes: string[]) => void | Promise<void>;
  onAddCourse: (courseCode: string) => void | Promise<void>;
}) {
  return (
    <>
      {remainingCourses.some(code => !selectedCourses.includes(code)) && (
        <button
          onClick={() => onAddAllCourses(remainingCourses)}
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
              onClick={() => !isSelected && onAddCourse(code)}
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
}

interface SearchPanelProps {
  searchRef: RefObject<HTMLDivElement | null>;
  searchQuery: string;
  searchResults: Course[];
  showResults: boolean;
  isSearching: boolean;
  selectedCourses: string[];
  currentTerm: string;
  onSearch: (query: string) => void;
  onFocus: () => void;
  onAddCourse: (courseCode: string) => void | Promise<void>;
  getTermLabel: (term: string) => string;
}

export function SearchPanel({
  searchRef,
  searchQuery,
  searchResults,
  showResults,
  isSearching,
  selectedCourses,
  currentTerm,
  onSearch,
  onFocus,
  onAddCourse,
  getTermLabel,
}: SearchPanelProps) {
  const sortedResults = [...searchResults].sort((a, b) => {
    const aInTerm = a.terms?.includes(currentTerm) ? 1 : 0;
    const bInTerm = b.terms?.includes(currentTerm) ? 1 : 0;
    return bInTerm - aInTerm;
  });

  return (
    <div className="bg-white border border-gray-200 p-6" style={{ borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      <h3 className="font-semibold text-gray-900 mb-4">Search Courses</h3>
      <div ref={searchRef} className="relative">
        <div className="relative">
          <Search className="absolute w-4 h-4 text-gray-400" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <Input
            type="text"
            placeholder="Search by course code or name (min 2 chars)..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            onFocus={onFocus}
            className="pl-10"
            style={{ height: '44px' }}
          />
          {isSearching && (
            <div className="absolute" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
              <div
                className="w-4 h-4 border-2 border-gray-300 rounded-full"
                style={{ borderTopColor: '#374151', animation: 'spin 1s linear infinite' }}
              />
            </div>
          )}
        </div>

        {showResults && searchResults.length > 0 && (
          <div className="absolute w-full mt-2 bg-white border border-gray-200 shadow-lg overflow-y-auto" style={{ zIndex: 20, borderRadius: '12px', maxHeight: '320px' }}>
            {sortedResults.map((course) => (
              <button
                key={course.code}
                onClick={() => onAddCourse(course.code)}
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
                      {course.sectionTypes && course.sectionTypes.length > 0 && <span className="text-gray-300">|</span>}
                      {course.sectionTypes && course.sectionTypes.length > 0 && <span>{course.sectionTypes.join(', ')}</span>}
                      {course.terms && course.terms.length > 0 && (
                        <>
                          <span className="text-gray-300">|</span>
                          <div className="flex gap-1">
                            {course.terms.map(term => {
                              const isCurrent = term === currentTerm;
                              return (
                                <span
                                  key={term}
                                  className={`px-1.5 py-0.5 rounded ${isCurrent ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600'}`}
                                >
                                  {getTermLabel(term)}{isCurrent ? ' (Available now)' : ''}
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
  );
}

interface SelectedCoursesPanelProps {
  selectedCourses: string[];
  completedCourses: string[];
  courseDetails: Map<string, Course>;
  electiveRequirements: ElectiveRequirement[];
  hasAuditData: boolean;
  onRemoveCourse: (courseCode: string) => void;
  areAllPrerequisitesMet: (
    prerequisites: string[],
    prerequisiteTree?: { id: string; nodeType: string; requiredCourseId: string | null; parentId: string | null }[],
  ) => boolean;
  checkPrerequisiteStatus: (prerequisite: string) => 'met' | 'not-met' | 'unknown';
}

export function SelectedCoursesPanel({
  selectedCourses,
  completedCourses,
  courseDetails,
  electiveRequirements,
  hasAuditData,
  onRemoveCourse,
  areAllPrerequisitesMet,
  checkPrerequisiteStatus,
}: SelectedCoursesPanelProps) {
  return (
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
          <p className="text-gray-500">No courses selected yet.</p>
          <p className="text-sm text-gray-400 mt-1">Search above or add from remaining requirements.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {selectedCourses.map((courseCode) => {
            if (courseCode.startsWith('ELECTIVE:')) {
              const category = getElectiveTokenCategory(courseCode) || courseCode.replace('ELECTIVE:', '');
              const requirement = electiveRequirements.find(er => er.category === category);
              const label = requirement?.label || category;
              const creditInfo = requirement ? `${getSelectionUnitCredits(requirement)} cr.` : '';

              return (
                <div
                  key={courseCode}
                  className="border border-gray-200 rounded-lg p-4"
                  style={{ background: '#f9fafb' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">{label}</span>
                      {creditInfo && <span className="text-xs text-gray-500 ml-2">({creditInfo})</span>}
                      <p className="text-xs text-gray-400" style={{ marginTop: '4px' }}>
                        A course will be auto-selected when you generate the schedule
                      </p>
                    </div>
                    <button
                      onClick={() => onRemoveCourse(courseCode)}
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
            const hasUnmetPrereqs = isCompleted ? false : !areAllPrerequisitesMet(course.prerequisites, course.prerequisiteTree);
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
                      {isCompleted && <StatusBadge text="Already completed" />}
                      {noSections && !isCompleted && <StatusBadge text="No sections available" />}
                      {hasUnmetPrereqs && hasAuditData && !noSections && !isCompleted && (
                        <StatusBadge text="Prerequisites not met" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{course.name}</p>

                    {!isCompleted && course.prerequisites.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs font-medium text-gray-500" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prerequisites: </span>
                        <span className="text-xs">
                          {course.prerequisites.map((prereq, index) => {
                            const status = checkPrerequisiteStatus(prereq);
                            return (
                              <span key={prereq}>
                                <span
                                  className={`font-medium ${
                                    status === 'met' ? 'text-green-600' : status === 'not-met' ? 'text-amber-600' : 'text-gray-600'
                                  }`}
                                >
                                  {prereq}
                                </span>
                                {index < course.prerequisites.length - 1 && ', '}
                              </span>
                            );
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onRemoveCourse(courseCode)}
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
  );
}

function StatusBadge({ text }: { text: string }) {
  return (
    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
      {text}
    </span>
  );
}

interface GenerateScheduleSidebarProps {
  selectedCourses: string[];
  coursesWithSectionsCount: number;
  currentTerm: string;
  hasAuditData: boolean;
  onGenerateSchedules: () => void;
  getTermLabel: (term: string) => string;
}

export function GenerateScheduleSidebar({
  selectedCourses,
  coursesWithSectionsCount,
  currentTerm,
  hasAuditData,
  onGenerateSchedules,
  getTermLabel,
}: GenerateScheduleSidebarProps) {
  return (
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
        <div
          className="flex items-center gap-2 text-xs font-semibold rounded-md px-3 py-1.5 mb-4"
          style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}
        >
          <Calendar className="w-3.5 h-3.5" />
          Planning for {getTermLabel(currentTerm)}
        </div>
        <Button
          onClick={onGenerateSchedules}
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
  );
}
