/*
 * Simulates delivery modes for sections that have no scheduled meeting times.
 *
 * Teaching sections (lectures, labs, tutorials, ...) without times become a mix of
 * in-person, online synchronous, online asynchronous and hybrid sections. Every
 * non-asynchronous section gets a realistic generated meeting time. Choices are
 * hashed from section ids, so reruns give the same result.
 *
 * Every simulated meeting row has an id starting with `simulated-delivery:`, which
 * marks the section as simulated. Run with --revert to undo.
 */

import { PrismaClient } from '@prisma/client'
import type { DeliveryMode } from '../shared/delivery-mode'

const prisma = new PrismaClient()
const ID_PREFIX = 'simulated-delivery:'

// Project-style sections legitimately have no fixed meeting time.
const UNSCHEDULED_TYPES = new Set(['IND', 'DIR', 'HON', 'RES', 'PLA', 'FIE', 'WRK', 'PRC', 'CAP', 'THE'])
const WEEKLY_TYPES = new Set(['TUT', 'PAN', 'LAB', 'GRP'])

const LECTURE_STARTS = ['0835', '1005', '1135', '1305', '1435', '1605', '1735']
const LONG_BLOCKS = [['0835', '1125'], ['1135', '1425'], ['1435', '1725'], ['1805', '2055']]
const DAY_PAIRS = ['MW', 'TR', 'WF']
const SINGLE_DAYS = ['M', 'T', 'W', 'R', 'F']

function hash(text: string): number {
  let value = 2166136261
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i)
    value = Math.imul(value, 16777619)
  }
  return (value >>> 0) / 4294967296
}

function pick<T>(items: T[], seed: string): T {
  return items[Math.floor(hash(seed) * items.length)]
}

function addMinutes(time: string, minutes: number): string {
  const total = Number(time.slice(0, 2)) * 60 + Number(time.slice(2)) + minutes
  return `${String(Math.floor(total / 60)).padStart(2, '0')}${String(total % 60).padStart(2, '0')}`
}

/** Lecture A and its A1/A2 tutorials share a delivery mode. */
function chooseGroupMode(groupKey: string, isWeekly: boolean): DeliveryMode {
  const roll = hash(`mode:${groupKey}`)
  if (isWeekly) {
    if (roll < 0.15) return 'ONLINE_ASYNC'
    if (roll < 0.3) return 'ONLINE_SYNC'
    return 'IN_PERSON'
  }
  if (roll < 0.35) return 'ONLINE_ASYNC'
  if (roll < 0.6) return 'ONLINE_SYNC'
  if (roll < 0.75) return 'HYBRID'
  return 'IN_PERSON'
}

function generateMeeting(sectionId: string, sectionType: string): { days: string; startTime: string; endTime: string } {
  if (sectionType === 'LAB' || sectionType === 'STU') {
    const [startTime, endTime] = pick(LONG_BLOCKS.slice(0, 3), `lab:${sectionId}`)
    return { days: pick(SINGLE_DAYS, `day:${sectionId}`), startTime, endTime }
  }
  if (WEEKLY_TYPES.has(sectionType)) {
    const startTime = pick(LECTURE_STARTS, `start:${sectionId}`)
    return { days: pick(SINGLE_DAYS, `day:${sectionId}`), startTime, endTime: addMinutes(startTime, 80) }
  }
  if (hash(`long:${sectionId}`) < 0.3) {
    const [startTime, endTime] = pick(LONG_BLOCKS, `block:${sectionId}`)
    return { days: pick(SINGLE_DAYS.slice(0, 4), `day:${sectionId}`), startTime, endTime }
  }
  const startTime = pick(LECTURE_STARTS, `start:${sectionId}`)
  return { days: pick(DAY_PAIRS, `days:${sectionId}`), startTime, endTime: addMinutes(startTime, 80) }
}

