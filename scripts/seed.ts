import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Read the prerequisites JSON file
  const prerequisitesPath = path.join(process.cwd(), 'course_prerequisites_simple.json')
  const prerequisitesData = JSON.parse(await fs.readFile(prerequisitesPath, 'utf-8'))

  console.log(`📚 Found ${Object.keys(prerequisitesData).length} courses with prerequisites`)

  // Create courses and prerequisites
  for (const [courseId, data] of Object.entries(prerequisitesData)) {
    const courseData = data as { required: string | null, restricted: string[] }
    
    // Create or update course
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

    // Create prerequisite if it exists
    if (courseData.required) {
      await prisma.prerequisite.upsert({
        where: { 
          id: `${courseId}_prereq` 
        },
        update: {
          requiredExpression: courseData.required,
          restrictedPrograms: courseData.restricted,
          updatedAt: new Date()
        },
        create: {
          id: `${courseId}_prereq`,
          courseId: courseId,
          requiredExpression: courseData.required,
          restrictedPrograms: courseData.restricted,
        }
      })
    }
  }

  // Note: Program data will be added in future iterations based on official program requirements

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })