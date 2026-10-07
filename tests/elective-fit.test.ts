import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyDeliveryPreference, evaluateElectiveFit, type Section } from '../server/lib/schedule-generation'
import { parseDeliveryMode } from '../shared/delivery-mode'
import type { DeliveryMode } from '../shared/delivery-mode'

let nextId = 0
function section(courseId: string, sectionType: string, day: string, startTime: string, endTime: string, deliveryMode: DeliveryMode = 'IN_PERSON'): Section {
  nextId += 1
  return { id: String(nextId), courseId, crn: String(nextId), sectionCode: 'A', sectionType, instructor: null, location: null, capacity: null, enrolled: null, deliveryMode, timeSlots: startTime ? [{ day, startTime, endTime }] : [] }
}

test('a candidate fits when another section of a fixed course frees the time', () => {
  const core = { courseId: 'SYSC2004', sections: [section('SYSC2004', 'Lecture', 'Monday', '0835', '0955'), section('SYSC2004', 'Lecture', 'Tuesday', '0835', '0955')] }
  const elective = { courseId: 'COMP3004', sections: [section('COMP3004', 'Lecture', 'Monday', '0835', '0955')] }
  const result = evaluateElectiveFit([core], [elective], false)
  assert.equal(result.fits.COMP3004, true)
})

test('pairwise lists electives that cannot be taken together', () => {
  const a = { courseId: 'COMP3004', sections: [section('COMP3004', 'Lecture', 'Monday', '1005', '1125'), section('COMP3004', 'Lab', 'Friday', '1305', '1425')] }
  const b = { courseId: 'COMP3005', sections: [section('COMP3005', 'Lecture', 'Wednesday', '1005', '1125'), section('COMP3005', 'Lab', 'Friday', '1335', '1455')] }
  const c = { courseId: 'COMP3007', sections: [section('COMP3007', 'Lecture', 'Thursday', '1005', '1125')] }
  const result = evaluateElectiveFit([], [a, b, c], true)
  assert.deepEqual(result.blocks.COMP3004, ['COMP3005'])
  assert.deepEqual(result.blocks.COMP3005, ['COMP3004'])
  assert.deepEqual(result.blocks.COMP3007, [])
  assert.equal(result.pairwiseComplete, true)
})

test('a candidate without sections does not fit', () => {
  const result = evaluateElectiveFit([], [{ courseId: 'COMP4000', sections: [] }], true)
  assert.equal(result.fits.COMP4000, false)
})

test('online preference keeps online sections and falls back per section type', () => {
  const course = {
    courseId: 'CHEM1001',
    sections: [
      section('CHEM1001', 'Lecture', 'Monday', '0835', '0955'),
      section('CHEM1001', 'Lecture', '', '', '', 'ONLINE_ASYNC'),
      section('CHEM1001', 'Lab', 'Friday', '1435', '1725'),
    ],
  }
  const { courseSections, fallbacks } = applyDeliveryPreference([course], 'online')
  assert.deepEqual(courseSections[0].sections.map(item => `${item.sectionType}:${item.deliveryMode}`), ['Lecture:ONLINE_ASYNC', 'Lab:IN_PERSON'])
  assert.deepEqual(fallbacks, ['CHEM1001'])
})

test('asynchronous sections never conflict', () => {
  const core = { courseId: 'SYSC2004', sections: [section('SYSC2004', 'Lecture', 'Monday', '0835', '0955')] }
  const online = { courseId: 'PSYC1001', sections: [section('PSYC1001', 'Lecture', '', '', '', 'ONLINE_ASYNC')] }
  assert.equal(evaluateElectiveFit([core], [online], false).fits.PSYC1001, true)
})

test('delivery mode wording from timetable exports is recognised', () => {
  assert.equal(parseDeliveryMode('Online - Asynchronous'), 'ONLINE_ASYNC')
  assert.equal(parseDeliveryMode('Online Synchronous'), 'ONLINE_SYNC')
  assert.equal(parseDeliveryMode('Blended'), 'HYBRID')
  assert.equal(parseDeliveryMode('In Person'), 'IN_PERSON')
  assert.equal(parseDeliveryMode(''), null)
})

test('hybrid sections are preferred over the opposite mode when nothing matches', () => {
  const course = {
    courseId: 'BUSI1800',
    sections: [
      section('BUSI1800', 'Lecture', 'Monday', '0835', '0955'),
      section('BUSI1800', 'Lecture', 'Tuesday', '0835', '0955', 'HYBRID'),
    ],
  }
  const { courseSections } = applyDeliveryPreference([course], 'online')
  assert.deepEqual(courseSections[0].sections.map(item => item.deliveryMode), ['HYBRID'])
})
