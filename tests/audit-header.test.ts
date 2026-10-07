import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseHTML } from '../cli/audit/parse-html'

// Header shape from a live Carleton audit: the title has no name, only the program line.
const liveHeader = `<html><body>
<header><div id="header"><div id="headerInfo" class="float-right">
<span class="float-right">
Alex Example
</span><br><span class="float-right">Undergraduate</span><br>
</div></div></header>
<div class="auditTitle">
<div class="floatright" style="height:60px;"><a id="pageAddButton" href="#" class="btn btn-primary">Request Audit</a></div>
<!--div -->
<!-- /div -->
<br>
Bachelor of Engineering - Software Engineering<br>
</div>
<div class="auditHeaderEntry col-3"><h>101999999</h></div>
</body></html>`

test('a live audit with no name in the title still yields the program and the header name', () => {
  const audit = parseHTML(liveHeader)
  assert.equal(audit.program, 'Software Engineering')
  assert.equal(audit.name, 'Alex Example')
})

test('the test-audit layout with "Last, First" in the title still works', () => {
  const audit = parseHTML(`<html><body><div class="auditTitle">
Testington, Jane<br/>
Bachelor of Engineering - Software Engineering<br/>
</div></body></html>`)
  assert.equal(audit.name, 'Jane Testington')
  assert.equal(audit.program, 'Software Engineering')
})
