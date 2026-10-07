import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { PrismaClient } from '@prisma/client'
import { collectUnmetCourseCategories, conflictCategoriesForTerm, eligibleConflictCourseCategories, standingFromEarnedCredits, type ConflictPrerequisiteCourse } from '../shared/conflict-eligibility'
import type { PrerequisiteNodeData, StudentTranscript } from '../shared/prerequisite-evaluator'
import { inspectCourseConflicts } from '../server/lib/course-conflicts'
import { parseHTML } from '../cli/audit/parse-html'
import { parsePDF } from '../cli/audit/parse-pdf'

function node(id: string, nodeType: string, course: string | null = null, parentId: string | null = null, grade: string | null = null, year: string | null = null): PrerequisiteNodeData {
  return { id, nodeType, requiredCourseId: course, parentId, requiredGrade: grade, requiredYear: year }
}
const transcript: StudentTranscript = { completedCourses: ['PHYS1004'], courseGrades: { PHYS1004: 'B' }, currentYear: 'SECOND_YEAR', hasSpecialPermission: false }
const science = { id: 'SCIENCE_ELECTIVE', label: 'Basic Science Elective', courseOptions: ['CHEM1001', 'CHEM2001', 'CHEM3001', 'PHYS1004', 'CHEM1002'] }
const course = (id: string, expression?: string, nodes: PrerequisiteNodeData[] = []): ConflictPrerequisiteCourse => ({ courseId: id, prerequisiteExpression: expression, prerequisiteNodes: nodes })

test('only genuinely unmet audit categories are collected, including categories not selected for this term', () => {
  const requirements = [
    { title: 'Basic Science Elective', status: 'NO', creditsRequired: 1, creditsCompleted: 0.5, creditsInProgress: 0, courseOptions: ['SCIENCE_ELECTIVE'] },
    { title: 'Computer Science Elective', status: 'OK', creditsRequired: 1, creditsCompleted: 1, creditsInProgress: 0, courseOptions: ['CS_ELECTIVE'] },
    { title: 'Complementary Studies', status: 'IP', creditsRequired: 0.5, creditsCompleted: 0, creditsInProgress: 0.5, courseOptions: ['COMPLEMENTARY_STUDIES'] },
  ]
  const electives = [
    { category: science.id, label: science.label, creditsNeeded: 0.5, courseOptions: science.courseOptions },
    { category: 'CS_ELECTIVE', label: 'Computer Science Elective', creditsNeeded: 0, courseOptions: ['COMP3005'] },
    { category: 'COMPLEMENTARY_STUDIES', label: 'Complementary Studies', creditsNeeded: 0, courseOptions: ['ECON1001'] },
  ]
  const categories = collectUnmetCourseCategories(requirements, electives)
  assert.deepEqual(categories, [science])
  assert.deepEqual(collectUnmetCourseCategories([], electives).map(category => category.id), ['SCIENCE_ELECTIVE'])
})

test('eligibility requires category membership, accepts a satisfied OR alternative, and rejects missing AND prerequisites', () => {
  const candidates = [
    course('CHEM1001'),
    course('CHEM2001', 'CHEM1001 || PHYS1004', [node('or', 'OR'), node('chem', 'COURSE', 'CHEM1001', 'or'), node('phys', 'COURSE', 'PHYS1004', 'or')]),
    course('CHEM3001', 'CHEM1001 && PHYS1004', [node('and', 'AND'), node('chem', 'COURSE', 'CHEM1001', 'and'), node('phys', 'COURSE', 'PHYS1004', 'and')]),
    course('COMP3005'), course('PHYS1004'), course('CHEM1002'),
  ]
  const eligible = eligibleConflictCourseCategories(candidates, [science], transcript, ['CHEM1002'])
  assert.deepEqual(Array.from(eligible.keys()), ['CHEM1001', 'CHEM2001'])
  assert.deepEqual(eligible.get('CHEM2001'), [{ id: science.id, label: science.label }])
})

