#!/usr/bin/env node

import { PrismaClient } from '@prisma/client'
import * as readline from 'readline'
import { validatePrerequisites, getPrerequisiteExplanation, StudentTranscript } from './prerequisite-validator'

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

async function showHelp() {
  console.log(`
Smart Scheduler CLI Commands:

1. search <course_code>     - Search for a course (e.g., search SYSC4907)
2. prereq <course_code>     - Show prerequisites for a course
3. sections <course_code>   - Show all sections for a course with times
4. validate <course> <completed_courses> [year] [permission] - Check if prerequisites are met
5. schedule <course_list>   - Check for schedule conflicts between courses
6. stats                   - Show database statistics
7. help                    - Show this help
8. exit                    - Exit the CLI

Examples:
  search SYSC
  prereq SYSC4907
  sections SYSC4907
  validate SYSC4907 "SYSC1006,SYSC2006,SYSC4001"
  validate SYSC4907 "SYSC1006,SYSC2006,SYSC4001" FOURTH_YEAR
  validate CIVE4302 "CIVE3203,CIVE3206" FOURTH_YEAR true
  schedule "SYSC4907,SYSC4120,ELEC4501"
`)
}

async function searchCourses(searchTerm: string) {
  const courses = await prisma.course.findMany({
    where: {
      id: {
        contains: searchTerm.toUpperCase(),
        mode: 'insensitive'
      }
    },
    include: {
      prerequisiteExpression: true,
      sections: true
    },
    take: 50
  })

  if (courses.length === 0) {
    console.log(`No courses found matching "${searchTerm}"`)
    return
  }

  console.log(`\nFound ${courses.length} course(s) matching "${searchTerm}":`)
  courses.forEach(course => {
    console.log(`\n${course.id} - ${course.title || 'No title available'}`)
    if (course.prerequisiteExpression) {
      console.log(`   Prerequisites: ${course.prerequisiteExpression.expression}`)
    }
    if (course.sections.length > 0) {
      console.log(`   Sections: ${course.sections.length} available`)
    }
  })
}

async function showPrerequisites(courseCode: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseCode.toUpperCase() },
    include: { prerequisiteExpression: true }
  })

  if (!course) {
    console.log(`[ERROR] Course ${courseCode} not found`)
    return
  }

  console.log(`\n[COURSE] ${course.id} - ${course.title || 'No title available'}`)
  
  if (!course.prerequisiteExpression) {
    console.log('[PASS] No prerequisites required')
    return
  }

  console.log(`Prerequisites: ${course.prerequisiteExpression.expression}`)
  console.log(`Last updated: ${course.prerequisiteExpression.lastModified.toDateString()}`)
}

async function validateCoursePrerequisites(courseCode: string, completedCoursesStr: string, yearStr?: string, permissionStr?: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseCode.toUpperCase() }
  })

  if (!course) {
    console.log(`[ERROR] Course ${courseCode} not found`)
    return
  }

  // Parse completed courses and grades
  const coursesWithGrades = completedCoursesStr.split(',').map(c => c.trim()).filter(c => c)
  const completedCourses: string[] = []
  const courseGrades: { [courseId: string]: string } = {}
  
  coursesWithGrades.forEach(courseStr => {
    // Handle courses with grades like "COMP1006[B+]"
    const gradeMatch = courseStr.match(/^([A-Z]{3,4}\d{4})\[([A-Z\-+]*)\]$/i)
    if (gradeMatch) {
      const courseCode = gradeMatch[1].toUpperCase()
      const grade = gradeMatch[2].toUpperCase()
      completedCourses.push(courseCode)
      courseGrades[courseCode] = grade
    } else {
      // Handle courses without grades like "COMP1006"
      const courseCode = courseStr.toUpperCase()
      if (courseCode.match(/^[A-Z]{3,4}\d{4}$/)) {
        completedCourses.push(courseCode)
      }
    }
  })
  
  // Parse year standing
  const yearStandings = ['FIRST_YEAR', 'SECOND_YEAR', 'THIRD_YEAR', 'FOURTH_YEAR']
  let currentYear: StudentTranscript['currentYear'] = 'FIRST_YEAR'
  
  if (yearStr) {
    const normalizedYear = yearStr.toUpperCase()
    if (yearStandings.includes(normalizedYear)) {
      currentYear = normalizedYear as StudentTranscript['currentYear']
    } else {
      console.log(`Invalid year standing "${yearStr}". Using FIRST_YEAR. Valid options: ${yearStandings.join(', ')}`)
    }
  }
  
  // Parse permission
  const hasSpecialPermission = permissionStr?.toLowerCase() === 'true' || permissionStr?.toLowerCase() === 'yes'

  const transcript: StudentTranscript = {
    completedCourses,
    courseGrades, 
    currentYear,
    hasSpecialPermission
  }

  console.log(`\n[COURSE] Validating prerequisites for ${course.id}`)
  console.log(`Your completed courses: ${completedCourses.join(', ')}`)
  console.log(`Current year standing: ${currentYear}`)
  console.log(`Special permission: ${hasSpecialPermission ? 'Yes' : 'No'}`)
  
  const explanation = await getPrerequisiteExplanation(courseCode.toUpperCase(), transcript)
  console.log(`\n${explanation}`)
}

