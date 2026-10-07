import { type RefObject, type ReactNode } from 'react';
import { ChevronDown, Search, X, Minus, Plus, Check, ArrowRight, Loader2, BookOpen, CalendarDays } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card';
import type { Course, PrerequisiteValidationResult } from '../../utils/courseData';
import type { ElectiveRequirement } from '../../types/electives';
import { getTermLabel } from '../../utils/termUtils';
import { HalfTermCourseTag } from '../HalfTermCourseTag';
import {
  buildElectiveToken,
  getElectiveSlotCount,
  getElectiveTokenCategory,
  getMissingElectiveTokenNumbers,
  getSelectedElectiveTokenCount,
  getSelectionUnitCredits,
} from '../../utils/electiveUtils';

interface StudentInfo {
  name: string;
  studentId: string;
  program: string;
}

interface CurrentCourse {
  courseId: string;
  term: string;
}

export function CourseSelectionHeader() {
  return (
    <div className="page-heading">
      <div className="flex items-center justify-between mb-1">
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 800,
          color: 'var(--foreground)',
          letterSpacing: '-0.02em',
          lineHeight: 1.2 
        }}>
          Plan your term
        </h1>
      </div>
      <p style={{ fontSize: '15px', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
        Find courses and keep your term's selections together.
      </p>
    </div>
  );
}

interface TermSwitchButtonProps {
  currentTerm: string;
  onChangeTerm: () => void;
}

