export interface PrerequisiteNodeData {
  id: string;
  courseId?: string;
  nodeType: string;
  requiredCourseId: string | null;
  requiredYear: string | null;
  requiredGrade: string | null;
  parentId: string | null;
}

export interface StudentTranscript {
  completedCourses: string[];
  /** Courses actually scheduled in earlier terms; completion/grades are projected. */
  plannedCourses?: string[];
  courseGrades?: { [courseId: string]: string };
  currentYear: 'FIRST_YEAR' | 'SECOND_YEAR' | 'THIRD_YEAR' | 'FOURTH_YEAR';
  hasSpecialPermission?: boolean;
}

export interface PrerequisiteValidationResult {
  /** Human-readable requirement tree; preserves alternatives and grouped requirements. */
  requirementExplanation?: string;
  plannedPrerequisites?: string[];
  isValid: boolean;
  reason?: string;
  missingCourses?: string[];
  yearRequirement?: string;
  needsPermission?: boolean;
  gradeIssues?: string[];
  expressionEvaluated: string;
}

interface EvaluationResult {
  plannedPrerequisites?: string[];
  isValid: boolean;
  reason?: string;
  missingItems?: string[];
  gradeIssues?: string[];
}

function meetsGradeRequirement(actualGrade: string | undefined, requiredGrade: string): boolean {
  if (!actualGrade) {
    return false;
  }

  const gradeValues: { [grade: string]: number } = {
    'A+': 12, 'A': 11, 'A-': 10,
    'B+': 9, 'B': 8, 'B-': 7,
    'C+': 6, 'C': 5, 'C-': 4,
    'D+': 3, 'D': 2, 'D-': 1,
    'F': 0
  };

  const actualValue = gradeValues[actualGrade];
  const requiredValue = gradeValues[requiredGrade];

  if (actualValue === undefined || requiredValue === undefined) {
    return true;
  }

  return actualValue >= requiredValue;
}

function explainRequirement(node: PrerequisiteNodeData, nodes: PrerequisiteNodeData[], parentType?: string): string {
  if (node.nodeType === 'AND' || node.nodeType === 'OR') {
    const children = nodes.filter(child => child.parentId === node.id);
    const text = children.map(child => explainRequirement(child, nodes, node.nodeType)).join(` ${node.nodeType} `);
    return parentType && parentType !== node.nodeType && children.length > 1 ? `(${text})` : text;
  }
  if (node.nodeType === 'COURSE') return `${node.requiredCourseId || 'Unknown course'}${node.requiredGrade ? ` (${node.requiredGrade} or better)` : ''}`;
  if (node.nodeType === 'PERMISSION') return 'department permission';
  if (node.nodeType === 'YEAR_STANDING') return `${node.requiredYear?.toLowerCase().replace('_', '-')} standing`;
  if (node.nodeType === 'OTHER_REQUIREMENT') return 'admission requirements';
  return node.nodeType.toLowerCase().replaceAll('_', ' ');
}

