import { test } from 'node:test'
import assert from 'node:assert/strict'
import { diffSchedules, slotKey } from '../Carletonscheduler/src/utils/scheduleDiff'
import type { GeneratedSchedule, Section, TimeSlot } from '../Carletonscheduler/src/utils/scheduleGenerator'

const slot = (day: TimeSlot['day'], startTime: string, endTime: string): TimeSlot => ({ day, startTime, endTime })
const section = (type: string, sectionCode: string, timeSlots: TimeSlot[]): Section =>
  ({ crn: sectionCode, sectionCode, type, instructor: '', timeSlots, capacity: 0, enrolled: 0, deliveryMode: 'IN_PERSON' })
const schedule = (id: number, selections: [string, Section][]): GeneratedSchedule =>
  ({ id, selections: selections.map(([courseCode, item]) => ({ courseCode, section: item })), hasUnmetPrerequisites: false })

const lecture = section('LEC', 'A', [slot('Monday', '08:35', '09:55'), slot('Wednesday', '08:35', '09:55')])

test('a swapped lab is paired with the lab it replaced and the unchanged lecture is left alone', () => {
  const before = schedule(1, [['SYSC4106', lecture], ['SYSC4106', section('LAB', 'L2', [slot('Tuesday', '14:35', '17:25')])]])
  const after = schedule(2, [['SYSC4106', lecture], ['SYSC4106', section('LAB', 'L4', [slot('Thursday', '08:35', '11:25')])]])
  const diff = diffSchedules(before, after)
  assert.deepEqual(diff.summary, ['SYSC4106 LAB L2 → L4'])
  assert.deepEqual(diff.changedSlots.get(slotKey(after.selections[1], after.selections[1].section.timeSlots[0])), slot('Tuesday', '14:35', '17:25'))
  assert.equal(diff.changedSlots.has(slotKey(after.selections[0], lecture.timeSlots[0])), false)
})

test('a different section at the same time is called out, and added or removed courses are listed', () => {
  const before = schedule(1, [['ELEC2501', section('TUT', 'T1', [slot('Friday', '10:05', '10:55')])], ['MATH1004', lecture]])
  const after = schedule(2, [['ELEC2501', section('TUT', 'T3', [slot('Friday', '10:05', '10:55')])], ['COMP3000', lecture]])
  assert.deepEqual(diffSchedules(before, after).summary, ['ELEC2501 TUT T1 → T3 (same time)', 'Added COMP3000', 'Removed MATH1004'])
})

test('identical schedules produce no changes', () => {
  const diff = diffSchedules(schedule(1, [['MATH1004', lecture]]), schedule(2, [['MATH1004', lecture]]))
  assert.equal(diff.changedSlots.size, 0)
  assert.deepEqual(diff.summary, [])
})
