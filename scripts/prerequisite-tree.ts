/*
 * Parses prerequisite expressions such as "(COMP1405 || COMP1005) && SECOND_YEAR"
 * into the node tree stored in prerequisite_nodes.
 */

import type { PrismaClient } from '@prisma/client'

// Prerequisite expression parser
export interface ParsedNode {
  type: 'AND' | 'OR' | 'COURSE' | 'YEAR_STANDING' | 'PERMISSION' | 'OTHER_REQUIREMENT'
  value?: string
  grade?: string
  children?: ParsedNode[]
}

export function parsePrerequisiteExpression(expression: string): ParsedNode {
  // Remove extra whitespace
  expression = expression.trim()

  // Handle simple cases first
  if (expression.includes(' && ') && !expression.includes(' || ')) {
    // Simple AND
    const parts = expression.split(' && ').map(p => p.trim())
    return {
      type: 'AND',
      children: parts.map(part => parseSimpleTerm(part))
    }
  }

  if (expression.includes(' || ') && !expression.includes(' && ')) {
    // Simple OR
    const parts = expression.split(' || ').map(p => p.trim())
    return {
      type: 'OR',
      children: parts.map(part => parseSimpleTerm(part))
    }
  }

  // Handle parentheses - for now, simplified parsing
  if (expression.includes('(') && expression.includes(')')) {
    // Complex expression with parentheses
    return parseComplexExpression(expression)
  }

  // Single term
  return parseSimpleTerm(expression)
}

function parseSimpleTerm(term: string): ParsedNode {
  term = term.trim().replace(/[()]/g, '')

  // Handle special requirement types
  if (term === 'FIRST_YEAR' || term === 'SECOND_YEAR' || term === 'THIRD_YEAR' || term === 'FOURTH_YEAR') {
    return { type: 'YEAR_STANDING', value: term }
  }

  if (term === 'PERMISSION') {
    return { type: 'PERMISSION' }
  }

  // Admission-level requirements (high school courses, program enrolment, "other") are
  // met by any admitted student, so they must not read as needing department permission.
  if (term === 'OTHER_REQUIREMENT' || term === 'HIGH_SCHOOL_REQUIREMENT' || term.startsWith('PROGRAM_')) {
    return { type: 'OTHER_REQUIREMENT', value: term }
  }

  // Handle course codes with grade requirements (e.g., "COMP1006[C-]")
  const gradeMatch = term.match(/^([A-Z]{3,4}\d{4})\[([A-Z\-+]*)\]$/)
  if (gradeMatch) {
    const courseCode = gradeMatch[1]
    const gradeRequirement = gradeMatch[2]
    return { type: 'COURSE', value: courseCode, grade: gradeRequirement }
  }

  // Handle standard course codes (but exclude MATH0005/MATH0006 which are prep courses)
  if (term.match(/^[A-Z]{3,4}\d{4}$/) && !term.match(/^MATH000[56]$/)) {
    return { type: 'COURSE', value: term }
  }

  // MATH 0005/0006 are high-school-level preparation courses, covered by admission requirements.
  if (term.match(/^MATH000[56]$/) || term.includes('_REQUIREMENT')) {
    return { type: 'OTHER_REQUIREMENT', value: term }
  }

  // Fallback - treat unknown terms as permission requirements to avoid FK issues
  console.log(`WARNING: Unknown term treated as PERMISSION: ${term}`)
  return { type: 'PERMISSION' }
}

function parseComplexExpression(expression: string): ParsedNode {
  // Simplified parser for basic cases like "(A || B) && (C || D)"
  // This handles the most common patterns in our dataset

  // Split on && first (lower precedence)
  if (expression.includes(' && ')) {
    const andParts = splitOnTopLevelOperator(expression, ' && ')
    if (andParts.length > 1) {
      return {
        type: 'AND',
        children: andParts.map(part => parsePrerequisiteExpression(part.trim()))
      }
    }
  }

  // Split on ||
  if (expression.includes(' || ')) {
    const orParts = splitOnTopLevelOperator(expression, ' || ')
    if (orParts.length > 1) {
      return {
        type: 'OR',
        children: orParts.map(part => parsePrerequisiteExpression(part.trim()))
      }
    }
  }

  // Remove outer parentheses and try again
  if (expression.startsWith('(') && expression.endsWith(')')) {
    return parsePrerequisiteExpression(expression.slice(1, -1))
  }

  return parseSimpleTerm(expression)
}

function splitOnTopLevelOperator(expression: string, operator: string): string[] {
  const parts: string[] = []
  let current = ''
  let parenDepth = 0
  let i = 0

  while (i < expression.length) {
    const char = expression[i]

    if (char === '(') {
      parenDepth++
      current += char
    } else if (char === ')') {
      parenDepth--
      current += char
    } else if (parenDepth === 0 && expression.slice(i, i + operator.length) === operator) {
      parts.push(current.trim())
      current = ''
      i += operator.length - 1
    } else {
      current += char
    }

    i++
  }

  if (current.trim()) {
    parts.push(current.trim())
  }

  return parts.length > 1 ? parts : [expression]
}

/** Writes a parsed tree to prerequisite_nodes and returns the root node id. */
export async function createPrerequisiteTree(prisma: PrismaClient, courseId: string, parsedNode: ParsedNode, parentId?: string): Promise<string> {
  const node = await prisma.prerequisiteNode.create({
    data: {
      courseId,
      nodeType: parsedNode.type,
      requiredCourseId: parsedNode.type === 'COURSE' ? parsedNode.value : null,
      requiredYear: parsedNode.type === 'YEAR_STANDING' ? parsedNode.value : null,
      requiredGrade: parsedNode.type === 'COURSE' && parsedNode.grade ? parsedNode.grade : null,
      parentId: parentId || null
    }
  })

  for (const child of parsedNode.children || []) {
    await createPrerequisiteTree(prisma, courseId, child, node.id)
  }

  return node.id
}
