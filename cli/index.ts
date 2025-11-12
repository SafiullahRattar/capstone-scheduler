#!/usr/bin/env node

import { PrismaClient } from '@prisma/client'
import readline from 'readline'

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
📚 Smart Scheduler CLI Commands:

1. search <course_code>     - Search for a course (e.g., search SYSC4907)
2. prereq <course_code>     - Show prerequisites for a course
3. sections <course_code>   - Show all sections for a course with times
4. validate <course> <completed_courses> - Check if prerequisites are met
5. schedule <course_list>   - Check for schedule conflicts between courses
6. list programs           - Show all programs
7. stats                   - Show database statistics
8. help                    - Show this help
9. exit                    - Exit the CLI

Examples:
  search SYSC
  prereq SYSC4907
  sections SYSC4907
  validate SYSC4907 "SYSC1006,SYSC2006,SYSC4001"
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
      prerequisites: true,
      sections: true
    },
    take: 10
  })

  if (courses.length === 0) {
    console.log(`❌ No courses found matching "${searchTerm}"`)
    return
  }

  console.log(`\n🔍 Found ${courses.length} course(s) matching "${searchTerm}":`)
  courses.forEach(course => {
    console.log(`\n📖 ${course.id} - ${course.title}`)
    if (course.prerequisites.length > 0) {
      console.log(`   Prerequisites: ${course.prerequisites[0].requiredExpression || 'None'}`)
    }
    if (course.sections.length > 0) {
      console.log(`   Sections: ${course.sections.length} available`)
    }
  })
}

async function showPrerequisites(courseCode: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseCode.toUpperCase() },
    include: { prerequisites: true }
  })

  if (!course) {
    console.log(`❌ Course ${courseCode} not found`)
    return
  }

  console.log(`\n📖 ${course.id} - ${course.title}`)
  
  if (course.prerequisites.length === 0) {
    console.log('✅ No prerequisites required')
    return
  }

  const prereq = course.prerequisites[0]
  console.log(`📋 Prerequisites: ${prereq.requiredExpression || 'None'}`)
  
  if (prereq.restrictedPrograms.length > 0) {
    console.log(`🚫 Restricted for: ${prereq.restrictedPrograms.join(', ')}`)
  }
}

async function validatePrerequisites(courseCode: string, completedCoursesStr: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseCode.toUpperCase() },
    include: { prerequisites: true }
  })

  if (!course) {
    console.log(`❌ Course ${courseCode} not found`)
    return
  }

  if (course.prerequisites.length === 0) {
    console.log(`✅ ${courseCode} has no prerequisites - you can take it!`)
    return
  }

  const completedCourses = completedCoursesStr.split(',').map(c => c.trim().toUpperCase())
  const prereqExpression = course.prerequisites[0].requiredExpression

  console.log(`\n📖 ${course.id}`)
  console.log(`📋 Prerequisites: ${prereqExpression}`)
  console.log(`📚 Your completed courses: ${completedCourses.join(', ')}`)
  
  // Simple validation (this is where T4 will be implemented)
  console.log(`\n⚠️  Note: Full prerequisite validation logic not yet implemented.`)
  console.log(`   This will be completed in T4 of the project.`)
}

async function showPrograms() {
  const programs = await prisma.program.findMany()
  
  console.log(`\n🎓 Available Programs:`)
  programs.forEach(program => {
    console.log(`\n📘 ${program.id}`)
    console.log(`   Name: ${program.name}`)
    console.log(`   Faculty: ${program.faculty}`)
    console.log(`   Total Credits: ${program.totalCredits}`)
    console.log(`   Core Courses: ${program.coreRequirements.length}`)
  })
}

async function showSections(courseCode: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseCode.toUpperCase() },
    include: { sections: true }
  })

  if (!course) {
    console.log(`❌ Course ${courseCode} not found`)
    return
  }

  console.log(`\n📖 ${course.id} - ${course.title}`)
  
  if (course.sections.length === 0) {
    console.log('❌ No sections available for this course')
    return
  }

  console.log(`\n📅 Available Sections (${course.sections.length} total):\n`)
  
  // Group sections by type for better display
  const sectionsByType = course.sections.reduce((acc, section) => {
    if (!acc[section.sectionType]) {
      acc[section.sectionType] = []
    }
    acc[section.sectionType].push(section)
    return acc
  }, {} as Record<string, any[]>)

  Object.entries(sectionsByType).forEach(([type, sections]) => {
    console.log(`📝 ${type} Sections:`)
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
  const programCount = await prisma.program.count()
  const sectionCount = await prisma.section.count()

  console.log(`\n📊 Database Statistics:`)
  console.log(`📚 Courses: ${courseCount}`)
  console.log(`📋 Prerequisites: ${prereqCount}`)
  console.log(`🎓 Programs: ${programCount}`)
  console.log(`📅 Sections: ${sectionCount}`)
}

async function main() {
  console.log('🎓 Welcome to Smart Scheduler CLI!')
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
            console.log('❌ Usage: search <course_code>')
            break
          }
          await searchCourses(args.join(' '))
          break
        
        case 'prereq':
          if (args.length === 0) {
            console.log('❌ Usage: prereq <course_code>')
            break
          }
          await showPrerequisites(args[0])
          break
        
        case 'sections':
          if (args.length === 0) {
            console.log('❌ Usage: sections <course_code>')
            break
          }
          await showSections(args[0])
          break
        
        case 'validate':
          if (args.length < 2) {
            console.log('❌ Usage: validate <course> <completed_courses>')
            console.log('   Example: validate SYSC4907 "SYSC1006,SYSC2006,SYSC4001"')
            break
          }
          await validatePrerequisites(args[0], args.slice(1).join(' ').replace(/"/g, ''))
          break
        
        case 'list':
          if (args[0] === 'programs') {
            await showPrograms()
          } else {
            console.log('❌ Usage: list programs')
          }
          break
        
        case 'stats':
          await showStats()
          break
        
        case 'exit':
        case 'quit':
          console.log('👋 Goodbye!')
          rl.close()
          await prisma.$disconnect()
          process.exit(0)
          break
        
        case '':
          // Empty command, do nothing
          break
        
        default:
          console.log(`❌ Unknown command: ${command}`)
          console.log('Type "help" for available commands.')
          break
      }
    } catch (error) {
      console.error('❌ Error:', error)
    }
  }
}

main().catch(console.error)