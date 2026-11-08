'use client';

import { RuleBadge } from '@/components/RuleBadge';
import type { ExtractedField } from '@/types/field';

export interface FieldCardProps {
  field: ExtractedField;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const reviewStatusLabels: Record<ExtractedField['reviewStatus'], string> = {
  pending: '待确认',
  confirmed: '已确认',
  'needs-human': '需人工复核',
};

export function FieldCard({ field, isSelected, onSelect }: FieldCardProps) {
  const { ruleResult, sourceRef, confidence } = field;
  const showRuleReason = ruleResult.level !== 'pass' && ruleResult.reason.length > 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(field.id)}
      aria-pressed={isSelected}
      className={`w-full rounded-lg border p-3 text-left transition outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1 ${
        isSelected
          ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-300'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
          {field.name}
        </span>
        <span className="shrink-0">
          <RuleBadge level={ruleResult.level} />
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-xs text-slate-600">{field.aiValue}</p>
      {showRuleReason ? (
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
          {ruleResult.ruleId}：{ruleResult.reason}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
        {confidence !== undefined ? <span>置信度 {Math.round(confidence * 100)}%</span> : null}
        <span title={sourceRef?.snippet}>{sourceRef ? '已定位原文' : '未定位原文'}</span>
        <span>{reviewStatusLabels[field.reviewStatus]}</span>
      </div>
    </button>
  );
}
