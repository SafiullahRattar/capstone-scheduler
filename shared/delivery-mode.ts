export const DELIVERY_MODES = ['IN_PERSON', 'ONLINE_SYNC', 'ONLINE_ASYNC', 'HYBRID'] as const
export type DeliveryMode = typeof DELIVERY_MODES[number]
export type DeliveryPreference = 'any' | 'in-person' | 'online'

/** Sections with no recorded mode are treated as in person. */
export function normalizeDeliveryMode(value: string | null | undefined): DeliveryMode {
  return parseDeliveryMode(value) ?? 'IN_PERSON'
}

/** Accepts the stored codes plus the wording used in timetable exports. */
export function parseDeliveryMode(value: string | null | undefined): DeliveryMode | null {
  const text = (value || '').trim().toUpperCase().replace(/[\s-]+/g, '_')
  if (!text) return null
  if ((DELIVERY_MODES as readonly string[]).includes(text)) return text as DeliveryMode
  if (text.includes('ASYNC')) return 'ONLINE_ASYNC'
  if (text.includes('HYBRID') || text.includes('BLENDED')) return 'HYBRID'
  if (text.includes('SYNC') || text.includes('ONLINE') || text === 'OL' || text === 'V') return 'ONLINE_SYNC'
  if (text.includes('PERSON') || text.includes('CAMPUS') || text === 'P') return 'IN_PERSON'
  return null
}

export function isOnlineMode(mode: DeliveryMode): boolean {
  return mode === 'ONLINE_SYNC' || mode === 'ONLINE_ASYNC'
}

/** Whether a section satisfies a student's delivery preference. Hybrid counts for neither strict choice. */
export function matchesDeliveryPreference(mode: DeliveryMode, preference: DeliveryPreference): boolean {
  if (preference === 'any') return true
  if (preference === 'online') return isOnlineMode(mode)
  return mode === 'IN_PERSON'
}
