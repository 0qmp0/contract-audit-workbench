'use client';

import { StatusBar } from '@/components/StatusBar';

export function StatusBarVariants() {
  return (
    <div className="space-y-2">
      <StatusBar status="就绪" tone="idle" detail="idle" />
      <StatusBar status="正在读取协议…" tone="streaming" detail="streaming" />
      <StatusBar status="审阅完成" tone="done" detail="done" />
      <StatusBar status="请求失败" tone="error" detail="error" />
    </div>
  );
}