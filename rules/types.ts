import type { SourceRef } from '@/types/field';

export type RuleLevel = 'pass' | 'warning' | 'blocked';

export interface RuleContext {
  fieldName: string;
  aiValue: string;
  sourceText: string;
  sourceRef: SourceRef | null;
}

export interface RuleResult {
  level: RuleLevel;
  ruleId: string;
  reason: string;
  suggestion?: string;
}

export interface Rule {
  id: string;
  name: string;
  appliesTo: string[];
  evaluate: (ctx: RuleContext) => RuleResult;
}
