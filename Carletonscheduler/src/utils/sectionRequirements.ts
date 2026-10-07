export function sectionRequirements(types: string[]): string {
  const labels: Record<string, string> = { LEC: 'Lecture', LAB: 'Lab', TUT: 'Tutorial', IND: 'Independent project' };
  const aliases: Record<string, string> = { LECTURE: 'LEC', LAB: 'LAB', TUTORIAL: 'TUT' };
  const normalized = new Set(types.map(type => aliases[type.toUpperCase()] || type.toUpperCase()));
  const ordered = [...['LEC', 'LAB', 'TUT', 'IND'].filter(type => normalized.has(type)), ...Array.from(normalized).filter(type => !labels[type])];
  return ordered.length ? `Requires: ${ordered.map(type => labels[type] || type).join(' + ')}` : '';
}
