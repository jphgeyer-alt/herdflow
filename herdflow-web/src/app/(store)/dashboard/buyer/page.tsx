import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, ShoppingCart, Eye, Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getUserIdFromSession, USER_SESSION_COOKIE } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

export default async function BuyerDashboard() {
  const jar = await cookies();
  const sessionValue = jar.get(USER_SESSION_COOKIE)?.value;
  const userId = getUserIdFromSession(sessionValue);

  if (!userId) {
    redirect("/auth/login");
  }

  let user: { id: string; fullName: string; email: string } | null = null;
  let recommendedProducts: Array<{
    id: string;
    name: string;
    priceCents: number;
    photos: string[];
  }> = [];

  try {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true },
    });
    if (!user) redirect("/auth/login");
    recommendedProducts = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, priceCents: true, photos: true },
    });
  } catch {
    if (!user) redirect("/auth/login");
  }

  if (!user) redirect("/auth/login");

  const pendingOrders: Array<{
    id: string;
    orderNumber: string;
    deliveryDate: string;
    status: string;
    totalCents: number;
  }> = [];
  const recentOrders: Array<{
    id: string;
    orderNumber: string;
    deliveryDate: string;
    status: string;
    totalCents: number;
  }> = [];

  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      {/* Hero Header */}
      <div className="bg-[#1B3A6B] px-4 py-12 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-2 text-4xl font-black">Welcome back, {user.fullName.split(" ")[0]}!</h1>
          <p className="text-lg text-white/80">Manage your orders and explore new products</p>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 md:px-8">
        {/* Quick Actions */}
        <section>
          <h2 className="mb-6 text-2xl font-black text-[#1B3A6B]">Quick Actions</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Link
              href="/shop"
              className="group flex flex-col items-center justify-center rounded-2xl border border-[#e4ebf5] bg-white p-8 shadow-lg transition hover:border-[#2E7D32] hover:shadow-xl"
            >
              <ShoppingCart
                size={48}
                className="mb-4 text-[#2E7D32] transition group-hover:scale-110"
              />
              <span className="text-lg font-bold text-[#244367]">GO TO SHOP</span>
            </Link>
            <Link
              href="/listings"
              className="group flex flex-col items-center justify-center rounded-2xl border border-[#e4ebf5] bg-white p-8 shadow-lg transition hover:border-[#2E7D32] hover:shadow-xl"
            >
              <Eye size={48} className="mb-4 text-[#2E7D32] transition group-hover:scale-110" />
              <span className="text-lg font-bold text-[#244367]">VIEW LIVESTOCK AUCTIONS</span>
            </Link>
            <Link
              href="/tracking"
              className="group flex flex-col items-center justify-center rounded-2xl border border-[#e4ebf5] bg-white p-8 shadow-lg transition hover:border-[#2E7D32] hover:shadow-xl"
            >
              <Truck size={48} className="mb-4 text-[#2E7D32] transition group-hover:scale-110" />
              <span className="text-lg font-bold text-[#244367]">TRACK MY DELIVERIES</span>
            </Link>
          </div>
        </section>

        {/* My Orders */}
        <section>
          <h2 className="mb-6 text-2xl font-black text-[#1B3A6B]">My Orders</h2>

          {/* Pending Orders */}
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-bold text-[#244367]">Pending Orders</h3>
            {pendingOrders.length === 0 ? (
              <div className="rounded-2xl border border-[#e4ebf5] bg-white p-12 text-center shadow-lg">
                <Package size={64} className="mx-auto mb-4 text-[#cdd8e7]" />
                <p className="text-lg text-[#5d7497]">You have no pending orders.</p>
                <Link
                  href="/shop"
                  className="mt-6 inline-block rounded-lg bg-[#2E7D32] px-8 py-3 font-bold text-white transition hover:bg-[#1d5e20]"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-xl border border-[#e4ebf5] bg-white p-6 shadow-md"
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-[#244367]">Order #{order.orderNumber}</p>
                      <p className="text-sm text-[#5d7497]">Delivery: {order.deliveryDate}</p>
                      <span className="inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                        {order.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-right">
                      <p className="text-xl font-black text-[#1B3A6B]">
                        R{(order.totalCents / 100).toFixed(2)}
                      </p>
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-block rounded-lg bg-[#1B3A6B] px-6 py-2 text-sm font-bold text-white transition hover:bg-[#122844]"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          {recentOrders.length > 0 && (
            <div>
              <h3 className="mb-4 text-lg font-bold text-[#244367]">Recent Orders</h3>
              <div className="space-y-4">
                {recentOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-xl border border-[#e4ebf5] bg-white p-6 shadow-md"
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-[#244367]">Order #{order.orderNumber}</p>
                      <p className="text-sm text-[#5d7497]">Delivered: {order.deliveryDate}</p>
                      <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                        {order.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-right">
                      <p className="text-xl font-black text-[#1B3A6B]">
                        R{(order.totalCents / 100).toFixed(2)}
                      </p>
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-block rounded-lg bg-[#1B3A6B] px-6 py-2 text-sm font-bold text-white transition hover:bg-[#122844]"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/orders"
                className="mt-6 block w-full rounded-lg border-2 border-[#1B3A6B] py-3 text-center font-bold text-[#1B3A6B] transition hover:bg-[#1B3A6B] hover:text-white"
              >
                VIEW ALL ORDERS
              </Link>
            </div>
          )}
        </section>

        {/* Recommended Products */}
        <section>
          <h2 className="mb-6 text-2xl font-black text-[#1B3A6B]">Recommended Products</h2>
          {recommendedProducts.length === 0 ? (
            <p className="py-8 text-center text-[#5d7497]">No products available at the moment.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-4">
              {recommendedProducts.map((product) => (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-[#e4ebf5] bg-white shadow-lg transition hover:shadow-xl"
                >
                  <img
                    src={product.photos[0] || "/placeholder-product.jpg"}
                    alt={product.name}
                    className="h-48 w-full object-cover"
                  />
                  <div className="space-y-3 p-4">
                    <h3 className="line-clamp-2 font-bold text-[#244367]">{product.name}</h3>
                    <p className="text-2xl font-black text-[#2E7D32]">
                      R{(product.priceCents / 100).toFixed(2)}
                    </p>
                    <button className="w-full rounded-lg bg-[#2E7D32] py-2 font-bold text-white transition hover:bg-[#1d5e20]">
                      Quick Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
