import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parsePrerequisiteExpression, type ParsedNode } from '../scripts/prerequisite-tree'
import { validatePrerequisitesFromTree, type PrerequisiteNodeData } from '../shared/prerequisite-evaluator'

// Flattens a parsed tree into stored-node shape, the way the seed writes it.
function toNodes(node: ParsedNode, nodes: PrerequisiteNodeData[] = [], parentId: string | null = null): PrerequisiteNodeData[] {
  const id = String(nodes.length + 1)
  nodes.push({ id, nodeType: node.type, requiredCourseId: node.type === 'COURSE' ? node.value ?? null : null, requiredYear: node.type === 'YEAR_STANDING' ? node.value ?? null : null, requiredGrade: node.grade ?? null, parentId } as PrerequisiteNodeData)
  for (const child of node.children || []) toNodes(child, nodes, id)
  return nodes
}

const firstYear = { completedCourses: [], courseGrades: {}, currentYear: 'FIRST_YEAR' as const, hasSpecialPermission: false }

for (const expression of ['OTHER_REQUIREMENT', 'MATH0005 && MATH0006 && HIGH_SCHOOL_REQUIREMENT', '(MATH0005 && HIGH_SCHOOL_REQUIREMENT) || PERMISSION', 'PROGRAM_ENGINEERING']) {
  test(`"${expression}" is open to an incoming first-year`, () => {
    const result = validatePrerequisitesFromTree(expression, toNodes(parsePrerequisiteExpression(expression)), firstYear)
    assert.equal(result.isValid, true, result.reason)
  })
}

test('real course and permission requirements still apply', () => {
  const needsCourses = 'ECOR1041 && MATH1004'
  assert.equal(validatePrerequisitesFromTree(needsCourses, toNodes(parsePrerequisiteExpression(needsCourses)), firstYear).isValid, false)
  assert.equal(validatePrerequisitesFromTree('PERMISSION', toNodes(parsePrerequisiteExpression('PERMISSION')), firstYear).needsPermission, true)
})
