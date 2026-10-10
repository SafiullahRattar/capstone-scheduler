import { test } from 'node:test'
import assert from 'node:assert/strict'
import { collapseEquivalentSections, type Section, type TimeSlot } from '../server/lib/schedule-generation'
import { carryOverSectionChoices, chooseEquivalentSection } from '../Carletonscheduler/src/utils/sectionChoices'
import type { GeneratedSchedule, Section as ClientSection } from '../Carletonscheduler/src/utils/scheduleGenerator'

const slot = (day: string, startTime: string, endTime: string): TimeSlot => ({ day, startTime, endTime })
function section(id: string, type: string, timeSlots: TimeSlot[], deliveryMode: Section['deliveryMode'] = 'IN_PERSON'): Section {
  return { id, courseId: 'SYSC4106', crn: id, sectionCode: id, sectionType: type, timeSlots, deliveryMode, instructor: null, location: null, capacity: null, enrolled: null }
}

test('sections of one type at identical times collapse to one, keeping the others as alternatives', () => {
  const friday = [slot('Friday', '0835', '1125')]
  const course = { courseId: 'SYSC4106', sections: [
    section('A', 'LEC', [slot('Monday', '1135', '1255'), slot('Wednesday', '1135', '1255')]),
    section('L10', 'LAB', friday), section('L2', 'LAB', friday), section('L1', 'LAB', friday),
    section('L3', 'LAB', [slot('Tuesday', '0835', '1125')]),
    section('L4', 'LAB', friday, 'ONLINE_SYNC'),
  ] }
  const { courseSections, alternatives } = collapseEquivalentSections([course])
  assert.deepEqual(courseSections[0].sections.map(item => item.id), ['A', 'L1', 'L3', 'L4'])
  assert.deepEqual(alternatives.get('L1')!.map(item => item.id), ['L1', 'L2', 'L10'])
  assert.equal(alternatives.has('A'), false)
})

const clientSection = (sectionCode: string): ClientSection =>
  ({ crn: sectionCode, sectionCode, type: 'LAB', instructor: 'TBA', timeSlots: [{ day: 'Friday', startTime: '08:35', endTime: '11:25' }], capacity: 0, enrolled: 0, deliveryMode: 'IN_PERSON' })
const options = [clientSection('L1'), clientSection('L2'), clientSection('L10')]
const schedule = (id: number, alternatives?: ClientSection[]): GeneratedSchedule =>
  ({ id, selections: [{ courseCode: 'SYSC4106', section: alternatives ? alternatives[0] : clientSection('L7'), alternatives }], hasUnmetPrerequisites: false })

test('choosing a same-time section applies to every option that offers it', () => {
  const chosen = chooseEquivalentSection([schedule(1, options), schedule(2, options), schedule(3)], 'SYSC4106', 'LAB', 'L10')
  assert.deepEqual(chosen.map(item => item.selections[0].section.sectionCode), ['L10', 'L10', 'L7'])
})

test('picks survive regenerating the options', () => {
  const picked = chooseEquivalentSection([schedule(1, options)], 'SYSC4106', 'LAB', 'L2')
  const regenerated = carryOverSectionChoices(picked, [schedule(1, options), schedule(2)])
  assert.deepEqual(regenerated.map(item => item.selections[0].section.sectionCode), ['L2', 'L7'])
  assert.deepEqual(carryOverSectionChoices([schedule(1, options)], [schedule(1, options)])[0].selections[0].section.sectionCode, 'L1')
})
