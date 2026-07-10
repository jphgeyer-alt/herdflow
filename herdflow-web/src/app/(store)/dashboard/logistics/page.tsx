import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Truck, DollarSign, MapPin, Wallet, Clock, Eye, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getUserIdFromSession, USER_SESSION_COOKIE } from "@/lib/user-auth";
import { formatRand } from "@/lib/marketing/format";
import { withLogisticsContext } from "@/lib/tenant-prisma";

export const dynamic = "force-dynamic";

export default async function LogisticsDashboard() {
  const jar = await cookies();
  const sessionValue = jar.get(USER_SESSION_COOKIE)?.value;
  const userId = await getUserIdFromSession(sessionValue);

  if (!userId) {
    redirect("/auth/login");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let user: any = null;
  try {
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: { logisticsProfile: true },
    });
  } catch {
    redirect("/register/logistics");
  }

  if (!user?.logisticsProfile) {
    redirect("/register/logistics");
  }

  const partnerId = user.logisticsProfile.id as string;

  type Job = Awaited<ReturnType<typeof prisma.deliveryRequest.findMany>>[number];
  let assignedJobs: Job[] = [];
  let inTransitJobs: Job[] = [];
  let deliveredJobs: Job[] = [];

  try {
    [assignedJobs, inTransitJobs, deliveredJobs] = await withLogisticsContext(partnerId, (tx) =>
      Promise.all([
        tx.deliveryRequest.findMany({
          where: { logisticsPartnerId: partnerId, status: "ASSIGNED" },
          orderBy: { assignedAt: "desc" },
        }),
        tx.deliveryRequest.findMany({
          where: { logisticsPartnerId: partnerId, status: "IN_TRANSIT" },
          orderBy: { pickedUpAt: "desc" },
        }),
        tx.deliveryRequest.findMany({
          where: { logisticsPartnerId: partnerId, status: "DELIVERED" },
          orderBy: { deliveredAt: "desc" },
          take: 20,
        }),
      ]),
    );
  } catch {
    // DB error — show empty lists
  }

  const totalDeliveries = deliveredJobs.length;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const revenueThisWeekCents = deliveredJobs
    .filter((j) => j.deliveredAt && j.deliveredAt >= weekAgo)
    .reduce((sum, j) => sum + (j.priceCents - j.commissionCents), 0);

  const totalEarnedCents = deliveredJobs.reduce(
    (sum, j) => sum + (j.priceCents - j.commissionCents),
    0,
  );
  const pendingPayoutCents = deliveredJobs
    .filter((j) => j.payoutId === null)
    .reduce((sum, j) => sum + (j.priceCents - j.commissionCents), 0);

  let recentPayouts: Array<{
    id: string;
    number: string;
    amountCents: number;
    status: string;
    createdAt: Date;
  }> = [];
  let totalPaidOutCents = 0;
  try {
    const [payouts, paidAggregate] = await withLogisticsContext(partnerId, (tx) =>
      Promise.all([
        tx.logisticsPayout.findMany({
          where: { logisticsPartnerId: partnerId },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, number: true, amountCents: true, status: true, createdAt: true },
        }),
        tx.logisticsPayout.aggregate({
          where: { logisticsPartnerId: partnerId, status: "PAID" },
          _sum: { amountCents: true },
        }),
      ]),
    );
    recentPayouts = payouts;
    totalPaidOutCents = paidAggregate._sum.amountCents ?? 0;
  } catch {
    // DB error — show empty payouts
  }

  const activeRoutes = inTransitJobs;
  const pendingRoutes = assignedJobs;
  const completedRoutes = deliveredJobs.slice(0, 10);

  function formatDate(value: Date | string) {
    return new Date(value).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      {/* Hero Header */}
      <div className="bg-[#1B3A6B] px-4 py-12 text-white md:px-8">
        <div className="mx-auto flex max-w-7xl items-start justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-black">Logistics Dashboard</h1>
            <p className="text-lg text-white/80">
              {user.logisticsProfile.companyName || user.fullName}
            </p>
          </div>
          <Link
            href="/logistics/work"
            className="rounded-lg bg-[#2E7D32] px-8 py-3 font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20]"
          >
            View Available Work
          </Link>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 md:px-8">
        {/* Fleet Overview */}
        <section>
          <h2 className="mb-6 text-2xl font-black text-[#1B3A6B]">Fleet Overview</h2>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg">
              <div className="mb-2 flex items-center gap-4">
                <div className="rounded-xl bg-blue-100 p-3">
                  <Truck size={32} className="text-[#1B3A6B]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#5d7497]">Total Deliveries</p>
                  <p className="text-3xl font-black text-[#1B3A6B]">{totalDeliveries}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg">
              <div className="mb-2 flex items-center gap-4">
                <div className="rounded-xl bg-orange-100 p-3">
                  <MapPin size={32} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#5d7497]">Active Routes</p>
                  <p className="text-3xl font-black text-[#1B3A6B]">{activeRoutes.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg">
              <div className="mb-2 flex items-center gap-4">
                <div className="rounded-xl bg-green-100 p-3">
                  <Truck size={32} className="text-[#2E7D32]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#5d7497]">Fleet Size</p>
                  <p className="text-3xl font-black text-[#1B3A6B]">
                    {user.logisticsProfile.fleetSize}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg">
              <div className="mb-2 flex items-center gap-4">
                <div className="rounded-xl bg-yellow-100 p-3">
                  <DollarSign size={32} className="text-[#A07C3A]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#5d7497]">Revenue This Week</p>
                  <p className="text-3xl font-black text-[#1B3A6B]">
                    {formatRand(revenueThisWeekCents / 100)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Earnings */}
        <section>
          <h2 className="mb-6 text-2xl font-black text-[#1B3A6B]">Earnings</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg">
              <div className="mb-2 flex items-center gap-4">
                <div className="rounded-xl bg-green-100 p-3">
                  <Wallet size={32} className="text-[#2E7D32]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#5d7497]">Total Earned</p>
                  <p className="text-3xl font-black text-[#1B3A6B]">
                    {formatRand(totalEarnedCents / 100)}
                  </p>
                  <p className="mt-0.5 text-xs text-[#9aabb9]">Net of HerdFlow&apos;s commission</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg">
              <div className="mb-2 flex items-center gap-4">
                <div className="rounded-xl bg-amber-100 p-3">
                  <Clock size={32} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#5d7497]">Pending Payout</p>
                  <p className="text-3xl font-black text-[#1B3A6B]">
                    {formatRand(pendingPayoutCents / 100)}
                  </p>
                  <p className="mt-0.5 text-xs text-[#9aabb9]">Not yet paid out</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg">
              <div className="mb-2 flex items-center gap-4">
                <div className="rounded-xl bg-blue-100 p-3">
                  <DollarSign size={32} className="text-[#1B3A6B]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#5d7497]">Total Paid Out</p>
                  <p className="text-3xl font-black text-[#1B3A6B]">
                    {formatRand(totalPaidOutCents / 100)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {recentPayouts.length > 0 && (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-[#e4ebf5] bg-white shadow-lg">
              <table className="w-full text-sm">
                <thead className="bg-[#f5f8fd]">
                  <tr>
                    <th className="px-6 py-3 text-left font-bold text-[#244367]">Payout</th>
                    <th className="px-6 py-3 text-left font-bold text-[#244367]">Amount</th>
                    <th className="px-6 py-3 text-left font-bold text-[#244367]">Status</th>
                    <th className="px-6 py-3 text-left font-bold text-[#244367]">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayouts.map((p) => (
                    <tr key={p.id} className="border-t border-[#e4ebf5]">
                      <td className="px-6 py-3 font-semibold text-[#1B3A6B]">{p.number}</td>
                      <td className="px-6 py-3 text-[#244367]">
                        {formatRand(p.amountCents / 100)}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                            p.status === "PAID"
                              ? "bg-green-100 text-green-800"
                              : p.status === "CANCELLED"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-[#5d7497]">
                        {p.createdAt.toLocaleDateString("en-ZA")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* My Routes */}
        <section>
          <h2 className="mb-6 text-2xl font-black text-[#1B3A6B]">My Routes</h2>

          {activeRoutes.length === 0 && pendingRoutes.length === 0 ? (
            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-12 text-center shadow-lg">
              <Truck size={64} className="mx-auto mb-4 text-[#cdd8e7]" />
              <p className="mb-6 text-lg text-[#5d7497]">You have no active routes.</p>
              <Link
                href="/logistics/work"
                className="inline-block rounded-lg bg-[#2E7D32] px-8 py-3 font-bold text-white transition hover:bg-[#1d5e20]"
              >
                View Available Work
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {[...activeRoutes, ...pendingRoutes].map((route) => (
                <div
                  key={route.id}
                  className="rounded-xl border border-[#e4ebf5] bg-white p-6 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-xl font-black text-[#244367]">{route.number}</p>
                      <div className="flex items-center gap-2 text-sm text-[#5d7497]">
                        <MapPin size={16} className="text-[#2E7D32]" />
                        <span>
                          <strong>Pickup:</strong> {route.pickupAddress}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#5d7497]">
                        <MapPin size={16} className="text-[#1B3A6B]" />
                        <span>
                          <strong>Delivery:</strong> {route.dropoffAddress}
                        </span>
                      </div>
                      <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                        {route.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-right">
                      <p className="text-sm text-[#5d7497]">{formatDate(route.createdAt)}</p>
                      <Link
                        href={`/logistics/routes/${route.id}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#1B3A6B] px-6 py-2 text-sm font-bold text-white transition hover:bg-[#122844]"
                      >
                        <Eye size={16} />
                        VIEW DETAILS
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Activity */}
        {completedRoutes.length > 0 && (
          <section>
            <h2 className="mb-6 text-2xl font-black text-[#1B3A6B]">Recent Deliveries</h2>
            <div className="space-y-4 rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg">
              {completedRoutes.map((route) => (
                <div
                  key={route.id}
                  className="flex items-start gap-4 border-b border-[#e4ebf5] pb-4 last:border-0 last:pb-0"
                >
                  <div className="rounded-lg bg-green-100 p-2">
                    <CheckCircle2 size={24} className="text-[#2E7D32]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#244367]">
                      {route.number} delivered — {formatRand(route.priceCents / 100)}
                    </p>
                    <p className="mt-1 text-xs text-[#5d7497]">
                      {route.deliveredAt && formatDate(route.deliveredAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