async function getTermDates(): Promise<Map<string, { startDate: string | null; endDate: string | null }>> {
  const rows = await prisma.$queryRaw<{ term: string; startDate: string | null; endDate: string | null }[]>`
    SELECT DISTINCT ON (s."term") s."term", m."startDate", m."endDate"
    FROM "section_meetings" m JOIN "sections" s ON s."id" = m."sectionId"
    WHERE m."startDate" IS NOT NULL AND s."term" IS NOT NULL
    GROUP BY s."term", m."startDate", m."endDate"
    ORDER BY s."term", COUNT(*) DESC
  `
  return new Map(rows.map(row => [row.term, { startDate: row.startDate, endDate: row.endDate }]))
}

async function revert() {
  const simulated = await prisma.sectionMeeting.findMany({ where: { id: { startsWith: ID_PREFIX } }, select: { sectionId: true } })
  const sectionIds = Array.from(new Set(simulated.map(meeting => meeting.sectionId)))
  await prisma.$transaction([
    prisma.section.updateMany({ where: { id: { in: sectionIds } }, data: { deliveryMode: null } }),
    prisma.sectionMeeting.deleteMany({ where: { id: { startsWith: ID_PREFIX } } }),
  ])
  console.log(`Reverted ${sectionIds.length} simulated sections.`)
}

async function simulate() {
  const termDates = await getTermDates()
  const sections = await prisma.section.findMany({
    select: { id: true, courseId: true, term: true, sectionCode: true, sectionType: true, meetings: { select: { id: true, startTime: true } } },
  })

  const meetings: { id: string; sectionId: string; days: string | null; startTime: string | null; endTime: string | null; startDate: string | null; endDate: string | null }[] = []
  const modes = new Map<DeliveryMode, string[]>()
  const setMode = (mode: DeliveryMode, sectionId: string) => modes.set(mode, [...(modes.get(mode) || []), sectionId])

  for (const section of sections) {
    if (section.meetings.some(meeting => meeting.id.startsWith(ID_PREFIX))) continue
    const isTimed = section.meetings.some(meeting => meeting.startTime)
    const dates = termDates.get(section.term || '') || { startDate: null, endDate: null }

    // Carleton's "V" sections are online; keep their real times when they have them.
    if (section.sectionCode.startsWith('V')) {
      const mode: DeliveryMode = isTimed ? 'ONLINE_SYNC' : 'ONLINE_ASYNC'
      setMode(mode, section.id)
      meetings.push({ id: `${ID_PREFIX}${section.id}`, sectionId: section.id, days: null, startTime: null, endTime: null, ...dates })
      continue
    }
    if (isTimed || UNSCHEDULED_TYPES.has(section.sectionType)) continue

    const isWeekly = WEEKLY_TYPES.has(section.sectionType)
    const groupKey = `${section.term}:${section.courseId}:${section.sectionCode.charAt(0)}`
    let mode = chooseGroupMode(groupKey, isWeekly)
    // Hybrid courses keep their labs on campus.
    if (mode === 'HYBRID' && section.sectionType === 'LAB') mode = 'IN_PERSON'
    setMode(mode, section.id)

    const meeting = mode === 'ONLINE_ASYNC'
      ? { days: null, startTime: null, endTime: null }
      : generateMeeting(section.id, section.sectionType)
    meetings.push({ id: `${ID_PREFIX}${section.id}`, sectionId: section.id, ...meeting, ...dates })
  }

  await prisma.$transaction(async tx => {
    for (let i = 0; i < meetings.length; i += 500) {
      await tx.sectionMeeting.createMany({ data: meetings.slice(i, i + 500), skipDuplicates: true })
    }
    for (const [mode, ids] of modes) {
      await tx.section.updateMany({ where: { id: { in: ids } }, data: { deliveryMode: mode } })
    }
  }, { timeout: 120000 })

  console.log(`Simulated ${meetings.length} sections:`)
  for (const [mode, ids] of modes) console.log(`  ${mode}: ${ids.length}`)
}

(process.argv.includes('--revert') ? revert() : simulate())
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
