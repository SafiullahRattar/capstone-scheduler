import { useEffect, useState } from 'react';
import { getCourseByCode } from '../utils/courseData';

export function HalfTermCourseTag({ code, credits }: { code: string; credits?: number }) {
  const [loaded, setLoaded] = useState<{ code: string; credits: number } | null>(null);
  useEffect(() => {
    if (credits !== undefined) return;
    let cancelled = false;
    getCourseByCode(code).then(course => { if (!cancelled && course) setLoaded({ code, credits: course.credits }); });
    return () => { cancelled = true; };
  }, [code, credits]);
  const value = credits ?? (loaded?.code === code ? loaded.credits : undefined);
  return value === 0.25 ? <span className="half-term-course-label">Half-term course</span> : null;
}