export function TermSwitchButton({ currentTerm, onChangeTerm }: TermSwitchButtonProps) {
  return (
    <button className="term-switch-button" onClick={onChangeTerm} aria-label={`Planning ${getTermLabel(currentTerm)}. Change term`}>
      <CalendarDays size={16} />
      <strong>{getTermLabel(currentTerm)}</strong>
      <span>Change term</span>
    </button>
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
  areAllPrerequisitesMet: (courseCode: string) => boolean;
  getMissingPrerequisites: (courseCode: string) => string[];
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
  getMissingPrerequisites,
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
    return areAllPrerequisitesMet(code);
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
    <div className="glass-panel"
      style={{ 
        padding: '20px',
      }}
    >
      {/* Student Info Header */}
      <div className="flex items-start justify-between mb-6" style={{ gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--foreground)', marginBottom: '4px' }}>
            {studentInfo.name}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
            {studentInfo.program}
          </p>
        </div>
        {remainingCourses.length > 0 && (
          <Button
            onClick={onGenerateSmartSchedule}
            disabled={isGenerating}
            size="sm"
          >
            {isGenerating ? 'Generating...' : 'Auto-fill courses'}
          </Button>
        )}
      </div>

      {/* Progress Stats */}
      <div className="audit-progress">
        <ProgressStat label="Completed" value={completedCourses.length} />
        <ProgressStat label="In Progress" value={currentCourses.length} />
        <ProgressStat label="Remaining" value={remainingCourses.length} />
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-4">
        <details className="audit-history">
          <summary>Academic history <span>{completedCourses.length} completed · {currentCourses.length} in progress</span></summary>
        <CollapsibleSection
          title="Completed"
          count={completedCourses.length}
          open={completedOpen}
          onToggle={onToggleCompleted}
        >
          <div className="flex flex-wrap gap-2">
            {completedCourses.map((code) => (
              <span 
                key={code} 
                style={{
                  padding: '4px 10px',
                  fontSize: '13px',
                  color: 'var(--muted-foreground)',
                  background: 'var(--surface)',
                  borderRadius: '4px'
                }}
              >
                {code}
              </span>
            ))}
          </div>
        </CollapsibleSection>

        {currentCourses.length > 0 && (
          <CollapsibleSection
            title="Currently Enrolled"
            count={currentCourses.length}
            open={enrolledOpen}
            onToggle={onToggleEnrolled}
          >
            <div className="flex flex-wrap gap-2">
              {currentCourses.map((course) => (
                <span 
                  key={course.courseId} 
                  style={{
                    padding: '4px 10px',
                    fontSize: '13px',
                    color: 'var(--muted-foreground)',
                    background: 'var(--surface)',
                    borderRadius: '4px'
                  }}
                >
                  {course.courseId}
                </span>
              ))}
            </div>
          </CollapsibleSection>
        )}
        </details>

        {remainingCourses.length > 0 && (
          <CollapsibleSection
            title="Remaining Requirements"
            count={remainingCourses.length}
            open={remainingOpen}
            onToggle={onToggleRemaining}
            loading={isLoadingDetails}
          >
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="flex gap-4">
                {hasUnselected && (
                  <button
                    onClick={() => onAddAllCourses(allItems)}
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--primary-text)',
                    }}
                    className="hover:underline"
                  >
                    Add all available ({addableCourses.length})
                  </button>
                )}
                {selectedCourses.length > 0 && (
                  <button
                    onClick={onClearSelected}
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--muted-foreground)',
                    }}
                    className="hover:underline"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              {/* Core Courses */}
              {coreCourses.length > 0 && (
                <div>
                  <h4 style={{ 
                    fontSize: '12px', 
                    fontWeight: 600, 
                    color: 'var(--muted-foreground)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '12px'
                  }}>
                    Core Courses
                  </h4>
                  <RemainingCoreCourseList
                    coreCourses={coreCourses}
                    selectedCourses={selectedCourses}
                    courseDetails={courseDetails}
                    currentTerm={currentTerm}
                    onAddCourse={onAddCourse}
                    onRemoveCourse={onRemoveCourse}
                    areAllPrerequisitesMet={areAllPrerequisitesMet}
                    getMissingPrerequisites={getMissingPrerequisites}
                    getTermLabel={getTermLabel}
                    getTermShortLabel={getTermShortLabel}
                  />
                </div>
              )}

              {/* Electives */}
              {electiveRequirements.length > 0 && (
                <div>
                  <h4 style={{ 
                    fontSize: '12px', 
                    fontWeight: 600, 
                    color: 'var(--muted-foreground)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '12px'
                  }}>
                    Electives
                  </h4>
                  <ElectiveRequirementList
                    electiveRequirements={electiveRequirements}
                    selectedCourses={selectedCourses}
                    onAddCourse={onAddCourse}
                    onRemoveCourse={onRemoveCourse}
                  />
                </div>
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
          </CollapsibleSection>
        )}

        {remainingCourses.length === 0 && (
          <div style={{ 
            padding: '16px',
            background: 'var(--success-soft)',
            borderRadius: '8px',
            fontSize: '14px',
            color: 'var(--success)'
          }}>
            All degree requirements completed or in progress
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '6px' }}>
        {label}
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  count,
  open,
  onToggle,
  loading,
  children,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-2 text-left"
      >
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)' }}>
          {title}
          <span style={{ color: 'var(--muted-foreground)', fontWeight: 400, marginLeft: '8px' }}>
            {count}
          </span>
          {loading && (
            <span style={{ color: 'var(--muted-foreground)', fontWeight: 400, marginLeft: '8px', fontStyle: 'italic' }}>
              Loading...
            </span>
          )}
        </span>
        <ChevronDown 
          className="w-4 h-4 text-slate-400 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      {open && (
        <div style={{ paddingTop: '12px', paddingBottom: '8px' }}>
          {children}
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
  areAllPrerequisitesMet: (courseCode: string) => boolean;
  getMissingPrerequisites: (courseCode: string) => string[];
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
  getMissingPrerequisites,
  getTermLabel,
  getTermShortLabel,
}: RemainingCoreCourseListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {coreCourses.map((code) => {
        const details = courseDetails.get(code);
        const hasTermData = details?.terms && details.terms.length > 0;
        const isOfferedNow = hasTermData && details!.terms!.includes(currentTerm);
        const prereqsMet = isOfferedNow && areAllPrerequisitesMet(code);
        const isSelected = selectedCourses.includes(code);
        const canAdd = isOfferedNow && !isSelected;
        const isClickable = canAdd || isSelected;

        const courseChip = (
          <button
            className="course-chip"
            onClick={() => {
              if (isSelected) onRemoveCourse(code);
              else if (canAdd) onAddCourse(code);
            }}
            disabled={!isClickable}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: '6px',
              border: '1px solid',
              transition: 'all 150ms',
              cursor: isClickable ? 'pointer' : 'default',
              background: isSelected ? 'var(--primary-soft)' : 'var(--surface)',
              color: isSelected ? 'var(--primary-text)' : canAdd ? 'var(--foreground)' : 'var(--muted-foreground)',
              borderColor: isSelected ? 'var(--primary-border)' : 'var(--border)',
              opacity: !isClickable ? 0.7 : 1,
            }}
          >
            {code}
            {isSelected && (
              <X className="w-3 h-3 inline ml-1.5" style={{ marginTop: '-1px' }} />
            )}
          </button>
        );

        if (isClickable) {
          return <span key={code}>{courseChip}</span>;
        }

        // Non-clickable courses get a hover card explaining why
        const missingPrereqs = getMissingPrerequisites(code);

        let reason = 'No schedule data available';
        if (hasTermData && !isOfferedNow) {
          reason = `Not offered in ${getTermLabel(currentTerm)}`;
        } else if (!prereqsMet && missingPrereqs.length > 0) {
          reason = `Missing: ${missingPrereqs.join(', ')}`;
        }

        return (
          <HoverCard key={code} openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>{courseChip}</HoverCardTrigger>
            <HoverCardContent
              className="scheduler-popover"
              side="top"
              align="center"
              style={{
                width: '240px',
                padding: '12px',
                background: 'var(--popover, #252630)',
                border: '1px solid var(--border, #ffffff29)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}
            >
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground, #f5f5f7)', marginBottom: '4px' }}>
                {code}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--muted-foreground, #b9bdc8)' }}>
                {reason}
              </p>
              {hasTermData && !isOfferedNow && details!.terms!.length > 0 && (
                <p style={{ fontSize: '12px', color: 'var(--muted-foreground, #b9bdc8)', marginTop: '8px' }}>
                  Available: {details!.terms!.map(t => getTermShortLabel(t)).join(', ')}
                </p>
              )}
            </HoverCardContent>
          </HoverCard>
        );
      })}
    </div>
  );
}

