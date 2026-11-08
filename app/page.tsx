'use client';

import { useMemo } from 'react';
import { AuditPanel } from '@/components/AuditPanel';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ExtractionList } from '@/components/ExtractionList';
import { SourcePanel } from '@/components/SourcePanel';
import { StatusBar } from '@/components/StatusBar';
import { UploadBox } from '@/components/UploadBox';
import { useAuditHistory } from '@/hooks/useAuditHistory';
import { mockFields, mockSourceText } from '@/lib/mock-data';
import { useAuditStore } from '@/stores/audit-store';

export default function HomePage() {
  const selectedId = useAuditStore((state) => state.selectedFieldId);
  const selectField = useAuditStore((state) => state.selectField);
  const history = useAuditHistory();

  const selectedField = useMemo(
    () => mockFields.find((field) => field.id === selectedId) ?? null,
    [selectedId],
  );

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

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden p-2 lg:grid-cols-[1fr_1.1fr_1fr]">
        <section className="min-h-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <SourcePanel sourceText={mockSourceText} activeSourceRef={selectedField?.sourceRef ?? null} />
        </section>

        <section className="min-h-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <ExtractionList fields={mockFields} selectedId={selectedId} onSelect={selectField} />
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

      <StatusBar status="就绪" tone="idle" detail={`共 ${mockFields.length} 个字段`} />
    </div>
  );
}