import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, ChevronRight, Circle, Clock3, GraduationCap, Loader2, Lock, Minus, Plus, BookOpen } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import type { AuditRequirement, RequirementChoices } from '../../types/audit';
import type { ElectiveRequirement } from '../../types/electives';
import { getCourseByCode, type Course } from '../../utils/courseData';
import { getRegistrationTerms, getTermLabel } from '../../utils/termUtils';
import { getElectiveTokenCategory, getElectiveSlotCount, getSelectionUnitCredits } from '../../utils/electiveUtils';
import { validatePrerequisitesFromTree } from '@shared/prerequisite-evaluator';
import { describePrerequisiteIssues } from '@shared/prerequisite-reasons';
import { getAuditGroupLabel, getCourseLevelGroup, getAuditGroupOrder } from '../../utils/auditYears';
import { HalfTermCourseTag } from '../HalfTermCourseTag';

interface AuditRequirementTreeProps {
  priorScheduledCourses: string[];
  prerequisiteOverrides: string[];
  program?: string;
  requirements: AuditRequirement[];
  completedCourses: string[];
  currentCourses: Array<{ courseId: string; term: string }>;
  remainingCourses: string[];
  electives: ElectiveRequirement[];
  courseDetails: Map<string, Course>;
  courseGrades: Record<string, string>;
  selectedCourses: string[];
  choices: RequirementChoices;
  activeTerm: string;
  onChoose: (requirementId: string, code: string) => Promise<void>;
  onUnchoose: (requirementId: string, code: string) => void;
  onIncludeElective: (requirementId: string, elective: ElectiveRequirement, courseCount: number) => void;
  /** Courses planned in other terms, mapped to that term. */
  plannedInOtherTerms?: Record<string, string>;
  /** Elective slots already planned in other terms, by category. */
  otherTermElectiveCounts?: Record<string, { count: number; term: string }>;
  onRemoveElective: (category: string) => void;
  electivesOnly?: boolean;
}

interface RequirementNode {
  id: string;
  label: string;
  creditsNeeded: number;
  options: string[];
  group: string;
  elective?: ElectiveRequirement;
}

const normalizeCode = (code: string) => code.toUpperCase().replace(/\s+/g, '');
const isCourseCode = (code: string) => /^[A-Z]{3,4}\d{4}$/.test(code);

function getRequirementNodes(requirements: AuditRequirement[], remaining: string[], electives: ElectiveRequirement[], details: Map<string, Course>): RequirementNode[] {
  const expandOptions = (options: string[]) => Array.from(new Set(options.flatMap(option => {
    const elective = electives.find(item => item.category === option);
    return elective ? elective.courseOptions : [option];
  }).map(normalizeCode)));

  if (requirements.length > 0) {
    return requirements.flatMap((requirement, index) => {
      const needed = Math.max(0, requirement.creditsRequired - requirement.creditsCompleted - requirement.creditsInProgress);
      if (requirement.status === 'OK' || (needed === 0 && requirement.status !== 'NO')) return [];
      const title = requirement.title.toLowerCase();
      const category = electives.find(item => requirement.courseOptions.includes(item.category)
        || title.includes(item.label.toLowerCase())
        || (item.category === 'SCIENCE_ELECTIVE' && title.includes('basic science')));
      const options = expandOptions(requirement.expandedOptions ?? requirement.courseOptions);
      const label = category?.label || (options.length === 1 && isCourseCode(options[0]) ? options[0] : requirement.title || 'Audit requirement');
      const group = requirement.groupTitle ? getAuditGroupLabel(requirement.groupTitle) : category ? 'Electives' : getCourseLevelGroup(options.find(isCourseCode) || '');
      return [{ id: `audit:${index}`, label, creditsNeeded: needed, options, group, elective: category ? { ...category, creditsNeeded: needed, courseOptions: options } : undefined }];
    });
  }

  // Older saved sessions contain the flattened course/category lists only.
  return [
    ...remaining.map(code => ({ id: `course:${normalizeCode(code)}`, label: normalizeCode(code), creditsNeeded: details.get(normalizeCode(code))?.credits || 0.5, options: [normalizeCode(code)], group: getCourseLevelGroup(normalizeCode(code)) })),
    ...electives.filter(elective => elective.creditsNeeded > 0).map(elective => ({ id: `elective:${elective.category}`, label: elective.label, creditsNeeded: elective.creditsNeeded, options: expandOptions(elective.courseOptions), group: 'Electives', elective })),
  ];
}

