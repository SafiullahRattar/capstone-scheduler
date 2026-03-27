import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface StudentTranscript {
  completedCourses: string[]
  courseGrades?: { [courseId: string]: string } // e.g., { "COMP1006": "B+", "MATH1004": "C" }
  currentYear: 'FIRST_YEAR' | 'SECOND_YEAR' | 'THIRD_YEAR' | 'FOURTH_YEAR'
  hasSpecialPermission?: boolean
}

export interface PrerequisiteValidationResult {
  isValid: boolean
  reason?: string
  missingCourses?: string[]
  yearRequirement?: string
  needsPermission?: boolean
  gradeIssues?: string[]
  expressionEvaluated: string
}

interface EvaluationResult {
  isValid: boolean
  reason?: string
  missingItems?: string[]
  gradeIssues?: string[]
}

interface PrerequisiteNodeData {
  id: string
  courseId: string
  nodeType: string
  requiredCourseId: string | null
  requiredYear: string | null
  requiredGrade: string | null
  parentId: string | null
}

// Grade comparison helper function
function meetsGradeRequirement(actualGrade: string | undefined, requiredGrade: string): boolean {
  if (!actualGrade) {
    return false // No grade means course not completed or grade not provided
  }
  
  // Grade scale: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F
  const gradeValues: { [grade: string]: number } = {
    'A+': 12, 'A': 11, 'A-': 10,
    'B+': 9, 'B': 8, 'B-': 7,
    'C+': 6, 'C': 5, 'C-': 4,
    'D+': 3, 'D': 2, 'D-': 1,
    'F': 0
  }
  
  const actualValue = gradeValues[actualGrade]
  const requiredValue = gradeValues[requiredGrade]
  
  if (actualValue === undefined || requiredValue === undefined) {
    // If we can't parse the grade, assume it's valid to be permissive
    console.warn(`Unknown grade: actual=${actualGrade}, required=${requiredGrade}`)
    return true
  }
  
  return actualValue >= requiredValue
}

async function evaluatePrerequisiteNode(
  node: PrerequisiteNodeData,
  transcript: StudentTranscript,
  childNodes: PrerequisiteNodeData[]
): Promise<EvaluationResult> {
  
  switch (node.nodeType) {
    case 'AND': {
      const children = childNodes.filter(child => child.parentId === node.id)
      const results: EvaluationResult[] = []
      
      for (const child of children) {
        const childResult = await evaluatePrerequisiteNode(child, transcript, childNodes)
        results.push(childResult)
      }
      
      const unsatisfied = results.filter(r => !r.isValid)
      if (unsatisfied.length > 0) {
        const allMissing = unsatisfied.flatMap(r => r.missingItems || [])
        const allGradeIssues = unsatisfied.flatMap(r => r.gradeIssues || [])
        return {
          isValid: false,
          reason: `Missing requirements: ${unsatisfied.map(r => r.reason).join(', ')}`,
          missingItems: allMissing,
          gradeIssues: allGradeIssues
        }
      }
      
      return { isValid: true, missingItems: [], gradeIssues: [] }
    }
    
    case 'OR': {
      const children = childNodes.filter(child => child.parentId === node.id)
      const results: EvaluationResult[] = []
      
      for (const child of children) {
        const childResult = await evaluatePrerequisiteNode(child, transcript, childNodes)
        results.push(childResult)
        
        if (childResult.isValid) {
          return { isValid: true, missingItems: [], gradeIssues: [] }
        }
      }
      
      const allMissing = results.flatMap(r => r.missingItems || [])
      const allGradeIssues = results.flatMap(r => r.gradeIssues || [])
      return {
        isValid: false,
        reason: `None of the alternative requirements satisfied: ${results.map(r => r.reason).join(' OR ')}`,
        missingItems: allMissing,
        gradeIssues: allGradeIssues
      }
    }
    
    case 'COURSE': {
      if (!node.requiredCourseId) {
        return { isValid: false, reason: 'Invalid course node', missingItems: [], gradeIssues: [] }
      }
      
      const hasCourse = transcript.completedCourses.includes(node.requiredCourseId)
      if (!hasCourse) {
        return {
          isValid: false,
          reason: `Missing course ${node.requiredCourseId}`,
          missingItems: [node.requiredCourseId],
          gradeIssues: []
        }
      }
      
      // Check grade requirement if specified
      if (node.requiredGrade) {
        const actualGrade = transcript.courseGrades?.[node.requiredCourseId]
        const meetsGrade = meetsGradeRequirement(actualGrade, node.requiredGrade)
        
        if (!meetsGrade) {
          const gradeIssue = `${node.requiredCourseId} grade ${actualGrade || 'unknown'} does not meet requirement ${node.requiredGrade}`
          return {
            isValid: false,
            reason: gradeIssue,
            missingItems: [],
            gradeIssues: [gradeIssue]
          }
        }
      }
      
      return {
        isValid: true,
        missingItems: [],
        gradeIssues: []
      }
    }
    
    case 'YEAR_STANDING': {
      if (!node.requiredYear) {
        return { isValid: false, reason: 'Invalid year standing node', missingItems: [], gradeIssues: [] }
      }
      
      const yearOrder = ['FIRST_YEAR', 'SECOND_YEAR', 'THIRD_YEAR', 'FOURTH_YEAR']
      const requiredIndex = yearOrder.indexOf(node.requiredYear)
      const currentIndex = yearOrder.indexOf(transcript.currentYear)
      
      const meetsYear = currentIndex >= requiredIndex
      return {
        isValid: meetsYear,
        reason: meetsYear ? undefined : `Requires ${node.requiredYear} standing (currently ${transcript.currentYear})`,
        missingItems: meetsYear ? [] : [node.requiredYear],
        gradeIssues: []
      }
    }
    
    case 'PERMISSION': {
      const hasPermission = transcript.hasSpecialPermission || false
      return {
        isValid: hasPermission,
        reason: hasPermission ? undefined : 'Requires special permission',
        missingItems: hasPermission ? [] : ['PERMISSION'],
        gradeIssues: []
      }
    }
    
    default:
      return { 
        isValid: false, 
        reason: `Unknown node type: ${node.nodeType}`,
        missingItems: [],
        gradeIssues: []
      }
  }
}

