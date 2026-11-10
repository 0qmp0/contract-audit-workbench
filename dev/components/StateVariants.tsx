'use client';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';

export function StateVariants() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded border border-slate-200">
        <EmptyState title="暂无数据" description="这是空状态描述。" />
      </div>
      <div className="rounded border border-slate-200">
        <EmptyState
          title="暂无历史审阅记录"
          actionLabel="新建审阅"
          onAction={() => console.log('new audit')}
        />
      </div>
      <div className="rounded border border-slate-200">
        <ErrorState />
      </div>
      <div className="rounded border border-slate-200">
        <ErrorState message="历史列表加载失败。" onRetry={() => console.log('retry')} />
      </div>
    </div>
  );
}
