import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyLockedSections, evaluateElectiveFit, hasTimeConflict, type Section, type TimeSlot } from '../server/lib/schedule-generation'
import { findCourseConflicts, findFittingBundles, hasConflictFreeBundle } from '../server/lib/course-conflicts'

const slot = (day: string, startTime: string, endTime: string): TimeSlot => ({ day, startTime, endTime })
test('lecture dropdowns receive every fitting lab for each lecture beyond the general bundle cap', () => {
  const anchor = [section('fixed', 'SYSC4806', 'LEC', [slot('Monday', '0900', '1000')])]
  const candidate = { courseId: 'BIOL2200', name: 'Lecture options', sections: [
    section('A', 'BIOL2200', 'LEC', [slot('Tuesday', '0900', '1000')]),
    section('B', 'BIOL2200', 'LEC', [slot('Wednesday', '0900', '1000')]),
    section('blocked', 'BIOL2200', 'LAB', [slot('Monday', '0900', '1000')]),
    ...Array.from({ length: 15 }, (_, index) => section(`lab${index}`, 'BIOL2200', 'LAB', [slot('Friday', '0900', '1000')])),
    section('A-only', 'BIOL2200', 'LAB', [slot('Wednesday', '0900', '1000')]),
  ] }
  const [report] = findCourseConflicts(anchor, [candidate])
  assert.equal(report.lectureBundles.filter(bundle => bundle.some(item => item.id === 'A')).length, 16)
  assert.equal(report.lectureBundles.filter(bundle => bundle.some(item => item.id === 'B')).length, 15)
  assert.equal(report.lectureBundles.some(bundle => bundle.some(item => item.id === 'blocked')), false)
})
function section(id: string, courseId: string, type: string, timeSlots: TimeSlot[]): Section {
  return { id, courseId, crn: id, sectionCode: id, sectionType: type, timeSlots, deliveryMode: 'IN_PERSON', instructor: null, location: null, capacity: null, enrolled: null }
}

test('pinning a course keeps its whole lecture/lab bundle and rejects a lecture-only pin', () => {
  const lecture = section('A', 'SYSC4806', 'LEC', [slot('Tuesday', '1735', '1925')])
  const lab1 = section('L1', 'SYSC4806', 'LAB', [slot('Monday', '1135', '1525')])
  const lab2 = section('L2', 'SYSC4806', 'LAB', [slot('Friday', '1135', '1525')])
  const courses = [{ courseId: 'SYSC4806', sections: [lecture, lab1, lab2] }]
  const pinned = applyLockedSections(courses, { SYSC4806: ['A', 'L1'] })
  assert.deepEqual(pinned[0].sections.map(item => item.id), ['A', 'L1'])
  assert.throws(() => applyLockedSections(courses, { SYSC4806: ['A'] }), /complete available bundle/)
  assert.throws(() => applyLockedSections(courses, { SYSC4806: ['A', 'missing'] }), /complete available bundle/)
})

test('explicit section locks prevent moving a course, while unlocked fit checks consider its alternatives', () => {
  const fixed = [{ courseId: 'MATH1004', sections: [section('A', 'MATH1004', 'LEC', [slot('Monday', '0900', '1000')]), section('B', 'MATH1004', 'LEC', [slot('Tuesday', '0900', '1000')])] }]
  const candidates = [{ courseId: 'ECON1001', sections: [section('C', 'ECON1001', 'LEC', [slot('Monday', '0930', '1030')])] }]
  assert.equal(evaluateElectiveFit(fixed, candidates, false).fits.ECON1001, true)
  assert.equal(evaluateElectiveFit(applyLockedSections(fixed, { MATH1004: ['A'] }), candidates, false).fits.ECON1001, false)
})

