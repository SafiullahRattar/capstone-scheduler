import { PrismaClient } from '@prisma/client'
import { promises as fs } from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Prerequisite expression parser
interface ParsedNode {
  type: 'AND' | 'OR' | 'COURSE' | 'YEAR_STANDING' | 'PERMISSION'
  value?: string
  grade?: string
  children?: ParsedNode[]
}

function parsePrerequisiteExpression(expression: string): ParsedNode {
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
  
  // Handle special non-course requirements
  if (term === 'OTHER_REQUIREMENT' || term === 'HIGH_SCHOOL_REQUIREMENT' || term.startsWith('PROGRAM_')) {
    return { type: 'PERMISSION' } // Treat these as permission-based requirements
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
  
  // Handle prep courses or other special terms as permission requirements
  if (term.match(/^MATH000[56]$/) || term.includes('_REQUIREMENT')) {
    return { type: 'PERMISSION' }
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

async function createPrerequisiteTree(courseId: string, parsedNode: ParsedNode, parentId?: string): Promise<string> {
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
  
  // Create child nodes if they exist
  if (parsedNode.children) {
    for (const child of parsedNode.children) {
      await createPrerequisiteTree(courseId, child, node.id)
    }
  }
  
  return node.id
}

// Helper function to extract all course codes from a prerequisite expression
function extractCourseCodesFromExpression(expression: string): string[] {
  const coursePattern = /\b[A-Z]{3,4}\d{4}\b/g
  return expression.match(coursePattern) || []
}

// Helper function to collect all prerequisite course codes recursively
function collectPrerequisiteCourses(parsedNode: ParsedNode): string[] {
  const courses: string[] = []
  
  if (parsedNode.type === 'COURSE' && parsedNode.value) {
    courses.push(parsedNode.value)
  }
  
  if (parsedNode.children) {
    for (const child of parsedNode.children) {
      courses.push(...collectPrerequisiteCourses(child))
    }
  }
  
  return courses
}

async function main() {
  console.log('[SEED] Starting database seed...')

  // Read the prerequisites JSON file
  const prerequisitesPath = path.join(process.cwd(), 'course_prerequisites_simple.json')
  const prerequisitesData = JSON.parse(await fs.readFile(prerequisitesPath, 'utf-8'))

  console.log(`[COURSES] Found ${Object.keys(prerequisitesData).length} courses with prerequisites`)

  // PASS 1: Collect all unique course codes mentioned in prerequisites
  console.log('[SEARCH] Pass 1: Collecting all referenced courses...')
  const allReferencedCourses = new Set<string>()
  
  for (const [courseId, data] of Object.entries(prerequisitesData)) {
    const courseData = data as { required: string | null, restricted: string[] }
    
    // Add the main course
    allReferencedCourses.add(courseId)
    
    // Extract prerequisite courses from the expression
    if (courseData.required) {
      const prereqCourses = extractCourseCodesFromExpression(courseData.required)
      prereqCourses.forEach(course => allReferencedCourses.add(course))
    }
  }
  
  console.log(`[LIST] Found ${allReferencedCourses.size} unique courses to create`)
  
  // Create all Course records first to satisfy foreign key constraints
  console.log('[CREATE]  Creating Course records...')
  let coursesCreated = 0
  for (const courseId of Array.from(allReferencedCourses)) {
    try {
      await prisma.course.upsert({
        where: { id: courseId },
        update: {
          updatedAt: new Date()
        },
        create: {
          id: courseId,
          title: courseId, // Will be populated with actual titles when course catalog data is available
        }
      })
      coursesCreated++
    } catch (error) {
      console.log(`[ERROR] Error creating course ${courseId}:`, error)
    }
  }
  
  console.log(`[SUCCESS] Created ${coursesCreated} course records`)

  // PASS 2: Create prerequisites and parse trees
  console.log('[TREE] Pass 2: Creating prerequisite expressions and trees...')
  let successCount = 0
  let errorCount = 0

  for (const [courseId, data] of Object.entries(prerequisitesData)) {
    const courseData = data as { required: string | null, restricted: string[] }
    
    try {
      // Create prerequisite if it exists
      if (courseData.required) {
        // Store the human-readable expression
        await prisma.prerequisite.upsert({
          where: { courseId },
          update: {
            expression: courseData.required,
            lastModified: new Date()
          },
          create: {
            courseId: courseId,
            expression: courseData.required,
          }
        })

        // Parse and create tree structure
        try {
          // Clear existing nodes for this course
          await prisma.prerequisiteNode.deleteMany({
            where: { courseId }
          })
          
          const parsedTree = parsePrerequisiteExpression(courseData.required)
          await createPrerequisiteTree(courseId, parsedTree)
          
          successCount++
        } catch (parseError) {
          console.log(`[WARNING]  Failed to parse prerequisites for ${courseId}: ${courseData.required}`)
          console.log(`   Error: ${parseError}`)
          errorCount++
        }
      } else {
        successCount++
      }
    } catch (error) {
      console.log(`[ERROR] Error processing course ${courseId}:`, error)
      errorCount++
    }
  }

  console.log(`[SUCCESS] Database seeded successfully!`)
  console.log(`   Successfully processed: ${successCount} courses`)
  if (errorCount > 0) {
    console.log(`   Parsing errors: ${errorCount} courses`)
  }
}

main()
  .catch((e) => {
    console.error('[ERROR] Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })