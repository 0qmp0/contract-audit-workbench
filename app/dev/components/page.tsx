'use client';

import { useState } from 'react';
import { AuditPanel } from '@/components/AuditPanel';
import { ExtractionList } from '@/components/ExtractionList';
import { FieldCard } from '@/components/FieldCard';
import { SourcePanel } from '@/components/SourcePanel';
import { UploadBox } from '@/components/UploadBox';
import { RuleBadgeVariants } from '@/dev/components/RuleBadgeVariants';
import { StateVariants } from '@/dev/components/StateVariants';
import { StatusBarVariants } from '@/dev/components/StatusBarVariants';
import { mockFields, mockSourceText } from '@/lib/mock-data';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
      {children}
    </section>
  );
}

export default function DevComponentsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(mockFields[0]?.id ?? null);
  const selectedField = mockFields.find((field) => field.id === selectedId) ?? null;

  return (
    <div className="min-h-screen space-y-4 bg-slate-100 p-4">
      <header>
        <h1 className="text-sm font-semibold text-slate-800">组件集中展示页</h1>
        <p className="mt-0.5 text-xs text-slate-500">仅开发调试用，覆盖所有组件与状态。</p>
      </header>

      <Section title="RuleBadge — pass / warning / blocked">
        <RuleBadgeVariants />
      </Section>

      <Section title="StatusBar — idle / streaming / done / error">
        <StatusBarVariants />
      </Section>

      <Section title="UploadBox">
        <UploadBox onFileSelect={(file) => console.log('dev page file:', file.name)} />
      </Section>

      <Section title="EmptyState / ErrorState">
        <StateVariants />
      </Section>

      <Section title="FieldCard — 默认 / 选中">
        <div className="grid gap-3 md:grid-cols-2">
          {mockFields.map((field) => (
            <FieldCard
              key={field.id}
              field={field}
              isSelected={field.id === selectedId}
              onSelect={setSelectedId}
            />
          ))}
        </div>
      </Section>

      <Section title="ExtractionList — 有数据 / 空">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-64 overflow-hidden rounded border border-slate-200">
            <ExtractionList fields={mockFields} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
          <div className="h-64 overflow-hidden rounded border border-slate-200">
            <ExtractionList fields={[]} selectedId={null} onSelect={setSelectedId} />
          </div>
        </div>
      </Section>

      <Section title="SourcePanel — 有高亮 / 无高亮 / 空原文">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-48 overflow-hidden rounded border border-slate-200">
            <SourcePanel
              sourceText={mockSourceText}
              activeSourceRef={selectedField?.sourceRef ?? null}
            />
          </div>
          <div className="h-48 overflow-hidden rounded border border-slate-200">
            <SourcePanel sourceText={mockSourceText} activeSourceRef={null} />
          </div>
          <div className="h-48 overflow-hidden rounded border border-slate-200">
            <SourcePanel sourceText="" />
          </div>
        </div>
      </Section>

      <Section title="AuditPanel — 选中字段 / 未选中">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-64 overflow-hidden rounded border border-slate-200">
            <AuditPanel field={selectedField} />
          </div>
          <div className="h-64 overflow-hidden rounded border border-slate-200">
            <AuditPanel field={null} />
          </div>
        </div>
      </Section>
    </div>
  );
}
