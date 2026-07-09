import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Truck, DollarSign, MapPin, Activity, Eye, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getUserIdFromSession, USER_SESSION_COOKIE } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

export default async function LogisticsDashboard() {
  const jar = await cookies();
  const sessionValue = jar.get(USER_SESSION_COOKIE)?.value;
  const userId = getUserIdFromSession(sessionValue);

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

  // Stubbed data - DeliveryRoute model not in schema yet
  const activeRoutes: Array<{
    id: string;
    routeNumber: string;
    pickupLocation: string;
    deliveryLocation: string;
    status: string;
    date: string;
  }> = [];

  const pendingRoutes: Array<{
    id: string;
    routeNumber: string;
    pickupLocation: string;
    deliveryLocation: string;
    status: string;
    date: string;
  }> = [];

  const completedRoutes: Array<{
    id: string;
    routeNumber: string;
    pickupLocation: string;
    deliveryLocation: string;
    status: string;
    date: string;
  }> = [];

  const recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }> = [];

  // Fleet stats (stubbed)
  const totalDeliveries = 0;
  const vehiclesOnline = 0;
  const revenueThisWeek = 0;

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
                  <Activity size={32} className="text-[#2E7D32]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#5d7497]">Vehicles Online</p>
                  <p className="text-3xl font-black text-[#1B3A6B]">{vehiclesOnline}</p>
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
                    R{revenueThisWeek.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* My Routes */}
        <section>
          <h2 className="mb-6 text-2xl font-black text-[#1B3A6B]">My Routes</h2>

          {/* Tabs */}
          <div className="mb-6 flex gap-4 border-b border-[#e4ebf5]">
            <button className="border-b-4 border-[#2E7D32] px-6 py-3 font-bold text-[#1B3A6B]">
              ACTIVE ({activeRoutes.length})
            </button>
            <button className="px-6 py-3 font-bold text-[#5d7497] transition hover:text-[#1B3A6B]">
              PENDING ({pendingRoutes.length})
            </button>
            <button className="px-6 py-3 font-bold text-[#5d7497] transition hover:text-[#1B3A6B]">
              COMPLETED ({completedRoutes.length})
            </button>
          </div>

          {/* Active Routes */}
          {activeRoutes.length === 0 ? (
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
              {activeRoutes.map((route) => (
                <div
                  key={route.id}
                  className="rounded-xl border border-[#e4ebf5] bg-white p-6 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-xl font-black text-[#244367]">
                        Route #{route.routeNumber}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-[#5d7497]">
                        <MapPin size={16} className="text-[#2E7D32]" />
                        <span>
                          <strong>Pickup:</strong> {route.pickupLocation}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#5d7497]">
                        <MapPin size={16} className="text-[#1B3A6B]" />
                        <span>
                          <strong>Delivery:</strong> {route.deliveryLocation}
                        </span>
                      </div>
                      <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                        {route.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-right">
                      <p className="text-sm text-[#5d7497]">{route.date}</p>
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
        {recentActivity.length > 0 && (
          <section>
            <h2 className="mb-6 text-2xl font-black text-[#1B3A6B]">Recent Activity</h2>
            <div className="space-y-4 rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 border-b border-[#e4ebf5] pb-4 last:border-0 last:pb-0"
                >
                  <div className="rounded-lg bg-green-100 p-2">
                    <CheckCircle2 size={24} className="text-[#2E7D32]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#244367]">{activity.message}</p>
                    <p className="mt-1 text-xs text-[#5d7497]">{activity.timestamp}</p>
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
