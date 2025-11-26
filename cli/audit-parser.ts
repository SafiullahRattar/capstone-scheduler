import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

export interface RequirementInfo {
  title: string
  status: 'OK' | 'NO' | 'IP' | 'NONE'
  creditsRequired: number
  creditsCompleted: number
  creditsInProgress: number
  courseOptions: string[] // List of courses that satisfy this requirement
}

export interface StudentAuditData {
  studentId: string
  name: string
  program: string
  completedCourses: Array<{
    courseId: string
    grade: string
  }>
  currentCourses: Array<{
    courseId: string
    term: string
  }>
  requirements: RequirementInfo[]
}

/**
 * Calculate which courses the student still needs to take
 * Returns courses from unfulfilled requirements that haven't been completed or enrolled in
 */
export function getRemainingCourses(auditData: StudentAuditData): string[] {
  const completedSet = new Set(auditData.completedCourses.map(c => c.courseId))
  const currentSet = new Set(auditData.currentCourses.map(c => c.courseId))
  const remainingCourses = new Set<string>()
  
  // Look at unfulfilled requirements (status = 'NO' or 'IP' with remaining credits)
  for (const req of auditData.requirements) {
    const creditsNeeded = req.creditsRequired - req.creditsCompleted - req.creditsInProgress
    
    if (creditsNeeded > 0) {
      // This requirement needs more courses
      for (const course of req.courseOptions) {
        // Add course if it's not completed and not currently enrolled
        if (!completedSet.has(course) && !currentSet.has(course)) {
          remainingCourses.add(course)
        }
      }
    }
  }
  
  return Array.from(remainingCourses).sort()
}

export function parseAuditHTML(htmlContent: string): StudentAuditData {
  // Extract student ID
  const studentIdMatch = htmlContent.match(/<h[^>]*>(\d{9})<\/h>/)
  const studentId = studentIdMatch ? studentIdMatch[1] : ''

  // Extract student name
  const nameMatch = htmlContent.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/)
  const name = nameMatch ? `${nameMatch[2]} ${nameMatch[1]}` : ''

  // Extract program
  const programMatch = htmlContent.match(/Bachelor of Engineering - ([^<]+)/)
  const program = programMatch ? programMatch[1].trim() : ''

  // Extract courses (both completed and current)
  const courseMatches = Array.from(htmlContent.matchAll(
    /<tr[^>]*class="takenCourse[^"]*"[^>]*>[\s\S]*?<td[^>]*class="term"[^>]*>([^<]*)<\/td>[\s\S]*?<td[^>]*class="course"[^>]*>([A-Z]{3,4}\s+\d{4})<\/td>[\s\S]*?<td[^>]*class="grade"[^>]*>([^<]+)<\/td>/g
  ))

  const completedCourses: Array<{ courseId: string; grade: string }> = []
  const currentCourses: Array<{ courseId: string; term: string }> = []
  
  for (const match of courseMatches) {
    const term = match[1].trim()
    const courseId = match[2].replace(/\s+/g, '') // Remove spaces from "SYSC 4907" -> "SYSC4907"
    const grade = match[3].trim()
    
    if (grade === 'CUR') {
      // Current course
      currentCourses.push({ courseId, term })
    } else if (grade && grade !== '') {
      // Completed course
      completedCourses.push({ courseId, grade })
    }
  }

  return {
    studentId,
    name,
    program,
    completedCourses,
    currentCourses,
    requirements: [] // TODO: Extract requirements from HTML
  }
}

/**
 * Extract requirements from PDF audit text
 * Requirements are sections with course lists and completion status
 */
function extractRequirementsFromPDF(pdfText: string): RequirementInfo[] {
  const requirements: RequirementInfo[] = []
  
  // Pattern to find requirement sections with course lists
  // Example: "4) 4.0 credits in NET 4001, NET 4005, NET 4007, NET 4009, NET 4010, NET 4011, NET 4901 [1.0]"
  // Course lists can span multiple lines
  const reqPattern = /\d+\)\s+([\d.]+)\s+credits?\s+in\s+([A-Z]{3,4}[^]+?)(?=\d+\.\d+\s+(?:cr\.|Credits)|NEEDS:|$)/gi
  
  for (const match of Array.from(pdfText.matchAll(reqPattern))) {
    const creditsText = match[1]
    let courseListText = match[2]
    
    // Clean up the course list text - take only up to the next section indicator
    courseListText = courseListText.split(/\n(?=\d+\.\d+\s+cr\.|\nNEEDS:|\nTerm)/)[0]
    
    // Extract course codes from the text (e.g., "NET 4001, NET 4005, SYSC 3000")
    // Course codes can be separated by commas or newlines
    const courseCodes = courseListText.match(/[A-Z]{3,4}\s+\d{4}/g) || []
    const courseOptions = courseCodes.map(code => code.replace(/\s+/g, '')) // Remove spaces
    
    if (courseOptions.length === 0) continue
    
    // Generate title from first course prefix
    const title = courseOptions[0]
    
    // Parse credits required
    const creditsRequired = parseFloat(creditsText) || 0
    
    // Try to find completion status in nearby lines
    const textAfterReq = pdfText.substring(pdfText.indexOf(match[0]))
    const nextLines = textAfterReq.substring(0, 300)
    
    let status: 'OK' | 'NO' | 'IP' | 'NONE' = 'NO'
    let creditsCompleted = 0
    let creditsInProgress = 0
    
    // Look for completion indicators
    if (nextLines.includes('cr. Complete')) {
      const completeMatch = nextLines.match(/([\d.]+)\s+cr\.\s+Complete/)
      if (completeMatch) {
        creditsCompleted = parseFloat(completeMatch[1]) || 0
      }
    }
    
    if (nextLines.includes('Credits\nIP') || nextLines.includes('IP\n')) {
      status = 'IP'
      // Try to extract IP credits
      const ipMatch = nextLines.match(/([\d.]+)\s+Credits\s*\n?\s*IP/)
      if (ipMatch) {
        creditsInProgress = parseFloat(ipMatch[1]) || 0
      }
    }
    
    if (nextLines.includes('NEEDS:')) {
      status = 'NO'
    } else if (creditsCompleted >= creditsRequired) {
      status = 'OK'
    }
    
    requirements.push({
      title,
      status,
      creditsRequired,
      creditsCompleted,
      creditsInProgress,
      courseOptions
    })
  }
  
  return requirements
}

