import { validatePrerequisitesFromTree, type PrerequisiteNodeData, type StudentTranscript } from './prerequisite-evaluator'

export interface UnmetCourseCategory {
  id: string
  label: string
  courseOptions: string[]
}

interface AuditRequirementLike {
  title: string
  status: string
  creditsRequired: number
  creditsCompleted: number
  creditsInProgress: number
  courseOptions: string[]
  expandedOptions?: string[]
}

interface ElectiveRequirementLike {
  category: string
  label: string
  creditsNeeded: number
  courseOptions: string[]
}

const normalizeCode = (code: string) => code.toUpperCase().replace(/\s+/g, '')
const letterGrades = new Set(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'])
const yearStandings = new Set(['FIRST_YEAR', 'SECOND_YEAR', 'THIRD_YEAR', 'FOURTH_YEAR'])
const nonPassingGrades = new Set(['F', 'UNS', 'X', 'NR', 'WDN', 'CUR', 'DEF'])

/** Includes every unmet audit requirement, whether or not it was selected for this term. */
export function collectUnmetCourseCategories(requirements: AuditRequirementLike[], electives: ElectiveRequirementLike[], remainingCourses: string[] = []): UnmetCourseCategory[] {
  const categories = new Map<string, UnmetCourseCategory>()
  function add(id: string, label: string, options: string[]) {
    const previous = categories.get(id)
    categories.set(id, { id, label, courseOptions: Array.from(new Set([...(previous?.courseOptions || []), ...options.map(normalizeCode).filter(code => /^[A-Z]{3,4}\d{4}$/.test(code))])) })
  }
  if (requirements.length) {
    requirements.forEach((requirement, index) => {
      if (requirement.status === 'OK' || requirement.creditsRequired - requirement.creditsCompleted - requirement.creditsInProgress <= 0) return
      const title = requirement.title.toLowerCase()
      const elective = electives.find(item => requirement.courseOptions.includes(item.category)
        || title.includes(item.label.toLowerCase())
        || (item.category === 'SCIENCE_ELECTIVE' && title.includes('basic science')))
      const options = requirement.expandedOptions ?? requirement.courseOptions.flatMap(option => electives.find(item => item.category === option)?.courseOptions || [option])
      add(elective?.category || `audit:${index}`, elective?.label || requirement.title, options)
    })
  } else {
    // Compatibility with saved audits from before requirement rows were retained.
    electives.filter(item => item.creditsNeeded > 0).forEach(item => add(item.category, item.label, item.courseOptions))
    if (remainingCourses.length) add('required-courses', 'Required courses', remainingCourses)
  }
  return Array.from(categories.values())
}

/** Narrows audit-wide needs to the choices the user is working on in this term. */
export function conflictCategoriesForTerm(categories: UnmetCourseCategory[], electiveCategoryIds: string[], requestedCredits: Record<string, number>, plannedCoreCourses: string[], inspectedCourse?: string | null, selectedElectives: Record<string, string[]> = {}): UnmetCourseCategory[] {
  const electiveIds = new Set(electiveCategoryIds)
  const coreIds = new Set(plannedCoreCourses.map(normalizeCode))
  const termCategories = categories.flatMap(category => {
    if (electiveIds.has(category.id)) return requestedCredits[category.id] > 0 ? [category] : []
    const options = category.courseOptions.filter(code => coreIds.has(normalizeCode(code)))
    return options.length ? [{ ...category, courseOptions: options }] : []
  })
  if (!inspectedCourse) return termCategories
  const code = normalizeCode(inspectedCourse)
  const assignedCategories = termCategories.filter(category => electiveIds.has(category.id) && (selectedElectives[category.id] || []).some(pick => normalizeCode(pick) === code))
  const matchingCategories = assignedCategories.length ? assignedCategories : termCategories.filter(category => electiveIds.has(category.id) && category.courseOptions.some(option => normalizeCode(option) === code))
  // An elective's inspection compares alternatives in that elective category.
  return matchingCategories.length ? matchingCategories : termCategories
}

export function normalizeConflictTranscript(transcript: StudentTranscript): StudentTranscript {
  const rawGrades = Object.fromEntries(Object.entries(transcript.courseGrades || {}).map(([code, grade]) => [normalizeCode(code), grade.trim().toUpperCase()]))
  return {
    ...transcript,
    completedCourses: Array.from(new Set(transcript.completedCourses.map(normalizeCode))).filter(code => !nonPassingGrades.has(rawGrades[code])),
    plannedCourses: Array.from(new Set((transcript.plannedCourses || []).map(normalizeCode))),
    // An unknown grade must not satisfy a minimum-grade prerequisite.
    courseGrades: Object.fromEntries(Object.entries(rawGrades).filter(([, grade]) => letterGrades.has(grade))),
  }
}

/** Carleton Calendar 3.1.7 thresholds for this planner's four-year degree programs.
 * https://calendar.carleton.ca/undergrad/regulations/academicregulationsoftheuniversity/regulations-for-degree-students/#year-standing
 */
export function standingFromEarnedCredits(credits: number): StudentTranscript['currentYear'] {
  if (credits >= 14) return 'FOURTH_YEAR'
  if (credits >= 9) return 'THIRD_YEAR'
  if (credits >= 4) return 'SECOND_YEAR'
  return 'FIRST_YEAR'
}

export interface ConflictPrerequisiteCourse {
  courseId: string
  prerequisiteExpression?: string | null
  prerequisiteNodes: PrerequisiteNodeData[]
}

/** Category membership and prerequisite eligibility are independent of timetable overlap. */
export function eligibleConflictCourseCategories(courses: ConflictPrerequisiteCourse[], categories: UnmetCourseCategory[], transcript: StudentTranscript, excludedCourseIds: string[] = []): Map<string, Array<{ id: string; label: string }>> {
  const normalized = normalizeConflictTranscript(transcript)
  const excluded = new Set([...normalized.completedCourses, ...excludedCourseIds.map(normalizeCode)])
  const membership = new Map<string, Array<{ id: string; label: string }>>()
  for (const category of categories) {
    for (const code of new Set(category.courseOptions.map(normalizeCode))) {
      membership.set(code, [...(membership.get(code) || []), { id: category.id, label: category.label }])
    }
  }
  const eligible = new Map<string, Array<{ id: string; label: string }>>()
  for (const course of courses) {
    const code = normalizeCode(course.courseId)
    if (excluded.has(code) || !membership.has(code)) continue
    let nodes = course.prerequisiteNodes.map(node => {
      const grade = node.requiredGrade?.trim().toUpperCase() || null
      const year = node.requiredYear?.trim().toUpperCase() || null
      const nodeType = grade && !letterGrades.has(grade) ? 'UNVERIFIED_GRADE'
        : node.nodeType === 'YEAR_STANDING' && (!year || !yearStandings.has(year)) ? 'UNVERIFIED_YEAR' : node.nodeType
      return { ...node, requiredGrade: grade, requiredYear: year, nodeType }
    })
    const roots = nodes.filter(node => !node.parentId)
    if (roots.length > 1) {
      // The course editor joins separate top-level requirement groups with AND.
      let rootId = 'conflict-eligibility-root'
      while (nodes.some(node => node.id === rootId)) rootId += '-'
      nodes = [{ id: rootId, nodeType: 'AND', requiredCourseId: null, requiredYear: null, requiredGrade: null, parentId: null }, ...nodes.map(node => node.parentId ? node : { ...node, parentId: rootId })]
    }
    const expression = course.prerequisiteExpression?.trim() || (nodes.length ? 'Recorded prerequisites' : undefined)
    if (expression && expression.toLowerCase() !== 'none' && !nodes.length) continue
    if (validatePrerequisitesFromTree(expression, nodes, normalized).isValid) eligible.set(code, membership.get(code)!)
  }
  return eligible
}
