import { useEffect, useRef, type FocusEvent, type MouseEvent } from 'react';
import { Loader2, AlertTriangle, Check, X, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import type { ConflictSectionSummary, CourseConflictReport, ScheduleHoverPreview } from '../../utils/scheduleGenerator';
import { getTermLabel } from '../../utils/termUtils';
import { sectionRequirements } from '../../utils/sectionRequirements';
import { CourseTermTags } from './CourseTermTags';
import { HalfTermCourseTag } from '../HalfTermCourseTag';
import type { UnmetCourseCategory } from '@shared/conflict-eligibility';

const readableTime = (time: string) => time.includes(':') ? time : `${time.padStart(4, '0').slice(0, 2)}:${time.padStart(4, '0').slice(2)}`;
const sectionTimes = (section: ConflictSectionSummary) => section.timeSlots.length
  ? section.timeSlots.map(slot => `${slot.day} ${readableTime(slot.startTime)}–${readableTime(slot.endTime)}`).join(' · ')
  : section.deliveryMode === 'ONLINE_ASYNC' ? 'Online, on your own time' : 'No fixed meeting times';

function fittingOptions(candidate: CourseConflictReport['courses'][number]) {
  if (candidate.lectureBundles?.length) return candidate.lectureBundles;
  const bundles = new Map<string, ConflictSectionSummary[]>();
  for (const bundle of [...(candidate.fittingBundles || []), ...(candidate.sections || []).flatMap(section => section.fittingBundle ? [section.fittingBundle] : [])]) {
    const key = bundle.map(section => section.id).sort().join('|');
    bundles.set(key, bundle);
  }
  return Array.from(bundles.values());
}

export function CourseConflictDialog({ course, report: receivedReport, scopeCategories, loading, error, term, onClose, onPreview, onDeselect, busy }: {
  course: string | null;
  report: CourseConflictReport | null;
  scopeCategories: UnmetCourseCategory[];
  loading: boolean;
  error: string | null;
  term: string;
  onClose: () => void;
  onPreview: (preview: ScheduleHoverPreview | null) => void;
  onDeselect: (course: string) => void;
  busy: boolean;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!course) return;
    returnFocus.current = document.activeElement as HTMLElement;
    heading.current?.focus({ preventScroll: true });
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', escape);
    return () => { window.removeEventListener('keydown', escape); if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true }); };
  }, [course]);

  const allowed = new Map(scopeCategories.map(category => [category.id, new Set(category.courseOptions)]));
  const report = receivedReport && receivedReport.courseId === course ? {
    ...receivedReport,
    categories: receivedReport.categories.filter(category => allowed.has(category.id)),
    courses: receivedReport.courses.flatMap(candidate => {
      const categories = (candidate.categories || []).filter(category => allowed.get(category.id)?.has(candidate.courseId));
      return categories.length ? [{ ...candidate, categories }] : [];
    }),
  } : null;
  const blocked = report?.courses.filter(candidate => !candidate.hasConflictFreeOption).length || 0;
  const groups = new Map<string, { label: string; categoryIds: string[] }>();
  for (const category of scopeCategories) {
    const required = category.id.startsWith('audit:') || category.id === 'required-courses';
    const id = required ? 'required-courses' : category.id;
    const group = groups.get(id) || { label: required ? 'Required classes' : category.label, categoryIds: [] };
    group.categoryIds.push(category.id);
    groups.set(id, group);
  }

  function previewHandlers(preview: ScheduleHoverPreview) {
    return {
      onMouseEnter: () => onPreview(preview),
      onMouseLeave: (event: MouseEvent<HTMLButtonElement>) => { if (document.activeElement !== event.currentTarget) onPreview(null); },
      onFocus: () => onPreview(preview),
      onBlur: (event: FocusEvent<HTMLButtonElement>) => { if (!event.currentTarget.matches(':hover')) onPreview(null); },
      onClick: () => onPreview(preview),
    };
  }

  if (!course) return null;
  return <aside className="glass-panel course-conflict-panel" aria-label="Course section alternatives">
    <header className="conflict-panel-heading"><h2 ref={heading} tabIndex={-1}>Options around {course}</h2><Button variant="ghost" size="icon" aria-label="Close course inspection" onClick={onClose}><X size={17} /></Button></header>
    <Button variant="outline" size="sm" className="conflict-deselect-course" disabled={busy} aria-label={`Deselect ${course}`} onClick={() => { onPreview(null); onDeselect(course); }}>Deselect {course}</Button>
    <p className="conflict-panel-description">{getTermLabel(term)} · Hover or focus a section to preview its meetings on the calendar.</p>
    {groups.size > 0 && <p className="conflict-active-scope">Comparing: {Array.from(groups.values(), group => group.label).join(', ')}</p>}
    {loading && <p className="conflict-inspection-loading" role="status"><Loader2 size={18} className="animate-spin" /> Checking section combinations…</p>}
    {error && <p className="inline-error" role="alert">{error}</p>}
    {!loading && report && <>
      <div className="conflict-status-groups" key={course}>
        {[false, true].map(fits => {
          const count = fits ? report.courses.length - blocked : blocked;
          return <details key={String(fits)} className={`conflict-status-group${fits ? ' has-alternatives' : ' blocked'}`} onToggle={() => onPreview(null)}>
            <summary>{fits ? <Check size={14} /> : <AlertTriangle size={14} />}<strong>{fits ? 'Some options still fit' : 'No options fit'}</strong><span>{count} {count === 1 ? 'course' : 'courses'}</span></summary>
            <p className="conflict-panel-description">These courses meet the prerequisite checks for your plan and belong to your selected requirements. {fits ? 'Some sections conflict, but these courses still have a complete combination that fits your timetable.' : 'These courses have no complete lecture/lab/tutorial combination that fits your timetable.'}</p>
      <div className="conflict-requirement-groups">
        {Array.from(groups, ([id, group]) => {
          const candidates = report.courses.filter(candidate => candidate.hasConflictFreeOption === fits && candidate.categories.some(category => group.categoryIds.includes(category.id)));
          if (!candidates.length) return null;
          return <details key={id} className="conflict-requirement-group" onToggle={() => onPreview(null)}>
            <summary><strong>{group.label}</strong><span>{candidates.length} {candidates.length === 1 ? 'course' : 'courses'}</span></summary>
      <ul className="conflict-course-list">
        {candidates.map(candidate => {
          const options = fittingOptions(candidate);
          const lectures = new Map<string, { sections: ConflictSectionSummary[]; options: typeof options }>();
          for (const bundle of options) {
            const sections = bundle.filter(section => section.sectionType === 'LEC');
            const key = sections.map(section => section.id).sort().join('|') || 'no-lecture';
            const lecture = lectures.get(key) || { sections, options: [] };
            lecture.options.push(bundle);
            lectures.set(key, lecture);
          }
           return <li key={candidate.courseId} className="course-has-term-tags">
           <CourseTermTags code={candidate.courseId} activeTerm={term} requiredTypes={candidate.sections.map(section => section.sectionType)} />
          <details onToggle={() => onPreview(null)}>
            <summary><div><div className="course-title-row"><strong>{candidate.courseId}</strong><HalfTermCourseTag code={candidate.courseId} /></div><span>{candidate.name}</span><span>{sectionRequirements(candidate.sections.map(section => section.sectionType))}</span></div><span className={`conflict-course-status${candidate.hasConflictFreeOption ? ' has-alternative' : ''}`}>{candidate.hasConflictFreeOption ? 'Alternatives fit' : 'No complete fit'}</span></summary>
            {!candidate.hasConflictFreeOption && <div className="conflict-section-options">
              <h3>Sections and meeting times</h3>
              {(candidate.sections || []).map(section => {
                const conflicts = section.conflictingTimeSlots.length > 0;
                const fits = Boolean(section.fittingBundle);
                const preview = { courseId: candidate.courseId, name: candidate.name, sections: section.fittingBundle || [section], fits };
                return <button key={section.id} className={`conflict-section-option${fits ? ' fits' : ' conflicts'}`} aria-label={`Preview ${candidate.courseId} ${section.sectionType} ${section.sectionCode}`} {...previewHandlers(preview)}>
                  <span className="conflict-section-option-heading"><strong>{section.sectionType} {section.sectionCode}</strong><small>{conflicts ? 'Overlaps' : 'No complete fit'}</small></span>
                  {section.timeSlots.length ? section.timeSlots.map((slot, index) => {
                    const overlap = section.conflictingTimeSlots.some(other => other.day === slot.day && other.startTime === slot.startTime && other.endTime === slot.endTime);
                    return <span key={index} className={`conflict-meeting-time${overlap ? ' overlaps' : ''}`}>{slot.day} {readableTime(slot.startTime)}–{readableTime(slot.endTime)}{overlap && ' · conflict'}</span>;
                  }) : <span className="conflict-meeting-time">{sectionTimes(section)}</span>}
                  {section.crn && <span className="conflict-section-crn">CRN {section.crn}</span>}
                </button>;
              })}
            </div>}
            {options.length > 0 && <div className="conflict-fitting-bundles"><h3>Lecture sections that fit your schedule</h3>
              {Array.from(lectures, ([key, lecture]) => {
                const labCount = new Set(lecture.options.flatMap(bundle => bundle.filter(section => section.sectionType === 'LAB').map(section => section.id))).size;
                return <details key={key} className="conflict-lecture-group" onToggle={() => onPreview(null)}>
                  <summary><strong>{lecture.sections.map(section => `LEC ${section.sectionCode}`).join(' + ') || 'Section options'}</strong><span>{labCount ? `${labCount} available ${labCount === 1 ? 'lab' : 'labs'}` : `${lecture.options.length} ${lecture.options.length === 1 ? 'option' : 'options'}`}</span></summary>
                  {lecture.sections.map(section => <p key={section.id} className="conflict-meeting-time">{sectionTimes(section)}</p>)}
                  <div className="conflict-lab-options">
                    {lecture.options.map(bundle => <button key={bundle.map(section => section.id).join('|')} className="conflict-bundle-preview" aria-label={`Preview fitting combination ${options.indexOf(bundle) + 1} for ${candidate.courseId}`} {...previewHandlers({ courseId: candidate.courseId, name: candidate.name, sections: bundle, fits: true })}>
                      <span className="conflict-bundle-preview-heading"><Check size={13} /> {bundle.filter(section => section.sectionType !== 'LEC').map(section => `${section.sectionType} ${section.sectionCode}`).join(' + ') || 'Lecture only'} <Eye size={13} /></span>
                      {bundle.filter(section => section.sectionType !== 'LEC').map(section => <span key={section.id} className="conflict-bundle-section"><strong>{section.sectionType} {section.sectionCode}</strong><span>{sectionTimes(section)}</span></span>)}
                    </button>)}
                  </div>
                </details>;
              })}
            </div>}
          </details>
        </li>;
        })}
      </ul>
            {!candidates.length && <p className="conflict-inspection-empty">No eligible courses in this group overlap these meetings.</p>}
          </details>;
        })}
      </div>
            {!count && <p className="conflict-inspection-empty">No courses in this group.</p>}
          </details>;
        })}
      </div>
      {!report.courses.length && <p className="conflict-inspection-empty">{!report.hasFixedMeetings ? 'This course has no fixed meeting times, so it has no timetable conflicts.' : !report.hasAuditData ? 'Import an audit to compare options in your unmet requirements.' : !report.categories.length ? 'Include a requirement in Courses to compare its options.' : 'No eligible options in your selected categories overlap these meetings.'}</p>}
    </>}
  </aside>;
}
