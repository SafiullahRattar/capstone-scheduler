/*
 * Generates Carleton-style HTML degree audits for simulated Software Engineering
 * students, so the real parser and planner can be tested against many histories.
 *
 * Two layouts are supported:
 *   - 'live'   matches a page saved from Carleton Central: the real Fall 2021
 *              curriculum (quarter-credit ECOR courses, zero-credit requirements),
 *              the name only in the page header, year standing, residency, CGPA
 *              summary, and "Courses Set Aside" blocks for failures and co-op.
 *   - 'simple' matches the hand-made test-audit.html.
 *
 * A persona describes how a student moved through the program: course load,
 * terms off, failures, retakes and elective choices. The generator walks the
 * terms from the start term up to the "as of" term, takes courses in curriculum
 * order once their prerequisites are passed, and marks the as-of term's courses CUR.
 */

export type AuditFormat = 'live' | 'simple'
type Slot = 'tech' | 'cs' | 'complementary' | 'program' | 'science' | 'science3'

export interface Persona {
  id: string
  name: string
  studentId: string
  description: string
  /** Courses per enrolled term, counted as 0.5-credit courses (so 5 means 2.5 credits). */
  load: number
  /** Override the load for specific terms, e.g. { '26FA': 2 }. */
  loadByTerm?: Record<string, number>
  /** Also enrol in summer terms. */
  summers?: boolean
  /** Terms the student was not enrolled (co-op, leave). */
  skip?: string[]
  /** The skipped terms were co-op work terms (adds COOP 1000 in the live layout). */
  coop?: boolean
  /** Failing grades by course (F, DEF, NR). */
  fail?: Record<string, string>
  /** Failed courses that are retaken two terms later. */
  retake?: string[]
  /** Fixed grades by course. */
  grades?: Record<string, string>
  /** Courses graded SAT (pass/fail). */
  satisfactory?: string[]
  /** Grade band for every other course. */
  standing: 'high' | 'mid' | 'low'
  /** Elective choices; defaults fill the rest. */
  electives?: Partial<Record<Slot, string[]>>
  /** Last term the student was enrolled; nothing is in progress after it. */
  leftAfter?: string
  /** First term, e.g. '26FA' for a student who started this fall. Defaults to Fall 2021. */
  startTerm?: string
  /** Courses pulled to the front, taken as soon as their prerequisites allow. */
  order?: string[]
  /** Courses pushed to the end, e.g. half of second year left for later. */
  postpone?: string[]
  /** Passed courses retaken later to raise the grade: course → grade on the second attempt. */
  upgrade?: Record<string, string>
}

export interface GeneratedAudit {
  html: string
  expected: {
    completed: string[]
    current: string[]
    failed: string[]
    /** Listed courses in requirements that still need credits (not completed or in progress). */
    remainingCore: string[]
  }
}

interface Subreq { pseudo: string; title: string; required: number; courses?: string[]; slot?: Slot }
interface Block { rname: string; title: string; category: string; subreqs: Subreq[] }
interface Program {
  blocks: Block[]
  /** Order courses are usually taken in; slot names expand to the student's electives. */
  sequence: (string | Slot)[]
  credits: Record<string, number>
  defaults: Record<Slot, string[]>
}

const SIMPLE_PROGRAM: Program = {
  blocks: [
    { rname: 'BENG8P-1', title: 'FIRST YEAR', category: 'Year_1', subreqs: [
      { pseudo: '8P1-1', title: '4.0 credits in ECOR 1041, ECOR 1042, ECOR 1043, ECOR 1044, ECOR 1055, MATH 1004, MATH 1104, PHYS 1004', required: 4, courses: ['ECOR 1041', 'ECOR 1042', 'ECOR 1043', 'ECOR 1044', 'ECOR 1055', 'MATH 1004', 'MATH 1104', 'PHYS 1004'] },
      { pseudo: 'RBASIC SCI', title: '0.0 credit in Basic Science Electives', required: 0 },
    ] },
    { rname: 'BENG8P-2', title: 'SECOND YEAR', category: 'Year_2', subreqs: [
      { pseudo: '8P2-1', title: '4.0 credits in SYSC 2004, SYSC 2006, SYSC 2100, SYSC 2310, MATH 2004, MATH 2107, STAT 2605, ELEC 2501', required: 4, courses: ['SYSC 2004', 'SYSC 2006', 'SYSC 2100', 'SYSC 2310', 'MATH 2004', 'MATH 2107', 'STAT 2605', 'ELEC 2501'] },
      { pseudo: 'RBASIC SCI', title: '0.0 credit in Basic Science Electives', required: 0 },
    ] },
    { rname: 'BENG8P-3', title: 'THIRD YEAR', category: 'Year_3', subreqs: [
      { pseudo: '8P3-1', title: '5.0 credits in SYSC 3006, SYSC 3020, SYSC 3101, SYSC 3110, SYSC 3120, SYSC 3303, SYSC 3310, SYSC 3600, SYSC 3601, ELEC 3500', required: 5, courses: ['SYSC 3006', 'SYSC 3020', 'SYSC 3101', 'SYSC 3110', 'SYSC 3120', 'SYSC 3303', 'SYSC 3310', 'SYSC 3600', 'SYSC 3601', 'ELEC 3500'] },
      { pseudo: '8P3-3', title: '0.5 credit in CCDP 2100', required: 0.5, courses: ['CCDP 2100'] },
    ] },
    { rname: 'BENG8P-4', title: 'FOURTH YEAR', category: 'Year_4', subreqs: [
      { pseudo: '8P4-1', title: '2.5 credits in Approved Software Engineering Technical Electives', required: 2.5, slot: 'tech' },
      { pseudo: '8P4-2', title: '0.5 credit in Approved Program Elective', required: 0.5, slot: 'program' },
      { pseudo: '8P4-3A', title: '1.5 credits in SYSC 4806, SYSC 4907', required: 1.5, courses: ['SYSC 4806', 'SYSC 4907'] },
      { pseudo: '8P4-3', title: '1.0 credit in Computer Science Electives for Software<br />Engineering', required: 1, slot: 'cs' },
    ] },
    { rname: 'ECOMP_1.0', title: 'COMPLEMENTARY STUDIES, CCDP 2100, ECOR 1055/1056/1057/2995<br />1.0 credits required', category: 'Complementary', subreqs: [
      { pseudo: 'ECOMP-1', title: 'CCDP 2100 (formerly ALSS 1000)', required: 0.5, courses: ['CCDP 2100'] },
      { pseudo: 'ENG-COMP', title: '0.5 credit in Complementary Studies', required: 0.5, slot: 'complementary' },
    ] },
  ],
  sequence: [
    'ECOR 1041', 'ECOR 1042', 'ECOR 1055', 'MATH 1004', 'ECOR 1043', 'ECOR 1044', 'MATH 1104', 'PHYS 1004',
    'SYSC 2004', 'SYSC 2006', 'MATH 2004', 'STAT 2605', 'SYSC 2100', 'SYSC 2310', 'MATH 2107', 'ELEC 2501',
    'SYSC 3006', 'SYSC 3020', 'SYSC 3120', 'SYSC 3600', 'ELEC 3500', 'CCDP 2100', 'SYSC 3101', 'SYSC 3110', 'SYSC 3303', 'SYSC 3310', 'SYSC 3601',
    'SYSC 4806', 'SYSC 4907', 'tech', 'cs', 'program', 'complementary',
  ],
  credits: { 'SYSC 4907': 1 },
  defaults: {
    tech: ['SYSC 4001', 'SYSC 4101', 'SYSC 4005', 'SYSC 4120', 'SYSC 4504'],
    program: ['SYSC 4602'],
    cs: ['COMP 3004', 'COMP 3804'],
    complementary: ['ECON 1001'],
    science: [],
    science3: [],
  },
}

