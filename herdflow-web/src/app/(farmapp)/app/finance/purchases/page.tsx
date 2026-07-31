// WEBSITE — herdflow-web/src/app/(farmapp)/app/finance/purchases/page.tsx
// F6: split into Livestock Purchases | Equipment & Other tabs. Livestock
// purchases still come from FarmerAnimal (source/purchasePrice, recorded
// when an animal is added) -- unchanged data source, now period + YTD
// scoped. Equipment & Other reads FarmerTransaction rows in the "equipment"
// category, which now optionally carry unitCost/quantity/
// isDepreciableAsset (migration 20260726130000).
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Wallet, ShoppingBag, Calculator, CalendarRange } from "lucide-react";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";
import { formatCurrency } from "@/lib/farm-finance/format";
import { resolvePeriod, periodRange, type Period } from "@/lib/farm-finance/periods";
import { Card, CardHeader, StatCard } from "@/components/farm/Card";
import { EmptyState } from "@/components/farm/EmptyState";
import { PeriodSelector } from "@/components/farm/PeriodSelector";
import { EquipmentTable } from "./EquipmentTable";
import { LivestockTable } from "./LivestockTable";

export const dynamic = "force-dynamic";

type Tab = "livestock" | "equipment";

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; period?: string; from?: string; to?: string }>;
}) {
  const t = await getTranslations("finance");
  const user = await getFarmWebUser();
  if (!user) return null;

  const params = await searchParams;
  const tab: Tab = params.tab === "equipment" ? "equipment" : "livestock";
  const { period, range } = resolvePeriod(params);
  const periodLabel = period === "custom" ? t("custom_range") : t(period as Exclude<Period, "custom">);
  const ytdRange = periodRange("this_financial_year");
  const qs = new URLSearchParams(params as Record<string, string>);

  function tabHref(tabId: Tab) {
    const p = new URLSearchParams(qs);
    p.set("tab", tabId);
    return `/app/finance/purchases?${p.toString()}`;
  }

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-navy-600 text-2xl font-semibold">{t("purchases_acquisitions")}</h1>
          <p className="text-sm text-navy-300">{periodLabel}</p>
        </div>
        <PeriodSelector current={period} />
      </header>

      <div className="flex gap-2 text-sm">
        <Link
          href={tabHref("livestock")}
          className={`rounded-lg px-3 py-1.5 font-semibold ${
            tab === "livestock" ? "bg-navy-600 text-white" : "text-navy-400 hover:bg-navy-25"
          }`}
        >
          {t("livestock_purchases_tab")}
        </Link>
        <Link
          href={tabHref("equipment")}
          className={`rounded-lg px-3 py-1.5 font-semibold ${
            tab === "equipment" ? "bg-navy-600 text-white" : "text-navy-400 hover:bg-navy-25"
          }`}
        >
          {t("equipment_other_tab")}
        </Link>
      </div>

      {tab === "livestock" ? (
        <LivestockTab
          farmerId={user.effectiveFarmerId}
          range={range}
          ytdRange={ytdRange}
          periodLabel={periodLabel}
        />
      ) : (
        <EquipmentTab
          farmerId={user.effectiveFarmerId}
          range={range}
          ytdRange={ytdRange}
          periodLabel={periodLabel}
        />
      )}
    </div>
  );
}

