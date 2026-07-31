import Link from "next/link";
import type { ReactNode } from "react";

// herdflow-web/src/components/farm/EmptyState.tsx
// Shared "no data yet" treatment for list screens -- icon + message + an
// optional CTA (omitted when the emptiness is caused by a search/filter
// rather than genuinely no data, since "Add X" doesn't help there).
export function EmptyState({
  icon,
  title,
  message,
  ctaLabel,
  ctaHref,
}: {
  icon: ReactNode;
  title: string;
  message: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy-25 text-navy-600">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-navy-600">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-navy-300">{message}</p>
      </div>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-1 rounded-lg bg-navy-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-700"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
