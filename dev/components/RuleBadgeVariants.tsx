'use client';

import { RuleBadge } from '@/components/RuleBadge';

export function RuleBadgeVariants() {
  return (
    <div className="flex flex-wrap gap-2">
      <RuleBadge level="pass" />
      <RuleBadge level="warning" />
      <RuleBadge level="blocked" />
      <RuleBadge level="pass" label="自定义文案" />
    </div>
  );
}