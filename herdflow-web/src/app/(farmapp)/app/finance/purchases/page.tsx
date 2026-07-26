// WEBSITE — herdflow-web/src/app/(farmapp)/app/finance/purchases/page.tsx
// F6: split into Livestock Purchases | Equipment & Other tabs. Livestock
// purchases still come from FarmerAnimal (source/purchasePrice, recorded
// when an animal is added) -- unchanged data source, now period + YTD
// scoped. Equipment & Other reads FarmerTransaction rows in the "equipment"
// category, which now optionally carry unitCost/quantity/
// isDepreciableAsset (migration 20260726130000).
import Link from "next/link";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";
import { formatCurrency, formatDate } from "@/lib/farm-finance/format";
import { resolvePeriod, periodRange, PERIOD_LABELS, type Period } from "@/lib/farm-finance/periods";
import { Card, CardHeader } from "@/components/farm/Card";
import { PeriodSelector } from "@/components/farm/PeriodSelector";
import { EquipmentTable } from "./EquipmentTable";

export const dynamic = "force-dynamic";

type Tab = "livestock" | "equipment";

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; period?: string; from?: string; to?: string }>;
}) {
  const user = await getFarmWebUser();
  if (!user) return null;

  const params = await searchParams;
  const tab: Tab = params.tab === "equipment" ? "equipment" : "livestock";
  const { period, range } = resolvePeriod(params);
  const periodLabel = period === "custom" ? "Custom Range" : PERIOD_LABELS[period as Exclude<Period, "custom">];
  const ytdRange = periodRange("this_financial_year");
  const qs = new URLSearchParams(params as Record<string, string>);

  function tabHref(t: Tab) {
    const p = new URLSearchParams(qs);
    p.set("tab", t);
    return `/app/finance/purchases?${p.toString()}`;
  }

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-navy-600 text-2xl font-semibold">Purchases &amp; Acquisitions</h1>
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
          Livestock Purchases
        </Link>
        <Link
          href={tabHref("equipment")}
          className={`rounded-lg px-3 py-1.5 font-semibold ${
            tab === "equipment" ? "bg-navy-600 text-white" : "text-navy-400 hover:bg-navy-25"
          }`}
        >
          Equipment &amp; Other
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-semibold tracking-wide text-navy-300 uppercase">
            Total Spent — {periodLabel}
          </p>
          <p className="mt-2 text-2xl font-semibold text-navy-600">{formatCurrency(totalSpend)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold tracking-wide text-navy-300 uppercase">Purchases</p>
          <p className="mt-2 text-2xl font-semibold text-navy-600">{periodAnimals.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold tracking-wide text-navy-300 uppercase">Avg. Cost / Unit</p>
          <p className="mt-2 text-2xl font-semibold text-navy-600">{formatCurrency(avgPrice)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold tracking-wide text-navy-300 uppercase">YTD Total</p>
          <p className="mt-2 text-2xl font-semibold text-navy-600">{formatCurrency(ytdTotal)}</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Livestock Purchases" description={periodLabel} />
        {periodAnimals.length === 0 ? (
          <p className="p-6 text-center text-sm text-navy-300">
            No livestock purchases recorded this period. Animals acquired by auction, private sale,
            or transfer will show up here once recorded on the mobile app.
          </p>
        ) : (
          <div className="divide-y divide-navy-50">
            {periodAnimals.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy-600">
                    {a.tagNumber || a.name || "Unnamed"}
                  </p>
                  <p className="text-xs text-navy-300">
                    {a.source} · {a.sellerName || a.auctionHouse || a.prevFarm || "—"} ·{" "}
                    {formatDate(a.dateAcquired)}
                  </p>
                </div>
                <p className="shrink-0 font-semibold text-navy-600">
                  {formatCurrency(Number(a.purchasePrice ?? 0))}
                </p>
              </div>
            ))}
          </div>
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-semibold tracking-wide text-navy-300 uppercase">
            Total Spent — {periodLabel}
          </p>
          <p className="mt-2 text-2xl font-semibold text-navy-600">{formatCurrency(totalSpend)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold tracking-wide text-navy-300 uppercase">Purchases</p>
          <p className="mt-2 text-2xl font-semibold text-navy-600">{periodRows.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold tracking-wide text-navy-300 uppercase">Avg. Cost / Unit</p>
          <p className="mt-2 text-2xl font-semibold text-navy-600">{formatCurrency(avgUnitCost)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold tracking-wide text-navy-300 uppercase">YTD Total</p>
          <p className="mt-2 text-2xl font-semibold text-navy-600">{formatCurrency(ytdTotal)}</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Equipment & Other Purchases" description={periodLabel} />
        {periodRows.length === 0 ? (
          <p className="p-6 text-center text-sm text-navy-300">
            No equipment purchases recorded this period. Record one via "Add Transaction" with
            category "Equipment" to see it here, with unit cost, quantity and depreciation tracking.
          </p>
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
