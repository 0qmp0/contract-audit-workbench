'use client';

import { useQuery } from '@tanstack/react-query';

export interface AuditHistoryItem {
  id: string;
  title: string;
  createdAt: string;
}

async function fetchAuditHistory(): Promise<AuditHistoryItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return [
    { id: 'session-1', title: '采购合同审阅', createdAt: '2026-11-08T10:00:00Z' },
    { id: 'session-2', title: '服务协议审阅', createdAt: '2026-11-07T15:30:00Z' },
  ];
}

export function useAuditHistory() {
  return useQuery({
    queryKey: ['audit-history'],
    queryFn: fetchAuditHistory,
  });
}