export async function validatePrerequisites(
  courseId: string,
  transcript: StudentTranscript
): Promise<PrerequisiteValidationResult> {
  
  try {
    const prerequisite = await prisma.prerequisite.findUnique({
      where: { courseId }
    })
    
    if (!prerequisite) {
      return {
        isValid: true,
        reason: 'No prerequisites required',
        expressionEvaluated: 'None'
      }
    }
    
    const nodes = await prisma.prerequisiteNode.findMany({
      where: { courseId },
      orderBy: { createdAt: 'asc' }
    })
    
    if (nodes.length === 0) {
      return {
        isValid: true,
        reason: 'No prerequisite tree found',
        expressionEvaluated: prerequisite.expression
      }
    }
    
    const rootNode = nodes.find(node => !node.parentId)
    if (!rootNode) {
      return {
        isValid: false,
        reason: 'Invalid prerequisite tree structure (no root node)',
        expressionEvaluated: prerequisite.expression
      }
    }
    
    const result = await evaluatePrerequisiteNode(rootNode, transcript, nodes)
    
    return {
      isValid: result.isValid,
      reason: result.reason,
      missingCourses: result.missingItems?.filter(item => 
        item.match(/^[A-Z]{3,4}\d{4}$/)
      ),
      yearRequirement: result.missingItems?.find(item => 
        item.endsWith('_YEAR')
      ),
      needsPermission: result.missingItems?.includes('PERMISSION'),
      gradeIssues: result.gradeIssues || [],
      expressionEvaluated: prerequisite.expression
    }
    
  } catch (error) {
    return {
      isValid: false,
      reason: `Error validating prerequisites: ${error instanceof Error ? error.message : 'Unknown error'}`,
      expressionEvaluated: 'Error'
    }
  }
}

export async function getPrerequisiteExplanation(
  courseId: string,
  transcript: StudentTranscript
): Promise<string> {
  
  const result = await validatePrerequisites(courseId, transcript)
  
  if (result.isValid) {
    return `[PASS] You meet all prerequisites for ${courseId}`
  }
  
  let explanation = `[FAIL] You do not meet the prerequisites for ${courseId}:\n`
  explanation += `Required: ${result.expressionEvaluated}\n\n`
  
  if (result.missingCourses && result.missingCourses.length > 0) {
    explanation += `Missing courses: ${result.missingCourses.join(', ')}\n`
  }
  
  if (result.gradeIssues && result.gradeIssues.length > 0) {
    explanation += `Grade requirements not met: ${result.gradeIssues.join(', ')}\n`
  }
  
  if (result.yearRequirement) {
    explanation += `Requires: ${result.yearRequirement.replace('_', ' ')}\n`
  }
  
  if (result.needsPermission) {
    explanation += `Requires special permission from instructor/department\n`
  }
  
  if (result.reason) {
    explanation += `Details: ${result.reason}`
  }
  
  return explanation
}

export async function cleanup() {
  await prisma.$disconnect()
}