/**
 * Parse academic audit from PDF text format
 * PDF audits have lines formatted like:
 * "21FA   CHEM 1101           0.50   A+"
 * "Term   Course           Credits   Grade    Title"
 */
export function parseAuditPDF(pdfText: string): StudentAuditData {
  // Extract student ID (9 digits)
  const studentIdMatch = pdfText.match(/(\d{9})/)
  const studentId = studentIdMatch ? studentIdMatch[1] : ''

  // Extract student name (format: "Lastname, Firstname" or just appears in text)
  const nameMatch = pdfText.match(/([A-Z][a-z]+),\s+([A-Z][a-z]+)/)
  const name = nameMatch ? `${nameMatch[2]} ${nameMatch[1]}` : ''

  // Extract program
  const programMatch = pdfText.match(/Bachelor of Engineering\s*-\s*([A-Za-z\s]+)/i)
  const program = programMatch ? programMatch[1].trim() : ''

  // Extract courses from PDF text
  // Match lines like: "21FA   CHEM 1101           0.50   A+"
  // The whitespace between columns varies, so we use \s+ for flexibility
  const completedCourses: Array<{ courseId: string; grade: string }> = []
  const currentCourses: Array<{ courseId: string; term: string }> = []
  const seenCompleted = new Set<string>()
  const seenCurrent = new Set<string>()
  
  // Match course lines with very flexible whitespace
  // Format: spaces + TERM + spaces + COURSE_CODE + spaces + COURSE_NUM + spaces + CREDITS + spaces + GRADE + optional(spaces + RP/CUR/etc)
  const courseLinePattern = /^\s*(\d{2}(?:FA|WN|SU))\s+([A-Z]{3,4})\s+(\d{4})\s+([\d.]+)\s+([A-Z+\-]+)(?:\s+(?:RP|CUR|SAT|TR|UNS|IP))?/gm
  
  const matches = Array.from(pdfText.matchAll(courseLinePattern))
  
  for (const match of matches) {
    const term = match[1]      // e.g., "21FA"
    const courseCode = match[2] // e.g., "CHEM"
    const courseNum = match[3]  // e.g., "1101"
    const courseId = courseCode + courseNum
    let grade = match[5]        // e.g., "A+"
    
    // Check if this line has "CUR" after the grade
    const fullMatch = match[0]
    const isCurrent = fullMatch.includes('CUR') || grade === 'CUR'
    
    if (isCurrent && !seenCurrent.has(courseId)) {
      currentCourses.push({ courseId, term })
      seenCurrent.add(courseId)
    } else if (grade && grade !== 'CUR' && grade !== 'UNS' && 
               grade !== 'F' && grade !== 'X' && grade !== 'NR' &&
               !seenCompleted.has(courseId)) {
      completedCourses.push({ courseId, grade })
      seenCompleted.add(courseId)
    }
  }

  // Extract requirements
  const requirements = extractRequirementsFromPDF(pdfText)

  return {
    studentId,
    name,
    program,
    completedCourses,
    currentCourses,
    requirements
  }
}

export async function saveStudentAuditData(auditData: StudentAuditData): Promise<void> {
  // Create or update student
  const student = await prisma.student.upsert({
    where: { studentId: auditData.studentId },
    update: {
      name: auditData.name,
      program: auditData.program
    },
    create: {
      studentId: auditData.studentId,
      name: auditData.name,
      program: auditData.program
    }
  })

  // Delete existing course completions for this student
  await prisma.courseCompletion.deleteMany({
    where: { studentId: student.id }
  })

  // Add course completions
  for (const completion of auditData.completedCourses) {
    // Check if course exists in database
    const course = await prisma.course.findUnique({
      where: { id: completion.courseId }
    })

    if (course) {
      await prisma.courseCompletion.upsert({
        where: {
          studentId_courseId: {
            studentId: student.id,
            courseId: completion.courseId
          }
        },
        update: {
          grade: completion.grade
        },
        create: {
          studentId: student.id,
          courseId: completion.courseId,
          grade: completion.grade
        }
      })
    } else {
      console.log(`Warning: Course ${completion.courseId} not found in database, skipping...`)
    }
  }
}

export async function ingestAuditFromFile(filePath: string): Promise<void> {
  try {
    const htmlContent = fs.readFileSync(filePath, 'utf-8')
    const auditData = parseAuditHTML(htmlContent)
    
    console.log(`Parsed audit for: ${auditData.name} (${auditData.studentId})`)
    console.log(`Program: ${auditData.program}`)
    console.log(`Found ${auditData.completedCourses.length} completed courses`)
    
    await saveStudentAuditData(auditData)
    console.log('✓ Student audit data saved successfully!')
    
  } catch (error) {
    console.error('Error ingesting audit:', error)
    throw error
  }
}