function ElectiveRemoveButton({ category, label, selectedCourses, onRemoveCourse }: {
  category: string;
  label: string;
  selectedCourses: string[];
  onRemoveCourse: (courseCode: string) => void;
}) {
  const token = selectedCourses.filter(code => getElectiveTokenCategory(code) === category).slice(-1)[0];
  if (!token) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      className="elective-remove"
      onClick={() => onRemoveCourse(token)}
      aria-label={`Remove one ${label} elective`}
      title={`Remove one ${label} elective`}
    >
      <Minus size={16} />
    </Button>
  );
}

function ElectiveRequirementList({
  electiveRequirements,
  selectedCourses,
  onAddCourse,
  onRemoveCourse,
}: {
  electiveRequirements: ElectiveRequirement[];
  selectedCourses: string[];
  onAddCourse: (courseCode: string) => void | Promise<void>;
  onRemoveCourse: (courseCode: string) => void;
}) {
  return (
    <div className="space-y-2">
      {electiveRequirements.map((elective) => {
        const selectedCount = getSelectedElectiveTokenCount(selectedCourses, elective.category);
        const slotCount = getElectiveSlotCount(elective);
        const nextTokenNumber = getMissingElectiveTokenNumbers(selectedCourses, elective.category, slotCount)[0];
        const nextToken = nextTokenNumber ? buildElectiveToken(elective.category, nextTokenNumber) : '';
        const isFullySelected = selectedCount >= slotCount;

        return (
          <div key={elective.category} className="elective-category-row">
          <button
            onClick={() => !isFullySelected && onAddCourse(nextToken)}
            disabled={isFullySelected}
            className="w-full text-left"
            style={{
              padding: '12px 16px',
              border: 'none',
              borderRadius: '8px',
              cursor: isFullySelected ? 'default' : 'pointer',
              opacity: isFullySelected ? 0.7 : 1,
              transition: 'all 150ms',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)' }}>
                  {elective.label}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                  {elective.creditsNeeded} credits needed
                </p>
              </div>
              <span style={{ 
                fontSize: '13px', 
                color: isFullySelected ? 'var(--success)' : 'var(--muted-foreground)',
                fontWeight: 500
              }}>
                {selectedCount}/{slotCount}
              </span>
            </div>
          </button>
          <ElectiveRemoveButton category={elective.category} label={elective.label} selectedCourses={selectedCourses} onRemoveCourse={onRemoveCourse} />
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
    <div>
      {remainingCourses.some(code => !selectedCourses.includes(code)) && (
        <button
          onClick={() => onAddAllCourses(remainingCourses)}
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--primary-text)',
            marginBottom: '12px',
          }}
          className="hover:underline"
        >
          Add all remaining courses
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
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 500,
                borderRadius: '6px',
                border: '1px solid',
                background: 'var(--surface)',
                color: isSelected ? 'var(--muted-foreground)' : 'var(--foreground)',
                borderColor: 'var(--border)',
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
  );
}

interface SearchPanelProps {
  searchRef: RefObject<HTMLDivElement | null>;
  searchQuery: string;
  searchResults: Course[];
  showResults: boolean;
  isSearching: boolean;
  selectedCourses: string[];
  plannedInOtherTerms?: Record<string, string>;
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
  plannedInOtherTerms = {},
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
    <div className="glass-panel course-search-panel"
      style={{ 
        padding: '20px'
      }}
    >
      <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--foreground)', marginBottom: '16px' }}>
        Find courses
      </h3>
      <div ref={searchRef} className="relative">
        <div className="relative">
          <Search 
            className="absolute w-4 h-4 text-slate-400" 
            style={{ left: '14px', top: '50%', transform: 'translateY(-50%)' }} 
          />
          <Input
            type="text"
            aria-label="Search courses by code or name"
            placeholder="Course code or name..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            onFocus={onFocus}
            style={{ 
              paddingLeft: '42px',
              paddingRight: '42px',
              height: '44px',
              fontSize: '14px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--surface)'
            }}
          />
          {searchQuery && !isSearching && <button className="search-clear" onClick={() => onSearch('')} aria-label="Clear course search"><X size={16} /></button>}
          {isSearching && (
            <div 
              className="absolute w-4 h-4 border-2 border-slate-200 rounded-full"
              style={{ 
                right: '14px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                borderTopColor: 'var(--muted-foreground)',
                animation: 'spin 1s linear infinite'
              }}
            />
          )}
        </div>

        {showResults && searchResults.length > 0 && (
          <div className="course-results" aria-label="Course search results">
            {sortedResults.map((course, index) => {
              const isSelected = selectedCourses.includes(course.code);
              const plannedTerm = plannedInOtherTerms[course.code];
              const isAvailable = course.terms?.includes(currentTerm);

              return (
                <button
                  key={course.code}
                  onClick={() => onAddCourse(course.code)}
                  disabled={isSelected || Boolean(plannedTerm)}
                   className="course-result w-full text-left transition-colors"
                  style={{ 
                    padding: '14px 16px',
                    borderBottom: index < sortedResults.length - 1 ? '1px solid var(--border)' : 'none',
                    opacity: 1,
                    cursor: isSelected || plannedTerm ? 'not-allowed' : 'pointer',
                    background: 'transparent'
                  }}
                  onMouseEnter={(e) => { if (!isSelected && !plannedTerm) e.currentTarget.style.background = 'var(--surface-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)' }}>
                          {course.code}
                        </span>
                        {isAvailable && (
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: 500,
                            color: 'var(--success)',
                            background: 'var(--success-soft)',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>
                            Available
                          </span>
                        )}
                      </div>
                      {course.name && course.name !== course.code && (
                        <p style={{ 
                          fontSize: '13px', 
                          color: 'var(--muted-foreground)',
                          marginTop: '2px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {course.name}
                        </p>
                      )}
                      <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '4px' }}>
                        {course.credits} credits
                        {' '}<HalfTermCourseTag code={course.code} credits={course.credits} />
                      </p>
                      {plannedTerm && <p className="planned-other-term">Already selected for {getTermLabel(plannedTerm)}</p>}
                    </div>
                    <span className={`course-result-action${isSelected || plannedTerm ? ' is-added' : ''}`}>
                        {isSelected || plannedTerm ? <Check size={14} /> : <Plus size={14} />}{isSelected ? 'Added' : plannedTerm ? 'Planned' : 'Add'}
                      </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {showResults && searchQuery && searchResults.length === 0 && !isSearching && (
          <div className="search-empty" role="status">
            <p style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
              No matches for “{searchQuery}” in {getTermLabel(currentTerm)}.
            </p>
          </div>
        )}
        {!searchQuery && <p className="search-hint">Search by code or title. Results show sections in {getTermLabel(currentTerm)}.</p>}
      </div>
    </div>
  );
}

export function ManualElectivePicker({
  electiveRequirements,
  selectedCourses,
  otherTermElectiveCounts = {},
  onAddElectiveCategory,
  onRemoveCourse,
}: {
  electiveRequirements: ElectiveRequirement[];
  selectedCourses: string[];
  otherTermElectiveCounts?: Record<string, { count: number; term: string }>;
  onAddElectiveCategory: (category: string) => void;
  onRemoveCourse: (courseCode: string) => void;
}) {
  if (electiveRequirements.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel"
      style={{
        padding: '20px'
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--foreground)', marginBottom: '4px' }}>
          Elective categories
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
          Choose a category now; pick the specific course alongside your timetable.
        </p>
      </div>

      <div className="space-y-2">
        {electiveRequirements.map((elective) => {
          const selectedCount = getSelectedElectiveTokenCount(selectedCourses, elective.category);
          return (
            <div key={elective.category} className="elective-category-row">
            <button
              onClick={() => onAddElectiveCategory(elective.category)}
              className="w-full text-left"
              style={{
                padding: '12px 16px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)' }}>
                    {elective.label}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                    {elective.selectionUnitCredits || 0.5} credits per selection
                  </p>
                  {otherTermElectiveCounts[elective.category] && (
                    <p className="planned-other-term">{otherTermElectiveCounts[elective.category].count} already selected for {getTermLabel(otherTermElectiveCounts[elective.category].term)}</p>
                  )}
                </div>
                <span style={{
                  fontSize: '13px',
                  color: 'var(--muted-foreground)',
                  fontWeight: 500
                }}>
                  <span className="elective-count">{selectedCount > 0 ? `${selectedCount} selected` : <><Plus size={14} /> Add</>}</span>
                </span>
              </div>
            </button>
            <ElectiveRemoveButton category={elective.category} label={elective.label} selectedCourses={selectedCourses} onRemoveCourse={onRemoveCourse} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface SelectedCoursesPanelProps {
  prerequisiteOverrides: string[];
  selectedCourses: string[];
  completedCourses: string[];
  courseDetails: Map<string, Course>;
  electiveRequirements: ElectiveRequirement[];
  hasAuditData: boolean;
  onRemoveCourse: (courseCode: string) => void;
  areAllPrerequisitesMet: (courseCode: string) => boolean;
  prerequisiteValidation: Record<string, PrerequisiteValidationResult>;
  currentTerm: string;
  onClear: () => void;
  children?: ReactNode;
}

export function SelectedCoursesPanel({
  prerequisiteOverrides,
  selectedCourses,
  completedCourses,
  courseDetails,
  electiveRequirements,
  hasAuditData,
  onRemoveCourse,
  areAllPrerequisitesMet,
  prerequisiteValidation,
  currentTerm,
  onClear,
  children,
}: SelectedCoursesPanelProps) {
  return (
    <div className="glass-panel selected-plan">
      <div className="selected-plan-header">
        <div>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--foreground)' }}>
          Your courses <span className="selection-count">{selectedCourses.length}</span>
        </h3>
        <p>{getSelectedCredits(selectedCourses, courseDetails, electiveRequirements)} credits · {getTermLabel(currentTerm)}</p>
        </div>
        {selectedCourses.length > 0 && <Button variant="ghost" size="sm" onClick={onClear}>Clear all</Button>}
      </div>

      {selectedCourses.length === 0 ? (
        <div className="plan-empty">
          <BookOpen size={28} />
          <p style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
            Your plan is empty
          </p>
          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '4px' }}>
            Courses and electives you add appear here.
          </p>
        </div>
      ) : (
        <div className="selected-plan-list">
          {selectedCourses.map((courseCode) => {
            if (courseCode.startsWith('ELECTIVE:')) {
              const category = getElectiveTokenCategory(courseCode) || courseCode.replace('ELECTIVE:', '');
              const requirement = electiveRequirements.find(er => er.category === category);
              const label = requirement?.label || category;
              const creditInfo = requirement ? getSelectionUnitCredits(requirement) : 0;

              return (
                <div
                  key={courseCode}
                  style={{
                    padding: '14px 16px',
                    background: 'var(--surface)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)' }}>
                        {label}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                        {creditInfo} credits · Choose course in schedule
                      </p>
                    </div>
                    <button
                      onClick={() => onRemoveCourse(courseCode)}
                      aria-label={`Remove ${label}`}
                      className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              );
            }

            const course = courseDetails.get(courseCode);
            if (!course) return null;

            const isCompleted = completedCourses.includes(courseCode);
            const validation = prerequisiteValidation[courseCode];
            const hasUnmetPrereqs = isCompleted ? false : !areAllPrerequisitesMet(courseCode);
            const noSections = course.hasSections === false || !course.terms?.includes(currentTerm);
            const prerequisiteExpression = validation?.expressionEvaluated?.trim() || course.prerequisiteExpression?.trim();
            const prerequisiteSummary = validation?.requirementExplanation || prerequisiteExpression || course.prerequisites.join(', ');

            // Determine if there's a warning
            const hasWarning = noSections || (hasUnmetPrereqs && hasAuditData) || isCompleted;
            let warningText = '';
            if (isCompleted) warningText = 'Already completed';
            else if (noSections) warningText = 'Not in this term';
            else if (hasUnmetPrereqs && hasAuditData) warningText = prerequisiteOverrides.includes(courseCode) ? 'Prerequisite override · planning only' : 'Prerequisites not met';

            return (
              <div
                key={courseCode}
                style={{
                  padding: '14px 16px',
                  background: 'var(--surface)',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: hasWarning ? 'var(--warning-border)' : 'var(--border)'
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)' }}>
                        {course.code}
                      </span>
                      <HalfTermCourseTag code={course.code} credits={course.credits} />
                      {hasWarning && (
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: 500,
                          color: 'var(--warning)',
                          background: 'var(--warning-soft)',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {warningText}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                      {course.name}
                    </p>

                    {!isCompleted && prerequisiteSummary && (
                      <details className="prerequisite-details">
                        <summary>
                          <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                            Prerequisites
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: !hasAuditData ? 'var(--muted-foreground)' : hasUnmetPrereqs ? 'var(--danger)' : 'var(--success)',
                              background: !hasAuditData ? 'var(--surface)' : hasUnmetPrereqs ? 'var(--danger-soft)' : 'var(--success-soft)',
                              padding: '2px 6px',
                              borderRadius: '9999px'
                            }}
                          >
                            {!hasAuditData ? 'No audit' : hasUnmetPrereqs ? 'Not met' : validation?.plannedPrerequisites?.length ? 'Planned earlier' : 'Met'}
                          </span>
                        </summary>
                        <p
                          style={{
                            fontSize: '12px',
                            color: hasUnmetPrereqs ? 'var(--danger)' : 'var(--success)',
                            marginTop: '6px',
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                          }}
                        >
                          {prerequisiteSummary}
                        </p>
                        {validation?.plannedPrerequisites?.length ? <p className="prerequisite-override-explanation">{validation.plannedPrerequisites.join(', ')} scheduled in an earlier term. Planning assumes you pass with any required grade.</p> : null}
                        {!prerequisiteExpression && course.prerequisites.length > 0 && (
                          <div style={{ marginTop: '6px' }}>
                            {course.prerequisites.map((prereq, index) => {
                              const status = completedCourses.includes(prereq) ? 'met' : 'not-met';
                              return (
                                <span key={prereq}>
                                  <span
                                    style={{
                                      fontSize: '12px',
                                      fontWeight: 500,
                                      color: status === 'met' ? 'var(--success)' : status === 'not-met' ? 'var(--danger)' : 'var(--muted-foreground)',
                                    }}
                                  >
                                    {prereq}
                                  </span>
                                  {index < course.prerequisites.length - 1 && (
                                    <span style={{ color: 'var(--muted-foreground)' }}>, </span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </details>
                    )}
                  </div>
                  <button
                    onClick={() => onRemoveCourse(courseCode)}
                    aria-label={`Remove ${courseCode}`}
                    className="p-1.5 rounded-md hover:bg-slate-100 transition-colors ml-3"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {children}
    </div>
  );
}

function getSelectedCredits(selectedCourses: string[], courseDetails: Map<string, Course>, electives: ElectiveRequirement[]) {
  return selectedCourses.reduce((sum, code) => {
    const category = getElectiveTokenCategory(code);
    const elective = category ? electives.find(item => item.category === category) : undefined;
    return sum + (elective ? getSelectionUnitCredits(elective) : courseDetails.get(code)?.credits || 0);
  }, 0);
}

interface GenerateScheduleSidebarProps {
  selectedCourses: string[];
  coursesWithSectionsCount: number;
  currentTerm: string;
  hasAuditData: boolean;
  onGenerateSchedules: () => void;
  getTermLabel: (term: string) => string;
  isGenerating: boolean;
  error: string | null;
}

export function GenerateScheduleSidebar({
  selectedCourses,
  coursesWithSectionsCount,
  currentTerm,
  hasAuditData,
  onGenerateSchedules,
  getTermLabel,
  isGenerating,
  error,
}: GenerateScheduleSidebarProps) {
  const canGenerate = selectedCourses.length > 0;
  
  return (
    <div className="plan-actions">
        <p className="plan-status" aria-live="polite">
          {selectedCourses.length === 0
            ? 'Add courses to find a timetable.'
            : `${coursesWithSectionsCount} course${coursesWithSectionsCount !== 1 ? 's' : ''} ready for ${getTermLabel(currentTerm)}`
          }
        </p>
        <Button
          onClick={onGenerateSchedules}
          disabled={!canGenerate || isGenerating}
          className="w-full"
          style={{ height: '44px', fontSize: '14px' }}
        >
          {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />} {isGenerating ? 'Finding schedules…' : 'Find schedules'}
        </Button>
      {error && <p role="alert" className="inline-error">{error}</p>}
      {!hasAuditData && (
        <div>
          <p className="plan-audit-hint">
            An imported audit lets us check your prerequisites.
          </p>
        </div>
      )}
    </div>
  );
}
