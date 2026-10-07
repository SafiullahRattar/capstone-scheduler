import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseHTML } from '../cli/audit/parse-html'
import { getRemainingCourses } from '../cli/audit-parser'
import { generateAudit, PERSONAS, termSequence, type AuditFormat } from '../scripts/audit-generator'

const AS_OF = '26FA'
const FORMATS: AuditFormat[] = ['live', 'simple']
const persona = (id: string) => PERSONAS.find(item => item.id === id)!

for (const format of FORMATS) {
  for (const item of PERSONAS) {
    test(`[${format}] "${item.id}" parses to the courses it was generated from`, () => {
      const { html, expected } = generateAudit(item, AS_OF, format)
      const audit = parseHTML(html)

      assert.equal(audit.name, item.name)
      assert.equal(audit.studentId, item.studentId)
      assert.equal(audit.program, 'Software Engineering')
      assert.deepEqual(audit.completedCourses.map(course => course.courseId).sort(), expected.completed)
      assert.deepEqual(audit.currentCourses.map(course => course.courseId).sort(), expected.current)
      for (const failed of expected.failed) {
        assert.ok(!expected.completed.includes(failed), `${failed} failed but counted as completed`)
      }

      const remaining = getRemainingCourses(audit)
      for (const code of expected.remainingCore) assert.ok(remaining.includes(code), `${code} should still be needed`)
      for (const code of [...expected.completed, ...expected.current]) assert.ok(!remaining.includes(code), `${code} should not be needed`)
    })
  }

  test(`[${format}] an incoming student with nothing registered still parses, and every course is still needed`, () => {
    const audit = parseHTML(generateAudit(persona('incoming'), AS_OF, format).html)
    assert.equal(audit.completedCourses.length, 0)
    assert.equal(audit.currentCourses.length, 0)
    const remaining = getRemainingCourses(audit)
    for (const code of ['ECOR1041', 'MATH1104', 'SYSC2004', 'SYSC3110', 'SYSC4907', 'CCDP2100']) assert.ok(remaining.includes(code), code)
    // "CCDP 2100 (formerly ALSS 1000)" is one course, not two.
    assert.ok(!remaining.includes('ALSS1000'))
  })

  test(`[${format}] a first-year in their first term has only in-progress courses`, () => {
    const { html, expected } = generateAudit(persona('first-year'), AS_OF, format)
    const audit = parseHTML(html)
    assert.equal(audit.completedCourses.length, 0)
    assert.ok(expected.current.includes('ECOR1041') && expected.current.includes('MATH1004'))
    assert.ok(html.includes('<h>Fall 2026</h>'), 'catalog year follows the start term')
    assert.ok(getRemainingCourses(audit).includes('MATH1104'))
  })

  test(`[${format}] the first-year no-progress audit leaves first-year courses available`, () => {
    const audit = parseHTML(generateAudit(persona('first-year-no-progress'), AS_OF, format).html)
    assert.equal(audit.name, persona('first-year').name)
    assert.equal(audit.completedCourses.length, 0)
    assert.equal(audit.currentCourses.length, 0)
    const remaining = getRemainingCourses(audit)
    const firstYearCourses = ['ECOR1041', 'ECOR1042', 'ECOR1043', 'ECOR1044', 'MATH1004', ...(format === 'live' ? ['CHEM1101'] : [])]
    for (const code of firstYearCourses) assert.ok(remaining.includes(code), `${code} should be available to plan`)
  })

  test(`[${format}] an out-of-order student takes third-year courses before finishing second year`, () => {
    const { expected } = generateAudit(persona('out-of-order'), AS_OF, format)
    const thirdYearStarted = [...expected.completed, ...expected.current].some(code => code.startsWith('SYSC3'))
    assert.ok(thirdYearStarted, 'some third-year course is done or in progress')
    assert.ok(expected.remainingCore.includes('SYSC2100'), 'SYSC 2100 is still outstanding')
    // SYSC 3110 needs SYSC 2100, so it can't have been taken yet.
    assert.ok(expected.remainingCore.includes('SYSC3110'))
  })

  test(`[${format}] electives taken early count toward their requirement`, () => {
    const audit = parseHTML(generateAudit(persona('early-electives'), AS_OF, format).html)
    const cs = audit.requirements.find(item => item.courseOptions.includes('CS_ELECTIVE'))!
    const complementary = audit.requirements.find(item => item.courseOptions.includes('COMPLEMENTARY_STUDIES'))!
    assert.ok(cs.creditsCompleted >= 0.5)
    assert.ok(complementary.creditsCompleted >= 0.5)
  })

  test(`[${format}] a course retaken to raise the grade keeps the later grade`, () => {
    const { html } = generateAudit(persona('grade-upgrade'), AS_OF, format)
    const audit = parseHTML(html)
    assert.equal(audit.completedCourses.find(course => course.courseId === 'MATH1104')?.grade, 'B+')
    assert.equal((html.match(/MATH 1104<\/td>/g) || []).length, 2, 'both attempts are listed')
  })
}