// Requirement structure and titles copied from a live Fall 2021 BENG-8P audit.
const LIVE_PROGRAM: Program = {
  blocks: [
    { rname: 'ECOMP 1.5', title: 'COMPLEMENTARY STUDIES, CCDP 2100, ECOR 1055/1056/1057/2995<br>1.5 credits required', category: 'Complementary', subreqs: [
      { pseudo: 'ECOMP-1', title: 'CCDP 2100 (formerly ALSS 1000)', required: 0.5, courses: ['CCDP 2100'] },
      { pseudo: 'ENG-COMP', title: '1.0 credit in Complementary Studies', required: 1, slot: 'complementary' },
      { pseudo: 'RENGINTRO', title: 'FIRST YEAR REQUIREMENT<br>The Introduction to Engineering Disciplines requirement<br>must be met through the successful completion of<br>ECOR 1055 [0.0], ECOR 1056 [0.0], ECOR 1057 [0.0]', required: 0, courses: ['ECOR 1055', 'ECOR 1056', 'ECOR 1057'] },
      { pseudo: 'ENGPORT', title: 'Successful completion of ECOR 2995 [0.0]', required: 0, courses: ['ECOR 2995'] },
    ] },
    { rname: 'BENG8P-1', title: 'FIRST YEAR', category: 'Year_1', subreqs: [
      { pseudo: '8P1-1', title: '4.0 credits in CHEM 1101, ECOR 1041, ECOR 1042,<br>ECOR 1043, ECOR 1044, ECOR 1045, ECOR 1046, ECOR 1047,<br>ECOR 1048, MATH 1004, MATH 1104, PHYS 1004', required: 4, courses: ['CHEM 1101', 'ECOR 1041', 'ECOR 1042', 'ECOR 1043', 'ECOR 1044', 'ECOR 1045', 'ECOR 1046', 'ECOR 1047', 'ECOR 1048', 'MATH 1004', 'MATH 1104', 'PHYS 1004'] },
      { pseudo: 'RBASIC SCI', title: '0.5 credit in Basic Science Electives', required: 0.5, slot: 'science' },
    ] },
    { rname: 'BENG8P-2', title: 'SECOND YEAR', category: 'Year_2', subreqs: [
      { pseudo: '8P2-1', title: '4.5 credits in COMP 1805, COMP 2804, ELEC 2501,<br>MATH 1005, SYSC 2004, SYSC 2006, SYSC 2100, SYSC 2310,<br>SYSC 2320', required: 4.5, courses: ['COMP 1805', 'COMP 2804', 'ELEC 2501', 'MATH 1005', 'SYSC 2004', 'SYSC 2006', 'SYSC 2100', 'SYSC 2310', 'SYSC 2320'] },
    ] },
    { rname: 'BENG8P-3', title: 'THIRD YEAR', category: 'Year_3', subreqs: [
      { pseudo: '8P3-1', title: '5.0 credits in COMP 3005, ECOR 2050, SYSC 3101,<br>SYSC 3110, SYSC 3120, SYSC 3303, SYSC 3310,<br>SYSC 4001, SYSC 4106, SYSC 4120', required: 5, courses: ['COMP 3005', 'ECOR 2050', 'SYSC 3101', 'SYSC 3110', 'SYSC 3120', 'SYSC 3303', 'SYSC 3310', 'SYSC 4001', 'SYSC 4106', 'SYSC 4120'] },
      { pseudo: 'RBASIC SCI', title: '0.5 credit from ELEC 2507, ELEC 4705 or Basic<br>Science Electives', required: 0.5, courses: ['ELEC 2507', 'ELEC 4705'], slot: 'science3' },
    ] },
    { rname: 'BENG8P-4', title: 'FOURTH YEAR', category: 'Year_4', subreqs: [
      { pseudo: '8P4-1', title: '2.0 credits in ECOR 4995, SYSC 4101, SYSC 4806,<br>SYSC 4810', required: 2, courses: ['ECOR 4995', 'SYSC 4101', 'SYSC 4806', 'SYSC 4810'] },
      { pseudo: '8P4-1A', title: '1.0 credit from SYSC 4907 [1.0]', required: 1, courses: ['SYSC 4907'] },
      { pseudo: '8P4-2', title: '1.0 credit from SYSC or ELEC courses at the 3000-level<br>or above', required: 1, slot: 'tech' },
      { pseudo: '8P4-3', title: '1.0 credit in ELEC or SYSC at the 3000-level or<br>1.0 credit in Computer Science Electives for Software<br>Engineering.', required: 1, slot: 'cs' },
    ] },
  ],
  sequence: [
    'ECOR 1041', 'ECOR 1042', 'ECOR 1043', 'ECOR 1044', 'ECOR 1055', 'ECOR 1056', 'MATH 1004', 'CHEM 1101',
    'ECOR 1045', 'ECOR 1046', 'ECOR 1047', 'ECOR 1048', 'ECOR 1057', 'MATH 1104', 'PHYS 1004', 'science',
    'SYSC 2004', 'SYSC 2006', 'COMP 1805', 'MATH 1005', 'ELEC 2501',
    'SYSC 2100', 'SYSC 2310', 'SYSC 2320', 'COMP 2804', 'CCDP 2100', 'complementary',
    'SYSC 3101', 'SYSC 3120', 'SYSC 4001', 'COMP 3005', 'ECOR 2050', 'ECOR 2995',
    'SYSC 3110', 'SYSC 3303', 'SYSC 3310', 'SYSC 4106', 'SYSC 4120', 'science3',
    'ECOR 4995', 'SYSC 4101', 'SYSC 4806', 'SYSC 4810', 'SYSC 4907', 'tech', 'cs',
  ],
  credits: {
    'ECOR 1041': 0.25, 'ECOR 1042': 0.25, 'ECOR 1043': 0.25, 'ECOR 1044': 0.25,
    'ECOR 1045': 0.25, 'ECOR 1046': 0.25, 'ECOR 1047': 0.25, 'ECOR 1048': 0.25,
    'ECOR 1055': 0, 'ECOR 1056': 0, 'ECOR 1057': 0, 'ECOR 2995': 0, 'SYSC 4907': 1,
  },
  defaults: {
    tech: ['SYSC 4005', 'SYSC 4504'],
    program: [],
    cs: ['COMP 3004', 'COMP 3804'],
    complementary: ['ECON 1001', 'PSYC 1001'],
    science: ['ERTH 1011'],
    science3: ['ELEC 2507'],
  },
}

