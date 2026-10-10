import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyBlockedTimes, evaluateElectiveFit, type Section, type TimeSlot } from '../server/lib/schedule-generation'
import { parseBlockedTimes, formatClockTime } from '../shared/blocked-times'

const slot = (day: string, startTime: string, endTime: string): TimeSlot => ({ day, startTime, endTime })
function section(id: string, courseId: string, type: string, timeSlots: TimeSlot[], deliveryMode: Section['deliveryMode'] = 'IN_PERSON'): Section {
  return { id, courseId, crn: id, sectionCode: id, sectionType: type, timeSlots, deliveryMode, instructor: null, location: null, capacity: null, enrolled: null }
}

test('sections meeting during a blocked time are dropped, touching edges and async sections are kept', () => {
  const course = { courseId: 'SYSC4806', sections: [
    section('A', 'SYSC4806', 'LEC', [slot('Monday', '0835', '1025')]),
    section('B', 'SYSC4806', 'LEC', [slot('Monday', '1035', '1225')]),
    section('C', 'SYSC4806', 'LEC', [slot('Tuesday', '0835', '1025')]),
    section('D', 'SYSC4806', 'LEC', [slot('Monday', '0900', '1000')], 'ONLINE_ASYNC'),
  ] }
  const { courseSections, blockedCourses } = applyBlockedTimes([course], [{ day: 'Monday', startTime: '08:00', endTime: '10:35' }])
  assert.deepEqual(courseSections[0].sections.map(item => item.id), ['B', 'C', 'D'])
  assert.deepEqual(blockedCourses, [])
})

test('a course whose every lab is blocked has no usable sections and is reported', () => {
  const course = { courseId: 'ELEC2501', sections: [
    section('A', 'ELEC2501', 'LEC', [slot('Tuesday', '1000', '1100')]),
    section('L1', 'ELEC2501', 'LAB', [slot('Friday', '1430', '1720')]),
    section('L2', 'ELEC2501', 'LAB', [slot('Friday', '0830', '1120')]),
  ] }
  const { courseSections, blockedCourses } = applyBlockedTimes([course], [{ day: 'Friday', startTime: '08:00', endTime: '18:00' }])
  assert.deepEqual(courseSections[0].sections, [])
  assert.deepEqual(blockedCourses, ['ELEC2501'])
})

test('elective fit treats a blocked-out candidate as not fitting', () => {
  const fixed = [{ courseId: 'MATH1004', sections: [section('A', 'MATH1004', 'LEC', [slot('Monday', '0900', '1000')])] }]
  const candidates = [{ courseId: 'ECON1001', sections: [section('C', 'ECON1001', 'LEC', [slot('Wednesday', '1800', '2100')])] }]
  assert.equal(evaluateElectiveFit(fixed, candidates, false).fits.ECON1001, true)
  const blocked = applyBlockedTimes(candidates, [{ day: 'Wednesday', startTime: '17:00', endTime: '22:00' }]).courseSections
  assert.equal(evaluateElectiveFit(fixed, blocked, false).fits.ECON1001, false)
})

test('blocked time input is validated', () => {
  assert.deepEqual(parseBlockedTimes(undefined), [])
  assert.deepEqual(parseBlockedTimes([{ day: 'Friday', startTime: '13:00', endTime: '17:30' }]), [{ day: 'Friday', startTime: '13:00', endTime: '17:30' }])
  assert.throws(() => parseBlockedTimes([{ day: 'Saturday', startTime: '13:00', endTime: '17:00' }]), /Invalid blocked times/)
  assert.throws(() => parseBlockedTimes([{ day: 'Friday', startTime: '17:00', endTime: '13:00' }]), /Invalid blocked times/)
  assert.throws(() => parseBlockedTimes([{ day: 'Friday', startTime: '9:00', endTime: '13:00' }]), /Invalid blocked times/)
  assert.throws(() => parseBlockedTimes('Friday'), /Invalid blocked times/)
  assert.equal(formatClockTime('00:05'), '12:05am')
  assert.equal(formatClockTime('17:30'), '5:30pm')
})
