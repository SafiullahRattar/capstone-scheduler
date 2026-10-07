import { test } from 'node:test'
import assert from 'node:assert/strict'
import { describePrerequisiteIssues } from '../shared/prerequisite-reasons'
import { validatePrerequisitesFromTree, type PrerequisiteNodeData } from '../shared/prerequisite-evaluator'

const physNodes: PrerequisiteNodeData[] = [
  { id: 'root', nodeType: 'OR', requiredCourseId: null, requiredYear: null, requiredGrade: null, parentId: null },
  { id: 'choices', nodeType: 'OR', requiredCourseId: null, requiredYear: null, requiredGrade: null, parentId: 'root' },
  { id: 'legacy', nodeType: 'COURSE', requiredCourseId: 'ECOR1101', requiredYear: null, requiredGrade: null, parentId: 'choices' },
  { id: 'pair', nodeType: 'AND', requiredCourseId: null, requiredYear: null, requiredGrade: null, parentId: 'choices' },
  { id: 'statics', nodeType: 'COURSE', requiredCourseId: 'ECOR1045', requiredYear: null, requiredGrade: null, parentId: 'pair' },
  { id: 'dynamics', nodeType: 'COURSE', requiredCourseId: 'ECOR1048', requiredYear: null, requiredGrade: null, parentId: 'pair' },
  { id: 'permission', nodeType: 'PERMISSION', requiredCourseId: null, requiredYear: null, requiredGrade: null, parentId: 'root' },
]

test('PHYS1004 alternatives remain OR choices, including the grouped ECOR pair and optional permission', () => {
  const validation = validatePrerequisitesFromTree('(ECOR1101 || (ECOR1045 && ECOR1048)) || PERMISSION', physNodes, { completedCourses: [], currentYear: 'FIRST_YEAR' })
  assert.deepEqual(describePrerequisiteIssues(validation), ['Requires: ECOR1101 OR (ECOR1045 AND ECOR1048) OR department permission'])
  assert.ok(!describePrerequisiteIssues(validation).includes('Requires department permission'))
})

test('a satisfied alternative clears the issue while a partial ECOR pair retains its original grouping', () => {
  const fulfilled = validatePrerequisitesFromTree('rule', physNodes, { completedCourses: ['ECOR1045', 'ECOR1048'], currentYear: 'FIRST_YEAR' })
  assert.deepEqual(describePrerequisiteIssues(fulfilled), [])
  const partial = validatePrerequisitesFromTree('rule', physNodes, { completedCourses: ['ECOR1045'], currentYear: 'FIRST_YEAR' })
  assert.deepEqual(describePrerequisiteIssues(partial), ['Requires: ECOR1101 OR (ECOR1045 AND ECOR1048) OR department permission'])
})

test('AND requirements keep nested OR alternatives and minimum grades explicit', () => {
  const nodes: PrerequisiteNodeData[] = [
    { id: 'root', nodeType: 'AND', requiredCourseId: null, requiredYear: null, requiredGrade: null, parentId: null },
    { id: 'math', nodeType: 'COURSE', requiredCourseId: 'MATH1004', requiredYear: null, requiredGrade: null, parentId: 'root' },
    { id: 'choice', nodeType: 'OR', requiredCourseId: null, requiredYear: null, requiredGrade: null, parentId: 'root' },
    { id: 'course', nodeType: 'COURSE', requiredCourseId: 'PHYS1007', requiredYear: null, requiredGrade: 'B-', parentId: 'choice' },
    { id: 'permission', nodeType: 'PERMISSION', requiredCourseId: null, requiredYear: null, requiredGrade: null, parentId: 'choice' },
  ]
  const validation = validatePrerequisitesFromTree('rule', nodes, { completedCourses: ['MATH1004', 'PHYS1007'], courseGrades: { PHYS1007: 'C' }, currentYear: 'FIRST_YEAR' })
  assert.deepEqual(describePrerequisiteIssues(validation), ['Requires: MATH1004 AND (PHYS1007 (B- or better) OR department permission)'])
})

test('lists missing prerequisites, grades, standing and permission', () => {
  assert.deepEqual(describePrerequisiteIssues({
    isValid: false,
    missingCourses: ['COMP2402', 'COMP2804'],
    gradeIssues: ['COMP1406 grade D does not meet requirement C-'],
    yearRequirement: 'THIRD_YEAR',
    needsPermission: true,
    expressionEvaluated: '',
  }), [
    'Needs C- or better in COMP1406 (you have D)',
    'Missing prerequisites: COMP2402, COMP2804',
    'Requires third-year standing',
    'Requires department permission',
  ])
})

test('omits an unknown grade and falls back to the evaluator reason', () => {
  assert.deepEqual(describePrerequisiteIssues({ isValid: false, gradeIssues: ['MATH1104 grade unknown does not meet requirement C'], expressionEvaluated: '' }), ['Needs C or better in MATH1104'])
  assert.deepEqual(describePrerequisiteIssues({ isValid: false, reason: 'Odd rule', missingCourses: [], expressionEvaluated: '' }), ['Odd rule'])
  assert.deepEqual(describePrerequisiteIssues({ isValid: true, expressionEvaluated: '' }), [])
})