// In-program prerequisites (from the course database), so a student can't take a course before passing these.
const PREREQS: Record<string, string[]> = {
  'SYSC 2100': ['SYSC 2006'],
  'SYSC 3101': ['SYSC 2004'],
  'SYSC 3110': ['SYSC 2004', 'SYSC 2100'],
  'SYSC 3120': ['SYSC 2004'],
  'SYSC 4806': ['SYSC 3110'],
}

const GRADE_BANDS: Record<Persona['standing'], string[]> = {
  high: ['A+', 'A', 'A', 'A-', 'A-', 'B+'],
  mid: ['A-', 'B+', 'B', 'B', 'B-', 'C+'],
  low: ['B-', 'C+', 'C', 'C-', 'D+', 'D'],
}
// Carleton's 12-point scale.
const GRADE_POINTS: Record<string, number> = { 'A+': 12, A: 11, 'A-': 10, 'B+': 9, B: 8, 'B-': 7, 'C+': 6, C: 5, 'C-': 4, 'D+': 3, D: 2, 'D-': 1, F: 0 }
const FAILING = new Set(['F', 'DEF', 'UNS', 'X', 'NR'])
const SEASONS = ['WN', 'SU', 'FA']

function hash(text: string): number {
  let value = 2166136261
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i)
    value = Math.imul(value, 16777619)
  }
  return (value >>> 0) / 4294967296
}

const normalize = (code: string) => code.replace(/\s+/g, '').toUpperCase()

function termIndex(term: string): number {
  return Number(term.slice(0, 2)) * 3 + SEASONS.indexOf(term.slice(2))
}

/** Term codes from `start` (default Fall 2021), e.g. 21FA, 22WN, 22SU, 22FA ... up to and including `asOf`. */
export function termSequence(asOf: string, summers: boolean, start = '21FA'): string[] {
  if (termIndex(asOf) < termIndex(start)) throw new Error(`Term ${asOf} is before ${start}`)
  const terms: string[] = []
  for (let index = termIndex(start); index <= termIndex(asOf); index++) {
    const term = `${String(Math.floor(index / 3)).padStart(2, '0')}${SEASONS[index % 3]}`
    if (!term.endsWith('SU') || summers) terms.push(term)
  }
  return terms
}

/** The term in progress for a given date, e.g. October 2026 → 26FA. */
export function currentAuditTerm(today = new Date()): string {
  const year = String(today.getFullYear() % 100).padStart(2, '0')
  const month = today.getMonth() + 1
  return `${year}${month >= 9 ? 'FA' : month >= 5 ? 'SU' : 'WN'}`
}

interface Row { term: string; code: string; grade: string; repeat: boolean }

