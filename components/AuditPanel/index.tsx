'use client';

import html2canvas from 'html2canvas';
import { useRef } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { RuleBadge } from '@/components/RuleBadge';
import type { ExtractedField } from '@/types/field';
import { useAuditStore } from '@/stores/audit-store';

export interface AuditPanelProps {
  field: ExtractedField | null;
}

const UNSUPPORTED_COLOR = /(oklch|oklab|lab|lch|color)\(/i;

const COLOR_PROPS = [
  'color',
  'background-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color',
  'text-decoration-color',
  'caret-color',
] as const;

function toParsableColor(value: string): string {
  if (!UNSUPPORTED_COLOR.test(value)) return value;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'rgb(0, 0, 0)';
  try {
    ctx.fillStyle = '#000000';
    ctx.fillStyle = value;
    const parsed = ctx.fillStyle;
    return typeof parsed === 'string' && !UNSUPPORTED_COLOR.test(parsed) ? parsed : 'rgb(0, 0, 0)';
  } catch {
    return 'rgb(0, 0, 0)';
  }
}

function flattenModernColors(source: HTMLElement, clone: HTMLElement) {
  const computed = getComputedStyle(source);
  for (const prop of COLOR_PROPS) {
    const value = computed.getPropertyValue(prop);
    if (value) clone.style.setProperty(prop, toParsableColor(value));
  }

  const shadow = computed.getPropertyValue('box-shadow');
  if (shadow && UNSUPPORTED_COLOR.test(shadow)) {
    clone.style.setProperty('box-shadow', 'none');
  }

  const srcChildren = Array.from(source.children);
  const cloneChildren = Array.from(clone.children);
  for (let i = 0; i < srcChildren.length; i++) {
    const srcChild = srcChildren[i];
    const cloneChild = cloneChildren[i];
    if (srcChild instanceof HTMLElement && cloneChild instanceof HTMLElement) {
      flattenModernColors(srcChild, cloneChild);
    }
  }
}

export function AuditPanel({ field }: AuditPanelProps) {
  const { sourceText, extractedFields, updateFieldReviewStatus } = useAuditStore();
  const panelRef = useRef<HTMLDivElement>(null);

  const handleExportImage = async () => {
    if (!panelRef.current) return;
    try {
      const source = panelRef.current;
      const canvas = await html2canvas(source, {
        backgroundColor: '#ffffff',
        scale: 2, // 高清
        useCORS: true,
        onclone: (clonedDoc, cloned) => {
          clonedDoc.querySelectorAll('style').forEach((styleEl) => {
            if (styleEl.textContent && UNSUPPORTED_COLOR.test(styleEl.textContent)) {
              styleEl.textContent = styleEl.textContent.replace(
                /(oklch|oklab|lab|lch|color)\([^)]*\)/gi,
                '#64748b',
              );
            }
          });
          flattenModernColors(source, cloned);
        },
      });
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `合同审计摘要_${Date.now()}.png`;
      link.click();
    } catch (err) {
      console.error('生成图片失败', err);
      alert('生成图片失败，请重试');
    }
  };

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
      <div ref={panelRef} className="flex h-full flex-col">
        <div className="flex justify-end gap-2 border-b border-slate-100 p-2">
           <button onClick={handleExport} disabled={extractedFields.length === 0} className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-50">导出报告</button>
           <button onClick={handleExportImage} className="rounded border border-blue-300 px-2 py-1 text-xs text-blue-700 hover:bg-blue-50">
             🖼️ 生成摘要图片
           </button>
        </div>
        <EmptyState title="未选中字段" description="点击中间栏的字段卡片查看详情。" />
      </div>
    );
  }

  return (
    <div ref={panelRef} className="flex h-full flex-col">
      <div className="flex justify-end gap-2 border-b border-slate-100 p-2">
         <button onClick={handleExport} className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">导出报告</button>
         <button onClick={handleExportImage} className="rounded border border-blue-300 px-2 py-1 text-xs text-blue-700 hover:bg-blue-50">
           🖼️ 生成摘要图片
         </button>
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

        {field.knowledgeHint && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-500">法务知识库参考</h3>
            <p className="mt-1 rounded bg-blue-50 p-2 text-xs text-blue-800 border border-blue-100">
              {field.knowledgeHint}
            </p>
          </section>
        )}

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

      <div className="mt-auto flex gap-2 border-t border-slate-100 p-3">
        <button
          type="button"
          disabled={field.reviewStatus === 'confirmed'}
          onClick={() => updateFieldReviewStatus(field.id, 'confirmed')}
          className="flex-1 rounded bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          {field.reviewStatus === 'confirmed' ? '已确认无误' : '确认无误'}
        </button>
        <button
          type="button"
          onClick={() => updateFieldReviewStatus(field.id, 'needs-human')}
          className="flex-1 rounded border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50"
        >
          需人工复核
        </button>
      </div>
    </div>
  );
}