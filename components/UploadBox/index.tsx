'use client';

import { useRef } from 'react';

export interface UploadBoxProps {
  onFileSelect: (file: File) => void;
  accept?: string;
}

export function UploadBox({ onFileSelect, accept = '.txt,.md,.pdf' }: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
      >
        选择协议文件
      </button>
      <span className="text-xs text-slate-500">或直接粘贴协议文本到下方输入区</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onFileSelect(file);
            e.target.value = '';
          }
        }}
      />
    </div>
  );
}