function evaluatePrerequisiteNode(
  node: PrerequisiteNodeData,
  transcript: StudentTranscript,
  childNodes: PrerequisiteNodeData[]
): EvaluationResult {
  switch (node.nodeType) {
    case 'AND': {
      const children = childNodes.filter(child => child.parentId === node.id);
      const results = children.map(child => evaluatePrerequisiteNode(child, transcript, childNodes));
      const unsatisfied = results.filter(result => !result.isValid);

      if (unsatisfied.length > 0) {
        return {
          isValid: false,
          reason: `Missing requirements: ${unsatisfied.map(result => result.reason).join(', ')}`,
          missingItems: unsatisfied.flatMap(result => result.missingItems || []),
          gradeIssues: unsatisfied.flatMap(result => result.gradeIssues || []),
          plannedPrerequisites: results.flatMap(result => result.plannedPrerequisites || []),
        };
      }

      return { isValid: true, missingItems: [], gradeIssues: [], plannedPrerequisites: results.flatMap(result => result.plannedPrerequisites || []) };
    }

    case 'OR': {
      const children = childNodes.filter(child => child.parentId === node.id);
      const results = children.map(child => evaluatePrerequisiteNode(child, transcript, childNodes));
      const firstValid = results.find(result => result.isValid);

      if (firstValid) {
        return { isValid: true, missingItems: [], gradeIssues: [], plannedPrerequisites: firstValid.plannedPrerequisites || [] };
      }

      return {
        isValid: false,
        reason: `None of the alternative requirements satisfied: ${results.map(result => result.reason).join(' OR ')}`,
        missingItems: results.flatMap(result => result.missingItems || []),
        gradeIssues: results.flatMap(result => result.gradeIssues || []),
      };
    }

    case 'COURSE': {
      if (!node.requiredCourseId) {
        return { isValid: false, reason: 'Invalid course node', missingItems: [], gradeIssues: [] };
      }

      const hasCourse = transcript.completedCourses.includes(node.requiredCourseId);
      const planned = transcript.plannedCourses?.includes(node.requiredCourseId);
      if (!hasCourse) {
        if (planned) return { isValid: true, missingItems: [], gradeIssues: [], plannedPrerequisites: [node.requiredCourseId] };
        return {
          isValid: false,
          reason: `Missing course ${node.requiredCourseId}`,
          missingItems: [node.requiredCourseId],
          gradeIssues: [],
        };
      }

      if (node.requiredGrade) {
        const actualGrade = transcript.courseGrades?.[node.requiredCourseId];
        const meetsGrade = meetsGradeRequirement(actualGrade, node.requiredGrade);

        if (!meetsGrade) {
          if (planned) return { isValid: true, missingItems: [], gradeIssues: [], plannedPrerequisites: [node.requiredCourseId] };
          const gradeIssue = `${node.requiredCourseId} grade ${actualGrade || 'unknown'} does not meet requirement ${node.requiredGrade}`;
          return {
            isValid: false,
            reason: gradeIssue,
            missingItems: [],
            gradeIssues: [gradeIssue],
          };
        }
      }

      return { isValid: true, missingItems: [], gradeIssues: [] };
    }

    case 'YEAR_STANDING': {
      if (!node.requiredYear) {
        return { isValid: false, reason: 'Invalid year standing node', missingItems: [], gradeIssues: [] };
      }

      const yearOrder = ['FIRST_YEAR', 'SECOND_YEAR', 'THIRD_YEAR', 'FOURTH_YEAR'];
      const requiredIndex = yearOrder.indexOf(node.requiredYear);
      const currentIndex = yearOrder.indexOf(transcript.currentYear);
      const meetsYear = currentIndex >= requiredIndex;

      return {
        isValid: meetsYear,
        reason: meetsYear ? undefined : `Requires ${node.requiredYear} standing (currently ${transcript.currentYear})`,
        missingItems: meetsYear ? [] : [node.requiredYear],
        gradeIssues: [],
      };
    }

    case 'PERMISSION': {
      const hasPermission = transcript.hasSpecialPermission || false;
      return {
        isValid: hasPermission,
        reason: hasPermission ? undefined : 'Requires special permission',
        missingItems: hasPermission ? [] : ['PERMISSION'],
        gradeIssues: [],
      };
    }

    case 'OTHER_REQUIREMENT': {
      return {
        isValid: true,
        missingItems: [],
        gradeIssues: [],
      };
    }

    default:
      return {
        isValid: false,
        reason: `Unknown node type: ${node.nodeType}`,
        missingItems: [],
        gradeIssues: [],
      };
  }
}

export function validatePrerequisitesFromTree(
  expression: string | null | undefined,
  nodes: PrerequisiteNodeData[],
  transcript: StudentTranscript
): PrerequisiteValidationResult {
  const normalizedExpression = expression || 'None';

  if (!expression) {
    return {
      isValid: true,
      reason: 'No prerequisites required',
      expressionEvaluated: 'None',
    };
  }

  if (nodes.length === 0) {
    return {
      isValid: true,
      reason: 'No prerequisite tree found',
      expressionEvaluated: normalizedExpression,
    };
  }

  const rootNode = nodes.find(node => !node.parentId);
  if (!rootNode) {
    return {
      isValid: false,
      reason: 'Invalid prerequisite tree structure (no root node)',
      expressionEvaluated: normalizedExpression,
    };
  }

  const result = evaluatePrerequisiteNode(rootNode, transcript, nodes);

  return {
    isValid: result.isValid,
    requirementExplanation: nodes.some(node => node.nodeType === 'OR') ? explainRequirement(rootNode, nodes) : undefined,
    plannedPrerequisites: Array.from(new Set(result.plannedPrerequisites || [])),
    reason: result.reason,
    missingCourses: result.missingItems?.filter(item =>
      item !== 'PERMISSION' &&
      item !== 'FIRST_YEAR' &&
      item !== 'SECOND_YEAR' &&
      item !== 'THIRD_YEAR' &&
      item !== 'FOURTH_YEAR'
    ),
    yearRequirement: result.missingItems?.find(item =>
      item === 'FIRST_YEAR' ||
      item === 'SECOND_YEAR' ||
      item === 'THIRD_YEAR' ||
      item === 'FOURTH_YEAR'
    ),
    needsPermission: result.missingItems?.includes('PERMISSION'),
    gradeIssues: result.gradeIssues,
    expressionEvaluated: normalizedExpression,
  };
}
