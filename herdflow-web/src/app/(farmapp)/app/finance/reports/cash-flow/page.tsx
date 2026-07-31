// WEBSITE — herdflow-web/src/app/(farmapp)/app/finance/reports/cash-flow/page.tsx
// F4: Cash Flow Statement preview (Operating/Investing/Financing + net
// movement). Financing always reads R 0.00 -- HerdFlow doesn't yet track
// loan/owner-contribution transactions, so this is an honest gap rather
// than a fabricated figure.
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { getCashFlowStatement } from "@/lib/farm-finance/queries";
import { resolvePeriod, type Period } from "@/lib/farm-finance/periods";
import { formatCurrency } from "@/lib/farm-finance/format";
import { Card, CardHeader, Badge } from "@/components/farm/Card";
import { PeriodSelector } from "@/components/farm/PeriodSelector";
import { DownloadPdfButton } from "@/components/farm/DownloadPdfButton";

export const dynamic = "force-dynamic";

export default async function CashFlowStatementPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const t = await getTranslations("finance");
  const user = await getFarmWebUser();
  if (!user) return null;

  const params = await searchParams;
  const { period, range } = resolvePeriod(params);
  const periodLabel = period === "custom" ? t("custom_range") : t(period as Exclude<Period, "custom">);

  const cf = await getCashFlowStatement(user.effectiveFarmerId, range);
  const qs = new URLSearchParams(params as Record<string, string>).toString();

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-navy-600 text-2xl font-semibold">{t("cash_flow_statement")}</h1>
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
          {t("income_statement")}
        </Link>
        <Link href={`/app/finance/vat?${qs}`} className="rounded-lg px-3 py-1.5 text-navy-400 hover:bg-navy-25">
          {t("vat_summary")}
        </Link>
        <span className="rounded-lg bg-navy-600 px-3 py-1.5 font-semibold text-white">{t("cash_flow_statement")}</span>
      </div>

      <Card>
        <CardHeader
          title={t("cash_flow_statement")}
          description={`${user.farmName || t("farm_fallback")} — ${periodLabel} — ${t("unaudited_management_accounts")}`}
        />
        <div className="divide-y divide-navy-50 p-4 text-sm">
          <Row label={t("net_cash_operating")} value={cf.operating} />
          <Row label={t("net_cash_investing")} value={cf.investing} sub={t("net_cash_investing_note")} />
          <Row
            label={t("net_cash_financing")}
            value={cf.financing}
            sub={t("net_cash_financing_note")}
            notTrackedLabel={t("not_tracked_yet_label")}
          />
          <Row label={t("net_movement_in_cash")} value={cf.netMovement} bold border big />
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
  notTrackedLabel,
}: {
  label: string;
  value: number;
  sub?: string;
  bold?: boolean;
  border?: boolean;
  big?: boolean;
  /** This category has no data model yet (e.g. loans/owner contributions) --
   * the underlying value is always 0, which would otherwise be
   * indistinguishable from "genuinely zero activity this period". Pass a
   * label to show instead of a currency figure, so farmers don't misread
   * "unsupported" as "nothing happened". */
  notTrackedLabel?: string;
}) {
  return (
    <div className={`py-2 ${border ? "border-t border-navy-100 pt-2.5" : ""}`}>
      <div className="flex items-center justify-between">
        <span className={bold ? "font-semibold text-navy-600" : "text-navy-600"}>{label}</span>
        {notTrackedLabel ? (
          <Badge variant="neutral">{notTrackedLabel}</Badge>
        ) : (
          <span
            className={`${bold ? "font-semibold" : ""} ${big ? "text-lg" : ""} ${
              value < 0 ? "text-[var(--status-danger-text)]" : "text-navy-600"
            }`}
          >
            {value < 0 ? `(${formatCurrency(Math.abs(value))})` : formatCurrency(value)}
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-navy-300">{sub}</p>}
    </div>
  );
}
