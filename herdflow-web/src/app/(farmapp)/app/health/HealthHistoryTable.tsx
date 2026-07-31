"use client";
// WEBSITE — herdflow-web/src/app/(farmapp)/app/health/HealthHistoryTable.tsx
// Search + event-type filter + pagination, mirroring HerdListTable's
// client-side pattern (the full farm-wide history is already fetched
// server-side, bounded to 200 rows).
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { HeartPulse } from "lucide-react";
import { Badge } from "@/components/farm/Card";
import { Pagination } from "@/components/farm/Pagination";
import { EmptyState } from "@/components/farm/EmptyState";
import { formatDate, formatCurrency } from "@/lib/farm-finance/format";

const PAGE_SIZE = 20;
const KNOWN_EVENT_TYPES = ["illness", "injury", "treatment", "vaccine", "checkup", "other"] as const;

export interface HealthRecordRow {
  id: string;
  eventDate: string;
  animalName: string;
  eventType: string;
  description: string | null;
  status: string;
  cost: number | null;
}

export function HealthHistoryTable({ records }: { records: HealthRecordRow[] }) {
  const t = useTranslations("health");
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState("all");
  const [page, setPage] = useState(1);

  function eventLabel(type: string) {
    const key = type.toLowerCase();
    return (KNOWN_EVENT_TYPES as readonly string[]).includes(key) ? t(`event_type_${key}`) : type;
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (eventType !== "all" && r.eventType.toLowerCase() !== eventType) return false;
      if (!q) return true;
      return (
        r.animalName.toLowerCase().includes(q) || (r.description?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [records, search, eventType]);

  // Reset to page 1 whenever the filters change -- adjusting state during
  // render rather than in a useEffect (React's documented pattern for this).
  const [prevFilterKey, setPrevFilterKey] = useState(`${search}|${eventType}`);
  const filterKey = `${search}|${eventType}`;
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-navy-100 bg-white p-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search_placeholder")}
          className="min-w-[220px] flex-1 rounded-lg border border-navy-100 px-3 py-1.5 text-sm text-navy-600"
        />
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="rounded-lg border border-navy-100 px-3 py-1.5 text-sm text-navy-500"
        >
          <option value="all">{t("all_event_types")}</option>
          {KNOWN_EVENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`event_type_${type}`)}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-navy-100 bg-white">
          {records.length === 0 ? (
            <EmptyState
              icon={<HeartPulse size={20} />}
              title={t("no_health_records_yet")}
              message={t("no_health_records_yet_message")}
              ctaLabel={t("add_health_event")}
              ctaHref="/app/health/new"
            />
          ) : (
            <EmptyState
              icon={<HeartPulse size={20} />}
              title={t("no_health_records_filtered")}
              message={t("no_health_records_filtered_hint")}
            />
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-navy-100 bg-white">
          <div className="max-h-[65vh] overflow-y-auto overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-50 text-xs font-semibold tracking-wide text-navy-300 uppercase">
                  <th className="sticky top-0 z-10 bg-white px-4 py-2 text-left">{t("event_date")}</th>
                  <th className="sticky top-0 z-10 bg-white px-4 py-2 text-left">{t("animal")}</th>
                  <th className="sticky top-0 z-10 bg-white px-4 py-2 text-left">{t("event_type")}</th>
                  <th className="sticky top-0 z-10 bg-white px-4 py-2 text-left">{t("description")}</th>
                  <th className="sticky top-0 z-10 bg-white px-4 py-2 text-left">{t("status")}</th>
                  <th className="sticky top-0 z-10 bg-white px-4 py-2 text-right">{t("cost")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {pageItems.map((r) => (
                  <tr key={r.id} className="hover:bg-navy-25">
                    <td className="px-4 py-2.5 whitespace-nowrap text-navy-500">{formatDate(r.eventDate)}</td>
                    <td className="px-4 py-2.5 text-navy-600">{r.animalName}</td>
                    <td className="px-4 py-2.5 text-navy-500">{eventLabel(r.eventType)}</td>
                    <td className="px-4 py-2.5 text-navy-500">{r.description || "—"}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={r.status === "resolved" ? "success" : "warning"}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right text-navy-500">
                      {r.cost != null ? formatCurrency(r.cost) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={setPage}
            itemLabel={t("records_label")}
          />
        </div>
      )}
    </div>
  );
}
