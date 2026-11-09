'use client';

import { useMemo, useRef, useState } from 'react';
import { AuditPanel } from '@/components/AuditPanel';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ExtractionList } from '@/components/ExtractionList';
import { SourcePanel } from '@/components/SourcePanel';
import { StatusBar } from '@/components/StatusBar';
import { UploadBox } from '@/components/UploadBox';
import { useAuditHistory } from '@/hooks/useAuditHistory';
import { mockFields, mockSourceText } from '@/lib/mock-data';
import { parseAIResponse } from '@/lib/parse-extraction';
import { useAuditStore } from '@/stores/audit-store';
import type { ExtractedField } from '@/types/field';

export default function HomePage() {
  const selectedId = useAuditStore((state) => state.selectedFieldId);
  const selectField = useAuditStore((state) => state.selectField);
  const history = useAuditHistory();

  const [inputText, setInputText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [streamError, setStreamError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>(mockFields);

  const selectedField = useMemo(
    () => extractedFields.find((field) => field.id === selectedId) ?? null,
    [extractedFields, selectedId],
  );

  const handleExtract = async () => {
    if (!inputText.trim() || isExtracting) return;

    setIsExtracting(true);
    setStreamedText('');
    setStreamError(null);
    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceText: inputText }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `请求失败 (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('浏览器不支持流式读取');

      const decoder = new TextDecoder();
      let buffer = '';
      let visible = '';

      // 只负责接收流，不解析 JSON
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;

          try {
            const parsed = JSON.parse(payload) as {
              type?: string;
              delta?: string;
              errorText?: string;
              error?: string | { message?: string };
            };

            if (parsed.type === 'text-delta' && typeof parsed.delta === 'string') {
              visible += parsed.delta;
              setStreamedText(visible);
            } else if (parsed.type === 'error') {
              const message =
                parsed.errorText ??
                (typeof parsed.error === 'string' ? parsed.error : parsed.error?.message) ??
                '模型调用失败';
              setStreamError(message);
            }
          } catch {
            // 非 JSON 的 data 行忽略
          }
        }
      }

      // 流结束后再统一解析
      if (visible.trim()) {
        try {
          const fields = parseAIResponse(visible, inputText);
          setExtractedFields(fields);
          setStreamError(null);
        } catch (parseErr) {
          setStreamError(parseErr instanceof Error ? parseErr.message : '解析失败');
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setStreamError('已中断提取');
      } else {
        setStreamError(err instanceof Error ? err.message : '未知错误');
      }
    } finally {
      setIsExtracting(false);
      abortRef.current = null;
    }
  };

  const handleAbort = () => {
    abortRef.current?.abort();
  };

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <h1 className="text-sm font-semibold text-slate-800">合同条款辅助审阅与规则审计工作台</h1>
        <p className="mt-0.5 text-xs text-slate-500">
          辅助审阅与审计，不提供法律意见，最终判断由人工完成。
        </p>
      </header>

      <div className="border-b border-slate-200 bg-white px-4 py-2">
        <UploadBox onFileSelect={(file) => console.log('selected file:', file.name)} />
      </div>

      <div className="border-b border-slate-200 bg-white px-4 py-2">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="粘贴协议文本…"
          rows={4}
          className="w-full rounded-md border border-slate-300 p-2 text-sm"
          disabled={isExtracting}
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={handleExtract}
            disabled={isExtracting || !inputText.trim()}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white disabled:opacity-50"
          >
            {isExtracting ? '提取中…' : '开始提取'}
          </button>
          {isExtracting ? (
            <button
              type="button"
              onClick={handleAbort}
              className="rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-700"
            >
              中断
            </button>
          ) : null}
          {streamError ? <span className="text-xs text-red-600">{streamError}</span> : null}
        </div>
        {streamedText ? (
          <pre className="mt-2 max-h-40 overflow-y-auto rounded bg-slate-50 p-2 text-xs text-slate-700">
            {streamedText}
          </pre>
        ) : null}
      </div>

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden p-2 lg:grid-cols-[1fr_1.1fr_1fr]">
        <section className="min-h-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <SourcePanel
            sourceText={inputText || mockSourceText}
            activeSourceRef={selectedField?.sourceRef ?? null}
          />
        </section>

        <section className="min-h-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <ExtractionList
            fields={extractedFields}
            selectedId={selectedId}
            onSelect={selectField}
          />
        </section>

        <section className="min-h-0 flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="min-h-0 flex-1 overflow-hidden">
            <AuditPanel field={selectedField} />
          </div>
          <div className="border-t border-slate-200 p-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">历史审阅</h2>
            {history.isPending ? (
              <p className="mt-2 text-xs text-slate-400">加载中…</p>
            ) : history.isError ? (
              <ErrorState message="历史列表加载失败。" onRetry={() => history.refetch()} />
            ) : history.data && history.data.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {history.data.map((item) => (
                  <li key={item.id} className="truncate text-xs text-slate-600">
                    {item.title}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="暂无历史审阅记录" />
            )}
          </div>
        </section>
      </main>

      <StatusBar
        status={isExtracting ? '正在提取…' : streamError ? '提取失败' : '就绪'}
        tone={isExtracting ? 'streaming' : streamError ? 'error' : 'idle'}
        detail={`共 ${extractedFields.length} 个字段`}
      />
    </div>
  );
}