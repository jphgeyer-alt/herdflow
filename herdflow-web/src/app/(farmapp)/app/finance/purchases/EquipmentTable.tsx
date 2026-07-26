"use client";
// WEBSITE — herdflow-web/src/app/(farmapp)/app/finance/purchases/EquipmentTable.tsx
// F8: click-to-sort column headers, same pattern as TransactionsTable so
// every data grid in the finance section behaves identically.
import { useMemo, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/farm-finance/format";
import { Badge } from "@/components/farm/Card";

export interface EquipmentRow {
  id: string;
  date: string;
  supplier: string | null;
  description: string | null;
  unitCost: number | null;
  quantity: number | null;
  vatAmount: number;
  amount: number;
  invoiceNumber: string | null;
  isDepreciableAsset: boolean;
}

type SortKey = "date" | "supplier" | "description" | "unitCost" | "quantity" | "vatAmount" | "amount" | "invoiceNumber";

export function EquipmentTable({ rows }: { rows: EquipmentRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const withKey = (r: EquipmentRow) => {
      switch (sortKey) {
        case "supplier":
          return r.supplier ?? "";
        case "description":
          return r.description ?? "";
        case "unitCost":
          return r.unitCost ?? 0;
        case "quantity":
          return r.quantity ?? 0;
        case "vatAmount":
          return r.vatAmount;
        case "amount":
          return r.amount;
        case "invoiceNumber":
          return r.invoiceNumber ?? "";
        default:
          return r.date;
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

  function SortHeader({ label, sortKeyId, right }: { label: string; sortKeyId: SortKey; right?: boolean }) {
    const active = sortKey === sortKeyId;
    return (
      <th className={`px-4 py-2 ${right ? "text-right" : "text-left"}`}>
        <button
          type="button"
          onClick={() => toggleSort(sortKeyId)}
          className={`inline-flex items-center gap-1 hover:text-navy-600 ${active ? "text-navy-600" : ""}`}
        >
          {label}
          {active ? sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} /> : null}
        </button>
      </th>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-navy-50 text-xs font-semibold tracking-wide text-navy-300 uppercase">
            <SortHeader label="Date" sortKeyId="date" />
            <SortHeader label="Supplier" sortKeyId="supplier" />
            <SortHeader label="Description" sortKeyId="description" />
            <SortHeader label="Unit Cost" sortKeyId="unitCost" right />
            <SortHeader label="Qty" sortKeyId="quantity" right />
            <SortHeader label="VAT" sortKeyId="vatAmount" right />
            <SortHeader label="Total Cost" sortKeyId="amount" right />
            <SortHeader label="Invoice #" sortKeyId="invoiceNumber" />
            <th className="px-4 py-2 text-left">Asset</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-50">
          {sorted.map((r) => (
            <tr key={r.id} className="hover:bg-navy-25">
              <td className="px-4 py-2.5 whitespace-nowrap text-navy-500">{formatDate(r.date)}</td>
              <td className="px-4 py-2.5 text-navy-500">{r.supplier || "—"}</td>
              <td className="px-4 py-2.5 text-navy-600">{r.description || "—"}</td>
              <td className="px-4 py-2.5 text-right text-navy-500">
                {r.unitCost != null ? formatCurrency(r.unitCost) : "—"}
              </td>
              <td className="px-4 py-2.5 text-right text-navy-500">{r.quantity ?? "—"}</td>
              <td className="px-4 py-2.5 text-right text-navy-500">{formatCurrency(r.vatAmount)}</td>
              <td className="px-4 py-2.5 text-right font-semibold text-navy-600">{formatCurrency(r.amount)}</td>
              <td className="px-4 py-2.5 text-navy-500">{r.invoiceNumber || "—"}</td>
              <td className="px-4 py-2.5">
                {r.isDepreciableAsset ? <Badge variant="info">Depreciable</Badge> : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
