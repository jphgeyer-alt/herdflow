"use client";
// WEBSITE — herdflow-web/src/app/(farmapp)/app/finance/purchases/LivestockTable.tsx
// Click-to-sort column headers, same pattern as EquipmentTable so both tabs
// on this page behave identically (Equipment has no search/filter bar
// either -- sort is the full capability level being matched here).
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronUp, ChevronDown } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/farm-finance/format";

export interface LivestockPurchaseRow {
  id: string;
  label: string;
  source: string | null;
  counterparty: string | null;
  dateAcquired: string | null;
  purchasePrice: number;
}

type SortKey = "label" | "source" | "counterparty" | "dateAcquired" | "purchasePrice";

function SortHeader({
  label,
  sortKeyId,
  right,
  sortKey,
  sortDir,
  onToggle,
}: {
  label: string;
  sortKeyId: SortKey;
  right?: boolean;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onToggle: (key: SortKey) => void;
}) {
  const active = sortKey === sortKeyId;
  return (
    <th className={`sticky top-0 z-10 bg-white px-4 py-2 ${right ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={() => onToggle(sortKeyId)}
        className={`inline-flex items-center gap-1 hover:text-navy-600 ${active ? "text-navy-600" : ""}`}
      >
        {label}
        {active ? sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} /> : null}
      </button>
    </th>
  );
}

export function LivestockTable({ rows }: { rows: LivestockPurchaseRow[] }) {
  const t = useTranslations("finance");
  const [sortKey, setSortKey] = useState<SortKey>("dateAcquired");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const withKey = (r: LivestockPurchaseRow) => {
      switch (sortKey) {
        case "label":
          return r.label;
        case "source":
          return r.source ?? "";
        case "counterparty":
          return r.counterparty ?? "";
        case "purchasePrice":
          return r.purchasePrice;
        default:
          return r.dateAcquired ?? "";
      }
    };
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = withKey(a);
      const bv = withKey(b);
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <div className="max-h-[65vh] overflow-y-auto overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-navy-50 text-xs font-semibold tracking-wide text-navy-300 uppercase">
            <SortHeader label={t("asset")} sortKeyId="label" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
            <SortHeader label={t("source")} sortKeyId="source" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
            <SortHeader
              label={t("supplier")}
              sortKeyId="counterparty"
              sortKey={sortKey}
              sortDir={sortDir}
              onToggle={toggleSort}
            />
            <SortHeader
              label={t("date")}
              sortKeyId="dateAcquired"
              sortKey={sortKey}
              sortDir={sortDir}
              onToggle={toggleSort}
            />
            <SortHeader
              label={t("total_cost")}
              sortKeyId="purchasePrice"
              right
              sortKey={sortKey}
              sortDir={sortDir}
              onToggle={toggleSort}
            />
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-50">
          {sorted.map((r) => (
            <tr key={r.id} className="hover:bg-navy-25">
              <td className="px-4 py-2.5 font-medium text-navy-600">{r.label}</td>
              <td className="px-4 py-2.5 text-navy-500">{r.source || "—"}</td>
              <td className="px-4 py-2.5 text-navy-500">{r.counterparty || "—"}</td>
              <td className="px-4 py-2.5 whitespace-nowrap text-navy-500">{formatDate(r.dateAcquired)}</td>
              <td className="px-4 py-2.5 text-right font-semibold text-navy-600">
                {formatCurrency(r.purchasePrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
