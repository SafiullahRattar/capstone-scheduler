import { test } from 'node:test'
import assert from 'node:assert/strict'
import { availabilityTerms, completeBundleTerms, type AvailabilitySection } from '../shared/term-availability'

const section = (term: string, type: string, day: string, startTime = '0900', endTime = '1000'): AvailabilitySection => ({ term, type, deliveryMode: 'IN_PERSON', timeSlots: [{ day, startTime, endTime }] })

test('F/W/S availability uses the selected academic-year cycle', () => {
  for (const term of ['202630', '202710', '202720']) assert.deepEqual(availabilityTerms(term), ['202630', '202710', '202720'])
})

test('a lecture alone or a missing tutorial does not mark a term available', () => {
  const terms = availabilityTerms('202630')
  const sections = [section('202630', 'LEC', 'Monday'), section('202710', 'LEC', 'Monday'), section('202710', 'LAB', 'Tuesday'), section('202720', 'LEC', 'Monday'), section('202720', 'LAB', 'Tuesday'), section('202720', 'TUT', 'Wednesday')]
  assert.deepEqual(completeBundleTerms(sections, ['LEC', 'LAB', 'TUT'], terms), ['202720'])
})

test('one internally compatible bundle is sufficient even when other labs overlap', () => {
  const terms = availabilityTerms('202630')
  const sections = [section('202630', 'LEC', 'Monday', '09:00', '10:00'), section('202630', 'LAB', 'Monday', '0930', '1030'), section('202630', 'LAB', 'Tuesday'), section('202710', 'LEC', 'Monday'), section('202710', 'LAB', 'Monday', '0930', '1030')]
  assert.deepEqual(completeBundleTerms(sections, ['LEC', 'LAB'], terms), ['202630'])
})

test('sections from separate terms cannot be combined and async meetings do not conflict', () => {
  const terms = availabilityTerms('202630')
  assert.deepEqual(completeBundleTerms([section('202630', 'LEC', 'Monday'), section('202710', 'LAB', 'Tuesday')], ['LEC', 'LAB'], terms), [])
  assert.deepEqual(completeBundleTerms([section('202630', 'LEC', 'Monday'), { ...section('202630', 'LAB', 'Monday'), deliveryMode: 'ONLINE_ASYNC' }], ['LEC', 'LAB'], terms), ['202630'])
  assert.deepEqual(completeBundleTerms([], [], terms), [])
})
