import { API_BASE_URL, SCHEDULE_CONFIG } from '../config/constants';

export interface Course {
  code: string;
  name: string;
  credits: number;
  prerequisites: string[];
  description: string;
  type?: 'core' | 'technical-elective' | 'complementary-elective';
  sectionTypes?: string[]; // e.g., ["LEC", "LAB", "TUT"]
  sectionCount?: number;
  hasSections?: boolean;
}

/**
 * Search for courses using the backend API
 * Falls back to empty array on error to prevent UI crashes
 */
export async function searchCourses(query: string): Promise<Course[]> {
  if (!query.trim()) return [];
  
  try {
    const response = await fetch(`${API_BASE_URL}/courses/search?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    return data.results.map((course: Course & { type?: string }) => ({
      code: course.code,
      name: course.name || course.code,
      credits: course.credits || 0,
      prerequisites: course.prerequisites || [],
      description: course.description || '',
      type: course.type as 'core' | 'technical-elective' | 'complementary-elective' | undefined,
      sectionTypes: course.sectionTypes || []
    })).slice(0, SCHEDULE_CONFIG.MAX_SEARCH_RESULTS);
  } catch {
    return [];
  }
}

/**
 * Get a single course by its code
 */
export async function getCourseByCode(code: string): Promise<Course | undefined> {
  try {
    const response = await fetch(`${API_BASE_URL}/courses/${encodeURIComponent(code)}`);
    
    if (!response.ok) {
      return {
        code: code,
        name: code,
        credits: 0,
        prerequisites: [],
        description: 'Course not available in database',
        hasSections: false,
        sectionCount: 0
      };
    }
    
    const course = await response.json();
    
    return {
      code: course.code,
      name: course.name || course.code,
      credits: course.credits || 0,
      prerequisites: course.prerequisites || [],
      description: course.description || '',
      type: course.type as 'core' | 'technical-elective' | 'complementary-elective' | undefined,
      sectionCount: course.sectionCount || 0,
      hasSections: (course.sectionCount || 0) > 0
    };
  } catch {
    return {
      code: code,
      name: code,
      credits: 0,
      prerequisites: [],
      description: 'Error loading course',
      hasSections: false,
      sectionCount: 0
    };
  }
}
