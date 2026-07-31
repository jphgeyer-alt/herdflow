"use client";
// WEBSITE — herdflow-web/src/app/(farmapp)/app/profile/activity/ActivityFeedList.tsx
// Pagination only (no search/filter requested for this list) -- the
// farm-wide activity log is unbounded/append-only, so this is the most
// important of the four lists to cap client-side render cost on.
import { useState } from "react";
import { Pagination } from "@/components/farm/Pagination";
import { formatDateTime } from "@/lib/farm-finance/format";
import { useTranslations } from "next-intl";

const PAGE_SIZE = 20;

export interface ActivityLogRow {
  id: string;
  description: string;
  userName: string;
  createdAt: string;
}

export function ActivityFeedList({ logs }: { logs: ActivityLogRow[] }) {
  const t = useTranslations("profile");
  const [page, setPage] = useState(1);
  const pageItems = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="divide-y divide-navy-50">
        {pageItems.map((log) => (
          <div key={log.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-navy-600">{log.description}</p>
              <p className="truncate text-xs text-navy-300">{log.userName}</p>
            </div>
            <p className="shrink-0 text-xs text-navy-300">{formatDateTime(log.createdAt)}</p>
          </div>
        ))}
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={logs.length} onPageChange={setPage} itemLabel={t("activity_label")} />
    </div>
  );
}
