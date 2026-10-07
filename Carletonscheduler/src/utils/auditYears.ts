const yearNames = ['First year', 'Second year', 'Third year', 'Fourth year'];

export function getAuditGroupLabel(title: string): string {
  const normalized = title.replace(/\s+/g, ' ').trim();
  const year = normalized.match(/\b(first|second|third|fourth) year\b/i)?.[1].toLowerCase();
  if (year) return yearNames[['first', 'second', 'third', 'fourth'].indexOf(year)];
  if (/complementary/i.test(normalized)) return 'Complementary studies';
  return normalized;
}

/** Course-level fallback for saved audits that did not retain year headings. */
export function getCourseLevelGroup(code: string): string {
  const level = code.match(/^[A-Z]{3,4}\s*([1-4])\d{3}$/i)?.[1];
  return level ? `${level}000-level courses` : 'Other courses';
}

export function getAuditGroupOrder(label: string): number {
  const year = yearNames.indexOf(label);
  if (year >= 0) return year;
  const level = label.match(/^([1-4])000-level/)?.[1];
  return level ? Number(level) - 1 : 5;
}
