'use client';

import { EmptyState } from '@/components/EmptyState';
import { FieldCard } from '@/components/FieldCard';
import type { ExtractedField } from '@/types/field';

export interface ExtractionListProps {
  fields: ExtractedField[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ExtractionList({ fields, selectedId, onSelect }: ExtractionListProps) {
  if (fields.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <EmptyState
          title="还没有提取结果"
          description="上传或粘贴协议文本后，AI 提取的字段会出现在这里。"
        />
      </div>
    );
  }

  return (
    <ul role="list" className="flex min-h-0 flex-1 list-none flex-col gap-2 overflow-y-auto p-2">
      {fields.map((field) => (
        <li key={field.id}>
          <FieldCard field={field} isSelected={field.id === selectedId} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}
