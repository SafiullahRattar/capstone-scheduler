const API_BASE_URL = 'http://localhost:3001/api';

export interface TimeSlot {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string;
  endTime: string;
}

export interface Section {
  sectionCode: string;
  type: 'Lecture' | 'Tutorial' | 'Lab';
  instructor: string;
  timeSlots: TimeSlot[];
  capacity: number;
  enrolled: number;
}

export interface CourseSchedule {
  courseCode: string;
  sections: Section[];
}

export interface PrerequisiteInfo {
  isValid: boolean;
  reason?: string;
  missingCourses?: string[];
  expressionEvaluated: string;
}

export interface GeneratedSchedule {
  id: number;
  selections: {
    courseCode: string;
    section: Section;
  }[];
  hasUnmetPrerequisites: boolean;
  prerequisiteInfo?: {
    [courseId: string]: PrerequisiteInfo;
  };
}

/**
 * Generate all possible schedules using the backend API
 * Falls back to error message if API fails
 */
export async function generateSchedules(
  courseCodes: string[],
  completedCourses: string[]
): Promise<GeneratedSchedule[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/schedules/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseIds: courseCodes,
        completedCourses: completedCourses,
        // Don't filter by term - use all available sections
        maxSchedules: 50
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Schedule generation failed:', error);
      throw new Error(error.message || 'Failed to generate schedules');
    }

    const data = await response.json();
    
    // Map API response to frontend format
    return data.schedules.map((schedule: any, index: number) => {
      // Check if any course has prerequisites (for informational display)
      const hasPrerequisites = schedule.prerequisiteInfo && 
        Object.values(schedule.prerequisiteInfo).some((info: any) => 
          info.expressionEvaluated && info.expressionEvaluated !== 'None'
        );
      
      return {
        id: index + 1,
        selections: schedule.selections.map((sel: any) => ({
          courseCode: sel.courseId,
          section: mapApiSectionToFrontend(sel.section)
        })),
        hasUnmetPrerequisites: hasPrerequisites || false, // Used to show info banner
        prerequisiteInfo: schedule.prerequisiteInfo || {}
      };
    });
  } catch (error) {
    console.error('Error generating schedules:', error);
    // Re-throw the error so the UI can display it to the user
    throw error;
  }
}

/**
 * Map backend section format to frontend Section interface
 */
function mapApiSectionToFrontend(apiSection: any): Section {
  // Parse days string (e.g., "MWF" -> ["Monday", "Wednesday", "Friday"])
  const dayMap: Record<string, 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = {
    'M': 'Monday',
    'T': 'Tuesday',
    'W': 'Wednesday',
    'R': 'Thursday',
    'F': 'Friday'
  };

  const days = apiSection.days 
    ? apiSection.days.split('').map((d: string) => dayMap[d]).filter(Boolean)
    : [];

  // Create time slots for each day
  const timeSlots: TimeSlot[] = days.map((day: any) => ({
    day,
    startTime: formatTime(apiSection.startTime),
    endTime: formatTime(apiSection.endTime)
  }));

  return {
    sectionCode: apiSection.sectionCode,
    type: apiSection.sectionType as 'Lecture' | 'Tutorial' | 'Lab',
    instructor: apiSection.instructor || 'TBA',
    timeSlots,
    capacity: apiSection.capacity || 0,
    enrolled: apiSection.enrolled || 0
  };
}

/**
 * Format time from "0835" to "08:35"
 */
function formatTime(time: string | null): string {
  if (!time || time.length !== 4) return '00:00';
  return `${time.substring(0, 2)}:${time.substring(2, 4)}`;
}

/**
 * Check for time conflicts between two time slots
 */
export function hasTimeConflict(slot1: TimeSlot, slot2: TimeSlot): boolean {
  if (slot1.day !== slot2.day) return false;
  
  const start1 = parseTime(slot1.startTime);
  const end1 = parseTime(slot1.endTime);
  const start2 = parseTime(slot2.startTime);
  const end2 = parseTime(slot2.endTime);

  return start1 < end2 && start2 < end1;
}

/**
 * Parse time string "HH:MM" to minutes since midnight
 */
function parseTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
