// WEBSITE — herdflow-web/src/app/(farmapp)/app/finance/reports/cash-flow/page.tsx
// F4: Cash Flow Statement preview (Operating/Investing/Financing + net
// movement). Financing always reads R 0.00 -- HerdFlow doesn't yet track
// loan/owner-contribution transactions, so this is an honest gap rather
// than a fabricated figure.
import Link from "next/link";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { getCashFlowStatement } from "@/lib/farm-finance/queries";
import { resolvePeriod, PERIOD_LABELS, type Period } from "@/lib/farm-finance/periods";
import { formatCurrency } from "@/lib/farm-finance/format";
import { Card, CardHeader } from "@/components/farm/Card";
import { PeriodSelector } from "@/components/farm/PeriodSelector";
import { DownloadPdfButton } from "@/components/farm/DownloadPdfButton";

export const dynamic = "force-dynamic";

export default async function CashFlowStatementPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const user = await getFarmWebUser();
  if (!user) return null;

  const params = await searchParams;
  const { period, range } = resolvePeriod(params);
  const periodLabel = period === "custom" ? "Custom Range" : PERIOD_LABELS[period as Exclude<Period, "custom">];

  const cf = await getCashFlowStatement(user.effectiveFarmerId, range);
  const qs = new URLSearchParams(params as Record<string, string>).toString();

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-navy-600 text-2xl font-semibold">Cash Flow Statement</h1>
          <p className="text-sm text-navy-300">{periodLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector current={period} />
          <DownloadPdfButton
            href={`/app/finance/reports/cash-flow/pdf?${qs}`}
            filename={`cash-flow-statement-${period}.pdf`}
          />
        </div>
      </header>

      <div className="flex gap-2 text-sm">
        <Link href={`/app/finance/reports?${qs}`} className="rounded-lg px-3 py-1.5 text-navy-400 hover:bg-navy-25">
          Income Statement
        </Link>
        <Link href={`/app/finance/vat?${qs}`} className="rounded-lg px-3 py-1.5 text-navy-400 hover:bg-navy-25">
          VAT Summary
        </Link>
        <span className="rounded-lg bg-navy-600 px-3 py-1.5 font-semibold text-white">Cash Flow Statement</span>
      </div>

      <Card>
        <CardHeader
          title="Cash Flow Statement"
          description={`${user.farmName || "Farm"} — ${periodLabel} — Unaudited management accounts`}
        />
        <div className="divide-y divide-navy-50 p-4 text-sm">
          <Row label="Net Cash from Operating Activities" value={cf.operating} />
          <Row label="Net Cash from Investing Activities" value={cf.investing} sub="livestock and equipment purchases" />
          <Row
            label="Net Cash from Financing Activities"
            value={cf.financing}
            sub="not yet tracked by HerdFlow"
          />
          <Row label="Net Movement in Cash" value={cf.netMovement} bold border big />
        </div>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  sub,
  bold,
  border,
  big,
}: {
  label: string;
  value: number;
  sub?: string;
  bold?: boolean;
  border?: boolean;
  big?: boolean;
}) {
  return (
    <div className={`py-2 ${border ? "border-t border-navy-100 pt-2.5" : ""}`}>
      <div className="flex items-center justify-between">
        <span className={bold ? "font-semibold text-navy-600" : "text-navy-600"}>{label}</span>
        <span
          className={`${bold ? "font-semibold" : ""} ${big ? "text-lg" : ""} ${
            value < 0 ? "text-[var(--status-danger-text)]" : "text-navy-600"
          }`}
        >
          {value < 0 ? `(${formatCurrency(Math.abs(value))})` : formatCurrency(value)}
        </span>
      </div>
      {sub && <p className="text-xs text-navy-300">{sub}</p>}
    </div>
  );
}
