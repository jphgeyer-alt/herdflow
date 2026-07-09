"use client";

import { useState } from "react";

type MonthRow = { month: string; totalCents: number };
type TopSeller = { name: string; totalCents: number };

type ReportsData = {
  monthlySales: MonthRow[];
  totalRevenueCents: number;
  totalCommissionCents: number;
  livestockCommissionCents: number;
  productCommissionCents: number;
  topSellers: TopSeller[];
  livestockSold: number;
  commissionRate: number;
};

type ReportsPanelProps = {
  data: ReportsData;
};

function toCurrency(cents: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function barWidth(value: number, max: number) {
  if (max === 0) return "0%";
  return `${Math.round((value / max) * 100)}%`;
}

export function ReportsPanel({ data }: ReportsPanelProps) {
  const [exporting, setExporting] = useState(false);

  const maxMonthly = Math.max(...data.monthlySales.map((r) => r.totalCents), 1);
  const commissionPct = Math.round(data.commissionRate * 100);

  async function exportCsv() {
    setExporting(true);
    try {
      const res = await fetch("/api/admin/reports?format=csv");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `herdflow-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Revenue", value: toCurrency(data.totalRevenueCents) },
          {
            label: `Total Commission (${commissionPct}%)`,
            value: toCurrency(data.totalCommissionCents),
          },
          { label: "Product Commission", value: toCurrency(data.productCommissionCents) },
          { label: "Livestock Sold", value: String(data.livestockSold) },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm"
          >
            <p className="text-xs uppercase tracking-wide text-gray-500">{card.label}</p>
            <p className="text-brand-navy mt-1 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly bar chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-700">Sales by Month (last 12 months)</h2>
          <button
            onClick={exportCsv}
            disabled={exporting}
            className="border-brand-navy text-brand-navy hover:bg-brand-navy rounded border px-3 py-1.5 text-xs font-medium transition hover:text-white disabled:opacity-50"
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
        <div className="space-y-2">
          {data.monthlySales.map((row) => (
            <div key={row.month} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-right text-xs text-gray-500">{row.month}</span>
              <div className="h-5 flex-1 overflow-hidden rounded bg-gray-100">
                <div
                  className="bg-brand-navy/70 h-full rounded transition-all"
                  style={{ width: barWidth(row.totalCents, maxMonthly) }}
                />
              </div>
              <span className="w-28 shrink-0 text-right text-xs font-medium text-gray-700">
                {toCurrency(row.totalCents)}
              </span>
              <span className="w-24 shrink-0 text-right text-xs text-gray-400">
                {toCurrency(Math.round(row.totalCents * data.commissionRate))} comm.
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top sellers */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-700">Top Sellers by Revenue</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Seller / Farm</th>
              <th className="px-4 py-3 text-right">Revenue</th>
              <th className="px-4 py-3 text-right">Commission ({commissionPct}%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.topSellers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  No sales data yet.
                </td>
              </tr>
            )}
            {data.topSellers.map((seller, i) => (
              <tr key={seller.name} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{seller.name}</td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {toCurrency(seller.totalCents)}
                </td>
                <td className="px-4 py-3 text-right text-gray-500">
                  {toCurrency(Math.round(seller.totalCents * data.commissionRate))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
