import { useEffect, useState } from 'react';
import { getCourseSections, type CourseSection } from '../../utils/courseData';
import { availabilityTerms, completeBundleTerms } from '@shared/term-availability';
import { getTermLabel } from '../../utils/termUtils';

const requests = new Map<string, Promise<CourseSection[]>>();
function sectionsFor(code: string) {
  if (!requests.has(code)) requests.set(code, getCourseSections(code).finally(() => requests.delete(code)));
  return requests.get(code)!;
}

export function CourseTermTags({ code, activeTerm, requiredTypes }: { code: string; activeTerm: string; requiredTypes: string[] }) {
  const [loaded, setLoaded] = useState<{ code: string; sections: CourseSection[] } | null>(null);
  useEffect(() => {
    let cancelled = false;
    sectionsFor(code).then(sections => { if (!cancelled) setLoaded({ code, sections }); });
    return () => { cancelled = true; };
  }, [code]);
  if (loaded?.code !== code) return null;
  const terms = availabilityTerms(activeTerm);
  const offered = new Set(completeBundleTerms(loaded.sections, requiredTypes, terms));
  return <div className="course-term-tags" aria-label={`Term availability for ${code}`}>
    {terms.map((term, index) => <span key={term} className={offered.has(term) ? 'is-offered' : 'not-offered'} title={`${getTermLabel(term)}: ${offered.has(term) ? 'complete section combination available' : 'no complete section combination recorded'}`} aria-label={`${getTermLabel(term)}: ${offered.has(term) ? 'available' : 'unavailable'}`}>{['F', 'W', 'S'][index]}</span>)}
  </div>;
}