function groupNodes(nodes: RequirementNode[]): Array<{ group: string; nodes: RequirementNode[] }> {
  const groups = new Map<string, RequirementNode[]>();
  for (const node of nodes) groups.set(node.group, [...(groups.get(node.group) || []), node]);
  return Array.from(groups.entries())
    .sort(([a], [b]) => getAuditGroupOrder(a) - getAuditGroupOrder(b) || a.localeCompare(b))
    .map(([group, groupedNodes]) => ({ group, nodes: groupedNodes }));
}

function CompletedBranch({ courses, grades }: { courses: string[]; grades: Record<string, string> }) {
  const departments = new Map<string, string[]>();
  for (const code of Array.from(new Set(courses.map(normalizeCode))).sort()) {
    const department = code.match(/^[A-Z]+/)?.[0] || 'Other courses';
    departments.set(department, [...(departments.get(department) || []), code]);
  }
  return (
    <li className="degree-branch degree-completed">
      <details>
        <summary><span className="degree-node-icon"><Check size={16} /></span><strong>Completed courses</strong><span className="degree-node-note">{courses.length} earned</span></summary>
        <ul className="degree-children">
          {Array.from(departments.entries()).map(([department, codes]) => (
            <li className="degree-branch" key={department}>
              <details>
                <summary><span className="degree-node-icon"><Check size={14} /></span><strong>{department}</strong><span className="degree-node-note">{codes.length} completed</span></summary>
                <ul className="degree-course-leaves">
                  {codes.map(code => <li key={code}><Check size={12} /><span>{code}</span>{grades[code] && <span className="degree-grade">{grades[code]}</span>}</li>)}
                </ul>
              </details>
            </li>
          ))}
          {departments.size === 0 && <li className="degree-empty-note">No completed courses were recorded in this audit.</li>}
        </ul>
      </details>
    </li>
  );
}

