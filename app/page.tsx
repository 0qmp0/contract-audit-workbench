'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AuditPanel } from '@/components/AuditPanel';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
    currentSessionId,
  } = useAuditStore();

  const history = useAuditHistory();

  const [inputText, setInputText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [streamError, setStreamError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isManualAbortRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 移动端输入区折叠
  const [showInput, setShowInput] = useState(true);

  // 端侧 AI 推理状态
  const [localAiStatus, setLocalAiStatus] = useState<
    'idle' | 'loading' | 'inferencing' | 'complete' | 'error'
  >('idle');
  const workerRef = useRef<Worker | null>(null);
  const [localAiResult, setLocalAiResult] = useState<{ label: string; score: number } | null>(null);

  useEffect(() => {
    loadCurrentSession().then((session) => {
      if (session) {
        loadSession(session);
      }
    });
  }, [loadSession]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      workerRef.current = new Worker(new URL('./worker.ts', import.meta.url));
      workerRef.current.onmessage = (event) => {
        const { status, result, error } = event.data;
        setLocalAiStatus(status);
        if (status === 'complete') {
          const r = Array.isArray(result) ? result[0] : result;
          if (r && typeof r.label === 'string') {
            setLocalAiResult({ label: r.label, score: Number(r.score) || 0 });
          }
          console.log('端侧 AI 推理结果:', result);
        }
        if (status === 'error') {
          setLocalAiResult(null);
          console.error('端侧 AI 推理失败:', error);
        }
      };
    }
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const selectedField = useMemo(
    () => extractedFields.find((field) => field.id === selectedFieldId) ?? null,
    [extractedFields, selectedFieldId],
  );

  const handleExtract = async () => {
    if (!inputText.trim() || isExtracting) return;

    setIsExtracting(true);
    setStreamedText('');
    setStreamError(null);
    isManualAbortRef.current = false;
    abortRef.current = new AbortController();

    // 30秒超时
    timeoutRef.current = setTimeout(() => {
      if (isManualAbortRef.current) return;
      abortRef.current?.abort();
      setStreamError('请求超时，AI 响应时间过长，请重试。');
    }, 30000);

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
            // ignore
          }
        }
      }

      if (visible.trim()) {
        try {
          const fields = parseAIResponse(visible, inputText);

          // 从服务端本地法律库为各字段补充知识提示，失败不阻断主流程
          let hints: Record<string, string | null> = {};
          try {
            const knowledgeRes = await fetch('/api/knowledge', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ names: fields.map((f) => f.name) }),
            });
            const knowledgeData = await knowledgeRes.json();
            hints = knowledgeData.hints ?? {};
          } catch (knowledgeError) {
            console.error('知识库查询失败:', knowledgeError);
          }

          setAuditResult(
            inputText,
            fields.map((f) => ({ ...f, knowledgeHint: hints[f.name] ?? null })),
          );
          setStreamError(null);

          setTimeout(() => {
            history.refetch();
          }, 300);
        } catch (parseErr) {
          setStreamError(parseErr instanceof Error ? parseErr.message : '解析失败');
        }
      }
    } catch (err) {
      const isAbortError =
        (err instanceof DOMException && err.name === 'AbortError') ||
        (err instanceof Error && err.name === 'AbortError');

      if (isAbortError) {
        if (isManualAbortRef.current) {
          setStreamError('已中断提取');
        }
      } else if (isManualAbortRef.current) {
        setStreamError('已中断提取');
      } else {
        setStreamError(err instanceof Error ? err.message : '未知错误');
      }
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsExtracting(false);
      abortRef.current = null;
    }
  };

  const handleAbort = () => {
    isManualAbortRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    abortRef.current?.abort();
  };

  const handleClearPreview = () => {
    setStreamedText('');
    setStreamError(null);
  };

  const runLocalAi = () => {
    if (!inputText.trim() || !workerRef.current) return;
    setLocalAiStatus('loading');
    setLocalAiResult(null);
    workerRef.current.postMessage({ text: inputText, id: Date.now() });
  };

  const handleFileSelect = (file: File) => {
    const name = file.name.toLowerCase();

    // 纯文本直接本地读取
    if (name.endsWith('.txt') || name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = typeof e.target?.result === 'string' ? e.target.result : '';
        setInputText(text);
        setShowInput(true);
      };
      reader.readAsText(file);
      return;
    }

    // PDF / DOCX 交由服务端解析
    if (name.endsWith('.pdf') || name.endsWith('.docx')) {
      (async () => {
        try {
          const form = new FormData();
          form.append('file', file);
          const res = await fetch('/api/parse-file', { method: 'POST', body: form });
          const data = await res.json();
          if (!res.ok || typeof data.text !== 'string') {
            throw new Error(data.error || '文件解析失败');
          }
          setInputText(data.text);
          setShowInput(true);
        } catch (err) {
          console.error('文件解析失败:', err);
          alert(`文件解析失败：${err instanceof Error ? err.message : '未知错误'}`);
        }
      })();
    }
  };

  const displaySourceText = sourceText || mockSourceText;
  const displayFields = extractedFields.length > 0 ? extractedFields : mockFields;

  return (
    // 使用 h-dvh 适配移动端视口
    <div className="flex h-dvh flex-col bg-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div>
          <h1 className="text-sm font-semibold text-slate-800">合同条款辅助审阅与规则审计工作台</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            辅助审阅与审计，不提供法律意见，最终判断由人工完成。
          </p>
        </div>
        {/* 移动端折叠按钮 */}
        <button
          onClick={() => setShowInput(!showInput)}
          className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 md:hidden"
        >
          {showInput ? '收起输入' : '展开输入'}
        </button>
      </header>

      {showInput && (
        <div className="border-b border-slate-200 bg-white px-4 py-2">
          <UploadBox onFileSelect={handleFileSelect} />
        </div>
      )}

      {showInput && (
        <div className="border-b border-slate-200 bg-white px-4 py-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="粘贴协议文本…"
            rows={4}
            className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800 placeholder:text-slate-400"
            disabled={isExtracting}
          />
          <p className="mt-1 text-xs text-slate-400">
            当前规则集最适配：含金额、交付期限、违约责任、争议解决条款的合同（如服务、买卖、委托类合同）；其他类型仍可提取，未命中规则的字段会提示「未匹配规则」。
          </p>
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
            <button
              type="button"
              onClick={runLocalAi}
              disabled={
                localAiStatus === 'loading' || localAiStatus === 'inferencing' || !inputText.trim()
              }
              className="rounded-md border border-purple-300 bg-purple-50 px-3 py-1.5 text-xs text-purple-700 hover:bg-purple-100 disabled:opacity-50"
            >
              {localAiStatus === 'loading' && '⏳ 加载端侧模型…'}
              {localAiStatus === 'inferencing' && '🧠 端侧推理中…'}
              {(localAiStatus === 'idle' ||
                localAiStatus === 'complete' ||
                localAiStatus === 'error') &&
                '🧠 端侧AI检测'}
            </button>
            {streamError ? <span className="text-xs text-red-600">{streamError}</span> : null}
          </div>

          {localAiStatus === 'complete' && localAiResult && (
            <div
              className="mt-1 flex items-center gap-2 rounded-md border border-purple-200 bg-purple-50 px-2.5 py-1.5 text-xs text-purple-700"
              data-testid="local-ai-result"
            >
              <span>✅ 端侧推理完成（模型已在浏览器本地运行）</span>
              <span className="font-medium">
                情感倾向：
                <span
                  className={
                    localAiResult.label.toLowerCase() === 'positive'
                      ? 'text-green-600'
                      : localAiResult.label.toLowerCase() === 'negative'
                        ? 'text-red-600'
                        : 'text-amber-600'
                  }
                >
                  {localAiResult.label.toLowerCase() === 'positive'
                    ? '正面'
                    : localAiResult.label.toLowerCase() === 'negative'
                      ? '负面'
                      : '中性'}
                </span>
                （置信度 {(localAiResult.score * 100).toFixed(1)}%）
              </span>
            </div>
          )}
          {localAiStatus === 'error' && (
            <p className="mt-1 text-xs text-red-500">⚠️ 端侧推理失败，请重试</p>
          )}

          {isExtracting && !streamedText ? (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-slate-600 transition-opacity">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
              </span>
              正在读取协议并调用 AI 分析…
            </div>
          ) : isExtracting && streamedText ? (
            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 transition-all">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                </span>
                {streamedText.includes('name') ? '正在识别关键条款...' : '正在解析文本结构...'}
              </div>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-slate-400">
                {streamedText.slice(-80)}
              </p>
            </div>
          ) : !isExtracting && streamedText ? (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-xs text-emerald-700">✅ 解析完成，已生成审计字段</p>
              <button
                type="button"
                onClick={handleClearPreview}
                className="shrink-0 rounded border border-emerald-300 px-2 py-0.5 text-[11px] text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                清除预览
              </button>
            </div>
          ) : null}
        </div>
      )}

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden p-2 lg:grid-cols-[1fr_1.1fr_1fr]">
        <ErrorBoundary>
          <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-3 py-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                ① 原文对照
              </h2>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <SourcePanel
                sourceText={displaySourceText}
                activeSourceRef={selectedField?.sourceRef ?? null}
              />
            </div>
          </section>
        </ErrorBoundary>

        <ErrorBoundary>
          <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                ② 提取字段
              </h2>
              {displayFields.length > 0 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  {displayFields.length} 项
                </span>
              )}
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <ExtractionList
                fields={displayFields}
                selectedId={selectedFieldId}
                onSelect={selectField}
              />
            </div>
          </section>
        </ErrorBoundary>

        <ErrorBoundary>
          <section className="min-h-0 flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-3 py-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                ③ 审计面板
              </h2>
            </div>
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
        </ErrorBoundary>
      </main>

      <StatusBar
        status={isExtracting ? 'AI 解析中…' : streamError ? '提取失败' : '就绪'}
        tone={isExtracting ? 'streaming' : streamError ? 'error' : 'idle'}
        detail={`共 ${displayFields.length} 个字段`}
      />
    </div>
  );
}