export function generateAudit(persona: Persona, asOf: string, format: AuditFormat = 'live'): GeneratedAudit {
  const program = format === 'live' ? LIVE_PROGRAM : SIMPLE_PROGRAM
  const credits = (code: string) => program.credits[code] ?? (code === 'COOP 1000' ? 0 : 0.5)
  const picks = (slot: Slot) => persona.electives?.[slot] ?? program.defaults[slot]
  const curriculum = program.sequence.flatMap(item => (item in program.defaults ? picks(item as Slot) : [item as string]))
  const front = (persona.order || []).filter(code => curriculum.includes(code))
  const back = (persona.postpone || []).filter(code => curriculum.includes(code) && !front.includes(code))
  const queue = [...front, ...curriculum.filter(code => !front.includes(code) && !back.includes(code)), ...back]
  const startTerm = persona.startTerm ?? '21FA'

  const rows: Row[] = []
  const lastTerm = persona.leftAfter ?? asOf
  for (const term of termSequence(asOf, Boolean(persona.summers), startTerm)) {
    if (persona.skip?.includes(term)) continue
    if (persona.leftAfter && termIndex(term) > termIndex(persona.leftAfter)) break
    // Load is counted in credits so quarter-credit and zero-credit courses fit naturally.
    const capacity = (persona.loadByTerm?.[term] ?? persona.load) * 0.5
    const passedBefore = new Set(rows.filter(row => !FAILING.has(row.grade) && row.grade !== 'CUR').map(row => row.code))
    const taking: string[] = []
    let used = 0
    for (let i = 0; i < queue.length && used < capacity; i++) {
      const code = queue[i]
      if (used + credits(code) > capacity || !(PREREQS[code] || []).every(prereq => passedBefore.has(prereq))) continue
      taking.push(...queue.splice(i--, 1))
      used += credits(code)
    }
    for (const code of taking) {
      const repeat = rows.some(row => row.code === code)
      const grade = term === asOf && term === lastTerm
        ? 'CUR'
        : persona.fail?.[code] && !repeat
          ? persona.fail[code]
          : repeat && persona.upgrade?.[code]
            ? persona.upgrade[code]
            : persona.satisfactory?.includes(code)
              ? 'SAT'
              : persona.grades?.[code] ?? GRADE_BANDS[persona.standing][Math.floor(hash(`${persona.id}:${code}`) * 6)]
      rows.push({ term, code, grade, repeat })
      // A retaken failure, or a pass being upgraded, comes back two terms later.
      const retakes = FAILING.has(grade) ? persona.retake?.includes(code) : Boolean(persona.upgrade?.[code]) && !repeat && grade !== 'CUR'
      if (retakes) queue.splice(Math.min(queue.length, persona.load), 0, code)
    }
    if (queue.length === 0) break
  }

  // Co-op students have COOP 1000 on their record; the live audit sets it aside as no credit.
  const firstCoopTerm = persona.skip?.find(term => termIndex(term) >= termIndex(startTerm) && termIndex(term) <= termIndex(asOf))
  if (format === 'live' && persona.coop && firstCoopTerm) rows.push({ term: firstCoopTerm, code: 'COOP 1000', grade: 'SAT', repeat: false })

  const latest = new Map<string, string>()
  for (const row of rows) latest.set(row.code, row.grade)
  const isDone = (code: string) => { const grade = latest.get(code); return Boolean(grade && grade !== 'CUR' && !FAILING.has(grade)) }
  const isCurrent = (code: string) => latest.get(code) === 'CUR'

  // Evaluate every sub-requirement once; both layouts render from this.
  const remainingCore = new Set<string>()
  const evaluated = program.blocks.map(block => ({
    block,
    subreqs: block.subreqs.map(sub => {
      const counted = [...(sub.courses || []), ...(sub.slot ? picks(sub.slot) : [])]
      const earned = counted.filter(isDone).reduce((sum, code) => sum + credits(code), 0)
      const pending = counted.filter(isCurrent).reduce((sum, code) => sum + credits(code), 0)
      const listedDone = (sub.courses || []).every(isDone)
      const status = sub.required === 0
        ? (listedDone ? 'OK' : 'NO')
        : earned >= sub.required ? 'OK' : earned + pending >= sub.required && pending > 0 ? 'IP' : 'NO'
      if (sub.required - earned - pending > 0) {
        for (const code of sub.courses || []) if (!isDone(code) && !isCurrent(code)) remainingCore.add(normalize(code))
      }
      return {
        sub, status,
        earned: Math.min(earned, sub.required),
        pending: Math.min(pending, Math.max(sub.required - earned, 0)),
        rows: rows.filter(row => counted.includes(row.code) && (format === 'simple' || !FAILING.has(row.grade))),
      }
    }),
  }))

  const totalCredits = [...latest.keys()].filter(isDone).reduce((sum, code) => sum + credits(code), 0)
  const html = format === 'live'
    ? renderLive(persona, startTerm, evaluated, rows, totalCredits, credits)
    : renderSimple(persona, startTerm, evaluated, credits)

  return {
    html: html.replace(/[\t ]+$/gm, ''),
    expected: {
      completed: [...latest.keys()].filter(isDone).map(normalize).sort(),
      current: [...latest.keys()].filter(isCurrent).map(normalize).sort(),
      failed: [...latest.entries()].filter(([, grade]) => FAILING.has(grade)).map(([code]) => normalize(code)).sort(),
      remainingCore: [...remainingCore].sort(),
    },
  }
}

type Evaluated = { block: Block; subreqs: { sub: Subreq; status: string; earned: number; pending: number; rows: Row[] }[] }[]

const statusWord = (status: string) => (status === 'OK' ? 'Complete' : status === 'IP' ? 'In-progress' : 'Unfulfilled')

