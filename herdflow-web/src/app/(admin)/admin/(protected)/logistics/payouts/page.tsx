import { prisma } from "@/lib/prisma";
import { formatRand } from "@/lib/marketing/format";
import { getLogisticsCommissionRate } from "@/lib/marketplace/commission";
import { Card, CardHeader, StatCard } from "@/components/admin/Card";
import { TrendingUp, Truck, Calendar } from "lucide-react";
import { PayoutsTable } from "../../payouts/PayoutsTable";

export const dynamic = "force-dynamic";

export default async function LogisticsPayoutsPage() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [commissionRate, allTime, thisMonth] = await Promise.all([
    getLogisticsCommissionRate(),
    prisma.deliveryRequest.aggregate({
      where: { status: "DELIVERED" },
      _sum: { commissionCents: true },
      _count: { _all: true },
    }),
    prisma.deliveryRequest.aggregate({
      where: { status: "DELIVERED", deliveredAt: { gte: monthStart } },
      _sum: { commissionCents: true },
      _count: { _all: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader
          title="Logistics Commission"
          description={`HerdFlow earns ${Math.round(commissionRate * 100)}% commission on every completed delivery job.`}
        />
        <div className="grid gap-4 p-4 sm:grid-cols-3">
          <StatCard
            label="Commission Earned (all time)"
            value={formatRand((allTime._sum.commissionCents ?? 0) / 100)}
            icon={<TrendingUp size={18} />}
            accent="green"
            hint={`${allTime._count._all} completed deliveries`}
          />
          <StatCard
            label="Commission Earned (this month)"
            value={formatRand((thisMonth._sum.commissionCents ?? 0) / 100)}
            icon={<Calendar size={18} />}
            accent="gold"
            hint={`${thisMonth._count._all} completed deliveries`}
          />
          <StatCard
            label="Commission Rate"
            value={`${Math.round(commissionRate * 100)}%`}
            icon={<Truck size={18} />}
            accent="navy"
            hint="Editable in Payment Settings"
          />
        </div>
      </Card>

      <PayoutsTable kind="logistics" />
    </div>
  );
}
