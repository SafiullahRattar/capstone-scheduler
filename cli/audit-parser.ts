import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

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
  const courseMatches = htmlContent.matchAll(
    /<tr[^>]*class="takenCourse[^"]*"[^>]*>[\s\S]*?<td[^>]*class="term"[^>]*>([^<]*)<\/td>[\s\S]*?<td[^>]*class="course"[^>]*>([A-Z]{3,4}\s+\d{4})<\/td>[\s\S]*?<td[^>]*class="grade"[^>]*>([^<]+)<\/td>/g
  )

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
    currentCourses
  }
}

/**
 * Parse academic audit from PDF text format
 * PDF audits have a different format where courses are in rows like:
 * "21FA CHEM 1101 0.50 A+"
 */
export function parseAuditPDF(pdfText: string): StudentAuditData {
  // Extract student ID (9 digits)
  const studentIdMatch = pdfText.match(/(\d{9})/)
  const studentId = studentIdMatch ? studentIdMatch[1] : ''

  // Extract student name (format: "Lastname, Firstname" or just appears in text)
  const nameMatch = pdfText.match(/([A-Z][a-z]+),\s+([A-Z][a-z]+)/)
  const name = nameMatch ? `${nameMatch[2]} ${nameMatch[1]}` : ''

  // Extract program
  const programMatch = pdfText.match(/Bachelor of Engineering\s*-\s*([A-Za-z\s]+?)(?:\s+Credits|\s+Term|$)/i)
  const program = programMatch ? programMatch[1].trim() : ''

  // Extract courses from PDF format (both completed and current)
  // Format: "21FA CHEM 1101 0.50 A+" or "21SU SYSC 2100 0.50 TR" or "26WN SYSC 4906 0.50 CUR"
  // Pattern: Term(2 digits + season) + Course(ABCD + digits) + (optional junk) + Credits + Grade
  // Some lines have extra text like "26WN SYSC 4906 4.50 Credits 0.50 CUR" - we need to handle these
  const coursePattern = /(\d{2}(?:FA|WN|SU))\s+([A-Z]{3,4})\s+(\d{4})\s+(?:[\d.]+\s+Credits\s+)?([\d.]+)\s+([A-Z+\-]+)/g
  const courseMatches = pdfText.matchAll(coursePattern)

  const completedCourses: Array<{ courseId: string; grade: string }> = []
  const currentCourses: Array<{ courseId: string; term: string }> = []
  const seenCompleted = new Set<string>() // Track completed to avoid duplicates
  const seenCurrent = new Set<string>() // Track current to avoid duplicates
  
  for (const match of courseMatches) {
    const term = match[1]        // e.g., "26WN"
    const courseCode = match[2]  // e.g., "SYSC"
    const courseNum = match[3]   // e.g., "4907"
    const credits = match[4]     // e.g., "0.50" or "0.00"
    const grade = match[5].trim() // e.g., "A+" or "TR" or "SAT" or "CUR"
    
    const courseId = courseCode + courseNum // e.g., "SYSC4907"
    
    if (grade === 'CUR' && !seenCurrent.has(courseId)) {
      // Current course (in progress)
      currentCourses.push({ courseId, term })
      seenCurrent.add(courseId)
    } else if (grade && grade !== 'CUR' && grade !== 'UNS' && 
               grade !== 'F' && grade !== 'X' && grade !== '' &&
               !seenCompleted.has(courseId)) {
      // Completed course
      // Include: 
      // - All letter grades (A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-)
      // - Transfer credits (TR) - these count as completed
      // - Satisfactory (SAT) - these count as completed
      completedCourses.push({ courseId, grade })
      seenCompleted.add(courseId)
    }
  }

  return {
    studentId,
    name,
    program,
    completedCourses,
    currentCourses
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