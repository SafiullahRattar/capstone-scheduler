import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const termCopies = [
  { source: '202530', target: '202630', label: 'Fall 2026' },
  { source: '202610', target: '202710', label: 'Winter 2027' },
  { source: '202610', target: '202720', label: 'Summer 2027' }
]

function shiftDateYear(value: string | null): string | null {
  return value?.replace(/^(\d{4})(-\d{2}-\d{2})/, (_, year, rest) => `${Number(year) + 1}${rest}`) ?? null
}

async function main() {
  const copies = await Promise.all(termCopies.map(async term => ({
    ...term,
    sections: await prisma.section.findMany({ where: { term: term.source }, include: { meetings: true } })
  })))

  for (const copy of copies) {
    if (copy.sections.length === 0) {
      throw new Error(`No source sections for ${copy.source}. Run npm run db:seed first.`)
    }
  }

  await prisma.$transaction(async tx => {
    for (const copy of copies) {
      // Stable sample IDs make reruns safe without replacing existing timetable data.
      const sections = copy.sections.map(section => ({
        id: `sample:${copy.target}:${section.id}`,
        term: copy.target,
        crn: section.crn,
        courseId: section.courseId,
        sectionCode: section.sectionCode,
        sectionType: section.sectionType,
        instructor: section.instructor,
        location: section.location,
        capacity: section.capacity,
        enrolled: section.enrolled,
        status: section.status
      }))
      const meetings = copy.sections.flatMap(section => section.meetings.map(meeting => ({
        id: `sample:${copy.target}:${meeting.id}`,
        sectionId: `sample:${copy.target}:${section.id}`,
        days: meeting.days,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        startDate: shiftDateYear(meeting.startDate),
        endDate: shiftDateYear(meeting.endDate),
        roomCapacity: meeting.roomCapacity
      })))

      for (let i = 0; i < sections.length; i += 500) {
        await tx.section.createMany({ data: sections.slice(i, i + 500), skipDuplicates: true })
      }
      for (let i = 0; i < meetings.length; i += 500) {
        await tx.sectionMeeting.createMany({ data: meetings.slice(i, i + 500), skipDuplicates: true })
      }
      console.log(`${copy.label}: copied ${sections.length} sample sections and ${meetings.length} meetings from ${copy.source}`)
    }
  }, { timeout: 60000 })
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