async function LivestockTab({
  farmerId,
  range,
  ytdRange,
  periodLabel,
}: {
  farmerId: string;
  range: { start: Date; end: Date };
  ytdRange: { start: Date; end: Date };
  periodLabel: string;
}) {
  const t = await getTranslations("finance");
  const [periodAnimals, ytdAnimals] = await Promise.all([
    withFarmerContext(farmerId, (tx) =>
      tx.farmerAnimal.findMany({
        where: {
          farmerId,
          source: { not: null, notIn: ["born"] },
          purchasePrice: { not: null },
          dateAcquired: { gte: range.start, lte: range.end },
        },
        orderBy: { dateAcquired: "desc" },
      }),
    ),
    withFarmerContext(farmerId, (tx) =>
      tx.farmerAnimal.aggregate({
        where: {
          farmerId,
          source: { not: null, notIn: ["born"] },
          purchasePrice: { not: null },
          dateAcquired: { gte: ytdRange.start, lte: ytdRange.end },
        },
        _sum: { purchasePrice: true },
      }),
    ),
  ]);

  const totalSpend = periodAnimals.reduce((sum, a) => sum + Number(a.purchasePrice ?? 0), 0);
  const avgPrice = periodAnimals.length ? totalSpend / periodAnimals.length : 0;
  const ytdTotal = Number(ytdAnimals._sum.purchasePrice ?? 0);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("total_spent_period", { period: periodLabel })}
          value={formatCurrency(totalSpend)}
          icon={<Wallet size={18} />}
        />
        <StatCard label={t("purchases")} value={periodAnimals.length} icon={<ShoppingBag size={18} />} />
        <StatCard label={t("avg_cost_unit")} value={formatCurrency(avgPrice)} icon={<Calculator size={18} />} />
        <StatCard label={t("ytd_total")} value={formatCurrency(ytdTotal)} icon={<CalendarRange size={18} />} />
      </div>

      <Card>
        <CardHeader title={t("livestock_purchases_tab")} description={periodLabel} />
        {periodAnimals.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={20} />}
            title={t("no_livestock_purchases_title")}
            message={t("no_livestock_purchases_period")}
            ctaLabel={t("add_animal_cta")}
            ctaHref="/app/herd/new"
          />
        ) : (
          <LivestockTable
            rows={periodAnimals.map((a) => ({
              id: a.id,
              label: a.tagNumber || a.name || t("unnamed"),
              source: a.source,
              counterparty: a.sellerName || a.auctionHouse || a.prevFarm || null,
              dateAcquired: a.dateAcquired ? a.dateAcquired.toISOString() : null,
              purchasePrice: Number(a.purchasePrice ?? 0),
            }))}
          />
        )}
      </Card>
    </>
  );
}

async function EquipmentTab({
  farmerId,
  range,
  ytdRange,
  periodLabel,
}: {
  farmerId: string;
  range: { start: Date; end: Date };
  ytdRange: { start: Date; end: Date };
  periodLabel: string;
}) {
  const t = await getTranslations("finance");
  const where = {
    farmerId,
    isDeleted: false,
    type: "expense",
    category: "equipment",
  } as const;

  const [periodRows, ytdAgg] = await Promise.all([
    withFarmerContext(farmerId, (tx) =>
      tx.farmerTransaction.findMany({
        where: { ...where, date: { gte: range.start, lte: range.end } },
        orderBy: { date: "desc" },
      }),
    ),
    withFarmerContext(farmerId, (tx) =>
      tx.farmerTransaction.aggregate({
        where: { ...where, date: { gte: ytdRange.start, lte: ytdRange.end } },
        _sum: { amount: true },
      }),
    ),
  ]);

  const totalSpend = periodRows.reduce((sum, r) => sum + Number(r.amount), 0);
  const unitCosts = periodRows.filter((r) => r.unitCost != null).map((r) => Number(r.unitCost));
  const avgUnitCost = unitCosts.length
    ? unitCosts.reduce((s, v) => s + v, 0) / unitCosts.length
    : periodRows.length
      ? totalSpend / periodRows.length
      : 0;
  const ytdTotal = Number(ytdAgg._sum.amount ?? 0);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("total_spent_period", { period: periodLabel })}
          value={formatCurrency(totalSpend)}
          icon={<Wallet size={18} />}
        />
        <StatCard label={t("purchases")} value={periodRows.length} icon={<ShoppingBag size={18} />} />
        <StatCard label={t("avg_cost_unit")} value={formatCurrency(avgUnitCost)} icon={<Calculator size={18} />} />
        <StatCard label={t("ytd_total")} value={formatCurrency(ytdTotal)} icon={<CalendarRange size={18} />} />
      </div>

      <Card>
        <CardHeader title={t("equipment_other_purchases_title")} description={periodLabel} />
        {periodRows.length === 0 ? (
          <EmptyState
            icon={<Wallet size={20} />}
            title={t("no_equipment_purchases_title")}
            message={t("no_equipment_purchases_period")}
            ctaLabel={t("add_transaction")}
            ctaHref="/app/finance/transactions/new"
          />
        ) : (
          <EquipmentTable
            rows={periodRows.map((r) => ({
              id: r.id,
              date: r.date.toISOString(),
              supplier: r.supplier,
              description: r.description,
              unitCost: r.unitCost != null ? Number(r.unitCost) : null,
              quantity: r.quantity,
              vatAmount: Number(r.vatAmount),
              amount: Number(r.amount),
              invoiceNumber: r.invoiceNumber,
              isDepreciableAsset: r.isDepreciableAsset,
            }))}
          />
        )}
      </Card>
    </>
  );
}