export function AuditRequirementTree({ program, requirements, completedCourses, currentCourses, remainingCourses, electives, courseDetails, courseGrades, selectedCourses, choices, activeTerm, onChoose, onUnchoose, onIncludeElective, onRemoveElective, electivesOnly = false, plannedInOtherTerms = {}, otherTermElectiveCounts = {}, prerequisiteOverrides, priorScheduledCourses }: AuditRequirementTreeProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadedCourses, setLoadedCourses] = useState<Map<string, Course>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingElective, setConfirmingElective] = useState<RequirementNode | null>(null);
  const [electiveCourseCount, setElectiveCourseCount] = useState(1);
  const [loadingTermCourses, setLoadingTermCourses] = useState(true);
  const allNodes = getRequirementNodes(requirements, remainingCourses, electives, courseDetails);
  const completed = useMemo(() => new Set(completedCourses.map(normalizeCode)), [completedCourses]);
  const enrolled = useMemo(() => new Set(currentCourses.map(course => normalizeCode(course.courseId))), [currentCourses]);
  const details = new Map([...courseDetails, ...loadedCourses]);
  const coreCodes = Array.from(new Set(allNodes.filter(node => !node.elective).flatMap(node => node.options).filter(code => isCourseCode(code) && !completed.has(code) && !enrolled.has(code))));
  const coreKey = coreCodes.join('|');
  const nodes = allNodes.flatMap(node => {
    if (node.elective) return [node];
    if (electivesOnly) return [];
    const options = node.options.filter(code => !completed.has(code) && !enrolled.has(code) && (details.get(code)?.terms?.includes(activeTerm) || selectedCourses.includes(code)));
    if (!options.length) return [];
    const label = options.length === node.options.length ? node.label : options.length === 1 ? options[0] : `${node.creditsNeeded} credits in ${options.join(', ')}`;
    return [{ ...node, options, label }];
  });
  const activeNode = nodes.find(node => node.id === activeId);
  const codesToLoad = (activeNode?.elective ? [] : activeNode?.options || []).filter(code => isCourseCode(code) && !completed.has(code) && !enrolled.has(code));
  const optionKey = codesToLoad.join('|');

  useEffect(() => {
    let cancelled = false;
    setLoadingTermCourses(true);
    const load = async () => {
      const codes = coreKey ? coreKey.split('|') : [];
      try {
        for (let index = 0; index < codes.length; index += 20) {
          const batch = await Promise.all(codes.slice(index, index + 20).map(getCourseByCode));
          if (cancelled) return;
          setLoadedCourses(previous => {
            const next = new Map(previous);
            batch.forEach(course => { if (course) next.set(course.code, course); });
            return next;
          });
        }
      } finally { if (!cancelled) setLoadingTermCourses(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [coreKey, activeTerm]);

  useEffect(() => {
    setShowUnavailable(false);
    setError(null);
  }, [activeId, activeTerm]);

  useEffect(() => {
    if (!activeId || !optionKey) { setIsLoading(false); return; }
    let cancelled = false;
    setIsLoading(true);
    const load = async () => {
      const codes = optionKey.split('|');
      try {
        for (let index = 0; index < codes.length; index += 20) {
          const batch = await Promise.all(codes.slice(index, index + 20).map(getCourseByCode));
          if (cancelled) return;
          setLoadedCourses(previous => {
            const next = new Map(previous);
            batch.forEach(course => { if (course) next.set(course.code, course); });
            return next;
          });
        }
      } catch {
        if (!cancelled) setError('Course options could not be loaded. Close this branch and try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activeId, optionKey]);

  // Every reason a course can't be chosen this term, most important first.
  function unavailableReason(course: Course | undefined): string | null {
    if (!course) return 'Loading course details';
    const reasons: string[] = [];
    if (course.hasSections === false || !course.terms?.includes(activeTerm)) {
      const otherTerms = getRegistrationTerms().map(term => term.code).filter(code => code !== activeTerm && course.terms?.includes(code));
      reasons.push(otherTerms.length > 0
        ? `Not offered in ${getTermLabel(activeTerm)}. Offered in ${otherTerms.map(getTermLabel).join(' and ')}`
        : `No sections in ${getTermLabel(activeTerm)}`);
    }
    const validation = validatePrerequisitesFromTree(course.prerequisiteExpression, course.prerequisiteTree || [], {
      completedCourses: Array.from(completed), plannedCourses: priorScheduledCourses, courseGrades, currentYear: 'FOURTH_YEAR', hasSpecialPermission: false,
    });
    reasons.push(...describePrerequisiteIssues(validation));
    return reasons.length > 0 ? reasons.join(' · ') : null;
  }

  const rows = codesToLoad.map(code => ({
    code,
    course: details.get(code),
    reason: plannedInOtherTerms[code] ? `Already selected for ${getTermLabel(plannedInOtherTerms[code])}` : unavailableReason(details.get(code)),
    canOverride: Boolean(details.get(code)?.terms?.includes(activeTerm) && !plannedInOtherTerms[code] && !completed.has(code) && !enrolled.has(code)),
    plannedPrerequisites: validatePrerequisitesFromTree(details.get(code)?.prerequisiteExpression, details.get(code)?.prerequisiteTree || [], { completedCourses: Array.from(completed), plannedCourses: priorScheduledCourses, courseGrades, currentYear: 'FOURTH_YEAR', hasSpecialPermission: false }).plannedPrerequisites || [],
  }));
  const availableCount = rows.filter(row => !row.reason).length;
  const filteredRows = rows.filter(row => {
    const chosen = (choices[activeId || ''] || []).includes(row.code) && selectedCourses.includes(row.code);
    return showUnavailable || !row.reason || chosen;
  }).sort((a, b) => Number(Boolean(a.reason)) - Number(Boolean(b.reason)) || a.code.localeCompare(b.code));

  const groupedNodes = groupNodes(nodes);
  const yearGroups = groupedNodes.filter(item => !item.nodes.every(node => node.elective));
  const electiveGroups = groupedNodes.filter(item => item.nodes.every(node => node.elective));

  async function choose(node: RequirementNode, code: string) {
    if (busyCode) return;
    setBusyCode(code);
    setError(null);
    try { await onChoose(node.id, code); }
    catch { setError('This course could not be added. Please try again.'); }
    finally { setBusyCode(null); }
  }

  const openElectiveDialog = (node: RequirementNode) => {
    const included = selectedCourses.filter(code => getElectiveTokenCategory(code) === node.elective?.category).length;
    const remaining = node.elective
      ? getElectiveSlotCount(node.elective) - (otherTermElectiveCounts[node.elective.category]?.count || 0)
      : 1;
    setElectiveCourseCount(Math.max(1, Math.min(included || 1, remaining)));
    setConfirmingElective(node);
  };

  const renderRequirement = (node: RequirementNode) => {
    const chosen = node.elective
      ? selectedCourses.filter(code => getElectiveTokenCategory(code) === node.elective?.category)
      : (choices[node.id] || []).filter(code => selectedCourses.includes(code) && node.options.includes(code));
    const plannedCredits = node.elective ? chosen.length * getSelectionUnitCredits(node.elective) : chosen.reduce((sum, code) => sum + (details.get(code)?.credits || 0), 0);
    const expanded = activeId === node.id;
    const otherTermNote = node.elective
      ? otherTermElectiveCounts[node.elective.category] && `${otherTermElectiveCounts[node.elective.category].count * getSelectionUnitCredits(node.elective)} credits selected for ${getTermLabel(otherTermElectiveCounts[node.elective.category].term)}`
      : (() => {
        const planned = node.options.filter(code => plannedInOtherTerms[code]);
        return planned.length > 0 && `${planned.join(', ')} selected for ${getTermLabel(plannedInOtherTerms[planned[0]])}`;
      })();

    return (
      <li className={`degree-branch requirement-node${chosen.length ? ' has-choices' : ''}`} key={node.id}>
        <button
          className="requirement-node-button"
          onClick={() => node.elective ? openElectiveDialog(node) : setActiveId(expanded ? null : node.id)}
          aria-haspopup={node.elective ? 'dialog' : undefined}
          aria-expanded={node.elective ? undefined : expanded}
          aria-controls={node.elective ? undefined : `options-${node.id}`}
        >
          <span className="degree-node-icon">{chosen.length ? <Plus size={15} /> : <Circle size={15} />}</span>
          <span className="requirement-node-copy">
            <span className="course-title-row"><strong>{node.label}</strong>{node.options.length === 1 && !node.elective && <HalfTermCourseTag code={node.options[0]} credits={details.get(node.options[0])?.credits} />}</span>
            <span>
              {node.creditsNeeded > 0 ? `${node.creditsNeeded} credits still needed` : 'Requirement recorded in your audit'}
              {node.elective
                ? chosen.length > 0 ? ` · ${plannedCredits} credits included; choose courses in schedules` : ' · Include for this term'
                : chosen.length > 0 ? ` · ${chosen.length} chosen for your plan` : ''}
            </span>
            {otherTermNote && <span className="planned-other-term">{otherTermNote}</span>}
          </span>
          <ChevronRight size={16} className={expanded ? 'is-expanded' : ''} />
        </button>
        {expanded && !node.elective && (
          <div className="requirement-options" id={`options-${node.id}`}>
            <div className="requirement-options-heading"><strong>Choose your courses</strong><span>{getTermLabel(activeTerm)}</span></div>
            {chosen.length > 0 && <p className="requirement-choice-note"><Check size={13} /> {plannedCredits} credits in your plan for this branch.</p>}
            {isLoading && <p className="requirement-loading" role="status"><Loader2 size={15} className="animate-spin" /> Finding your available options…</p>}
            {!isLoading && (
              <>
                {rows.length > 0 && (
                  <label className="requirement-unavailable-toggle">
                    <input type="checkbox" checked={showUnavailable} onChange={event => setShowUnavailable(event.target.checked)} />Show unavailable
                    <span>{availableCount} available</span>
                  </label>
                )}
                <div className="requirement-option-list">
                    {filteredRows.map(({ code, course, reason, canOverride, plannedPrerequisites }) => {
                    const isChosen = chosen.includes(code);
                    return (
                      <button
                        key={code}
                        className={`requirement-option${isChosen ? ' is-chosen' : ''}`}
                        aria-label={`${isChosen ? 'Remove' : 'Choose'} ${code} for ${node.label}`}
                        aria-pressed={isChosen}
                        disabled={Boolean(busyCode) || Boolean(reason && !isChosen && !canOverride)}
                        onClick={() => isChosen ? onUnchoose(node.id, code) : choose(node, code)}
                      >
                        <span className="requirement-option-copy">
                          <span className="course-title-row"><strong>{code}</strong><HalfTermCourseTag code={code} credits={course?.credits} />{prerequisiteOverrides.includes(code) && <span className="prerequisite-override-badge" title="Prerequisite override · planning only">Override</span>}</span>
                          <span>{course?.name !== code ? course?.name : ''}</span>
                          {reason
                            ? <small className="requirement-option-reason"><AlertCircle size={12} />{reason}</small>
                            : <small>{`${course?.credits || 0} credits · ${plannedPrerequisites.length ? `Prerequisites planned earlier: ${plannedPrerequisites.join(', ')}` : 'Prerequisites met'}`}</small>}
                        </span>
                        <span className="requirement-option-action">
                          {busyCode === code ? <Loader2 size={16} className="animate-spin" /> : isChosen ? <Minus size={16} /> : reason && !canOverride ? <Lock size={14} /> : <Plus size={16} />}
                          {isChosen ? 'Remove' : reason ? canOverride ? 'Plan anyway' : 'Unavailable' : selectedCourses.includes(code) ? 'Use in this branch' : 'Choose'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {filteredRows.length === 0 && <p className="requirement-no-options">{rows.length > 0 ? 'No eligible courses are loaded for this term. Show unavailable to see why.' : 'No course options remain in this branch.'}</p>}
              </>
            )}
            {error && <p className="inline-error" role="alert">{error}</p>}
          </div>
        )}
      </li>
    );
  };

  return (
    <section className="glass-panel audit-degree-tree" aria-labelledby="degree-tree-heading">
      <div className="degree-root">
        <span className="degree-root-icon"><GraduationCap size={23} /></span>
        <div><h2 id="degree-tree-heading">{electivesOnly ? 'Your elective requirements' : 'Your degree map'}</h2><p>{program || 'Academic audit'} · {getTermLabel(activeTerm)}</p></div>
      </div>
      <div className="degree-legend"><span><Check size={12} /> Completed</span><span><Clock3 size={12} /> In progress</span><span><Circle size={12} /> Still to choose</span><span><Plus size={12} /> In your plan</span></div>
      <ul className="degree-root-branches" aria-label="Academic audit requirements">
        <li className="degree-branch degree-unmet">
          <details open>
            <summary><span className="degree-node-icon"><Circle size={16} /></span><strong>Still to meet</strong><span className="degree-node-note">Organized by year</span></summary>
            <ul className="degree-children degree-requirement-list">
              {loadingTermCourses && !electivesOnly && <li className="degree-empty-note" role="status"><Loader2 size={16} className="animate-spin" /> Loading {getTermLabel(activeTerm)} course offerings…</li>}
              {yearGroups.map(({ group, nodes: groupNodeList }) => (
                <li className="degree-year-group" key={group}>
                  <details>
                    <summary className="degree-year-heading"><span>{group}</span><span>{groupNodeList.length} {groupNodeList.length === 1 ? 'item' : 'items'}</span></summary>
                    <ul className="degree-year-list">{groupNodeList.map(renderRequirement)}</ul>
                  </details>
                </li>
              ))}
              {yearGroups.length > 0 && electiveGroups.length > 0 && <li className="degree-year-divider" aria-hidden="true" />}
              {electiveGroups.map(({ group, nodes: groupNodeList }) => (
                <li className="degree-year-group" key={`electives-${group}`}>
                  <details>
                    <summary className="degree-year-heading"><span>{group}</span><span>{groupNodeList.length} {groupNodeList.length === 1 ? 'item' : 'items'}</span></summary>
                    <ul className="degree-year-list">{groupNodeList.map(renderRequirement)}</ul>
                  </details>
                </li>
              ))}
              {nodes.length === 0 && !loadingTermCourses && <li className="degree-empty-note"><Check size={16} /> {electivesOnly ? 'Your audit has no remaining elective requirements.' : `No remaining audit course options are offered in ${getTermLabel(activeTerm)}.`}</li>}
            </ul>
          </details>
        </li>
        {!electivesOnly && currentCourses.length > 0 && <li className="degree-branch degree-in-progress"><details><summary><span className="degree-node-icon"><Clock3 size={16} /></span><strong>In progress</strong><span className="degree-node-note">{currentCourses.length} courses</span></summary><ul className="degree-course-leaves">{currentCourses.map(course => <li key={course.courseId}><Clock3 size={12} /><span>{normalizeCode(course.courseId)}</span></li>)}</ul></details></li>}
        {!electivesOnly && <CompletedBranch courses={completedCourses} grades={courseGrades} />}
      </ul>
      <Dialog open={Boolean(confirmingElective)} onOpenChange={open => { if (!open) setConfirmingElective(null); }}>
        <DialogContent className="scheduler-popover elective-confirm-dialog">
          <DialogTitle>Include this elective in your term?</DialogTitle>
          <DialogDescription>Confirm the elective requirement now. You'll choose the specific courses alongside your generated schedules.</DialogDescription>
          {confirmingElective?.elective && (() => {
            const elective = confirmingElective.elective;
            const unitCredits = getSelectionUnitCredits(elective);
            const otherTerm = otherTermElectiveCounts[elective.category];
            const maxCourses = Math.max(0, getElectiveSlotCount(elective) - (otherTerm?.count || 0));
            const includedCount = selectedCourses.filter(code => getElectiveTokenCategory(code) === elective.category).length;
            return (
            <>
              <div className="elective-confirm-summary"><BookOpen size={22} /><div><strong>{confirmingElective.label}</strong><span>{confirmingElective.creditsNeeded} credits still needed · {getTermLabel(activeTerm)}</span></div></div>
              {otherTerm && (
                <p className="planned-other-term">
                  {otherTerm.count * unitCredits} credits already selected for {getTermLabel(otherTerm.term)}.{maxCourses === 0 ? ' Nothing is left to plan for this requirement.' : ''}
                </p>
              )}
              {maxCourses > 1 && (
                <div className="elective-count-picker">
                  <div><strong>Courses this term</strong><span>{electiveCourseCount * unitCredits} of {confirmingElective.creditsNeeded} credits · {unitCredits} credits each</span></div>
                  <div className="elective-count-stepper">
                    <Button variant="outline" size="icon" aria-label="Fewer courses" disabled={electiveCourseCount <= 1} onClick={() => setElectiveCourseCount(count => count - 1)}><Minus size={14} /></Button>
                    <output aria-live="polite">{electiveCourseCount}</output>
                    <Button variant="outline" size="icon" aria-label="More courses" disabled={electiveCourseCount >= maxCourses} onClick={() => setElectiveCourseCount(count => count + 1)}><Plus size={14} /></Button>
                  </div>
                </div>
              )}
              <div className="elective-confirm-actions">
                <Button variant="ghost" onClick={() => setConfirmingElective(null)}>Cancel</Button>
                {includedCount > 0 && <Button variant="outline" onClick={() => { onRemoveElective(elective.category); setConfirmingElective(null); }}>Remove elective</Button>}
                <Button disabled={maxCourses === 0 && includedCount === 0} onClick={() => { onIncludeElective(confirmingElective.id, elective, electiveCourseCount); setConfirmingElective(null); }}>{includedCount === 0 ? 'Include elective' : includedCount === electiveCourseCount ? 'Keep elective' : 'Update elective'}</Button>
              </div>
            </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </section>
  );
}