test('conflict inspection distinguishes overlapping options from a fully blocked bundle', () => {
  const anchor = [section('fixed', 'SYSC4806', 'LAB', [slot('Monday', '1135', '1525')])]
  const partial = { courseId: 'COMP3000', name: 'Alternatives', sections: [
    section('A', 'COMP3000', 'LEC', [slot('Monday', '1200', '1300')]),
    section('B', 'COMP3000', 'LEC', [slot('Tuesday', '1200', '1300')]),
    section('L1', 'COMP3000', 'LAB', [slot('Wednesday', '1200', '1300')]),
  ] }
  const blocked = { courseId: 'COMP4000', name: 'Blocked labs', sections: [
    section('A', 'COMP4000', 'LEC', [slot('Tuesday', '1200', '1300')]),
    section('L1', 'COMP4000', 'LAB', [slot('Monday', '1200', '1300')]),
    section('L2', 'COMP4000', 'LAB', [slot('Monday', '1400', '1500')]),
  ] }
  const adjacent = { courseId: 'COMP2000', name: 'Adjacent', sections: [section('A', 'COMP2000', 'LEC', [slot('Monday', '1525', '1600')])] }
  const asyncSection = { ...section('A', 'COMP1000', 'LEC', [slot('Monday', '1200', '1300')]), deliveryMode: 'ONLINE_ASYNC' as const }
  const report = findCourseConflicts(anchor, [partial, blocked, adjacent, { courseId: 'COMP1000', name: 'Async', sections: [asyncSection] }, { courseId: 'SYSC4806', name: 'Own course', sections: anchor }])
  assert.deepEqual(report.map(item => item.courseId), ['COMP4000', 'COMP3000'])
  assert.equal(report[0].hasConflictFreeOption, false)
  assert.equal(report[1].hasConflictFreeOption, true)
  assert.equal(report[1].overlappingSections.length, 1)
})

test('bundle availability checks internal section conflicts and supports colon-formatted times', () => {
  assert.equal(hasTimeConflict(slot('Monday', '09:00', '10:00'), slot('Monday', '0930', '1030')), true)
  assert.equal(hasTimeConflict(slot('Monday', '09:00', '10:00'), slot('Monday', '1000', '1100')), false)
  const invalidBundle = [section('A', 'COMP3000', 'LEC', [slot('Monday', '0900', '1000')]), section('L1', 'COMP3000', 'LAB', [slot('Monday', '0930', '1030')])]
  assert.equal(hasConflictFreeBundle(invalidBundle, []), false)
  assert.equal(hasConflictFreeBundle([], []), false)
})

test('section details retain every meeting and identify complete fitting lecture/lab alternatives', () => {
  const anchor = [section('fixed', 'SYSC4806', 'LEC', [slot('Monday', '0900', '1000')])]
  const candidate = { courseId: 'COMP3000', name: 'Alternatives', sections: [
    section('A', 'COMP3000', 'LEC', [slot('Monday', '0930', '1030'), slot('Thursday', '0930', '1030')]),
    section('B', 'COMP3000', 'LEC', [slot('Tuesday', '0930', '1030')]),
    section('L1', 'COMP3000', 'LAB', [slot('Wednesday', '1100', '1200')]),
    section('L2', 'COMP3000', 'LAB', [slot('Monday', '0945', '1045')]),
  ] }
  const [report] = findCourseConflicts(anchor, [candidate])
  assert.deepEqual(report.fittingBundles.map(bundle => bundle.map(item => item.sectionCode)), [['B', 'L1']])
  const lectureA = report.sections.find(item => item.sectionCode === 'A')!
  assert.equal(lectureA.timeSlots.length, 2)
  assert.deepEqual(lectureA.conflictingTimeSlots.map(item => item.day), ['Monday'])
  assert.equal(lectureA.fittingBundle, null)
  assert.deepEqual(report.sections.find(item => item.sectionCode === 'L1')!.fittingBundle!.map(item => item.sectionCode), ['B', 'L1'])
  assert.equal(report.sections.find(item => item.sectionCode === 'L2')!.fittingBundle, null)
})