test('[live] layout matches a Carleton Central download', () => {
  const { html } = generateAudit(persona('retook-course'), AS_OF, 'live')
  // The name is only in the page header; the title has the program line first.
  assert.match(html, /<!--div -->\n<!-- \/div -->\n<br>\nBachelor of Engineering - Software Engineering<br>/)
  for (const title of ['UNIVERSITY YEAR STANDING IN ENGINEERING', 'RESIDENCY REQUIREMENTS', 'SUMMARY OF CREDITS AND CGPA', 'COURSES SET ASIDE']) {
    assert.ok(html.includes(title), title)
  }
  // Failed attempts are listed only under "Failed and/or Forfeited Courses", with no credit.
  const setAside = html.slice(html.indexOf('Failed and/or Forfeited Courses'))
  assert.match(setAside, /MATH 1104<\/td>\n<td class="credit" aria-label="credit"> 0\.00 <\/td>\n<td class="grade" aria-label="grade">F   <\/td>\n<td class="ccode" aria-label="condition code">&gt;X|>X/)
  // Co-op shows up as COOP 1000, graded SAT, with no credit toward the degree.
  assert.ok(html.includes('COOP 1000'))
})

test('[live] zero-credit and quarter-credit courses are handled', () => {
  const { html, expected } = generateAudit(persona('final-term'), AS_OF, 'live')
  const audit = parseHTML(html)
  assert.ok(expected.completed.includes('ECOR1055'), 'zero-credit ECOR 1055 is completed')
  assert.ok(html.includes('<td class="credit" aria-label="credit"> 0.25 </td>'), 'ECOR quarter credits')
  assert.equal(audit.completedCourses.find(course => course.courseId === 'CCDP2100')?.grade, 'SAT')
  // Zero-credit requirements never show up as remaining courses.
  assert.ok(!getRemainingCourses(audit).includes('ECOR2995') || !expected.completed.includes('ECOR2995'))
})

test('[live] parser drops the "SYSC or ELEC courses at the 3000-level" requirement, which lists no codes', () => {
  // Documents a known gap: the app can't plan this 1.0-credit requirement.
  const audit = parseHTML(generateAudit(persona('incoming'), AS_OF, 'live').html)
  assert.ok(!audit.requirements.some(item => item.title.includes('SYSC or ELEC courses at the 3000-level')))
})

test('term sequence starts in Fall 2021 and includes summers only when asked', () => {
  assert.deepEqual(termSequence('22FA', false), ['21FA', '22WN', '22FA'])
  assert.deepEqual(termSequence('22FA', true), ['21FA', '22WN', '22SU', '22FA'])
  assert.deepEqual(termSequence('27WN', false, '26FA'), ['26FA', '27WN'])
})

test('personas cover the situations the planner has to handle', () => {
  for (const format of FORMATS) {
    const results = Object.fromEntries(PERSONAS.map(item => [item.id, generateAudit(item, AS_OF, format).expected]))
    assert.equal(results['not-enrolled'].current.length, 0)
    assert.ok(results['failed-prereq'].failed.includes('SYSC2004'))
    assert.ok(results['failed-prereq'].remainingCore.includes('SYSC2004'))
    assert.ok(results['retook-course'].completed.includes('MATH1104'))
    assert.ok(results['part-time'].remainingCore.length > results['final-term'].remainingCore.length)
  }
})
