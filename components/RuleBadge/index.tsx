export interface RuleBadgeProps {
  level: 'pass' | 'warning' | 'blocked';
  label?: string;
}

const levelStyles: Record<RuleBadgeProps['level'], string> = {
  pass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  blocked: 'bg-red-50 text-red-700 border-red-200',
};

const levelLabels: Record<RuleBadgeProps['level'], string> = {
  pass: '通过',
  warning: '警告',
  blocked: '阻断',
};

export function RuleBadge({ level, label }: RuleBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${levelStyles[level]}`}
    >
      {label ?? levelLabels[level]}
    </span>
  );
}
