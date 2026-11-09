'use client';

import { useEffect, useRef } from 'react';
import type { SourceRef } from '@/types/field';

export interface SourcePanelProps {
  sourceText: string;
  activeSourceRef?: SourceRef | null;
}

export function SourcePanel({ sourceText, activeSourceRef }: SourcePanelProps) {
  const markRef = useRef<HTMLElement>(null);

  // 监听高亮位置变化，自动滚动到中央
  useEffect(() => {
    if (activeSourceRef && markRef.current) {
      markRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeSourceRef]);

  if (!sourceText.trim()) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-xs text-slate-400">
        粘贴或上传协议后，原文会显示在这里。
      </div>
    );
  }

  const { start, end } = activeSourceRef ?? { start: -1, end: -1 };
  const hasHighlight = start >= 0 && end > start && end <= sourceText.length;

  return (
    <div className="h-full overflow-y-auto whitespace-pre-wrap break-words p-4 text-sm leading-7 text-slate-700">
      {hasHighlight ? (
        <>
          {sourceText.slice(0, start)}
          <mark 
            ref={markRef as React.RefObject<HTMLElement>} 
            className="rounded bg-amber-200 px-0.5 transition-colors duration-300"
          >
            {sourceText.slice(start, end)}
          </mark>
          {sourceText.slice(end)}
        </>
      ) : (
        sourceText
      )}
    </div>
  );
}