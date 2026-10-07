import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { AlertTriangle, Check, ChevronDown, ChevronLeft, ChevronRight, Copy, Laptop, Loader2, Search } from 'lucide-react';
import { COURSE_COLORS, TIMETABLE_CONFIG } from '../../config/constants';
import { hasTimeConflict, type GeneratedSchedule, type ScheduleHoverPreview } from '../../utils/scheduleGenerator';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { getTermLabel } from '../../utils/termUtils';
import { DELIVERY_LABELS, isOnlineMode, type DeliveryMode } from '../../utils/deliveryMode';
import { sectionRequirements } from '../../utils/sectionRequirements';
import { CourseTermTags } from './CourseTermTags';
import { HalfTermCourseTag } from '../HalfTermCourseTag';

interface ElectiveCourseInfo {
  prerequisiteOverride?: boolean;
  code: string;
  name: string;
  credits: number;
  status: 'available' | 'tba' | 'conflicting' | 'prereq' | 'planned';
  prerequisites: string[];
  missingPrerequisites: string[];
  blocks: string[];
  deliveryModes: DeliveryMode[];
  sectionTypes: string[];
  plannedTerm?: string;
}

export function ElectiveCourseCard({
  elective,
  category,
  isSelected,
  isSwapping,
  onToggle,
  busy = false,
  activeTerm,
}: {
  elective: ElectiveCourseInfo;
  category: string;
  isSelected: boolean;
  isSwapping: boolean;
  onToggle: (category: string, code: string, credits: number) => void;
  busy?: boolean;
  activeTerm: string;
}) {
  const isAvailable = elective.status !== 'conflicting' && elective.status !== 'planned';
  const statusLabel = elective.status === 'planned' && elective.plannedTerm
    ? `Already selected for ${getTermLabel(elective.plannedTerm)}`
    : elective.status === 'conflicting'
    ? "Doesn't fit your courses"
    : elective.status === 'prereq'
      ? elective.missingPrerequisites.length > 0 ? elective.missingPrerequisites.join(' · ') : 'Prerequisites not met'
      : elective.status === 'tba'
        ? 'Timing TBA'
      : null;

  return (
    <button
      onClick={() => isAvailable && onToggle(category, elective.code, elective.credits)}
      disabled={!isAvailable || isSwapping || busy}
      style={{
        position: 'relative',
        textAlign: 'left',
        padding: '30px 12px 10px',
        borderRadius: '8px',
        border: isSelected ? '2px solid var(--primary-border)' : '1px solid var(--border)',
        background: isSelected ? 'var(--primary-soft)' : 'var(--surface)',
        opacity: isAvailable ? 1 : 0.5,
        cursor: isAvailable ? 'pointer' : 'not-allowed',
        width: '100%',
        transition: 'all 0.15s',
      }}
    >
      <CourseTermTags code={elective.code} activeTerm={activeTerm} requiredTypes={elective.sectionTypes} />
      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '6px' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3, margin: 0 }}>
            {elective.code}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '2px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {elective.name}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
            {sectionRequirements(elective.sectionTypes)}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
            {elective.credits} cr
            {elective.prerequisiteOverride && <> · <span className="prerequisite-override-badge" title="Prerequisite override · planning only">Override</span></>}
            {' '}<HalfTermCourseTag code={elective.code} credits={elective.credits} />
            {elective.deliveryModes.includes('ONLINE_ASYNC')
              ? <span className="delivery-tag is-online"><Laptop size={10} /> On your own time</span>
              : elective.deliveryModes.includes('ONLINE_SYNC')
                ? <span className="delivery-tag is-online"><Laptop size={10} /> Online</span>
                : elective.deliveryModes.includes('HYBRID') && <span className="delivery-tag">Hybrid</span>}
          </p>
        </div>
        {isSelected && (
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Check style={{ width: '12px', height: '12px', color: '#fff' }} />
          </div>
        )}
        {isSwapping && <Loader2 style={{ width: '16px', height: '16px', color: 'var(--muted-foreground)', flexShrink: 0 }} className="animate-spin" />}
      </div>
      {statusLabel && (
        <p style={{ marginTop: '4px', fontSize: '11px', color: 'var(--muted-foreground)', margin: '4px 0 0 0' }}>
          {statusLabel}
        </p>
      )}
      {!isSelected && isAvailable && elective.blocks.length > 0 && (
        <span className="elective-blocks-badge" title={`Rules out ${elective.blocks.join(', ')}`}>
          <AlertTriangle size={11} /> Blocks {elective.blocks.length}
        </span>
      )}
    </button>
  );
}

