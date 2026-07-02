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
      <div className="bg-[#1B3A6B] text-white py-12 px-4 md:px-8">
        <div className="mx-auto max-w-7xl flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-black mb-2">Logistics Dashboard</h1>
            <p className="text-lg text-white/80">{user.logisticsProfile.companyName || user.fullName}</p>
          </div>
          <Link
            href="/logistics/work"
            className="px-8 py-3 bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold uppercase tracking-wide rounded-lg shadow-lg transition"
          >
            View Available Work
          </Link>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-12 space-y-12">
        {/* Fleet Overview */}
        <section>
          <h2 className="text-2xl font-black text-[#1B3A6B] mb-6">Fleet Overview</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Truck size={32} className="text-[#1B3A6B]" />
                </div>
                <div>
                  <p className="text-sm text-[#5d7497] font-semibold">Total Deliveries</p>
                  <p className="text-3xl font-black text-[#1B3A6B]">{totalDeliveries}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <MapPin size={32} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-[#5d7497] font-semibold">Active Routes</p>
                  <p className="text-3xl font-black text-[#1B3A6B]">{activeRoutes.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Activity size={32} className="text-[#2E7D32]" />
                </div>
                <div>
                  <p className="text-sm text-[#5d7497] font-semibold">Vehicles Online</p>
                  <p className="text-3xl font-black text-[#1B3A6B]">{vehiclesOnline}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <DollarSign size={32} className="text-[#A07C3A]" />
                </div>
                <div>
                  <p className="text-sm text-[#5d7497] font-semibold">Revenue This Week</p>
                  <p className="text-3xl font-black text-[#1B3A6B]">R{revenueThisWeek.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* My Routes */}
        <section>
          <h2 className="text-2xl font-black text-[#1B3A6B] mb-6">My Routes</h2>
          
          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-[#e4ebf5]">
            <button className="px-6 py-3 font-bold text-[#1B3A6B] border-b-4 border-[#2E7D32]">
              ACTIVE ({activeRoutes.length})
            </button>
            <button className="px-6 py-3 font-bold text-[#5d7497] hover:text-[#1B3A6B] transition">
              PENDING ({pendingRoutes.length})
            </button>
            <button className="px-6 py-3 font-bold text-[#5d7497] hover:text-[#1B3A6B] transition">
              COMPLETED ({completedRoutes.length})
            </button>
          </div>

          {/* Active Routes */}
          {activeRoutes.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-12 text-center">
              <Truck size={64} className="mx-auto text-[#cdd8e7] mb-4" />
              <p className="text-[#5d7497] text-lg mb-6">You have no active routes.</p>
              <Link
                href="/logistics/work"
                className="inline-block px-8 py-3 bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold rounded-lg transition"
              >
                View Available Work
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeRoutes.map((route) => (
                <div key={route.id} className="bg-white rounded-xl shadow-lg border border-[#e4ebf5] p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-xl font-black text-[#244367]">Route #{route.routeNumber}</p>
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
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        {route.status}
                      </span>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-sm text-[#5d7497]">{route.date}</p>
                      <Link
                        href={`/logistics/routes/${route.id}`}
                        className="inline-flex items-center gap-2 px-6 py-2 bg-[#1B3A6B] hover:bg-[#122844] text-white text-sm font-bold rounded-lg transition"
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
            <h2 className="text-2xl font-black text-[#1B3A6B] mb-6">Recent Activity</h2>
            <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-6 space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-[#e4ebf5] last:border-0 last:pb-0">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle2 size={24} className="text-[#2E7D32]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#244367]">{activity.message}</p>
                    <p className="text-xs text-[#5d7497] mt-1">{activity.timestamp}</p>
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
