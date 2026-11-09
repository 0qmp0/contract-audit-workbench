'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
import { loadCurrentSession } from '@/lib/storage';
import { useAuditStore } from '@/stores/audit-store';

export default function HomePage() {
  const {
    selectedFieldId,
    selectField,
    sourceText,
    extractedFields,
    setAuditResult,
    loadSession,
    currentSessionId, // 新增：用于高亮当前选中的历史记录
  } = useAuditStore();

  const history = useAuditHistory();

  // 控制输入框和流式的本地状态
  const [inputText, setInputText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [streamError, setStreamError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 挂载时从 IndexedDB 恢复数据
  useEffect(() => {
    loadCurrentSession().then((session) => {
      if (session) {
        loadSession(session);
      }
    });
  }, [loadSession]);

  const selectedField = useMemo(
    () => extractedFields.find((field) => field.id === selectedFieldId) ?? null,
    [extractedFields, selectedFieldId],
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

      if (visible.trim()) {
        try {
          const fields = parseAIResponse(visible, inputText);
          // 将解析结果存入 Zustand，并异步保存到 IndexedDB
          setAuditResult(inputText, fields);
          setStreamError(null);
          
          // 稍微延迟一点，等 IndexedDB 写完再更新历史列表查询
          setTimeout(() => {
            history.refetch();
          }, 300);
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

  // 决定展示什么数据：如果是首次进入，没数据，展示 mock 作为演示
  const displaySourceText = sourceText || mockSourceText;
  const displayFields = extractedFields.length > 0 ? extractedFields : mockFields;

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
            sourceText={displaySourceText}
            activeSourceRef={selectedField?.sourceRef ?? null}
          />
        </section>

        <section className="min-h-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <ExtractionList
            fields={displayFields}
            selectedId={selectedFieldId}
            onSelect={selectField}
          />
        </section>

        <section className="min-h-0 flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="min-h-0 flex-1 overflow-hidden">
            <AuditPanel field={selectedField} />
          </div>
          <div className="border-t border-slate-200 p-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              历史审阅
            </h2>
            {history.isPending ? (
              <p className="mt-2 text-xs text-slate-400">加载中…</p>
            ) : history.isError ? (
              <ErrorState message="历史列表加载失败。" onRetry={() => history.refetch()} />
            ) : history.data && history.data.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {history.data.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => loadSession(item)}
                      className={`w-full truncate rounded px-2 py-1 text-left text-xs transition-colors hover:bg-slate-100 ${
                        item.id === currentSessionId
                          ? 'bg-slate-100 font-medium text-slate-900'
                          : 'text-slate-600'
                      }`}
                    >
                      {item.title}
                    </button>
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
        detail={`共 ${displayFields.length} 个字段`}
      />
    </div>
  );
}