export type StatusTone = 'idle' | 'streaming' | 'done' | 'error';

export interface StatusBarProps {
  status: string;
  tone?: StatusTone;
  detail?: string;
}

const toneStyles: Record<StatusTone, string> = {
  idle: 'text-slate-500',
  streaming: 'text-blue-600',
  done: 'text-emerald-600',
  error: 'text-red-600',
};

export function StatusBar({ status, tone = 'idle', detail }: StatusBarProps) {
  return (
    <footer className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs">
      <span className={`font-medium ${toneStyles[tone]}`}>{status}</span>
      {detail ? <span className="text-slate-400">{detail}</span> : null}
    </footer>
  );
}