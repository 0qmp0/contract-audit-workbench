'use client';

import { useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { RuleBadge } from '@/components/RuleBadge';
import type { ExtractedField } from '@/types/field';
import { useAuditStore } from '@/stores/audit-store';

export interface AuditPanelProps {
  field: ExtractedField | null;
}

export function AuditPanel({ field }: AuditPanelProps) {
  const { sourceText, extractedFields, updateFieldReviewStatus } = useAuditStore();
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    if (!extractedFields.length) return;
    setIsGeneratingImage(true);
    setGeneratedImageUrl(null);

    // 1. 构造描述合同审计摘要的提示词
    const summary = extractedFields
      .map((f) => `条款「${f.name}」: 提取值「${f.aiValue}」, 判定为「${f.ruleResult.level}」`)
      .join('\n');

    const prompt = `请生成一张关于合同审计摘要的卡片式图片，风格简洁、专业、商务。背景为浅色。内容包含以下核心条款的审计结果：\n${summary}`;

    try {
      // 2. wan2.7-image 为同步接口，直接等待图片 URL 返回
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();

      if (data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
      } else {
        throw new Error(data.error || '生成图片失败');
      }
    } catch (err) {
      console.error(err);
      alert('请求失败，请重试。');
    } finally {
      setIsGeneratingImage(false);
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

  const generateImageButton = (
    <button
      type="button"
      onClick={handleGenerateImage}
      disabled={isGeneratingImage || extractedFields.length === 0}
      className="rounded border border-blue-300 px-2 py-1 text-xs text-blue-700 hover:bg-blue-50 disabled:opacity-50"
    >
      {isGeneratingImage ? '生成中...' : '🖼️ 生成摘要图片'}
    </button>
  );

  const generatedImage = generatedImageUrl ? (
    <div className="border-b border-slate-100 p-2">
      {/* 生成图来自百炼 OSS 随机域名且需原样下载，不做 next/image 优化 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={generatedImageUrl}
        alt="审计摘要图片"
        className="max-h-64 rounded border border-slate-200"
      />
      <a
        href={generatedImageUrl}
        target="_blank"
        rel="noreferrer"
        download="合同审计摘要.png"
        className="mt-1 inline-block text-xs text-blue-600 hover:underline"
      >
        ⬇️ 下载摘要图片
      </a>
    </div>
  ) : null;

  if (!field) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex justify-end gap-2 border-b border-slate-100 p-2">
          <button
            onClick={handleExport}
            disabled={extractedFields.length === 0}
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-50"
          >
            导出报告
          </button>
          {generateImageButton}
        </div>
        {generatedImage}
        <EmptyState title="未选中字段" description="点击中间栏的字段卡片查看详情。" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex justify-end gap-2 border-b border-slate-100 p-2">
        <button
          onClick={handleExport}
          className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
        >
          导出报告
        </button>
        {generateImageButton}
      </div>
      {generatedImage}
      <div className="flex flex-col gap-4 overflow-y-auto p-4">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            AI 原始输出
          </h3>
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
            <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-500">
              法务知识库参考
            </h3>
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
              <strong>⚠️ 未定位到原文：</strong> AI
              可能产生了幻觉，或原文未明确提及。请务必人工核对。
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