// The parser reads in-progress credits from this row; real in-progress markup hasn't been checked against a live audit.
const ipRow = (pending: number, liveCells: boolean) => pending > 0
  ? liveCells
    ? `\n<tr class="subreqIpHours">\n<td class="hours number">${pending.toFixed(2)}</td><td class="hourslabel fieldlabel">cr. In-progress</td>\n</tr>`
    : `<tr class="subreqIpHours"><td class="hours number">${pending.toFixed(2)}</td><td class="hourslabel fieldlabel">cr. In-progress</td></tr>`
  : ''

function renderSimple(persona: Persona, startTerm: string, evaluated: Evaluated, credits: (code: string) => number): string {
  const startYear = `20${startTerm.slice(0, 2)}`
  const [first, last] = persona.name.split(' ')
  const blocks = evaluated.map(({ block, subreqs }) => {
    const ok = subreqs.every(item => item.status === 'OK')
    const required = block.subreqs.reduce((sum, sub) => sum + sub.required, 0)
    const earned = subreqs.reduce((sum, item) => sum + item.earned, 0)
    const subHtml = subreqs.map(({ sub, status, earned: subEarned, pending, rows }, index) => `
<div class="subrequirement" id="${sub.pseudo}" pseudo="${sub.pseudo}" rqdHours="${sub.required.toFixed(2)}" maxHours="${sub.required.toFixed(2)}">
<div class="subreqPretext"><span class="status Status_${status}"><span class="sr-only hidden-print">Sub-Requirement ${statusWord(status)}</span></span><span class="subreqNumber">${index + 1})</span></div>
<div class="subreqBody">
<span class="subreqTitle srTitle_substatus${status}">${sub.title}</span>
<table class="subrequirementTotals"><tr class="subreqEarned"><td class="bigcolumn"><span class="hours number">${subEarned.toFixed(2)}</span><span class="hourslabel fieldlabel">cr. Complete</span></td></tr>${ipRow(pending, false)}</table>
${rows.length ? `<table class="completedCourses" summary="complete course table">
${rows.map(row => `<tr class="takenCourse "><td class="term" aria-label="term">${row.term}</td><td class="course" aria-label="course">${row.code}</td><td class="credit" aria-label="credit">${credits(row.code).toFixed(2)}</td><td class="grade" aria-label="grade">${row.grade.padEnd(4)}</td></tr>`).join('\n')}
</table>` : ''}
</div>
</div>`).join('')
    return `
<!-- ==================== ${block.title.replace(/<br \/>.*/, '')} ==================== -->
<div class="requirement Status_${ok ? 'OK' : 'NO'} category_${block.category} rname_${block.rname.replace(/\s/g, '_')} rtabx_10" id="req-${block.rname}" rname="${block.rname}" pseudo="${block.rname}" rqdSubreq="${subreqs.length}" rqdCount="0" rqdGpa="0" rqdHours="${required.toFixed(2)}" maxHours="${required.toFixed(2)}" authCode1=" " authCode2=" ">
<div class="reqHeaderTable">
<h3 class="sr-only">Requirement: ${block.title.replace(/<br \/>.*/, '')}</h3>
<div class="reqStatusGroup"><div class="status status${ok ? 'OK' : 'NO'}"><span class="sr-only hidden-print">Requirement ${ok ? 'Complete' : 'Unfulfilled'}</span></div></div>
<div class="reqText"><div class="reqTitle">${block.title}</div></div>
</div>
<div class="reqBody">
<table class="requirementTotals"><tr class="reqEarned"><td class="hourscount bigcolumn"><span class="hours number">${earned.toFixed(2)}</span><span class="hourslabel smallfieldlabel">Credit</span></td></tr></table>
<div class="auditSubrequirements">${subHtml}
</div>
<hr/>
</div>
</div>`
  }).join('\n')
  const allOk = evaluated.every(({ subreqs }) => subreqs.every(item => item.status === 'OK'))

  return `<!DOCTYPE html><html lang="en-US">
<head>
<meta http-equiv="content-type" content="text/html; charset=ISO-8859-1" />
<title>My Audit - Audit Results Tab</title>
</head>
<body>
<!-- Simulated audit "${persona.id}": ${persona.description} -->
<header class="hidden-print">
<div id="header" class="d-none d-lg-block">
<div id="headerInfo" class="float-right">
<span class="float-right">${persona.name}</span><br/>
<span class="float-right">Undergraduate</span><br/>
</div>
</div>
</header>
<div class="container-fluid" id="main" role="main">
<div>
<h1 class="sr-only">Audit Results</h1>
<div class="auditTitle">
${last}, ${first}<br/>
Bachelor of Engineering - Software Engineering<br/>
</div>
<div class="auditHeader verticalListing row">
<div class="auditHeaderEntryLabel col-1"><h><b>Student ID</b></h></div>
<div class="auditHeaderEntry col-3"><h>${persona.studentId}</h></div>
<div class="auditHeaderEntryLabel col-1"><h><b>Catalog Year</b></h></div>
<div class="auditHeaderEntry col-3"><h>Fall ${startYear}</h></div>
</div>
<div id="auditResults">
<div id="audit">
<div id="auditHeader">
<div class="includeTopText preformatted">
Email: ${(first + last).toUpperCase()}@cmail.carleton.ca
Admit Term: ${startYear}  Fall
Your program is in the Faculty:Engineering &amp; Design
</div>
<div class="completionText${allOk ? 'OK' : 'NO'}">${allOk ? 'ALL REQUIREMENTS HAVE BEEN SATISFIED' : 'AT LEAST ONE REQUIREMENT HAS NOT BEEN SATISFIED'}</div>
</div>
<div id="auditRequirements">
${blocks}
</div> <!-- end auditRequirements -->
<div id="endText">***  End of Audit  ***</div>
</div>
</div>
</div>
</div>
</body>
</html>
`
}

