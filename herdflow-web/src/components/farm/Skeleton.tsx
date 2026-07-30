// herdflow-web/src/components/farm/Skeleton.tsx
// Shared loading-placeholder primitive for every /app/* route's loading.tsx.
// Server Component (no interactivity needed) -- the shimmer is pure CSS
// (globals.css .farmapp-theme scope) and respects prefers-reduced-motion.
import type { CSSProperties } from "react";

export function Skeleton({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-skeleton rounded bg-navy-100 ${className}`} style={style} />;
}

export function SkeletonStatRow({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-xl border border-navy-50 bg-white p-4 shadow-sm">
          <Skeleton className="mb-3 h-3 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-navy-100 bg-white">
      <div className="flex gap-6 border-b border-navy-50 px-4 py-3">
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} className="h-3 w-16" />
        ))}
      </div>
      <div className="divide-y divide-navy-50">
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="flex gap-6 px-4 py-3.5">
            {Array.from({ length: cols }, (_, c) => (
              <Skeleton key={c} className="h-3.5 w-20" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-xl border border-navy-50 bg-white p-5 shadow-sm">
      <Skeleton className="mb-4 h-4 w-32" />
      <div className="space-y-2.5">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} className="h-3 w-full" style={{ width: `${85 - i * 12}%` }} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonForm({ fields = 6 }: { fields?: number }) {
  return (
    <div className="rounded-xl border border-navy-50 bg-white p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i}>
            <Skeleton className="mb-2 h-2.5 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
