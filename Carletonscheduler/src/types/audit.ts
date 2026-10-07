export interface AuditRequirement {
  title: string;
  status: 'OK' | 'NO' | 'IP' | 'NONE';
  creditsRequired: number;
  creditsCompleted: number;
  creditsInProgress: number;
  courseOptions: string[];
  expandedOptions?: string[];
  groupTitle?: string;
}

export type RequirementChoices = Record<string, string[]>;
