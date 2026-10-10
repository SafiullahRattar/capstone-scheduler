import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '../ui/button';
import { WEEKDAYS, formatClockTime, timeToMinutes, type BlockedTime, type Weekday } from '@shared/blocked-times';

const EVERY_WEEKDAY = 'weekdays';

interface BlockedTimesEditorProps {
  blockedTimes: BlockedTime[];
  onChange: (blockedTimes: BlockedTime[]) => void;
  disabled?: boolean;
}

/** Periods with the same hours are shown together, so "every weekday" stays a single entry. */
function groupByHours(blockedTimes: BlockedTime[]) {
  const groups = new Map<string, { startTime: string; endTime: string; days: Weekday[] }>();
  for (const blocked of blockedTimes) {
    const key = `${blocked.startTime}-${blocked.endTime}`;
    const group = groups.get(key) || { startTime: blocked.startTime, endTime: blocked.endTime, days: [] };
    group.days.push(blocked.day);
    groups.set(key, group);
  }
  return Array.from(groups.entries())
    .map(([key, group]) => ({ key, ...group, days: WEEKDAYS.filter(day => group.days.includes(day)) }))
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

function describeDays(days: Weekday[]) {
  return days.length === WEEKDAYS.length ? 'Weekdays' : days.map(day => day.slice(0, 3)).join(', ');
}

export function BlockedTimesEditor({ blockedTimes, onChange, disabled = false }: BlockedTimesEditorProps) {
  const [day, setDay] = useState<string>(EVERY_WEEKDAY);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    if (!startTime || !endTime || timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      setError('The end time must be after the start time.');
      return;
    }
    const days = day === EVERY_WEEKDAY ? [...WEEKDAYS] : [day as Weekday];
    const additions = days
      .map(item => ({ day: item, startTime, endTime }))
      .filter(item => !blockedTimes.some(existing => existing.day === item.day && existing.startTime === item.startTime && existing.endTime === item.endTime));
    setError(null);
    if (additions.length) onChange([...blockedTimes, ...additions]);
  };

  const removeGroup = (key: string) => onChange(blockedTimes.filter(blocked => `${blocked.startTime}-${blocked.endTime}` !== key));

  return (
    <fieldset className="blocked-times" disabled={disabled}>
      <legend>Times to avoid</legend>
      <p className="blocked-times-hint">No class sections will be scheduled during these times.</p>
      {blockedTimes.length > 0 && (
        <ul className="blocked-times-list">
          {groupByHours(blockedTimes).map(group => (
            <li key={group.key}>
              <span>{describeDays(group.days)} · {formatClockTime(group.startTime)}–{formatClockTime(group.endTime)}</span>
              <button type="button" onClick={() => removeGroup(group.key)} aria-label={`Stop avoiding ${describeDays(group.days)} ${formatClockTime(group.startTime)} to ${formatClockTime(group.endTime)}`}>
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="blocked-times-form">
        <select aria-label="Day to avoid" value={day} onChange={event => setDay(event.target.value)}>
          <option value={EVERY_WEEKDAY}>Every weekday</option>
          {WEEKDAYS.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
        <div className="blocked-times-range">
          <input type="time" aria-label="Avoid from" step={300} value={startTime} onChange={event => setStartTime(event.target.value)} />
          <span aria-hidden="true">to</span>
          <input type="time" aria-label="Avoid until" step={300} value={endTime} onChange={event => setEndTime(event.target.value)} />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus size={14} /> Add
        </Button>
      </div>
      {error && <p role="alert" className="blocked-times-error">{error}</p>}
    </fieldset>
  );
}
