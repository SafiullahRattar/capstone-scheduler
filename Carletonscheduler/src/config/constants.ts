// Set VITE_API_URL to point the client at another API, e.g. a deployed server.
export const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = localStorage.getItem('auth_token');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

export const BRAND_COLORS = {
  PRIMARY: '#bf112b',
  PRIMARY_HOVER: '#a00f25',
} as const;

export const SCHEDULE_CONFIG = {
  MAX_SUGGESTIONS: 10,
  DEFAULT_COURSE_LOAD: 5,
  MAX_SCHEDULES: 100,
  MAX_SEARCH_RESULTS: 8,
} as const;

export const TIMETABLE_CONFIG = {
  START_HOUR: 8,
  END_HOUR: 22,
  HOUR_HEIGHT_PX: 60,
  TIME_SLOTS: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'],
  DAYS: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const,
} as const;

export const COURSE_COLORS = [
  { bg: '#59342d', border: '#e9957f', text: '#ffe8df' },
  { bg: '#233d5b', border: '#7aafea', text: '#dcecff' },
  { bg: '#21473d', border: '#67cbaa', text: '#d1fae5' },
  { bg: '#51422a', border: '#dcbd76', text: '#fff0cc' },
  { bg: '#3e315a', border: '#b099df', text: '#eee5ff' },
  { bg: '#21434c', border: '#68bfce', text: '#d6f8ff' },
  { bg: '#512e49', border: '#d792c5', text: '#ffe0f6' },
  { bg: '#513827', border: '#e3a574', text: '#ffe8d6' },
] as const;

export type CourseColor = typeof COURSE_COLORS[number];
export type Day = typeof TIMETABLE_CONFIG.DAYS[number];
