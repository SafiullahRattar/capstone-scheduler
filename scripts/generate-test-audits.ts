/*
 * Writes simulated Software Engineering audits to test-audits/ in the layout of a page
 * saved from Carleton Central, and to test-audits/simple/ in the test-audit.html layout.
 *
 *   npm run audits:generate                 # write the HTML files and manifest.json
 *   npm run audits:generate -- --check      # also parse each one and try scheduling it (needs the database)
 *   npm run audits:generate -- --as-of 26FA # pick the term that is in progress
 *   npm run audits:generate -- --only first-year-no-progress # write one audit
 */

import fs from 'fs/promises'
import path from 'path'
import { currentAuditTerm, generateAudit, PERSONAS } from './audit-generator'

const args = process.argv.slice(2)
const asOf = args.includes('--as-of') ? args[args.indexOf('--as-of') + 1] : currentAuditTerm()
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : undefined
const outDir = path.join(process.cwd(), 'test-audits')

async function main() {
  const personas = only ? PERSONAS.filter(persona => persona.id === only) : PERSONAS
  if (!personas.length) throw new Error(`Unknown audit persona: ${only}`)
  await fs.mkdir(path.join(outDir, 'simple'), { recursive: true })
  const manifest: Array<{ file: string; simpleFile: string; name: string; description: string; expected: ReturnType<typeof generateAudit>['expected']; expectedSimple: ReturnType<typeof generateAudit>['expected'] }> = []
  for (const persona of personas) {
    const { html, expected } = generateAudit(persona, asOf, 'live')
    const file = `${persona.id}.html`
    await fs.writeFile(path.join(outDir, file), html)
    const simple = generateAudit(persona, asOf, 'simple')
    await fs.writeFile(path.join(outDir, 'simple', file), simple.html)
    manifest.push({ file, simpleFile: `simple/${file}`, name: persona.name, description: persona.description, expected, expectedSimple: simple.expected })
  }
  const manifestPath = path.join(outDir, 'manifest.json')
  const previous = only ? JSON.parse(await fs.readFile(manifestPath, 'utf-8')) : null
  if (previous && previous.asOf !== asOf) throw new Error('Use the existing manifest as-of term when generating a single audit.')
  const audits = previous ? [...previous.audits.filter((item: { file: string }) => !manifest.some(entry => entry.file === item.file)), ...manifest] : manifest
  await fs.writeFile(manifestPath, JSON.stringify({ asOf, audits }, null, 2))
  console.log(`Wrote ${manifest.length} audits as of ${asOf} to ${path.relative(process.cwd(), outDir)}/`)

  if (args.includes('--check')) await check(manifest.map(item => item.file))
}

// Parses each audit like the upload route does, then generates schedules for the
// courses each student still needs in every upcoming term.
async function check(files: string[]) {
  const { PrismaClient } = await import('@prisma/client')
  const { ingestAudit } = await import('../cli/audit/router')
  const { getRemainingCourses, getElectiveRequirements } = await import('../cli/audit-parser')
  const { getElectiveCategoryLookup } = await import('../server/lib/electives')
  const { generateSchedulesForCourses } = await import('../server/lib/schedule-generation')
  const prisma = new PrismaClient()
  try {
    const lookup = await getElectiveCategoryLookup(prisma)
    const terms = ['202630', '202710', '202720']
    console.log(`\n${'audit'.padEnd(22)}${'done'.padStart(5)}${'now'.padStart(5)}${'left'.padStart(6)}  electives  ${terms.map(term => `${term} offered/schedules`).join('  ')}`)
    for (const file of files) {
      const audit = ingestAudit(await fs.readFile(path.join(outDir, file), 'utf-8'), { filePath: file })
      const remaining = getRemainingCourses(audit, lookup)
      const electives = getElectiveRequirements(audit, lookup).map(item => `${item.category}:${item.creditsNeeded}`)
      const cells = []
      for (const term of terms) {
        const offered = (await prisma.section.findMany({ where: { term, courseId: { in: remaining } }, distinct: ['courseId'], select: { courseId: true } })).map(row => row.courseId)
        const pick = offered.slice(0, 5)
        const schedules = pick.length ? (await generateSchedulesForCourses(prisma, { courseIds: pick, term, maxSchedules: 50, includePrerequisites: false })).schedules.length : 0
        cells.push(`${String(offered.length).padStart(7)}/${String(schedules).padEnd(9)}`)
      }
      console.log(`${file.replace('.html', '').padEnd(22)}${String(audit.completedCourses.length).padStart(5)}${String(audit.currentCourses.length).padStart(5)}${String(remaining.length).padStart(6)}  ${(electives.join(' ') || '-').padEnd(9)}  ${cells.join('  ')}`)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
