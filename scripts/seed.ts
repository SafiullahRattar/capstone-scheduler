import { PrismaClient } from '@prisma/client'
import { promises as fs } from 'fs'
import * as path from 'path'
import { ELECTIVE_CATEGORIES } from '../cli/elective-mappings'
import { ensureSectionMeetingsTable, insertSectionMeetings } from '../server/lib/section-meetings'
import { createPrerequisiteTree as writePrerequisiteTree, parsePrerequisiteExpression } from './prerequisite-tree'

const prisma = new PrismaClient()

const ELECTIVE_CATEGORY_SEED: Record<string, { label: string }> = {
  CS_ELECTIVE: { label: 'Computer Science Elective' },
  SCIENCE_ELECTIVE: { label: 'Basic Science Elective' },
  COMPLEMENTARY_STUDIES: { label: 'Complementary Studies' }
}

// Enhanced course data interface
interface CourseEntry {
  required: string | null
  restricted: string[]
  title?: string
  credits?: number
  description?: string
}

interface SectionMeetingSeed {
  days: string | null
  startTime: string | null
  endTime: string | null
  roomCapacity: number | null
}

interface SectionSeed {
  crn: string
  courseId: string
  sectionCode: string
  sectionType: string
  term: string
  meetings: SectionMeetingSeed[]
}

// Helper function to extract all course codes from a prerequisite expression
function extractCourseCodesFromExpression(expression: string): string[] {
  const coursePattern = /\b[A-Z]{3,4}\d{4}\b/g
  return expression.match(coursePattern) || []
}

async function resolveScheduleCsvPath(): Promise<string> {
  for (const fileName of ['Sched.csv', 'sched.csv']) {
    const fullPath = path.join(process.cwd(), fileName)
    try {
      await fs.access(fullPath)
      return fullPath
    } catch {
      continue
    }
  }

  throw new Error('Sched.csv not found in project root')
}

function mapScheduleTermLabel(termLabel: string): string {
  const normalized = termLabel.trim().toLowerCase()

  // This dataset contains Fall 2025 and Winter 2026.
  if (normalized === 'fall') return '202530'
  if (normalized === 'winter') return '202610'

  throw new Error(`Unsupported schedule term label: ${termLabel}`)
}

function parseScheduleCsv(content: string): SectionSeed[] {
  const lines = content.split(/\r?\n/).filter(line => line.trim())
  if (lines.length <= 1) return []

  const header = lines[0].split('\t')
  const expectedHeader = ['TERM', 'CRN', 'SUBJ', 'CRSE', 'SECT', 'INSTR_TYPE', 'DAYS', 'START_TIME', 'END_TIME', 'ROOM_CAP']
  if (header.join('\t') !== expectedHeader.join('\t')) {
    throw new Error(`Unexpected Sched.csv header: ${header.join(', ')}`)
  }

  const groupedSections = new Map<string, SectionSeed>()

  for (const line of lines.slice(1)) {
    const parts = line.split('\t')
    if (parts.length < 10) continue

    const [
      termLabel,
      crn,
      department,
      courseNumber,
      sectionCode,
      sectionType,
      days,
      startTime,
      endTime,
      roomCapacity
    ] = parts

    const normalizedTerm = mapScheduleTermLabel(termLabel)
    const courseId = `${department}${courseNumber}`
    const sectionKey = [normalizedTerm, crn, courseId, sectionCode, sectionType].join('|')

    const meeting: SectionMeetingSeed = {
      days: days || null,
      startTime: startTime ? startTime.padStart(4, '0') : null,
      endTime: endTime ? endTime.padStart(4, '0') : null,
      roomCapacity: roomCapacity ? parseInt(roomCapacity, 10) || null : null
    }

    const existingSection = groupedSections.get(sectionKey)
    if (!existingSection) {
      groupedSections.set(sectionKey, {
        crn,
        courseId,
        sectionCode,
        sectionType,
        term: normalizedTerm,
        meetings: meeting.days || meeting.startTime || meeting.endTime || meeting.roomCapacity !== null
          ? [meeting]
          : []
      })
      continue
    }

    const alreadySeenMeeting = existingSection.meetings.some(existing =>
      existing.days === meeting.days &&
      existing.startTime === meeting.startTime &&
      existing.endTime === meeting.endTime &&
      existing.roomCapacity === meeting.roomCapacity
    )

    if (!alreadySeenMeeting && (meeting.days || meeting.startTime || meeting.endTime || meeting.roomCapacity !== null)) {
      existingSection.meetings.push(meeting)
    }
  }

  return Array.from(groupedSections.values())
}

