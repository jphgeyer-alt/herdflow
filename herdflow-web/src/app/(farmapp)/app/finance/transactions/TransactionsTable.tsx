"use client";
// WEBSITE — herdflow-web/src/app/(farmapp)/app/finance/transactions/TransactionsTable.tsx
// F5: sortable desktop table with a filter bar (date range, category
// multi-select, type, VAT) and CSV export of exactly what's currently
// filtered -- everything happens client-side since the full transaction
// list is already loaded, so filtering/sorting/export need no round trip.
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronUp, ChevronDown, Download } from "lucide-react";
import { INCOME_CATS, EXPENSE_CATS, categoryLabelKey } from "@/lib/farm-finance/categories";
import { formatCurrency, formatDate } from "@/lib/farm-finance/format";

export interface TxRow {
  id: string;
  date: string;
  description: string | null;
  category: string;
  supplier: string | null;
  amount: number;
  vatAmount: number;
  invoiceNumber: string | null;
  type: "income" | "expense";
  runningBalance: number;
}

type SortKey = "date" | "description" | "category" | "supplier" | "amount" | "vatAmount" | "inclVat" | "invoiceNumber";
type TypeFilter = "all" | "income" | "expense";
type VatFilter = "all" | "vat" | "no-vat";

const ALL_CATS = [...INCOME_CATS, ...EXPENSE_CATS];

