import { evaluateField } from '@/rules/engine';
import type { ExtractedField, ReviewStatus, SourceRef } from '@/types/field';

interface RawField {
  name?: unknown;
  aiValue?: unknown;
  confidence?: unknown;
  source_ref?: unknown;
}

function stripMarkdownFence(raw: string): string {
  return raw.replace(/```json\s*/gi, '').replace(/```/g, '');
}

function toExtractedField(item: RawField, sourceText: string, index: number): ExtractedField {
  const name = typeof item.name === 'string' && item.name.trim() ? item.name : `字段${index + 1}`;
  const aiValue = typeof item.aiValue === 'string' ? item.aiValue : '原文未提及';
  const confidence = typeof item.confidence === 'number' ? item.confidence : undefined;
  const snippet = typeof item.source_ref === 'string' ? item.source_ref.trim() : '';

  let sourceRef: SourceRef | null = null;
  let reviewStatus: ReviewStatus = 'pending';

  if (snippet) {
    const start = sourceText.indexOf(snippet);
    if (start >= 0) {
      sourceRef = { start, end: start + snippet.length, snippet };
    } else {
      // AI 引用了原文里不存在的片段，视为幻觉引用
      reviewStatus = 'needs-human';
    }
  }

  const base: ExtractedField = {
    id: `${index}-${name}`,
    name,
    aiValue,
    confidence,
    ruleResult: { level: 'warning', ruleId: 'TBD', reason: 'TBD' },
    sourceRef,
    reviewStatus,
  };

  const ruleResult = evaluateField(base, sourceText);
  return {
    ...base,
    ruleResult,
    reviewStatus: ruleResult.level === 'blocked' ? 'needs-human' : reviewStatus,
    // knowledgeHint 由服务端 /api/knowledge 在解析后补充（法律库为 Node 端 SQLite）
  };
}

export function parseAIResponse(raw: string, sourceText: string): ExtractedField[] {
  const cleaned = stripMarkdownFence(raw);
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI 返回中未找到 JSON 数组');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error('AI 返回的 JSON 无法解析，可能被截断');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('AI 返回不是数组');
  }

  return parsed.map((item, index) => toExtractedField(item as RawField, sourceText, index));
}
