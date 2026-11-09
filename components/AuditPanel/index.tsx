import { EmptyState } from '@/components/EmptyState';
import { RuleBadge } from '@/components/RuleBadge';
import type { ExtractedField } from '@/types/field';

export interface AuditPanelProps {
  field: ExtractedField | null;
}

export function AuditPanel({ field }: AuditPanelProps) {
  if (!field) {
    return (
      <EmptyState
        title="未选中字段"
        description="点击中间栏的字段卡片，这里会展示 AI 输出、规则判定和原文依据。"
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">AI 原始输出</h3>
        <p className="mt-1 text-sm text-slate-800">{field.aiValue}</p>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">规则判定</h3>
        <div className="mt-1 flex items-center gap-2">
          <RuleBadge level={field.ruleResult.level} />
          <span className="text-xs text-slate-500">{field.ruleResult.ruleId}</span>
        </div>
        <p className="mt-1 text-xs text-slate-600">{field.ruleResult.reason}</p>
        {field.ruleResult.suggestion ? (
          <p className="mt-1 text-xs text-amber-700">建议：{field.ruleResult.suggestion}</p>
        ) : null}
      </section>

            <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">原文依据</h3>
        {field.sourceRef ? (
          <p className="mt-1 rounded bg-slate-50 p-2 text-xs text-slate-600">
            “{field.sourceRef.snippet}”
          </p>
        ) : (
          <div className="mt-1 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
            <strong>⚠️ 未定位到原文：</strong> AI 可能产生了幻觉，或原文未明确提及。请务必人工核对。
          </div>
        )}
      </section>

      {field.ruleResult.level === 'blocked' ? (
        <p className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          AI 提取值「{field.aiValue}」未通过规则 {field.ruleResult.ruleId}，建议人工核对。
        </p>
      ) : null}
    </div>
  );
}