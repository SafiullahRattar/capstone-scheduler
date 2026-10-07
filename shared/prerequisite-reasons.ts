import type { PrerequisiteValidationResult } from './prerequisite-evaluator'

const YEAR_LABELS: Record<string, string> = {
  FIRST_YEAR: 'first-year',
  SECOND_YEAR: 'second-year',
  THIRD_YEAR: 'third-year',
  FOURTH_YEAR: 'fourth-year',
}

/** Turns a failed prerequisite check into short sentences a student can act on. */
export function describePrerequisiteIssues(validation: PrerequisiteValidationResult): string[] {
  if (validation.isValid) return []
  if (validation.requirementExplanation) return [`Requires: ${validation.requirementExplanation}`]
  const reasons: string[] = []

  for (const issue of validation.gradeIssues || []) {
    const match = issue.match(/^(\S+) grade (\S+) does not meet requirement (\S+)$/)
    reasons.push(match
      ? `Needs ${match[3]} or better in ${match[1]}${match[2] === 'unknown' ? '' : ` (you have ${match[2]})`}`
      : issue)
  }

  const missing = validation.missingCourses || []
  if (missing.length > 0) {
    reasons.push(`Missing ${missing.length === 1 ? 'prerequisite' : 'prerequisites'}: ${missing.join(', ')}`)
  }

  if (validation.yearRequirement) {
    reasons.push(`Requires ${YEAR_LABELS[validation.yearRequirement] || validation.yearRequirement} standing`)
  }

  if (validation.needsPermission) {
    reasons.push('Requires department permission')
  }

  if (reasons.length === 0) {
    reasons.push(validation.reason || 'Prerequisites not met')
  }

  return reasons
}
