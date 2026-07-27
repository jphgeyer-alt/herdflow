// WEBSITE — herdflow-web/src/app/(farmapp)/app/finance/reports/page.tsx
// On-screen Income Statement preview for the selected period, matching the
// structure of the downloadable PDF (see reports/pdf/route.ts).
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";
import { resolvePeriod, type Period } from "@/lib/farm-finance/periods";
import { formatCurrency, formatDateTime } from "@/lib/farm-finance/format";
import { categoryLabelKey } from "@/lib/farm-finance/categories";
import { Card, CardHeader } from "@/components/farm/Card";
import { PeriodSelector } from "@/components/farm/PeriodSelector";
import { DownloadPdfButton } from "@/components/farm/DownloadPdfButton";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
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

  const rows = await withFarmerContext(user.effectiveFarmerId, (tx) =>
    tx.farmerTransaction.findMany({
      where: {
        farmerId: user.effectiveFarmerId,
        isDeleted: false,
        date: { gte: range.start, lte: range.end },
      },
    }),
  );

  const grossIncome = rows.filter((r) => r.type === "income").reduce((s, r) => s + Number(r.amount), 0);
  const costOfSales = rows
    .filter((r) => r.type === "expense" && r.category === "livestock_purchase")
    .reduce((s, r) => s + Number(r.amount), 0);
  const grossProfit = grossIncome - costOfSales;

  const opExByCategory = new Map<string, number>();
  for (const r of rows) {
    if (r.type !== "expense" || r.category === "livestock_purchase") continue;
    opExByCategory.set(r.category, (opExByCategory.get(r.category) ?? 0) + Number(r.amount));
  }
  const totalOpEx = [...opExByCategory.values()].reduce((s, v) => s + v, 0);
  const netProfit = grossProfit - totalOpEx;
  const qs = new URLSearchParams(params as Record<string, string>).toString();

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-navy-600 text-2xl font-semibold">{t("reports_title")}</h1>
          <p className="text-sm text-navy-300">{t("income_statement_pl_period", { period: periodLabel })}</p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector current={period} />
          <DownloadPdfButton
            href={`/app/finance/reports/pdf?${qs}`}
            filename={`income-statement-${period}.pdf`}
          />
        </div>
      </header>

      <div className="flex gap-2 text-sm">
        <span className="rounded-lg bg-navy-600 px-3 py-1.5 font-semibold text-white">{t("income_statement")}</span>
        <Link href={`/app/finance/vat?${qs}`} className="rounded-lg px-3 py-1.5 text-navy-400 hover:bg-navy-25">
          {t("vat_summary")}
        </Link>
        <Link
          href={`/app/finance/reports/cash-flow?${qs}`}
          className="rounded-lg px-3 py-1.5 text-navy-400 hover:bg-navy-25"
        >
          {t("cash_flow_statement")}
        </Link>
      </div>

      <Card>
        <CardHeader
          title={t("income_statement")}
          description={`${user.farmName || t("farm_fallback")} — ${periodLabel} — ${t("unaudited_management_accounts")}`}
        />
        <div className="divide-y divide-navy-50 p-4 text-sm">
          <Row label={t("gross_income")} value={grossIncome} bold />
          <Row label={t("cost_of_sales")} value={-costOfSales} indent />
          <Row label={t("gross_profit")} value={grossProfit} bold border />

          <div className="pt-3 pb-1 text-xs font-bold tracking-wide text-navy-300 uppercase">
            {t("operating_expenses")}
          </div>
          {opExByCategory.size === 0 ? (
            <p className="py-2 text-navy-300">{t("no_operating_expenses")}</p>
          ) : (
            [...opExByCategory.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => <Row key={cat} label={t(categoryLabelKey(cat))} value={-amt} indent />)
          )}
          <Row label={t("total_operating_expenses")} value={-totalOpEx} bold />

          <Row label={netProfit >= 0 ? t("net_profit") : t("net_loss")} value={netProfit} bold border big />
        </div>
      </Card>
      <p className="text-xs text-navy-300">
        {t("prepared_footer", { date: formatDateTime(new Date()) })}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  indent,
  border,
  big,
}: {
  label: string;
  value: number;
  bold?: boolean;
  indent?: boolean;
  border?: boolean;
  big?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2 ${indent ? "pl-4 text-navy-500" : "text-navy-600"} ${
        border ? "border-t border-navy-100 pt-2.5" : ""
      }`}
    >
      <span className={bold ? "font-semibold" : ""}>{label}</span>
      <span
        className={`${bold ? "font-semibold" : ""} ${big ? "text-lg" : ""} ${
          value < 0 ? "text-[var(--status-danger-text)]" : "text-navy-600"
        }`}
      >
        {value < 0 ? `(${formatCurrency(Math.abs(value))})` : formatCurrency(value)}
      </span>
    </div>
  );
}
