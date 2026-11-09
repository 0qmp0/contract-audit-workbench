'use client';

import { EmptyState } from '@/components/EmptyState';
import { RuleBadge } from '@/components/RuleBadge';
import type { ExtractedField } from '@/types/field';
import { useAuditStore } from '@/stores/audit-store';

export interface AuditPanelProps {
  field: ExtractedField | null;
}

export function AuditPanel({ field }: AuditPanelProps) {
  const { sourceText, extractedFields } = useAuditStore();

  const handleExport = () => {
    if (extractedFields.length === 0) return;
    
    let md = `# 合同审阅报告\n\n生成时间：${new Date().toLocaleString()}\n\n`;
    md += `## 原始合同内容\n\n\`\`\`\n${sourceText}\n\`\`\`\n\n`;
    md += `## 审计结果\n\n`;
    
    extractedFields.forEach((f) => {
      md += `### ${f.name}\n`;
      md += `- **AI 提取值**：${f.aiValue}\n`;
      md += `- **规则判定**：${f.ruleResult.level.toUpperCase()} (${f.ruleResult.ruleId})\n`;
      md += `- **判定依据**：${f.ruleResult.reason}\n`;
      if (f.sourceRef) {
        md += `- **原文依据**：“${f.sourceRef.snippet}”\n`;
      } else {
        md += `- **原文依据**：未定位到原文（疑似 AI 幻觉）\n`;
      }
      md += `\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `合同审阅报告_${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!field) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex justify-end border-b border-slate-100 p-2">
           <button onClick={handleExport} disabled={extractedFields.length === 0} className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-50">导出报告</button>
        </div>
        <EmptyState title="未选中字段" description="点击中间栏的字段卡片查看详情。" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex justify-end border-b border-slate-100 p-2">
         <button onClick={handleExport} className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">导出报告</button>
      </div>
      <div className="flex flex-col gap-4 overflow-y-auto p-4">
        {/* 以下是原有的内容，保持不变 */}
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
    </div>
  );
}