"use client";
// WEBSITE — herdflow-web/src/app/(farmapp)/app/health/medicines/MedicinesTable.tsx
// Search + category filter + pagination, mirroring HerdListTable's pattern.
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Pill } from "lucide-react";
import { Badge } from "@/components/farm/Card";
import { Pagination } from "@/components/farm/Pagination";
import { EmptyState } from "@/components/farm/EmptyState";

const PAGE_SIZE = 20;

export interface MedicineRow {
  id: string;
  name: string;
  category: string;
  quantityInStock: number;
  reorderLevel: number | null;
  dosageUnit: string | null;
}

export function MedicinesTable({ medicines }: { medicines: MedicineRow[] }) {
  const t = useTranslations("health");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);

  const categoryOptions = useMemo(
    () => Array.from(new Set(medicines.map((m) => m.category))).sort(),
    [medicines],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return medicines.filter((m) => {
      if (category !== "all" && m.category !== category) return false;
      if (!q) return true;
      return m.name.toLowerCase().includes(q);
    });
  }, [medicines, search, category]);

  // Reset to page 1 whenever the filters change -- adjusting state during
  // render rather than in a useEffect (React's documented pattern for this).
  const [prevFilterKey, setPrevFilterKey] = useState(`${search}|${category}`);
  const filterKey = `${search}|${category}`;
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
          placeholder={t("medicine_search_placeholder")}
          className="min-w-[220px] flex-1 rounded-lg border border-navy-100 px-3 py-1.5 text-sm text-navy-600"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-navy-100 px-3 py-1.5 text-sm text-navy-500"
        >
          <option value="all">{t("all_categories")}</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-navy-100 bg-white">
          {medicines.length === 0 ? (
            <EmptyState
              icon={<Pill size={20} />}
              title={t("no_medicines_yet")}
              message={t("no_medicines_yet_message")}
              ctaLabel={t("add_medicine")}
              ctaHref="/app/health/medicines/new"
            />
          ) : (
            <EmptyState
              icon={<Pill size={20} />}
              title={t("no_medicines_filtered")}
              message={t("no_medicines_filtered_hint")}
            />
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-navy-100 bg-white">
          <div className="max-h-[65vh] overflow-y-auto overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-50 text-xs font-semibold tracking-wide text-navy-300 uppercase">
                  <th className="sticky top-0 z-10 bg-white px-4 py-2 text-left">{t("medicine_name")}</th>
                  <th className="sticky top-0 z-10 bg-white px-4 py-2 text-left">{t("category")}</th>
                  <th className="sticky top-0 z-10 bg-white px-4 py-2 text-right">{t("quantity_in_stock")}</th>
                  <th className="sticky top-0 z-10 bg-white px-4 py-2 text-left">{t("dosage_unit")}</th>
                  <th className="sticky top-0 z-10 bg-white px-4 py-2 text-left">{t("status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {pageItems.map((m) => {
                  const isLow = m.reorderLevel != null && m.quantityInStock <= m.reorderLevel;
                  return (
                    <tr key={m.id} className="hover:bg-navy-25">
                      <td className="px-4 py-2.5 font-medium text-navy-600">{m.name}</td>
                      <td className="px-4 py-2.5 text-navy-500">{m.category}</td>
                      <td className="px-4 py-2.5 text-right text-navy-500">{m.quantityInStock}</td>
                      <td className="px-4 py-2.5 text-navy-500">{m.dosageUnit || "—"}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={isLow ? "danger" : "success"}>{isLow ? t("low_stock") : t("in_stock")}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={setPage}
            itemLabel={t("medicines_label")}
          />
        </div>
      )}
    </div>
  );
}
