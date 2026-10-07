import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseHTML } from '../cli/audit/parse-html'
import { parsePDF } from '../cli/audit/parse-pdf'

test('HTML requirements keep their audit year even when the course number suggests another year', () => {
  const audit = parseHTML(`<html><body>
    <div class="requirement"><div class="reqTitle">FIRST YEAR</div>
      <div class="subrequirement" rqdHours="0.5"><span class="status Status_NO"></span><span class="subreqTitle">0.5 credits in SYSC 2004</span></div>
    </div>
    <div class="requirement"><div class="reqTitle">FOURTH YEAR</div>
      <div class="subrequirement" rqdHours="1"><span class="status Status_NO"></span><span class="subreqTitle">1 credit in Computer Science Electives</span></div>
    </div>
  </body></html>`)
  assert.equal(audit.requirements[0].groupTitle, 'FIRST YEAR')
  assert.deepEqual(audit.requirements[0].courseOptions, ['SYSC2004'])
  assert.equal(audit.requirements[1].groupTitle, 'FOURTH YEAR')
  assert.deepEqual(audit.requirements[1].courseOptions, ['CS_ELECTIVE'])
})

test('PDF section changes attach each requirement to the correct audit year', () => {
  const audit = parsePDF(`NO  FIRST YEAR
  - 1) 0.5 credits in SYSC 2004
NO  FOURTH YEAR
  - 2) 1.0 credits in Computer Science Electives
******** END OF REPORT ********`)
  assert.deepEqual(audit.requirements.map(requirement => requirement.groupTitle), ['FIRST YEAR', 'FOURTH YEAR'])
  assert.deepEqual(audit.requirements[0].courseOptions, ['SYSC2004'])
  assert.deepEqual(audit.requirements[1].courseOptions, ['CS_ELECTIVE'])
})
