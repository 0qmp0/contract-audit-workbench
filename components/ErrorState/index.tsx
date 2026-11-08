'use client';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = '出错了',
  message = '请稍后重试，或检查网络与配置。',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center"
    >
      <p className="text-sm font-medium text-red-700">{title}</p>
      <p className="text-xs text-slate-500">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
        >
          重试
        </button>
      ) : null}
    </div>
  );
}