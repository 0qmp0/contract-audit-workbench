'use client';

import { useQuery } from '@tanstack/react-query';
import { getHistory } from '@/lib/storage';

export function useAuditHistory() {
  return useQuery({
    queryKey: ['audit-history'],
    queryFn: async () => {
      return await getHistory();
    },
  });
}