export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const
export type Weekday = typeof WEEKDAYS[number]

/** A period the student wants kept free of classes. Times are 24-hour "HH:MM". */
export interface BlockedTime {
  day: Weekday
  startTime: string
  endTime: string
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export function timeToMinutes(time: string): number {
  const padded = time.replace(':', '').padStart(4, '0')
  return parseInt(padded.slice(0, 2)) * 60 + parseInt(padded.slice(2, 4))
}

/** Validates request input, throwing on anything that is not a list of well-formed periods. */
export function parseBlockedTimes(value: unknown): BlockedTime[] {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > 50) throw new Error('Invalid blocked times')
  return value.map(item => {
    if (!item || typeof item !== 'object') throw new Error('Invalid blocked times')
    const { day, startTime, endTime } = item as Record<string, unknown>
    if (!(WEEKDAYS as readonly unknown[]).includes(day) || typeof startTime !== 'string' || typeof endTime !== 'string'
      || !TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime) || timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      throw new Error('Invalid blocked times')
    }
    return { day: day as Weekday, startTime, endTime }
  })
}

export function formatClockTime(time: string): string {
  const minutes = timeToMinutes(time)
  const hours = Math.floor(minutes / 60)
  const suffix = hours >= 12 ? 'pm' : 'am'
  return `${hours % 12 || 12}:${String(minutes % 60).padStart(2, '0')}${suffix}`
}
