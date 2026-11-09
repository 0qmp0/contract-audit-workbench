export type RuleLevel = 'pass' | 'warning' | 'blocked';

export interface RuleResult {
  level: RuleLevel;
  ruleId: string;
  reason: string;
  suggestion?: string;
}

export type ReviewStatus = 'pending' | 'confirmed' | 'needs-human';

export interface SourceRef {
  start: number;
  end: number;
  snippet: string;
}

export interface ExtractedField {
  id: string;
  name: string;
  aiValue: string;
  confidence?: number;
  ruleResult: RuleResult;
  sourceRef: SourceRef | null;
  reviewStatus: ReviewStatus;
  knowledgeHint?: string | null;
}