function toCsvValue(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function TransactionsTable({ rows }: { rows: TxRow[] }) {
  const t = useTranslations("finance");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categories, setCategories] = useState<Set<string>>(new Set());
  const [type, setType] = useState<TypeFilter>("all");
  const [vat, setVat] = useState<VatFilter>("all");
  const [showCatPicker, setShowCatPicker] = useState(false);
  const dateFromRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onFocusFilter() {
      dateFromRef.current?.focus();
    }
    window.addEventListener("farm-finance:focus-filter", onFocusFilter);
    return () => window.removeEventListener("farm-finance:focus-filter", onFocusFilter);
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;
      if (categories.size > 0 && !categories.has(r.category)) return false;
      if (type !== "all" && r.type !== type) return false;
      if (vat === "vat" && r.vatAmount <= 0) return false;
      if (vat === "no-vat" && r.vatAmount > 0) return false;
      return true;
    });
  }, [rows, dateFrom, dateTo, categories, type, vat]);

  const sorted = useMemo(() => {
    const withKey = (r: TxRow) => {
      switch (sortKey) {
        case "description":
          return r.description ?? "";
        case "category":
          return t(categoryLabelKey(r.category));
        case "supplier":
          return r.supplier ?? "";
        case "amount":
          return r.amount;
        case "vatAmount":
          return r.vatAmount;
        case "inclVat":
          return r.amount + r.vatAmount;
        case "invoiceNumber":
          return r.invoiceNumber ?? "";
        default:
          return r.date;
      }
    };
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = withKey(a);
      const bv = withKey(b);
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function toggleCategory(id: string) {
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exportCsv() {
    const header = [
      t("date"),
      t("description"),
      t("category"),
      t("supplier"),
      t("excl_vat"),
      t("vat"),
      t("incl_vat"),
      t("invoice_number"),
      t("type"),
      t("running_balance"),
    ];
    const lines = [header.join(",")];
    for (const r of sorted) {
      lines.push(
        [
          r.date.slice(0, 10),
          r.description ?? "",
          t(categoryLabelKey(r.category)),
          r.supplier ?? "",
          r.amount.toFixed(2),
          r.vatAmount.toFixed(2),
          (r.amount + r.vatAmount).toFixed(2),
          r.invoiceNumber ?? "",
          r.type,
          r.runningBalance.toFixed(2),
        ]
          .map(toCsvValue)
          .join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
          {active ? (
            sortDir === "asc" ? (
              <ChevronUp size={12} />
            ) : (
              <ChevronDown size={12} />
            )
          ) : null}
        </button>
      </th>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-navy-100 bg-white p-3" id="tx-filter-bar">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-navy-300 uppercase">{t("from")}</label>
          <input
            ref={dateFromRef}
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-navy-100 px-2 py-1.5 text-sm text-navy-600"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-navy-300 uppercase">{t("to")}</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-navy-100 px-2 py-1.5 text-sm text-navy-600"
          />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCatPicker((v) => !v)}
            className="rounded-lg border border-navy-100 px-3 py-1.5 text-sm text-navy-500 hover:bg-navy-25"
          >
            {t("category")} {categories.size > 0 ? `(${categories.size})` : ""}
          </button>
          {showCatPicker && (
            <div className="absolute z-10 mt-1 max-h-64 w-56 overflow-y-auto rounded-lg border border-navy-100 bg-white p-2 shadow-lg">
              {ALL_CATS.map((c) => (
                <label key={c.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-navy-25">
                  <input
                    type="checkbox"
                    checked={categories.has(c.id)}
                    onChange={() => toggleCategory(c.id)}
                    className="h-3.5 w-3.5 rounded border-navy-100"
                  />
                  {t(categoryLabelKey(c.id))}
                </label>
              ))}
            </div>
          )}
        </div>

        <select
          value={type}
          onChange={(e) => setType(e.target.value as TypeFilter)}
          className="rounded-lg border border-navy-100 px-3 py-1.5 text-sm text-navy-500"
        >
          <option value="all">{t("all_types")}</option>
          <option value="income">{t("income")}</option>
          <option value="expense">{t("expenses")}</option>
        </select>

        <select
          value={vat}
          onChange={(e) => setVat(e.target.value as VatFilter)}
          className="rounded-lg border border-navy-100 px-3 py-1.5 text-sm text-navy-500"
        >
          <option value="all">{t("vat_all")}</option>
          <option value="vat">{t("vat_only")}</option>
          <option value="no-vat">{t("no_vat")}</option>
        </select>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-navy-300">{t("shown_count", { shown: sorted.length, total: rows.length })}</span>
          <button
            type="button"
            onClick={exportCsv}
            disabled={sorted.length === 0}
            className="flex items-center gap-2 rounded-lg bg-navy-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={14} /> {t("export_csv")}
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-lg border border-navy-100 bg-white p-6 text-center text-sm text-navy-300">
          {rows.length === 0 ? t("no_transactions_yet") : t("no_transactions_filtered_csv")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-navy-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-50 text-xs font-semibold tracking-wide text-navy-300 uppercase">
                <SortHeader label={t("date")} sortKeyId="date" />
                <SortHeader label={t("description")} sortKeyId="description" />
                <SortHeader label={t("category")} sortKeyId="category" />
                <SortHeader label={t("supplier")} sortKeyId="supplier" />
                <SortHeader label={t("excl_vat")} sortKeyId="amount" right />
                <SortHeader label={t("vat")} sortKeyId="vatAmount" right />
                <SortHeader label={t("incl_vat")} sortKeyId="inclVat" right />
                <SortHeader label={t("invoice_number")} sortKeyId="invoiceNumber" />
                <th className="px-4 py-2 text-left">{t("status")}</th>
                <th className="px-4 py-2 text-right">{t("balance")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {sorted.map((tx) => (
                <tr key={tx.id} className="hover:bg-navy-25">
                  <td className="px-4 py-2.5 whitespace-nowrap text-navy-500">{formatDate(tx.date)}</td>
                  <td className="px-4 py-2.5 text-navy-600">{tx.description || "—"}</td>
                  <td className="px-4 py-2.5 text-navy-500">{t(categoryLabelKey(tx.category))}</td>
                  <td className="px-4 py-2.5 text-navy-500">{tx.supplier || "—"}</td>
                  <td className="px-4 py-2.5 text-right text-navy-500">{formatCurrency(tx.amount)}</td>
                  <td className="px-4 py-2.5 text-right text-navy-500">{formatCurrency(tx.vatAmount)}</td>
                  <td
                    className={`px-4 py-2.5 text-right font-semibold ${
                      tx.type === "income" ? "text-[var(--status-success-text)]" : "text-[var(--status-danger-text)]"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"} {formatCurrency(tx.amount + tx.vatAmount)}
                  </td>
                  <td className="px-4 py-2.5 text-navy-500">{tx.invoiceNumber || "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className="rounded-full bg-[var(--status-success-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--status-success-text)]">
                      {t("recorded")}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium text-navy-600">
                    {formatCurrency(tx.runningBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