test('a preview combination must fit every course already on the calendar', () => {
  const anchor = [section('fixed', 'SYSC4806', 'LEC', [slot('Monday', '0900', '1000')])]
  const candidate = { courseId: 'COMP3000', name: 'Alternatives', sections: [
    section('A', 'COMP3000', 'LEC', [slot('Monday', '0930', '1030')]),
    section('B', 'COMP3000', 'LEC', [slot('Tuesday', '0930', '1030')]),
  ] }
  assert.equal(findCourseConflicts(anchor, [candidate])[0].hasConflictFreeOption, true)
  const [blocked] = findCourseConflicts(anchor, [candidate], [slot('Tuesday', '0900', '1100')])
  assert.equal(blocked.hasConflictFreeOption, false)
  assert.deepEqual(blocked.fittingBundles, [])
})

test('an individually clear lecture is not marked fitting when it clashes with the only lab', () => {
  const anchor = [section('fixed', 'SYSC4806', 'LEC', [slot('Monday', '0900', '1000')])]
  const candidate = { courseId: 'COMP3000', name: 'Internal clash', sections: [
    section('A', 'COMP3000', 'LEC', [slot('Monday', '0930', '1030')]),
    section('B', 'COMP3000', 'LEC', [slot('Tuesday', '0900', '1000')]),
    section('L1', 'COMP3000', 'LAB', [slot('Tuesday', '0930', '1030')]),
  ] }
  const [report] = findCourseConflicts(anchor, [candidate])
  assert.equal(report.hasConflictFreeOption, false)
  const lecture = report.sections.find(item => item.sectionCode === 'B')!
  assert.deepEqual(lecture.conflictingTimeSlots, [])
  assert.equal(lecture.fittingBundle, null)
})

test('every fitting section remains previewable when the combination list is bounded', () => {
  const anchor = [section('fixed', 'SYSC4806', 'LEC', [slot('Monday', '0900', '1000')])]
  const sections = [section('A', 'COMP3000', 'LEC', [slot('Monday', '0930', '1030')]), section('B', 'COMP3000', 'LEC', [slot('Tuesday', '0900', '1000')]),
    ...Array.from({ length: 15 }, (_, index) => section(`L${index + 1}`, 'COMP3000', 'LAB', [slot('Wednesday', '0900', '1000')]))]
  const [report] = findCourseConflicts(anchor, [{ courseId: 'COMP3000', name: 'Many labs', sections }])
  assert.equal(report.fittingBundles.length, 12)
  assert.equal(report.moreFittingBundles, true)
  assert.deepEqual(report.sections.find(item => item.sectionCode === 'L15')!.fittingBundle!.map(item => item.sectionCode), ['B', 'L15'])
  assert.equal(findFittingBundles(sections, [], 1, 'missing').length, 0)
})

test('asynchronous alternatives return no invented lecture times in their preview bundles', () => {
  const anchor = [section('fixed', 'SYSC4806', 'LEC', [slot('Monday', '0900', '1000')])]
  const asyncLecture = { ...section('OA', 'COMP3000', 'LEC', [slot('Monday', '0930', '1030')]), deliveryMode: 'ONLINE_ASYNC' as const }
  const [report] = findCourseConflicts(anchor, [{ courseId: 'COMP3000', name: 'Online alternative', sections: [section('A', 'COMP3000', 'LEC', [slot('Monday', '0930', '1030')]), asyncLecture, section('L1', 'COMP3000', 'LAB', [slot('Tuesday', '0900', '1000')])] }])
  assert.equal(report.hasConflictFreeOption, true)
  assert.deepEqual(report.fittingBundles[0].find(item => item.sectionCode === 'OA')!.timeSlots, [])
  assert.equal(report.fittingBundles[0].find(item => item.sectionCode === 'OA')!.deliveryMode, 'ONLINE_ASYNC')
})