async function showSections(courseCode: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseCode.toUpperCase() },
    include: { sections: true }
  })

  if (!course) {
    console.log(`[ERROR] Course ${courseCode} not found`)
    return
  }

  console.log(`\n[COURSE] ${course.id} - ${course.title || 'No title available'}`)
  
  if (course.sections.length === 0) {
    console.log('[ERROR] No sections available for this course')
    return
  }

  console.log(`\nAvailable Sections Available Sections (${course.sections.length} total):\n`)
  
  // Group sections by type for better display
  const sectionsByType = course.sections.reduce((acc, section) => {
    if (!acc[section.sectionType]) {
      acc[section.sectionType] = []
    }
    acc[section.sectionType].push(section)
    return acc
  }, {} as Record<string, any[]>)

  Object.entries(sectionsByType).forEach(([type, sections]) => {
    console.log(` ${type} Sections:`)
    sections.forEach(section => {
      const timeStr = section.startTime && section.endTime 
        ? `${formatTime(section.startTime)}-${formatTime(section.endTime)}`
        : 'TBA'
      
      const enrollmentStr = section.capacity && section.enrolled !== null
        ? `${section.enrolled}/${section.capacity}`
        : 'N/A'
        
      console.log(`   ${section.sectionCode}: ${section.days || 'TBA'} ${timeStr}`)
      console.log(`      Enrollment: ${enrollmentStr} | Term: ${section.term || 'N/A'} | Status: ${section.status || 'N/A'}`)
      if (section.instructor) {
        console.log(`      Instructor: ${section.instructor}`)
      }
    })
    console.log('')
  })
}

function formatTime(timeStr: string): string {
  // Convert "0835" to "8:35 AM"
  if (!timeStr || timeStr.length !== 4) return timeStr
  
  const hour = parseInt(timeStr.substring(0, 2))
  const minute = timeStr.substring(2, 4)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
  
  return `${displayHour}:${minute} ${ampm}`
}

async function showStats() {
  const courseCount = await prisma.course.count()
  const prereqCount = await prisma.prerequisite.count()
  const nodeCount = await prisma.prerequisiteNode.count()
  const sectionCount = await prisma.section.count()

  console.log(`\nDatabase Statistics: Database Statistics:`)
  console.log(`Smart Scheduler CLI Commands: Courses: ${courseCount}`)
  console.log(`Prerequisites: Prerequisite Expressions: ${prereqCount}`)
  console.log(`Prerequisite Tree Nodes: Prerequisite Tree Nodes: ${nodeCount}`)
  console.log(`Available Sections Sections: ${sectionCount}`)
}

async function main() {
  console.log('Current year standing: Welcome to Smart Scheduler CLI!')
  console.log('Type "help" for available commands or "exit" to quit.\n')

  while (true) {
    try {
      const input = await question('smart-scheduler> ')
      const [command, ...args] = input.trim().split(' ')

      switch (command.toLowerCase()) {
        case 'help':
          await showHelp()
          break
        
        case 'search':
          if (args.length === 0) {
            console.log('[ERROR] Usage: search <course_code>')
            break
          }
          await searchCourses(args.join(' '))
          break
        
        case 'prereq':
          if (args.length === 0) {
            console.log('[ERROR] Usage: prereq <course_code>')
            break
          }
          await showPrerequisites(args[0])
          break
        
        case 'sections':
          if (args.length === 0) {
            console.log('[ERROR] Usage: sections <course_code>')
            break
          }
          await showSections(args[0])
          break
        
        case 'validate':
          if (args.length < 2) {
            console.log('[ERROR] Usage: validate <course> <completed_courses> [year] [permission]')
            console.log('   Example: validate SYSC4907 "SYSC1006,SYSC2006,SYSC4001"')
            console.log('   Example: validate SYSC4907 "SYSC1006,SYSC2006,SYSC4001" FOURTH_YEAR')
            console.log('   Example: validate CIVE4302 "CIVE3203,CIVE3206" FOURTH_YEAR true')
            break
          }
          await validateCoursePrerequisites(
            args[0], 
            args[1].replace(/"/g, ''),
            args[2],
            args[3]
          )
          break
        
        case 'stats':
          await showStats()
          break
        
        case 'exit':
        case 'quit':
          console.log('Goodbye! Goodbye!')
          rl.close()
          await prisma.$disconnect()
          process.exit(0)
        
        case '':
          // Empty command, do nothing
          break
        
        default:
          console.log(`[ERROR] Unknown command: ${command}`)
          console.log('Type "help" for available commands.')
          break
      }
    } catch (error) {
      console.error('[ERROR] Error:', error)
    }
  }
}

main().catch(console.error)