test('unselected elective goals in the audit do not leak into a Basic Science-only term', () => {
  const categories = [science, { id: 'CS_ELECTIVE', label: 'Computer Science Elective', courseOptions: ['COMP2108'] }, { id: 'COMPLEMENTARY_STUDIES', label: 'Complementary Studies', courseOptions: ['BUSI1001', 'ECON2009', 'PHIL1301'] }]
  assert.deepEqual(conflictCategoriesForTerm(categories, categories.map(category => category.id), { SCIENCE_ELECTIVE: 0.5 }, []), [science])
  assert.deepEqual(conflictCategoriesForTerm(categories, categories.map(category => category.id), {}, []), [])
})

test('clicking a Basic Science elective compares its own category even when other goals are queued', () => {
  const categories = [science, { id: 'CS_ELECTIVE', label: 'Computer Science Elective', courseOptions: ['COMP2108'] }, { id: 'COMPLEMENTARY_STUDIES', label: 'Complementary Studies', courseOptions: ['BUSI1001'] }]
  const credits = { SCIENCE_ELECTIVE: 0.5, CS_ELECTIVE: 0.5, COMPLEMENTARY_STUDIES: 0.5 }
  assert.deepEqual(conflictCategoriesForTerm(categories, categories.map(category => category.id), credits, [], 'CHEM1001', { SCIENCE_ELECTIVE: ['CHEM1001'] }), [science])
  assert.deepEqual(conflictCategoriesForTerm(categories, categories.map(category => category.id), credits, [], 'CHEM1001'), [science])
})

test('core-course inspections use selected term goals and only planned core choices', () => {
  const categories = [science, { id: 'CS_ELECTIVE', label: 'Computer Science Elective', courseOptions: ['COMP2108'] }, { id: 'audit:4', label: 'Required courses', courseOptions: ['SYSC4806', 'SYSC4907', 'SYSC4005'] }]
  const scoped = conflictCategoriesForTerm(categories, ['SCIENCE_ELECTIVE', 'CS_ELECTIVE'], { SCIENCE_ELECTIVE: 0.5 }, ['SYSC4806', 'SYSC4907'], 'SYSC4806')
  assert.deepEqual(scoped.map(category => category.id), ['SCIENCE_ELECTIVE', 'audit:4'])
  assert.deepEqual(scoped[1].courseOptions, ['SYSC4806', 'SYSC4907'])
})

test('minimum grades, year standing, and permission must actually be satisfied', () => {
  const category = { ...science, courseOptions: ['CHEM2001', 'CHEM3001', 'CHEM4001'] }
  const candidates = [
    course('CHEM2001', 'PHYS1004[B-]', [node('grade', 'COURSE', 'PHYS1004', null, 'B-')]),
    course('CHEM3001', 'FOURTH_YEAR', [node('year', 'YEAR_STANDING', null, null, null, 'FOURTH_YEAR')]),
    course('CHEM4001', 'PERMISSION', [node('permission', 'PERMISSION')]),
  ]
  assert.deepEqual(Array.from(eligibleConflictCourseCategories(candidates, [category], transcript).keys()), ['CHEM2001'])
  for (const grade of ['C+', 'SAT', 'F']) {
    assert.equal(eligibleConflictCourseCategories(candidates, [category], { ...transcript, courseGrades: { PHYS1004: grade } }).size, 0)
  }
})

test('missing prerequisite data does not imply eligibility, and node-only requirements still apply', () => {
  const category = { ...science, courseOptions: ['CHEM1001', 'CHEM2001', 'CHEM3001'] }
  const eligible = eligibleConflictCourseCategories([
    course('CHEM1001'),
    course('CHEM2001', 'PHYS1004', []),
    course('CHEM3001', undefined, [node('missing', 'COURSE', 'MATH1004')]),
  ], [category], transcript)
  assert.deepEqual(Array.from(eligible.keys()), ['CHEM1001'])
  assert.equal(eligibleConflictCourseCategories([course('CHEM1001')], [], transcript).size, 0)
})

