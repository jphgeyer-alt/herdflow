// WEBSITE — herdflow-web/src/app/(farmapp)/app/finance/vat/page.tsx
// VAT201-preparation summary -- field numbers match SARS's actual VAT201
// return layout so a tax practitioner can map these straight across.
import Link from "next/link";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { getFinanceTotals } from "@/lib/farm-finance/queries";
import { resolvePeriod, PERIOD_LABELS, type Period } from "@/lib/farm-finance/periods";
import { formatCurrency } from "@/lib/farm-finance/format";
import { Card, CardHeader } from "@/components/farm/Card";
import { PeriodSelector } from "@/components/farm/PeriodSelector";
import { DownloadPdfButton } from "@/components/farm/DownloadPdfButton";

export const dynamic = "force-dynamic";

export default async function VatSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const user = await getFarmWebUser();
  if (!user) return null;

  const params = await searchParams;
  const { period, range } = resolvePeriod(params);
  const periodLabel = period === "custom" ? "Custom Range" : PERIOD_LABELS[period as Exclude<Period, "custom">];

  const totals = await getFinanceTotals(user.effectiveFarmerId, range);
  const owing = totals.vatOwing;
  const qs = new URLSearchParams(params as Record<string, string>).toString();

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-navy-600 text-2xl font-semibold">VAT Summary</h1>
          <p className="text-sm text-navy-300">VAT201 preparation — {periodLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector current={period} />
          <DownloadPdfButton href={`/app/finance/vat/pdf?${qs}`} filename={`vat-report-${period}.pdf`} />
        </div>
      </header>

      <div className="flex gap-2 text-sm">
        <Link href={`/app/finance/reports?${qs}`} className="rounded-lg px-3 py-1.5 text-navy-400 hover:bg-navy-25">
          Income Statement
        </Link>
        <span className="rounded-lg bg-navy-600 px-3 py-1.5 font-semibold text-white">VAT Summary</span>
        <Link
          href={`/app/finance/reports/cash-flow?${qs}`}
          className="rounded-lg px-3 py-1.5 text-navy-400 hover:bg-navy-25"
        >
          Cash Flow Statement
        </Link>
      </div>

      <Card>
        <CardHeader title="VAT201 Field Summary" description={`${user.farmName || "Farm"} — ${periodLabel}`} />
        <div className="divide-y divide-navy-50 p-4 text-sm">
          <VatRow field="Field 1" label="Total Sales (Output Tax)" value={totals.income} />
          <VatRow field="Field 4A" label="Total VAT on Sales" value={totals.vatCollected} bold />
          <VatRow field="Field 14" label="Total Purchases (Input Tax)" value={totals.expenses} />
          <VatRow field="Field 15" label="Total VAT on Purchases" value={totals.vatPaid} bold />
          <div className="flex items-center justify-between border-t border-navy-100 pt-3">
            <span className="font-semibold text-navy-600">
              Field 19 — {owing >= 0 ? "VAT Payable" : "VAT Refundable"}
            </span>
            <span
              className={`text-lg font-semibold ${
                owing >= 0 ? "text-[var(--status-warning-text)]" : "text-[var(--status-success-text)]"
              }`}
            >
              {formatCurrency(Math.abs(owing))}
            </span>
          </div>
        </div>
      </Card>

      <div className="rounded-lg border border-[var(--status-warning-bg)] bg-[var(--status-warning-bg)] p-4 text-sm text-[var(--status-warning-text)]">
        This is a management summary only. Verify with your registered tax practitioner before
        submission to SARS.
      </div>
    </div>
  );
}

function VatRow({
  field,
  label,
  value,
  bold,
}: {
  field: string;
  label: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-navy-500">
        <span className="mr-2 rounded bg-navy-25 px-1.5 py-0.5 text-xs font-semibold text-navy-600">
          {field}
        </span>
        {label}
      </span>
      <span className={`text-navy-600 ${bold ? "font-semibold" : ""}`}>{formatCurrency(value)}</span>
    </div>
  );
}
