import type { ExtractedField } from '@/types/field';
import { allRules } from './definitions';
import type { RuleContext, RuleResult } from './types';

export function evaluateField(field: ExtractedField, sourceText: string): RuleResult {
  const ctx: RuleContext = {
    fieldName: field.name,
    aiValue: field.aiValue,
    sourceText,
    sourceRef: field.sourceRef,
  };

  const matched = allRules.filter((rule) => rule.appliesTo.some((kw) => field.name.includes(kw)));
  if (matched.length === 0) {
    return {
      level: 'warning',
      ruleId: 'NO_RULE',
      reason: '未匹配到适用规则，建议人工核对。',
    };
  }

  // 取最严重的一档
  const results = matched.map((rule) => rule.evaluate(ctx));
  const severity = { blocked: 2, warning: 1, pass: 0 } as const;
  return results.sort((a, b) => severity[b.level] - severity[a.level])[0];
}

export function evaluateFields(fields: ExtractedField[], sourceText: string): ExtractedField[] {
  return fields.map((field) => ({
    ...field,
    ruleResult: evaluateField(field, sourceText),
    reviewStatus: evaluateField(field, sourceText).level === 'blocked' ? 'needs-human' : 'pending',
  }));
}