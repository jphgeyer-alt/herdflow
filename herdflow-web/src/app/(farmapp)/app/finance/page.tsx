// WEBSITE — herdflow-web/src/app/(farmapp)/app/finance/page.tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, Receipt, Target, ArrowRight } from "lucide-react";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { getFinanceTotals, getMonthlyCashFlow } from "@/lib/farm-finance/queries";
import { resolvePeriod, trendLabel, type Period } from "@/lib/farm-finance/periods";
import { formatCurrency, formatDate } from "@/lib/farm-finance/format";
import { withFarmerContext } from "@/lib/tenant-prisma";
import { categoryLabelKey } from "@/lib/farm-finance/categories";
import { Card, CardHeader, StatCard } from "@/components/farm/Card";
import { PeriodSelector } from "@/components/farm/PeriodSelector";
import { CashFlowChart } from "@/components/farm/charts/CashFlowChart";

export const dynamic = "force-dynamic";

export default async function FinanceDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const t = await getTranslations("finance");
  const user = await getFarmWebUser();
  if (!user) return null; // layout already redirects; satisfies the type checker

  const params = await searchParams;
  const { period, range, previousRange } = resolvePeriod(params);

  const [totals, previousTotals, cashFlow, recentTx] = await Promise.all([
    getFinanceTotals(user.effectiveFarmerId, range),
    getFinanceTotals(user.effectiveFarmerId, previousRange),
    getMonthlyCashFlow(user.effectiveFarmerId),
    withFarmerContext(user.effectiveFarmerId, (tx) =>
      tx.farmerTransaction.findMany({
        where: { farmerId: user.effectiveFarmerId, isDeleted: false },
        orderBy: { date: "desc" },
        take: 6,
      }),
    ),
  ]);

  const incomeTrend = trendLabel(totals.income, previousTotals.income);
  const expenseTrend = trendLabel(totals.expenses, previousTotals.expenses);
  const netProfitTrend = trendLabel(totals.netProfit, previousTotals.netProfit);
  const vatOwingTrend = trendLabel(totals.vatOwing, previousTotals.vatOwing);

  const periodLabel = period === "custom" ? t("custom_range") : t(period as Exclude<Period, "custom">);

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-navy-600 text-2xl font-semibold">{t("dashboard_title")}</h1>
          <p className="text-sm text-navy-300">{t("income_expenses_vat_position", { period: periodLabel })}</p>
        </div>
        <PeriodSelector current={period} />
      </header>

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label={t("total_income")}
          value={formatCurrency(totals.income)}
          icon={<ArrowUpCircle size={18} />}
          tone="success"
          trend={incomeTrend}
        />
        <StatCard
          label={t("total_expenses")}
          value={formatCurrency(totals.expenses)}
          icon={<ArrowDownCircle size={18} />}
          tone="danger"
          trend={expenseTrend}
        />
        <StatCard
          label={totals.netProfit >= 0 ? t("net_profit") : t("net_loss")}
          value={formatCurrency(totals.netProfit)}
          icon={<TrendingUp size={18} />}
          tone={totals.netProfit >= 0 ? "success" : "danger"}
          trend={netProfitTrend}
        />
        <StatCard
          label={t("vat_collected")}
          value={formatCurrency(totals.vatCollected)}
          icon={<Receipt size={18} />}
          tone="info"
          hint={t("output_tax_hint")}
        />
        <StatCard
          label={t("vat_paid")}
          value={formatCurrency(totals.vatPaid)}
          icon={<Receipt size={18} />}
          tone="info"
          hint={t("input_tax_hint")}
        />
        <StatCard
          label={totals.vatOwing >= 0 ? t("vat_owing") : t("vat_refundable")}
          value={formatCurrency(Math.abs(totals.vatOwing))}
          icon={<Receipt size={18} />}
          tone={totals.vatOwing >= 0 ? "warning" : "success"}
          trend={vatOwingTrend}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cash flow chart */}
        <Card className="lg:col-span-2">
          <CardHeader title={t("monthly_cash_flow")} description={t("last_6_months_zar")} />
          <div className="p-4">
            {cashFlow.every((m) => m.income === 0 && m.expense === 0) ? (
              <p className="py-16 text-center text-sm text-navy-300">
                {t("record_transactions_for_chart")}
              </p>
            ) : (
              <CashFlowChart data={cashFlow} />
            )}
          </div>
        </Card>

        {/* Budget vs Actual placeholder -- no budget data model exists yet */}
        <Card>
          <CardHeader title={t("budget_vs_actual")} />
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="rounded-full bg-navy-25 p-3 text-navy-600">
              <Target size={22} />
            </div>
            <p className="text-sm text-navy-500">{t("no_budget_set_message")}</p>
            <button
              type="button"
              disabled
              title={t("budget_future_update_tooltip")}
              className="mt-1 rounded-lg border border-navy-100 px-4 py-2 text-sm font-semibold text-navy-300"
            >
              {t("set_budget")}
            </button>
          </div>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader
          title={t("recent_transactions")}
          action={
            <Link
              href="/app/finance/transactions"
              className="flex items-center gap-1 text-sm font-semibold text-navy-600 hover:underline"
            >
              {t("view_all")} <ArrowRight size={14} />
            </Link>
          }
        />
        {recentTx.length === 0 ? (
          <p className="p-6 text-center text-sm text-navy-300">{t("no_transactions_yet")}</p>
        ) : (
          <div className="divide-y divide-navy-50">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy-600">
                    {tx.description || t(categoryLabelKey(tx.category))}
                  </p>
                  <p className="text-xs text-navy-300">{formatDate(tx.date)}</p>
                </div>
                <p
                  className={`shrink-0 text-sm font-semibold ${
                    tx.type === "income"
                      ? "text-[var(--status-success-text)]"
                      : "text-[var(--status-danger-text)]"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"} {formatCurrency(Number(tx.amount))}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