function renderLive(persona: Persona, startTerm: string, evaluated: Evaluated, rows: Row[], totalCredits: number, credits: (code: string) => number): string {
  const startYear = `20${startTerm.slice(0, 2)}`
  const [first, last] = persona.name.split(' ')
  let ids = 0
  const uuid = () => { ids += 1; const h = Math.floor(hash(`${persona.id}:${ids}`) * 0xffffffff).toString(16).padStart(8, '0'); return `${h}-${h.slice(0, 4)}-4${h.slice(1, 4)}-a${h.slice(4, 7)}-${h}${h.slice(0, 4)}` }

  const courseRow = (row: Row, failed = false) => `<tr class="takenCourse ">
<td class="term" aria-label="term">${row.term}</td>
<td class="course" aria-label="course">${row.code}</td>
<td class="credit" aria-label="credit"> ${(failed ? 0 : credits(row.code)).toFixed(2)} </td>
<td class="grade" aria-label="grade">${row.grade.padEnd(4)}</td>
<td class="ccode" aria-label="condition code">${failed ? '>X' : row.repeat ? 'RP' : ''}</td>
<td class="description" aria-label="description">
<table>
</table>
</tr>`
  const courseTable = (list: Row[], failed = false) => list.length
    ? `<table class="completedCourses" summary="complete course table">\n<tbody>${list.map(row => courseRow(row, failed)).join('\n')}\n</tbody></table>`
    : ''
  const subreqHtml = (pseudo: string, number: string, title: string, required: number, status: string, earnedLabel: string, earned: number, pending: number, list: Row[], failed = false) => `
<div class="subrequirement" id="subreq-${uuid()}" pseudo="${pseudo}" pseudolist="[&quot;${pseudo}&quot;]" rqdsubreq="0" rqdgpa="0" rqdhours="${required.toFixed(2)}" maxhours="${required.toFixed(2)}"> 							<div class="subreqPretext">
<span class="subreqSeqErr">  </span>
<span class="subreqRequired"></span>
<span class="status Status_${status}"><span class="sr-only hidden-print">Sub-Requirement ${status === 'NONE' ? '' : statusWord(status)}</span></span>
<span class="subreqNumber">${number}</span>
</div>
<div class="subreqBody">
<div class="subrequirement-buttons"></div>
<span class="subreqTitle srTitle_substatus${status}">${title}</span>
<table class="subrequirementTotals">
<tbody><tr class="subreqEarned">
<td class="bigcolumn">
<span class="hours number"> ${earned.toFixed(2)}</span><span class="hourslabel fieldlabel">${earnedLabel}</span>
</td>
</tr>${ipRow(pending, true)}
</tbody></table>
${courseTable(list, failed)}
</div>
</div> `
  const block = (rname: string, title: string, category: string, status: string, required: number, subs: string, totals = '', header = '') => `
<div class="requirement Status_${status}  ${category ? `category_${category}` : ''}   rname_${rname.replace(/\s/g, '_')}  rtabx_09" id="req-${uuid()}" rname="${rname}" pseudo="${rname}" rqdsubreq="0" rqdcount="0" rqdgpa="0" rqdhours="${required.toFixed(2)}" maxhours="${required.toFixed(2)}" authcode1=" " authcode2=" ">
<div class="reqHeaderTable">
<h3 class="sr-only">Requirement: ${title.replace(/<br>.*/, '')}</h3>
<div class="reqStatusGroup">
<div class="status status${status}"><span class="sr-only hidden-print">Requirement ${status === 'OK' ? 'Complete' : status === 'NONE' ? '' : 'Unfulfilled'}</span></div>
</div>  <div class="reqText">					<div class="requirement-buttons"></div>
<div class="reqHeader">${header}</div>
<div class="reqTitle">${title}						</div>
</div>
</div>
<div class="reqBody">
<table class="requirementTotals">
${totals}</table>
<div class="auditSubrequirements">${subs}
</div>
<hr>
</div>
</div> `
  const earnedTotals = (earned: number) => `<tbody><tr class="reqEarned">
<td class="warnind"></td>
<td class="rowlabel"><span class="warnind"></span>EARNED:</td>
<td class="hourscount bigcolumn">
<span class="hours number">  ${earned.toFixed(2)}</span>
<span class="hourslabel smallfieldlabel">Credits</span>
</td>
</tr>
</tbody>`

  const standing = totalCredits >= 14 ? ['Fourth', 14] : totalCredits >= 9 ? ['Third', 9] : totalCredits >= 4 ? ['Second', 4] : ['First', 0]
  const graded = rows.filter(row => row.grade in GRADE_POINTS)
  const latestGraded = [...new Map(graded.map(row => [row.code, row])).values()]
  const cgpaCredits = latestGraded.reduce((sum, row) => sum + credits(row.code), 0)
  const points = latestGraded.reduce((sum, row) => sum + credits(row.code) * GRADE_POINTS[row.grade], 0)
  const failedRows = rows.filter(row => FAILING.has(row.grade))
  const coopRows = rows.filter(row => row.code === 'COOP 1000')
  const allOk = evaluated.every(({ subreqs }) => subreqs.every(item => item.status === 'OK'))

  const programBlocks = evaluated.map(({ block: spec, subreqs }) => {
    const ok = subreqs.every(item => item.status === 'OK')
    const earned = subreqs.reduce((sum, item) => sum + item.earned, 0)
    const required = spec.subreqs.reduce((sum, sub) => sum + sub.required, 0)
    const subs = subreqs.map((item, index) => subreqHtml(item.sub.pseudo, `${index + 1})`, item.sub.title, item.sub.required, item.status, 'cr. Complete', item.earned, item.pending, item.rows)).join('')
    return block(spec.rname, spec.title, spec.category, ok ? 'OK' : 'NO', required, subs, earnedTotals(earned))
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="en-US">
<head>
<meta http-equiv="content-type" content="text/html; charset=UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>My Audit - Audit Results Tab</title>
</head>
<body>
<!-- Simulated audit "${persona.id}" in the live Carleton Central layout: ${persona.description} -->
<header class="hidden-print">
<div id="header" class="d-none d-lg-block">
<div id="headerInfo" class="float-right">
<span class="float-right">
${persona.name}
</span>
<br>
<span class="float-right">
Undergraduate
</span>
</div>
</div>
</header>
<div class="container-fluid" style="margin-top: 20px;" id="main" role="main">
<div>
<h1 class="sr-only">Audit Results</h1>
<input type="hidden" id="pageGroup" value="audits">
<input type="hidden" id="hoursLabel" value="Credit">
<h1 class="sr-only">Student and Audit Information</h1>
<div class="auditTitle">
<div class="floatright" style="height:60px;">
<a id="pageAddButton" href="https://carleton.uachieve.com/selfservice/audit/create.html" class="btn btn-primary" role="button" style="font-style: normal;">Request Audit</a>
</div>
<!--div -->
<!-- /div -->
<br>
Bachelor of Engineering - Software Engineering<br>
</div>
<div class="auditMessage"></div>
<div class="auditHeader verticalListing row">
<div class="auditHeaderEntryLabel col-1">
<h><b>Prepared On</b></h>
</div>
<div class="auditHeaderEntry col-3">
<h>10/02/2026 11:56 AM</h>
</div>
<div class="auditHeaderEntryLabel col-1">
<h><b>Program Code</b></h>
</div>
<div class="auditHeaderEntry col-3">
<h>BENG-8P</h>
</div>
<div class="auditHeaderEntryLabel col-1">
<h><b>Catalog Year</b></h>
</div>
<div class="auditHeaderEntry col-3">
<h>Fall ${startYear}</h>
</div>
<div class="auditHeaderEntryLabel col-1">
<h><b>Student ID</b></h>
</div>
<div class="auditHeaderEntry col-3">
<h>${persona.studentId}</h>
</div>
<div class="auditHeaderEntryLabel col-1">
<h><b>Graduation Date</b></h>
</div>
<div class="auditHeaderEntry col-3">
<h></h>
</div>
<div class="auditHeaderEntryLabel col-1">
<h><b>Job ID</b></h>
</div>
<div class="auditHeaderEntry col-3">
<h>${persona.studentId}4735875</h>
</div>
</div>
<div id="auditResults">
<div id="audit" dprog="BENG-8P" catlyt="${startYear}30" includeip="false" includeplanned="false">
<div id="auditHeader">
<div class="includeTopText preformatted">
Email: ${(first + last).toUpperCase()}@cmail.carleton.ca
Admit Term: ${startYear}  Fall
Your program is in the Faculty:Engineering &amp; Design
*** Academic Continuation Code Legend ***
(EC)- Eligible to Continue                  (PE)- Pending
</div>
<div class="completionText${allOk ? 'OK' : 'NO'}">${allOk ? '******* ALL REQUIREMENTS IDENTIFIED BELOW HAVE BEEN MET *******' : '******* AT LEAST ONE REQUIREMENT HAS NOT BEEN SATISFIED *******'}</div>
</div>  	<div id="auditRequirements">
${block('ENG NOTE', '', '', 'NONE', 0, '', '', '***IMPORTANT NOTES***<br>ALL ENGINEERING STUDENTS must refer to the Engineering Academic<br>Support Web-site at: www.carleton.ca/engineering/uas<br>for program and registration directions and information.')}
${block('HSTANDENG', 'UNIVERSITY YEAR STANDING IN ENGINEERING', '', 'NONE', 0, subreqHtml('*', '', `${standing[0]} Year Standing - ${Number(standing[1]).toFixed(1)} or more credits completed<br>ALL REQUIREMENTS BELOW MUST BE MET IN ORDER TO GRADUATE`, Number(standing[1]), 'OK', 'cr. Complete', totalCredits, 0, []))}
${block('ENG-RES', 'RESIDENCY REQUIREMENTS', '', 'NONE', 0, subreqHtml('ENGRES', '', 'A minimum of 10.5 Carleton credits.', 10.5, totalCredits >= 10.5 ? 'OK' : 'NO', 'Credits', totalCredits, 0, []))}
${block('GR21-5.0', 'SUMMARY OF CREDITS AND CGPA<br>Engineering Program Only', 'Overall', 'NONE', 21, '', `${earnedTotals(totalCredits).replace('</tbody>', '')}<tr class="reqGpaDetail">
<td class="reqStatusTd"></td>
<td class="rowlabel"></td>
<td class="hourscount bigcolumn">
<span class="hours number"> ${cgpaCredits.toFixed(2)}</span>
<span class="hourslabel fieldlabel">CGPA Credits</span>
</td>
<td class="points number">${points.toFixed(2)}</td>
<td class="pointslabel fieldlabel">Points</td>
<td class="gpa number">${cgpaCredits ? (points / cgpaCredits).toFixed(2) : '0.00'}</td>
<td class="gpalabel">CGPA</td>
</tr>
</tbody>`)}
${programBlocks}
${block('ETD', 'COURSES SET ASIDE', '', 'NONE', 0, subreqHtml('FORFEIT', '', 'Failed and/or Forfeited Courses', 300, 'NONE', 'Credits', 0, 0, failedRows, true))}
${block('NCD-SYSC', 'COURSES SET ASIDE', '', 'NONE', 0, subreqHtml('NCDSYSC', '', 'No credit in this degree program', 300, 'NONE', 'Credits', 0, 0, coopRows))}
${block('DISCLAIM', '', '', 'NONE', 0, '', '', 'This audit is not an official transcript.')}
</div>
<div id="endText">
**********END OF REPORT**********
</div>
</div>
</div>
</div>
</div>
</body>
</html>
`
}

/** Software Engineering students as of Fall 2026, mostly from the Fall 2021 intake. */
export const PERSONAS: Persona[] = [
  {
    id: 'incoming', name: 'Leah Nguyen', studentId: '101200001', standing: 'mid', load: 0, startTerm: '26FA',
    description: 'Admitted for Fall 2026 but not registered in anything yet: no completed or in-progress courses.',
  },
  {
    id: 'first-year', name: 'Jonah Weiss', studentId: '101200002', standing: 'mid', load: 4, startTerm: '26FA',
    description: 'In his first term with first-year courses in progress and nothing completed.',
  },
  {
    id: 'first-year-no-progress', name: 'Jonah Weiss', studentId: '101200002', standing: 'mid', load: 0, startTerm: '26FA',
    description: 'First-year student with nothing completed or in progress; all first-year requirements remain to be planned.',
  },
  {
    id: 'out-of-order', name: 'Ines Duarte', studentId: '101200003', standing: 'high', load: 4, startTerm: '24FA',
    skip: ['26WN'],
    postpone: ['SYSC 2100', 'SYSC 2310', 'SYSC 2320', 'COMP 2804', 'MATH 2107', 'ELEC 2501', 'CCDP 2100', 'ECON 1001', 'PSYC 1001'],
    description: 'Left the second half of second year for later and moved on to third-year courses she has the prerequisites for; SYSC 2100 is still outstanding, so SYSC 3110 stays blocked.',
  },
  {
    id: 'early-electives', name: 'Kofi Mensah', studentId: '101200004', standing: 'mid', load: 5, startTerm: '24FA',
    order: ['ECON 1001', 'COMP 3804'],
    description: 'Took his complementary elective and a CS elective in first year, before most of the core.',
  },
  {
    id: 'grade-upgrade', name: 'Hana Sato', studentId: '101200005', standing: 'mid', load: 5, startTerm: '24FA',
    grades: { 'MATH 1104': 'D-' }, upgrade: { 'MATH 1104': 'B+' },
    description: 'Passed MATH 1104 with a D- and retook it for a B+; the audit should keep the later grade.',
  },
  {
    id: 'final-term', name: 'Maya Chen', studentId: '101100001', standing: 'high', load: 5, coop: true,
    skip: ['23FA', '24FA', '25WN'], loadByTerm: { '22WN': 4 }, satisfactory: ['CCDP 2100'],
    description: 'Did a co-op year and is in her final year, with only fourth-year courses and electives left; took CCDP 2100 pass/fail.',
  },
  {
    id: 'electives-left', name: 'Omar Haddad', studentId: '101100002', standing: 'mid', load: 5, coop: true,
    skip: ['23FA', '24FA', '25WN'],
    electives: { cs: ['COMP 3004', 'COMP 3203'] },
    description: 'Has finished almost all core courses; mostly fourth-year courses and electives remain.',
  },
  {
    id: 'coop-behind', name: 'Priya Raman', studentId: '101100003', standing: 'mid', load: 5, coop: true,
    skip: ['23FA', '24WN', '24FA', '25WN'], loadByTerm: { '21FA': 2 },
    description: 'Two co-op years, so she is in fourth-year courses now.',
  },
  {
    id: 'part-time', name: 'Lucas Martin', studentId: '101100004', standing: 'mid', load: 2,
    description: 'Part-time at about one credit a term, partway through the program.',
  },
  {
    id: 'failed-prereq', name: 'Sofia Rossi', studentId: '101100005', standing: 'low', load: 4,
    skip: ['23FA', '24WN', '24FA', '25WN', '25FA'],
    fail: { 'SYSC 2006': 'F', 'SYSC 2004': 'F' },
    description: 'Failed SYSC 2004 and SYSC 2006 and never retook them, so SYSC 2100, 3101, 3110, 3120 and 4806 are blocked.',
  },
  {
    id: 'retook-course', name: 'Ethan Brooks', studentId: '101100006', standing: 'mid', load: 5, coop: true,
    skip: ['24FA', '25WN', '25FA'],
    fail: { 'MATH 1104': 'F', 'SYSC 2100': 'DEF' }, retake: ['MATH 1104', 'SYSC 2100'],
    description: 'Failed MATH 1104 and deferred SYSC 2100, then passed both on a second attempt.',
  },
  {
    id: 'summer-student', name: 'Grace Okafor', studentId: '101100007', standing: 'high', load: 4, summers: true,
    skip: ['24FA', '25WN', '25SU', '25FA', '26WN', '26SU'],
    description: 'Takes summer courses and is ahead of most of the cohort.',
  },
  {
    id: 'returning-from-leave', name: 'Noah Tremblay', studentId: '101100008', standing: 'low', load: 4,
    skip: ['23FA', '24WN', '24FA', '25WN', '25FA', '26WN'],
    description: 'Took three years off after second year and just came back.',
  },
  {
    id: 'not-enrolled', name: 'Aisha Malik', studentId: '101100009', standing: 'mid',
    load: 4, leftAfter: '25FA', skip: ['24FA', '25WN'],
    description: 'Not enrolled this term, so no courses are in progress.',
  },
  {
    id: 'low-grades', name: 'Daniel Kim', studentId: '101100010', standing: 'low', load: 5,
    skip: ['24FA', '25WN', '25FA', '26WN'],
    grades: { 'SYSC 2004': 'D-', 'SYSC 2006': 'D', 'MATH 1004': 'D-' },
    description: 'Passed several prerequisites with D grades, for testing grade-based prerequisite rules.',
  },
]
