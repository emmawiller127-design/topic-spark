export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-stone-200 border-t-[var(--accent)] ${className}`}
      role="status"
      aria-label="加载中"
    />
  );
}
