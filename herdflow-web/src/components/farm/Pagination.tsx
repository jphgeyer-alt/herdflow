"use client";
// herdflow-web/src/components/farm/Pagination.tsx
// Shared client-side pagination control for the farm-app's list screens
// (Herd, Health history, Medicines, Activity feed) -- all of them already
// fetch a bounded set server-side (take: 100-200) and filter/search
// client-side, so paging the already-fetched array client-side too avoids
// a second data-fetch mechanism just for page 2.
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  itemLabel,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  itemLabel: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-navy-50 px-4 py-3">
      <p className="text-xs text-navy-300">
        {start}–{end} of {total} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 rounded-lg border border-navy-100 px-2.5 py-1.5 text-xs font-semibold text-navy-500 transition hover:bg-navy-25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs font-medium text-navy-500">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center gap-1 rounded-lg border border-navy-100 px-2.5 py-1.5 text-xs font-semibold text-navy-500 transition hover:bg-navy-25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
