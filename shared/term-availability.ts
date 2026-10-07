interface MeetingSlot { day: string; startTime: string; endTime: string }
export interface AvailabilitySection {
  term?: string | null;
  type: string;
  deliveryMode: string;
  timeSlots: MeetingSlot[];
}

export function availabilityTerms(activeTerm: string): string[] {
  const year = Number(activeTerm.slice(0, 4)) - (activeTerm.endsWith('30') ? 0 : 1);
  return [`${year}30`, `${year + 1}10`, `${year + 1}20`];
}

/** A term needs every required section type in one internally compatible bundle. */
export function completeBundleTerms(sections: AvailabilitySection[], requiredTypes: string[], terms: string[]): string[] {
  const types = Array.from(new Set(requiredTypes.length ? requiredTypes : sections.map(section => section.type)));
  const minutes = (time: string) => {
    const normalized = time.replace(':', '').padStart(4, '0');
    return Number(normalized.slice(0, 2)) * 60 + Number(normalized.slice(2));
  };
  const overlaps = (a: MeetingSlot, b: MeetingSlot) => a.day === b.day && minutes(a.startTime) < minutes(b.endTime) && minutes(b.startTime) < minutes(a.endTime);
  return terms.filter(term => {
    const groups = types.map(type => sections.filter(section => section.term === term && section.type === type));
    if (!groups.length || groups.some(group => !group.length)) return false;
    function fits(index: number, occupied: MeetingSlot[]): boolean {
      if (index === groups.length) return true;
      return groups[index].some(section => {
        const slots = section.deliveryMode === 'ONLINE_ASYNC' ? [] : section.timeSlots;
        return !slots.some(slot => occupied.some(other => overlaps(slot, other))) && fits(index + 1, [...occupied, ...slots]);
      });
    }
    return fits(0, []);
  });
}
