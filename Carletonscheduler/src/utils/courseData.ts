import { API_BASE_URL, SCHEDULE_CONFIG } from '../config/constants';

export interface PrerequisiteNode {
  id: string;
  nodeType: string;
  requiredCourseId: string | null;
  requiredYear: string | null;
  requiredGrade: string | null;
  parentId: string | null;
}

export interface Course {
  code: string;
  name: string;
  credits: number;
  prerequisites: string[];
  prerequisiteTree?: PrerequisiteNode[];
  description: string;
  type?: 'core' | 'technical-elective' | 'complementary-elective';
  sectionTypes?: string[];
  sectionCount?: number;
  hasSections?: boolean;
  terms?: string[];
}

// Cache for search results - stores results for 5 minutes
const searchCache = new Map<string, { results: Course[]; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Cache for individual course lookups
const courseCache = new Map<string, { course: Course; timestamp: number }>();

// Current abort controller for search requests
let currentSearchController: AbortController | null = null;

/**
 * Clear expired cache entries
 */
function cleanCache() {
  const now = Date.now();
  for (const [key, value] of searchCache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      searchCache.delete(key);
    }
  }
  for (const [key, value] of courseCache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      courseCache.delete(key);
    }
  }
}

// Clean cache periodically
setInterval(cleanCache, 60 * 1000);

/**
 * Search for courses using the backend API
 * - Returns cached results if available
 * - Cancels any in-flight requests when a new search starts
 */
export async function searchCourses(query: string): Promise<Course[]> {
  const normalizedQuery = query.trim().toLowerCase();
  
  // Check minimum query length
  if (normalizedQuery.length < 2) return [];
  
  // Check cache first
  const cached = searchCache.get(normalizedQuery);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.results;
  }
  
  // Cancel any in-flight search request
  if (currentSearchController) {
    currentSearchController.abort();
  }
  
  // Create new abort controller for this request
  currentSearchController = new AbortController();
  const signal = currentSearchController.signal;
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/courses/search?q=${encodeURIComponent(normalizedQuery)}`,
      { signal }
    );
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    const results = data.results.map((course: Course & { type?: string }) => ({
      code: course.code,
      name: course.name || course.code,
      credits: course.credits || 0,
      prerequisites: course.prerequisites || [],
      prerequisiteTree: course.prerequisiteTree || [],
      description: course.description || '',
      type: course.type as 'core' | 'technical-elective' | 'complementary-elective' | undefined,
      sectionTypes: course.sectionTypes || [],
      terms: course.terms || []
    })).slice(0, SCHEDULE_CONFIG.MAX_SEARCH_RESULTS);
    
    // Cache the results
    searchCache.set(normalizedQuery, { results, timestamp: Date.now() });
    
    return results;
  } catch (error) {
    // Don't treat aborted requests as errors
    if (error instanceof Error && error.name === 'AbortError') {
      return [];
    }
    return [];
  }
}

/**
 * Get a single course by its code
 * - Returns cached result if available
 */
export async function getCourseByCode(code: string): Promise<Course | undefined> {
  const normalizedCode = code.trim().toUpperCase();
  
  // Check cache first
  const cached = courseCache.get(normalizedCode);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.course;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/courses/${encodeURIComponent(normalizedCode)}`);
    
    if (!response.ok) {
      const fallback: Course = {
        code: normalizedCode,
        name: normalizedCode,
        credits: 0,
        prerequisites: [],
        description: 'Course not available in database',
        hasSections: false,
        sectionCount: 0
      };
      courseCache.set(normalizedCode, { course: fallback, timestamp: Date.now() });
      return fallback;
    }
    
    const data = await response.json();
    
    const course: Course = {
      code: data.code,
      name: data.name || data.code,
      credits: data.credits || 0,
      prerequisites: data.prerequisites || [],
      prerequisiteTree: data.prerequisiteTree || [],
      description: data.description || '',
      type: data.type as 'core' | 'technical-elective' | 'complementary-elective' | undefined,
      sectionCount: data.sectionCount || 0,
      hasSections: (data.sectionCount || 0) > 0,
      terms: data.terms || []
    };
    
    // Cache the result
    courseCache.set(normalizedCode, { course, timestamp: Date.now() });
    
    return course;
  } catch {
    const fallback: Course = {
      code: normalizedCode,
      name: normalizedCode,
      credits: 0,
      prerequisites: [],
      description: 'Error loading course',
      hasSections: false,
      sectionCount: 0
    };
    return fallback;
  }
}