export function ElectiveBlockDialog({
  pending,
  details,
  nextPickThisTerm,
  onCancel,
  onConfirm,
}: {
  pending: { category: string; code: string } | null;
  details: ElectiveCourseInfo[];
  nextPickThisTerm: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const elective = pending ? details.find(item => item.code === pending.code) : undefined;
  const blocked = elective ? details.filter(item => elective.blocks.includes(item.code.toUpperCase()) || elective.blocks.includes(item.code)) : [];
  const fittingOptions = details.filter(item => item.status !== 'conflicting' && item.code !== elective?.code);
  const stillFit = fittingOptions.length - blocked.length;

  return (
    <Dialog open={Boolean(elective)} onOpenChange={open => { if (!open) onCancel(); }}>
      <DialogContent className="scheduler-popover elective-confirm-dialog">
        <DialogTitle>Add {elective?.code}?</DialogTitle>
        <DialogDescription>
          {nextPickThisTerm
            ? `This rules out ${blocked.length} ${blocked.length === 1 ? 'elective' : 'electives'} for your next elective this term:`
            : `If you add another elective later, ${blocked.length === 1 ? 'this one' : `these ${blocked.length}`} won't fit with ${elective?.code}:`}
        </DialogDescription>
        <ul className="elective-blocked-list">
          {blocked.map(item => <li key={item.code}><strong>{item.code}</strong><span>{item.name}</span></li>)}
        </ul>
        <p className="elective-blocked-summary">{stillFit} of {fittingOptions.length} other options will still fit.</p>
        <div className="elective-confirm-actions">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm}>Add anyway</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ScheduleCalendarSection({
  schedules,
  currentIndex,
  currentSchedule,
  visibleTimeSlots,
  hourPx,
  getPos,
  onBack,
  onPrevious,
  onNext,
  onSelectSchedule,
  onInspectCourse,
  hoverPreview,
}: {
  schedules: GeneratedSchedule[];
  currentIndex: number;
  currentSchedule: GeneratedSchedule;
  visibleTimeSlots: string[];
  hourPx: number;
  getPos: (startTime: string, endTime: string) => { top: number; height: number };
  onBack: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSelectSchedule: (index: number) => void;
  onInspectCourse: (course: string) => void;
  hoverPreview?: ScheduleHoverPreview | null;
}) {
  const calendar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hoverPreview || !calendar.current) return;
    const slots = hoverPreview.sections.flatMap(section => section.timeSlots);
    if (!slots.length) return;
    const minutes = (time: string) => Number(time.replace(':', '').padStart(4, '0').slice(0, 2)) * 60 + Number(time.replace(':', '').padStart(4, '0').slice(2));
    const start = Number(visibleTimeSlots[0].slice(0, 2)) * 60;
    const bounds = calendar.current.getBoundingClientRect();
    // Keep the scrollable area inside the viewport so later meetings can be
    // brought into view even when the course controls take up several rows.
    const viewportHeight = Math.max(320, window.innerHeight - bounds.top - 16);
    calendar.current.style.maxHeight = `${viewportHeight}px`;
    const grid = calendar.current.querySelector('.calendar-time-grid');
    const headerHeight = calendar.current.querySelector('.calendar-day-header')?.getBoundingClientRect().height || 48;
    const offset = grid ? grid.getBoundingClientRect().top - bounds.top + calendar.current.scrollTop : 68;
    const top = ((Math.min(...slots.map(slot => minutes(slot.startTime))) - start) / 60) * hourPx + offset;
    const bottom = ((Math.max(...slots.map(slot => minutes(slot.endTime))) - start) / 60) * hourPx + offset;
    const visibleHeight = Math.max(120, Math.min(calendar.current.clientHeight, window.innerHeight - bounds.top));
    const lower = Math.max(0, bottom - visibleHeight + 16);
    const upper = Math.max(0, top - headerHeight - 16);
    calendar.current.scrollTop = lower <= upper ? Math.max(lower, Math.min(upper, calendar.current.scrollTop)) : upper;
    return () => { if (calendar.current) calendar.current.style.maxHeight = ''; };
  }, [hoverPreview, visibleTimeSlots.join('|'), hourPx]);
  const groupedCourses = new Map<string, typeof currentSchedule.selections>();
  currentSchedule.selections.forEach(selection => {
    if (!groupedCourses.has(selection.courseCode)) groupedCourses.set(selection.courseCode, []);
    groupedCourses.get(selection.courseCode)!.push(selection);
  });

  const courseColorMap = new Map<string, typeof COURSE_COLORS[number]>();
  Array.from(groupedCourses.keys()).forEach((code, idx) => {
    courseColorMap.set(code, COURSE_COLORS[idx % COURSE_COLORS.length]);
  });

  const asyncSelections = currentSchedule.selections.filter(selection => selection.section.deliveryMode === 'ONLINE_ASYNC');
  const previewSlots = hoverPreview?.sections.flatMap(section => section.timeSlots) || [];
  const overlappingCourses = Array.from(new Set(currentSchedule.selections.filter(selection => selection.section.timeSlots.some(slot => previewSlots.some(previewSlot => hasTimeConflict(slot, previewSlot)))).map(selection => selection.courseCode)));

  return (
    <section className="schedule-calendar" aria-label="Weekly timetable">
      {hoverPreview && <p className={`schedule-preview-label${hoverPreview.fits ? ' fits' : ' conflicts'}`} role="status">Preview: {hoverPreview.courseId} · {hoverPreview.sections.map(section => `${section.sectionType} ${section.sectionCode}`).join(' + ')} · {hoverPreview.fits ? 'Complete combination fits' : overlappingCourses.length ? `Overlaps ${overlappingCourses.join(', ')}` : 'No complete fit'}</p>}

      <div className="glass-panel calendar-scroll" ref={calendar}>
        <div style={{ minWidth: '480px' }}>
          <div className="calendar-day-header" style={{ display: 'grid', gridTemplateColumns: '50px repeat(5, 1fr)', gap: '2px', marginBottom: '2px' }}>
            <div />
            {TIMETABLE_CONFIG.DAYS.map(day => (
              <div key={day} style={{ fontSize: '12px', fontWeight: 800, color: 'var(--foreground)', padding: '12px 0', textAlign: 'center', background: 'var(--surface)', borderRadius: '8px' }}>
                {day.slice(0, 3)}
              </div>
            ))}
          </div>

          <div className="calendar-time-grid" style={{ display: 'grid', gridTemplateColumns: '50px repeat(5, 1fr)', gap: '2px' }}>
            <div>
              {visibleTimeSlots.map(time => (
                <div key={time} style={{ height: `${hourPx}px`, fontSize: '11px', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingTop: '2px', paddingRight: '8px' }}>
                  {time}
                </div>
              ))}
            </div>

            {TIMETABLE_CONFIG.DAYS.map(day => (
              <div key={day} style={{ position: 'relative', background: 'var(--surface)', borderRadius: '8px', height: `${visibleTimeSlots.length * hourPx}px` }}>
                {visibleTimeSlots.map((_, idx) => (
                  <div key={idx} style={{ position: 'absolute', left: 0, right: 0, top: `${idx * hourPx}px`, borderTop: '1px solid var(--border)' }} />
                ))}

                {currentSchedule.selections.map(selection => {
                  const colors = courseColorMap.get(selection.courseCode) || COURSE_COLORS[0];
                  return selection.section.timeSlots
                    .filter(slot => slot.day === day)
                    .map((slot, slotIdx) => {
                      const { top, height } = getPos(slot.startTime, slot.endTime);
                      const previewOverlap = previewSlots.some(previewSlot => hasTimeConflict(slot, previewSlot));
                      return (
                        <button
                          className={`schedule-event${isOnlineMode(selection.section.deliveryMode) ? ' is-online' : ''}${selection.section.deliveryMode === 'HYBRID' ? ' is-hybrid' : ''}${previewOverlap ? ' preview-overlap' : ''}`}
                          type="button"
                          aria-label={`Inspect conflicts for ${selection.courseCode}, ${selection.section.type} ${selection.section.sectionCode}, ${day} ${slot.startTime}`}
                          onClick={() => onInspectCourse(selection.courseCode)}
                          title={`${selection.courseCode} · ${selection.section.type} ${selection.section.sectionCode} · ${slot.startTime}–${slot.endTime} · CRN ${selection.section.crn}`}
                          key={`${selection.courseCode}-${selection.section.sectionCode}-${slotIdx}`}
                          style={{
                            position: 'absolute',
                            left: '2px',
                            right: previewOverlap ? '50%' : '2px',
                            top: `${top}px`,
                            height: `${height}px`,
                            background: colors.bg,
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                            borderRadius: '6px',
                            padding: '4px 6px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            textAlign: 'left',
                          }}
                        >
                          <p style={{ fontSize: '12px', fontWeight: 700, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                            {selection.courseCode}
                          </p>
                          <p style={{ fontSize: '11px', opacity: 0.7, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                            {selection.section.type} {selection.section.sectionCode} · {slot.startTime}-{slot.endTime}
                          </p>
                          {selection.section.deliveryMode !== 'IN_PERSON' && (
                            <p className="schedule-event-mode">{selection.section.deliveryMode === 'HYBRID' ? 'Hybrid' : <><Laptop size={10} /> Online</>}</p>
                          )}
                        </button>
                      );
                    });
                })}
                {hoverPreview?.sections.flatMap(section => section.timeSlots.filter(slot => slot.day === day).map((slot, index) => {
                  const { top, height } = getPos(slot.startTime, slot.endTime);
                  const overlapsSchedule = currentSchedule.selections.some(selection => selection.section.timeSlots.some(meeting => hasTimeConflict(slot, meeting)));
                  const displayTime = (time: string) => time.includes(':') ? time : `${time.padStart(4, '0').slice(0, 2)}:${time.padStart(4, '0').slice(2)}`;
                  return <div key={`preview-${section.id}-${index}`} aria-hidden="true" className={`schedule-hover-event${hoverPreview.fits ? ' fits' : ' conflicts'}`} data-preview-course={hoverPreview.courseId} data-preview-section={section.sectionCode} style={{ top: `${top}px`, height: `${height}px`, left: overlapsSchedule ? '50%' : '2px' }}><strong>{hoverPreview.courseId}</strong><span>{section.sectionType} {section.sectionCode}</span><span>{displayTime(slot.startTime)}–{displayTime(slot.endTime)}</span></div>;
                }))}
              </div>
            ))}
          </div>
        </div>
      </div>
      {hoverPreview?.sections.some(section => section.timeSlots.length === 0) && <p className="preview-untimed-course">Preview: {hoverPreview.sections.filter(section => !section.timeSlots.length).map(section => `${hoverPreview.courseId} ${section.sectionType} ${section.sectionCode} · ${section.deliveryMode === 'ONLINE_ASYNC' ? 'Online, on your own time' : 'No fixed meeting time'}`).join(' · ')}</p>}

      {asyncSelections.length > 0 && (
        <div className="async-courses" aria-label="Online courses on your own time">
          <p><Laptop size={14} /> Online, on your own time</p>
          <ul>
            {asyncSelections.map(selection => {
              const colors = courseColorMap.get(selection.courseCode) || COURSE_COLORS[0];
                return <li key={`${selection.courseCode}-${selection.section.sectionCode}`} style={{ borderColor: colors.border, background: colors.bg, color: colors.text }}><button onClick={() => onInspectCourse(selection.courseCode)} aria-label={`Inspect conflicts for ${selection.courseCode}`}><strong>{selection.courseCode}</strong> {selection.section.type} {selection.section.sectionCode}</button></li>;
            })}
          </ul>
        </div>
      )}
      {!currentSchedule.selections.some(selection => selection.section.timeSlots.length > 0) && asyncSelections.length === 0 && <p className="timetable-note">{currentSchedule.selections.length ? 'These courses have no fixed meeting times. Their registration details appear beside the calendar.' : 'Your calendar starts empty. Add a course above or choose an elective to begin.'}</p>}
      <div className="calendar-controls calendar-controls-bottom">
        <Button variant="ghost" size="sm" onClick={onBack}><ChevronLeft size={16} /> Edit courses</Button>
        <div className="timetable-legend">
          {Array.from(courseColorMap.entries()).map(([code, colors]) => <span key={code}><i style={{ background: colors.border }} />{code}</span>)}
        </div>
        <div className="schedule-pagination">
          <Button variant="outline" size="icon" onClick={onPrevious} disabled={schedules.length < 2} aria-label="Previous schedule"><ChevronLeft size={16} /></Button>
          <select aria-label="Choose schedule option" value={currentIndex} onChange={event => onSelectSchedule(Number(event.target.value))}>
            {schedules.map((schedule, index) => <option key={schedule.id} value={index}>Option {index + 1} of {schedules.length}</option>)}
          </select>
          <Button variant="outline" size="icon" onClick={onNext} disabled={schedules.length < 2} aria-label="Next schedule"><ChevronRight size={16} /></Button>
        </div>
      </div>
    </section>
  );
}

export function ScheduleSidebar({
  prerequisiteOverrides,
  currentSchedule,
  activeTerm,
  copiedItem,
  onCopyToClipboard,
  activeElectiveRequirements,
  activeElectiveCategory,
  selectedElectives,
  electiveCourseDetails,
  electiveFitMeta,
  loadingElectives,
  electiveSearchTerms,
  setElectiveSearchTerms,
  showUnavailable,
  setShowUnavailable,
  swappingElective,
  onElectiveToggle,
  onElectiveRemove,
  busy = false,
  onInspectCourse,
}: {
  prerequisiteOverrides: string[];
  currentSchedule: GeneratedSchedule;
  activeTerm: string;
  copiedItem: string | null;
  onCopyToClipboard: (text: string, itemId: string) => void;
  activeElectiveRequirements: Array<{ category: string; label: string; creditsNeeded: number }>;
  activeElectiveCategory: string;
  setActiveElectiveCategory: (category: string) => void;
  selectedElectives: Record<string, string[]>;
  selectedElectiveCredits: Record<string, number>;
  electiveCourseDetails: Record<string, ElectiveCourseInfo[]>;
  electiveFitMeta: Record<string, { pairwiseComplete: boolean }>;
  loadingElectives: Record<string, boolean>;
  electiveSearchTerms: Record<string, string>;
  setElectiveSearchTerms: Dispatch<SetStateAction<Record<string, string>>>;
  showUnavailable: Record<string, boolean>;
  setShowUnavailable: Dispatch<SetStateAction<Record<string, boolean>>>;
  swappingElective: string | null;
  onElectiveToggle: (category: string, code: string, credits: number) => void;
  onElectiveRemove: (category: string, courseCode: string) => void;
  busy?: boolean;
  onInspectCourse: (course: string) => void;
}) {
  const [showCrns, setShowCrns] = useState(false);
  const groupedCourses = new Map<string, typeof currentSchedule.selections>();
  currentSchedule.selections.forEach(selection => {
    if (!groupedCourses.has(selection.courseCode)) groupedCourses.set(selection.courseCode, []);
    groupedCourses.get(selection.courseCode)!.push(selection);
  });

  const courseColorMap = new Map<string, typeof COURSE_COLORS[number]>();
  Array.from(groupedCourses.keys()).forEach((code, idx) => {
    courseColorMap.set(code, COURSE_COLORS[idx % COURSE_COLORS.length]);
  });

  const activeEr = activeElectiveRequirements.find(er => er.category === activeElectiveCategory) || activeElectiveRequirements[0];
  const category = activeEr?.category || '';
  const currentPicks = selectedElectives[category] || [];
  const allDetails = (electiveCourseDetails[category] || []).map(course => ({ ...course, prerequisiteOverride: prerequisiteOverrides.includes(course.code) }));
  const isLoading = loadingElectives[category];
  const searchTerm = electiveSearchTerms[category] || '';
  const available = allDetails.filter(e => e.status === 'available');
  const tba = allDetails.filter(e => e.status === 'tba');
  const conflicting = allDetails.filter(e => e.status === 'conflicting');
  const prereqNotMet = allDetails.filter(e => e.status === 'prereq');
  const plannedElsewhere = allDetails.filter(e => e.status === 'planned');
  const filterFn = (e: ElectiveCourseInfo) => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return e.code.toLowerCase().includes(t) || e.name.toLowerCase().includes(t);
  };
  const filteredAvail = available.filter(filterFn);
  const filteredTba = tba.filter(filterFn);
  const filteredConflicting = conflicting.filter(filterFn);
  const filteredPrereqNotMet = prereqNotMet.filter(filterFn);
  const filteredPlannedElsewhere = plannedElsewhere.filter(filterFn);

  return (
    <aside className="glass-panel schedule-sidebar" aria-label="Schedule details and electives">
      <div className="registration-details" style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
        <Button variant="outline" size="sm" aria-expanded={showCrns} aria-controls="schedule-crn-details" onClick={() => setShowCrns(value => !value)}>{showCrns ? 'Hide CRN(s)' : 'Show CRN(s)'}</Button>
        {showCrns && <div id="schedule-crn-details" style={{ marginTop: '12px' }}>
        {currentSchedule.selections.some(selection => prerequisiteOverrides.includes(selection.courseCode)) && <p className="prerequisite-override-explanation">This timetable includes prerequisite overrides for planning. They do not waive university requirements; Carleton Central may reject these CRNs. Confirm your eligibility before registering.</p>}
        <div className="registration-heading">
          {currentSchedule.selections.some(selection => selection.section.crn) && <Button variant="outline" size="sm" onClick={() => onCopyToClipboard([...new Set(currentSchedule.selections.map(selection => selection.section.crn).filter(Boolean))].join(', '), 'all-crns')}>
            {copiedItem === 'all-crns' ? <Check size={14} /> : <Copy size={14} />}{copiedItem === 'all-crns' ? 'Copied' : 'Copy CRNs'}
          </Button>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {Array.from(groupedCourses.entries()).map(([courseCode, sections]) => {
            const colors = courseColorMap.get(courseCode) || COURSE_COLORS[0];
            const prerequisiteInfo = currentSchedule.prerequisiteInfo?.[courseCode];
            const hasUnmetPrerequisites = Boolean(
              prerequisiteInfo &&
              prerequisiteInfo.isValid === false &&
              prerequisiteInfo.expressionEvaluated &&
              prerequisiteInfo.expressionEvaluated !== 'None'
            );

            return <div className="registration-course course-has-term-tags" key={courseCode}>
              <CourseTermTags code={courseCode} activeTerm={activeTerm} requiredTypes={sections.map(selection => selection.section.type)} />
              <h3><i style={{ background: colors.border }} /><button className="inspect-course-button" onClick={() => onInspectCourse(courseCode)} aria-label={`Inspect course conflicts for ${courseCode}`}>{courseCode}</button><HalfTermCourseTag code={courseCode} />{prerequisiteOverrides.includes(courseCode) && <span className="prerequisite-override-badge" title="Prerequisite override · planning only">Override</span>}</h3>
              <p className="course-section-requirements">{sectionRequirements(sections.map(selection => selection.section.type))}</p>
              {sections.map((selection) => {
              const itemId = `${courseCode}-${selection.section.sectionCode}`;
              const days = selection.section.timeSlots
                .map(slot => slot.day.slice(0, 3))
                .filter((value, index, array) => array.indexOf(value) === index)
                .join(', ');
              const times = selection.section.timeSlots.length > 0
                ? `${selection.section.timeSlots[0].startTime}-${selection.section.timeSlots[0].endTime}`
                : 'TBA';

              return (
                <div key={itemId} className="registration-section">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground)' }}>{selection.section.type} {selection.section.sectionCode}</span>
                      {selection.section.deliveryMode !== 'IN_PERSON' && (
                        <span className={`delivery-tag${isOnlineMode(selection.section.deliveryMode) ? ' is-online' : ''}`}>
                          {isOnlineMode(selection.section.deliveryMode) && <Laptop size={10} />}{selection.section.deliveryMode === 'HYBRID' ? 'Hybrid' : 'Online'}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', margin: 0 }}>{selection.section.deliveryMode === 'ONLINE_ASYNC' ? `${DELIVERY_LABELS.ONLINE_ASYNC} · no set meeting time` : selection.section.timeSlots.length ? `${days} ${times}` : selection.section.type === 'IND' ? 'Independent project · no fixed meeting time' : 'Meeting times to be announced'}</p>
                  </div>
                  <button
                    onClick={() => onCopyToClipboard(selection.section.crn, `crn-${itemId}`)}
                    aria-label={`Copy registration number ${selection.section.crn}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                  >
                    {copiedItem === `crn-${itemId}` ? (
                      <Check style={{ width: '12px', height: '12px', color: 'var(--success)' }} />
                    ) : (
                      <Copy style={{ width: '10px', height: '10px', opacity: 0.4 }} />
                    )}
                    <span>{copiedItem === `crn-${itemId}` ? 'Copied' : selection.section.crn || 'No CRN'}</span>
                  </button>
                </div>
              );
              })}
              {hasUnmetPrerequisites && <details className="prerequisite-details registration-prerequisites"><summary>Check prerequisites</summary><p>{prerequisiteInfo?.requirementExplanation || prerequisiteInfo?.expressionEvaluated}</p></details>}
              {prerequisiteInfo?.isValid && prerequisiteInfo.plannedPrerequisites?.length ? <p className="prerequisite-override-explanation">Prerequisites scheduled earlier: {prerequisiteInfo.plannedPrerequisites.join(', ')}. Planning assumes you pass with any required grade.</p> : null}
            </div>;
          })}
        </div>
        </div>}
      </div>

      {activeElectiveRequirements.length > 0 && activeEr && (
        <div id="schedule-elective-picker" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: '16px 16px 0 16px' }}>
             <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--foreground)' }}>{/elective/i.test(activeEr.label) ? activeEr.label : `${activeEr.label} Elective`}</span>
          </div>


          <div style={{ padding: '10px 16px' }}>
            {currentPicks.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                {currentPicks.map(code => (
                  <span
                    key={code}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '4px 8px 4px 10px', fontSize: '12px', fontWeight: 700, background: 'var(--primary-soft)', color: 'var(--primary-text)', borderRadius: '9999px' }}
                  >
                    {code}
                    <button
                      onClick={(e) => { e.stopPropagation(); onElectiveRemove(category, code); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--surface-hover)', border: 'none', cursor: 'pointer', color: 'var(--primary-text)', fontSize: '10px', lineHeight: 1, padding: 0 }}
                      title={`Remove ${code}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {!isLoading && electiveFitMeta[category]?.pairwiseComplete === false && (
            <p className="elective-fit-note">Some elective combinations weren't checked, so a few blocked pairs may not be marked.</p>
          )}
          <div style={{ padding: '0 16px 8px 16px', position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '26px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--muted-foreground)' }} />
            <input
              placeholder="Filter by code or name..."
              value={searchTerm}
              onChange={e => setElectiveSearchTerms(prev => ({ ...prev, [category]: e.target.value }))}
              aria-label="Filter elective courses"
              style={{ width: '100%', padding: '10px 12px 10px 34px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--surface)', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px 16px' }}>
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '32px 0', color: 'var(--muted-foreground)' }}>
                <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />
                <span style={{ fontSize: '12px' }}>Loading...</span>
              </div>
            ) : (
              <>
                {filteredAvail.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                      Available ({filteredAvail.length})
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '6px' }}>
                      {filteredAvail.map(elective => (
                        <ElectiveCourseCard
                          key={elective.code}
                          elective={elective}
                          activeTerm={activeTerm}
                          category={category}
                          isSelected={currentPicks.includes(elective.code)}
                          isSwapping={swappingElective === elective.code}
                          onToggle={onElectiveToggle}
                          busy={busy}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {filteredTba.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                      TBA ({filteredTba.length})
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '6px' }}>
                      {filteredTba.map(elective => (
                        <ElectiveCourseCard
                          key={elective.code}
                          elective={elective}
                          activeTerm={activeTerm}
                          category={category}
                          isSelected={currentPicks.includes(elective.code)}
                          isSwapping={swappingElective === elective.code}
                          onToggle={onElectiveToggle}
                          busy={busy}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {filteredConflicting.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowUnavailable(prev => ({ ...prev, [`${category}:conflicting`]: !prev[`${category}:conflicting`] }))}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '6px', padding: 0 }}
                    >
                      <ChevronDown style={{ width: '12px', height: '12px', transform: showUnavailable[`${category}:conflicting`] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      Conflicting ({filteredConflicting.length})
                    </button>
                    {showUnavailable[`${category}:conflicting`] && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '6px' }}>
                        {filteredConflicting.map(elective => (
                          <ElectiveCourseCard
                            key={elective.code}
                            elective={elective}
                            activeTerm={activeTerm}
                            category={category}
                            isSelected={false}
                            isSwapping={false}
                            onToggle={onElectiveToggle}
                            busy={busy}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {filteredPrereqNotMet.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowUnavailable(prev => ({ ...prev, [`${category}:prereq`]: !prev[`${category}:prereq`] }))}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '6px', padding: 0 }}
                    >
                      <ChevronDown style={{ width: '12px', height: '12px', transform: showUnavailable[`${category}:prereq`] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      Prereq not met ({filteredPrereqNotMet.length})
                    </button>
                    {showUnavailable[`${category}:prereq`] && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '6px' }}>
                        {filteredPrereqNotMet.map(elective => (
                          <ElectiveCourseCard
                            key={elective.code}
                            elective={elective}
                            activeTerm={activeTerm}
                            category={category}
                            isSelected={false}
                            isSwapping={false}
                            onToggle={onElectiveToggle}
                            busy={busy}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {filteredPlannedElsewhere.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowUnavailable(prev => ({ ...prev, [`${category}:planned`]: !prev[`${category}:planned`] }))}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '6px', padding: 0 }}
                    >
                      <ChevronDown style={{ width: '12px', height: '12px', transform: showUnavailable[`${category}:planned`] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      Selected in other terms ({filteredPlannedElsewhere.length})
                    </button>
                    {showUnavailable[`${category}:planned`] && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '6px' }}>
                        {filteredPlannedElsewhere.map(elective => (
                          <ElectiveCourseCard
                            key={elective.code}
                            elective={elective}
                            activeTerm={activeTerm}
                            category={category}
                            isSelected={false}
                            isSwapping={false}
                            onToggle={onElectiveToggle}
                            busy={busy}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {filteredAvail.length === 0 && filteredTba.length === 0 && filteredConflicting.length === 0 && filteredPrereqNotMet.length === 0 && filteredPlannedElsewhere.length === 0 && (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                    <p style={{ fontSize: '12px' }}>{searchTerm ? 'No matches.' : 'No options found.'}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
