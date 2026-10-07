/*
 * Rebuilds stored prerequisite trees that an older seed wrote with admission-level
 * requirements (OTHER_REQUIREMENT, HIGH_SCHOOL_REQUIREMENT, PROGRAM_*, MATH 0005/0006)
 * as PERMISSION nodes, which made first-year courses look like they need permission.
 *
 *   npm run db:repair-prerequisites            # show what would change
 *   npm run db:repair-prerequisites -- --apply # rewrite the affected trees
 */

import { PrismaClient } from '@prisma/client'
import { createPrerequisiteTree, parsePrerequisiteExpression } from './prerequisite-tree'

const prisma = new PrismaClient()
const ADMISSION_TOKENS = /OTHER_REQUIREMENT|HIGH_SCHOOL_REQUIREMENT|PROGRAM_|MATH000[56]|_REQUIREMENT/

async function main() {
  const apply = process.argv.includes('--apply')
  const affected = (await prisma.prerequisite.findMany()).filter(row => ADMISSION_TOKENS.test(row.expression))

  for (const row of affected) {
    const before = await prisma.prerequisiteNode.count({ where: { courseId: row.courseId, nodeType: 'PERMISSION' } })
    console.log(`${row.courseId.padEnd(9)} ${before} permission node(s)  ${row.expression}`)
    if (!apply) continue
    await prisma.$transaction(async tx => {
      // Children reference parents, so delete deepest nodes first.
      const nodes = await tx.prerequisiteNode.findMany({ where: { courseId: row.courseId }, select: { id: true, parentId: true } })
      const depth = (id: string | null): number => { const node = nodes.find(item => item.id === id); return node?.parentId ? 1 + depth(node.parentId) : 0 }
      for (const node of [...nodes].sort((a, b) => depth(b.id) - depth(a.id))) await tx.prerequisiteNode.delete({ where: { id: node.id } })
      await createPrerequisiteTree(tx as unknown as PrismaClient, row.courseId, parsePrerequisiteExpression(row.expression))
    })
  }

  console.log(apply ? `\nRebuilt ${affected.length} prerequisite trees.` : `\n${affected.length} trees would be rebuilt. Run with --apply to rewrite them.`)
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