test('year standing uses completed-credit thresholds rather than the highest course number', () => {
  assert.equal(standingFromEarnedCredits(3.75), 'FIRST_YEAR')
  assert.equal(standingFromEarnedCredits(4), 'SECOND_YEAR')
  assert.equal(standingFromEarnedCredits(8.75), 'SECOND_YEAR')
  assert.equal(standingFromEarnedCredits(9), 'THIRD_YEAR')
  assert.equal(standingFromEarnedCredits(13.75), 'THIRD_YEAR')
  assert.equal(standingFromEarnedCredits(14), 'FOURTH_YEAR')
})

test('every independent top-level prerequisite group must be met', () => {
  const candidate = course('CHEM2001', 'PHYS1004 && MATH1004', [node('first', 'COURSE', 'PHYS1004'), node('second', 'COURSE', 'MATH1004')])
  assert.equal(eligibleConflictCourseCategories([candidate], [science], transcript).size, 0)
  assert.equal(eligibleConflictCourseCategories([candidate], [science], { ...transcript, completedCourses: ['PHYS1004', 'MATH1004'] }).size, 1)
})

test('unrecognized year-standing requirements are not assumed satisfied', () => {
  const candidate = course('CHEM2001', 'Unknown standing', [node('year', 'YEAR_STANDING', null, null, null, 'UNRECOGNIZED_YEAR')])
  assert.equal(eligibleConflictCourseCategories([candidate], [science], { ...transcript, currentYear: 'FOURTH_YEAR' }).size, 0)
})

test('HTML and PDF audits preserve earned course credits for eligibility checks', () => {
  const html = parseHTML('<html><body><table><tr class="takenCourse"><td class="term">21FA</td><td class="course">ECOR 1041</td><td class="credit">0.25</td><td class="grade">A</td></tr></table></body></html>')
  const pdf = parsePDF('21FA   ECOR 1041    0.25   A\n******** END OF REPORT ********')
  assert.equal(html.completedCourses[0].credits, 0.25)
  assert.equal(pdf.completedCourses[0].credits, 0.25)
})

test('the conflict service applies prerequisite and unmet-category filters before reporting overlaps', async () => {
  function row(code: string, nodes: PrerequisiteNodeData[] = [], expression?: string) {
    return {
      id: `${code}-A`, courseId: code, crn: code, sectionCode: 'A', sectionType: 'LEC', deliveryMode: 'IN_PERSON',
      instructor: null, location: null, capacity: null, enrolled: null,
      course: { id: code, title: code, prerequisiteExpression: expression ? { expression } : null, prerequisiteNodes: nodes },
      meetings: [{ days: 'M', startTime: '0900', endTime: '1000' }],
    }
  }
  const rows = [
    row('SYSC4806'), row('CHEM1001'),
    row('CHEM2001', [node('pass', 'COURSE', 'PHYS1004')], 'PHYS1004'),
    row('CHEM3001', [node('fail', 'COURSE', 'MATH1004')], 'MATH1004'),
    row('COMP3005'),
  ]
  const prisma = { section: { findMany: async () => rows }, course: { findMany: async () => [] } } as unknown as PrismaClient
  const options = {
    courseId: 'SYSC4806', term: '202630', sectionIds: ['SYSC4806-A'], crns: [], deliveryPreference: 'any' as const,
    hasAuditData: true, unmetCategories: [science], completedCourses: ['PHYS1004'], courseGrades: { PHYS1004: 'B' }, completedCourseCredits: { PHYS1004: 0.5 }, excludedCourseIds: ['SYSC4806'],
  }
  const report = await inspectCourseConflicts(prisma, options)
  assert.deepEqual(report.courses.map(candidate => candidate.courseId), ['CHEM1001', 'CHEM2001'])
  assert.deepEqual(report.courses[0].categories, [{ id: science.id, label: science.label }])
  assert.equal(report.eligibleCourseCount, 2)
  assert.equal((await inspectCourseConflicts(prisma, { ...options, hasAuditData: false })).courses.length, 0)
  assert.equal((await inspectCourseConflicts(prisma, { ...options, unmetCategories: [] })).courses.length, 0)
})
