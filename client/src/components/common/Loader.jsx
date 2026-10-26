export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={`animate-spin text-current ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export default function Loader({ label = 'Loading...', full = false }) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center gap-3 text-brand-600 ${full ? 'min-h-[60vh]' : 'py-16'}`}
    >
      <Spinner className="h-8 w-8" />
      <span className="text-sm text-gray-500">{label}</span>
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/5" />
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card p-3">
      <Skeleton className="aspect-square w-full" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/2" />
      <Skeleton className="mt-3 h-6 w-1/3" />
    </div>
  );
}