async function main() {
  console.log('[SEED] Starting database seed...')

  // Read the enhanced prerequisites JSON file
  const prerequisitesPath = path.join(process.cwd(), 'course_prerequisites_simple.json')
  const prerequisitesData: Record<string, CourseEntry> = JSON.parse(await fs.readFile(prerequisitesPath, 'utf-8'))
  const scheduleCsvPath = await resolveScheduleCsvPath()
  const scheduleSections = parseScheduleCsv(await fs.readFile(scheduleCsvPath, 'utf-8'))

  console.log(`[COURSES] Found ${Object.keys(prerequisitesData).length} courses with enhanced data`)
  console.log(`[SCHEDULE] Found ${scheduleSections.length} normalized sections in ${path.basename(scheduleCsvPath)}`)

  // PASS 1: Collect all unique course codes mentioned in prerequisites
  console.log('[SEARCH] Pass 1: Collecting all referenced courses...')
  const allReferencedCourses = new Set<string>()
  
  for (const [courseId, courseEntry] of Object.entries(prerequisitesData)) {
    // Add the main course
    allReferencedCourses.add(courseId)
    
    // Extract prerequisite courses from the expression
    if (courseEntry.required) {
      const prereqCourses = extractCourseCodesFromExpression(courseEntry.required)
      prereqCourses.forEach(course => allReferencedCourses.add(course))
    }
  }

  for (const section of scheduleSections) {
    allReferencedCourses.add(section.courseId)
  }
  
  console.log(`[LIST] Found ${allReferencedCourses.size} unique courses to create`)
  
  // Create all Course records first to satisfy foreign key constraints
  console.log('[CREATE] Creating Course records...')
  let coursesCreated = 0
  let titledCourses = 0
  
  for (const courseId of Array.from(allReferencedCourses)) {
    try {
      const courseEntry = prerequisitesData[courseId]
      
      await prisma.course.upsert({
        where: { id: courseId },
        update: {
          updatedAt: new Date(),
          // Update title/description if we have enhanced data
          ...(courseEntry?.title && courseEntry.title !== courseId ? { 
            title: courseEntry.title,
            description: courseEntry.description,
            credits: courseEntry.credits
          } : {})
        },
        create: {
          id: courseId,
          title: courseEntry?.title || courseId,
          description: courseEntry?.description || null,
          credits: courseEntry?.credits || null
        }
      })
      
      coursesCreated++
      if (courseEntry?.title && courseEntry.title !== courseId) {
        titledCourses++
      }
    } catch (error) {
      console.log(`[ERROR] Error creating course ${courseId}:`, error)
    }
  }
  
  console.log(`[SUCCESS] Created ${coursesCreated} course records`)
  console.log(`[TITLES] ${titledCourses} courses have proper titles`)

  // PASS 2: Create prerequisites and parse trees
  console.log('[TREE] Pass 2: Creating prerequisite expressions and trees...')
  let successCount = 0
  let errorCount = 0

  for (const [courseId, courseEntry] of Object.entries(prerequisitesData)) {
    try {
      // Create prerequisite if it exists
      if (courseEntry.required) {
        // Store the human-readable expression
        await prisma.prerequisite.upsert({
          where: { courseId },
          update: {
            expression: courseEntry.required,
            lastModified: new Date()
          },
          create: {
            courseId: courseId,
            expression: courseEntry.required,
          }
        })

        // Parse and create tree structure
        try {
          // Clear existing nodes for this course
          await prisma.prerequisiteNode.deleteMany({
            where: { courseId }
          })
          
          const parsedTree = parsePrerequisiteExpression(courseEntry.required)
          await writePrerequisiteTree(prisma, courseId, parsedTree)
          
          successCount++
        } catch (parseError) {
          console.log(`[WARNING] Failed to parse prerequisites for ${courseId}: ${courseEntry.required}`)
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

  // PASS 3: Backfill titles from course_titles.json for any course still
  // using its code as the title (e.g. courses created by import-timetable
  // that weren't in course_prerequisites_simple.json).
  console.log('[TITLES] Pass 3: Backfilling titles from course_titles.json...')
  const titlesPath = path.join(process.cwd(), 'course_titles.json')
  let titlesBackfilled = 0
  try {
    const titlesFile: { courses: Record<string, { title: string; credits: number; description: string }> } =
      JSON.parse(await fs.readFile(titlesPath, 'utf-8'))

    // Find all courses whose title still equals their id (the placeholder)
    const coursesNeedingTitles = await prisma.course.findMany({
      select: { id: true, title: true }
    })

    for (const course of coursesNeedingTitles) {
      // Only update if the title is the course code (placeholder) or null
      if (course.title && course.title !== course.id) continue

      const titleEntry = titlesFile.courses[course.id]
      if (!titleEntry) continue

      await prisma.course.update({
        where: { id: course.id },
        data: {
          title: titleEntry.title,
          description: titleEntry.description || null,
          credits: titleEntry.credits || null
        }
      })
      titlesBackfilled++
    }

    console.log(`[TITLES] Backfilled ${titlesBackfilled} course titles from course_titles.json`)
  } catch (err) {
    console.log(`[WARNING] Could not backfill titles from course_titles.json: ${err}`)
  }

  console.log('\n[SCHEDULE] Rebuilding section and meeting data from Sched.csv...')
  await ensureSectionMeetingsTable(prisma)
  await prisma.section.deleteMany({})

  let sectionsCreated = 0
  let meetingsCreated = 0

  for (const section of scheduleSections) {
    const createdSection = await prisma.section.create({
      data: {
        crn: section.crn,
        courseId: section.courseId,
        sectionCode: section.sectionCode,
        sectionType: section.sectionType,
        term: section.term
      }
    })

    await insertSectionMeetings(
      prisma,
      createdSection.id,
      section.meetings.map(meeting => ({
        days: meeting.days,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        startDate: null,
        endDate: null,
        roomCapacity: meeting.roomCapacity
      }))
    )

    sectionsCreated++
    meetingsCreated += section.meetings.length
  }

  console.log(`[SCHEDULE] Seeded ${sectionsCreated} sections and ${meetingsCreated} meeting rows`)
  
  // Show statistics about course titles
  const coursesWithTitles = await prisma.course.count({
    where: {
      NOT: {
        title: { equals: prisma.course.fields.id }
      }
    }
  })
  
  const totalCourses = await prisma.course.count()
  
  console.log(`\n[FINAL STATS] Course title coverage:`)
  console.log(`   Total courses in database: ${totalCourses}`)
  console.log(`   Courses with proper titles: ${coursesWithTitles}`)
  console.log(`   Coverage: ${((coursesWithTitles / totalCourses) * 100).toFixed(1)}%`)

  console.log('\n[ELECTIVES] Syncing elective categories...')
  let electiveCourseLinks = 0
  const activeElectiveCategoryIds = Object.keys(ELECTIVE_CATEGORIES)

  await prisma.electiveCourse.deleteMany({
    where: {
      categoryId: {
        notIn: activeElectiveCategoryIds
      }
    }
  })

  await prisma.electiveCategory.deleteMany({
    where: {
      id: {
        notIn: activeElectiveCategoryIds
      }
    }
  })

  for (const [categoryId, courseIds] of Object.entries(ELECTIVE_CATEGORIES)) {
    const metadata = ELECTIVE_CATEGORY_SEED[categoryId] || {
      label: categoryId
    }

    await prisma.electiveCategory.upsert({
      where: { id: categoryId },
      update: {
        label: metadata.label
      },
      create: {
        id: categoryId,
        label: metadata.label
      }
    })

    await prisma.electiveCourse.deleteMany({
      where: { categoryId }
    })

    const existingCourses = await prisma.course.findMany({
      where: {
        id: {
          in: courseIds
        }
      },
      select: {
        id: true
      }
    })

    if (existingCourses.length === 0) {
      continue
    }

    await prisma.electiveCourse.createMany({
      data: existingCourses.map(course => ({
        categoryId,
        courseId: course.id
      })),
      skipDuplicates: true
    })

    electiveCourseLinks += existingCourses.length
  }

  console.log(`[ELECTIVES] Synced ${Object.keys(ELECTIVE_CATEGORIES).length} categories and ${electiveCourseLinks} course links`)
}

main()
  .catch((e) => {
    console.error('[ERROR] Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
