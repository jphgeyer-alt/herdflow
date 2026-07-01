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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, email: true },
  });

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch buyer orders (stubbed for now - Order model not yet in schema)
  const pendingOrders: Array<{ id: string; orderNumber: string; deliveryDate: string; status: string; totalCents: number }> = [];
  const recentOrders: Array<{ id: string; orderNumber: string; deliveryDate: string; status: string; totalCents: number }> = [];

  // Fetch recommended products
  const recommendedProducts = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    take: 4,
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, priceCents: true, imageUrl: true },
  });

  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      {/* Hero Header */}
      <div className="bg-[#1B3A6B] text-white py-12 px-4 md:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-black mb-2">Welcome back, {user.fullName.split(' ')[0]}!</h1>
          <p className="text-lg text-white/80">Manage your orders and explore new products</p>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-12 space-y-12">
        {/* Quick Actions */}
        <section>
          <h2 className="text-2xl font-black text-[#1B3A6B] mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/shop"
              className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-lg border border-[#e4ebf5] hover:shadow-xl hover:border-[#2E7D32] transition group"
            >
              <ShoppingCart size={48} className="text-[#2E7D32] mb-4 group-hover:scale-110 transition" />
              <span className="text-lg font-bold text-[#244367]">GO TO SHOP</span>
            </Link>
            <Link
              href="/listings"
              className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-lg border border-[#e4ebf5] hover:shadow-xl hover:border-[#2E7D32] transition group"
            >
              <Eye size={48} className="text-[#2E7D32] mb-4 group-hover:scale-110 transition" />
              <span className="text-lg font-bold text-[#244367]">VIEW LIVESTOCK AUCTIONS</span>
            </Link>
            <Link
              href="/tracking"
              className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-lg border border-[#e4ebf5] hover:shadow-xl hover:border-[#2E7D32] transition group"
            >
              <Truck size={48} className="text-[#2E7D32] mb-4 group-hover:scale-110 transition" />
              <span className="text-lg font-bold text-[#244367]">TRACK MY DELIVERIES</span>
            </Link>
          </div>
        </section>

        {/* My Orders */}
        <section>
          <h2 className="text-2xl font-black text-[#1B3A6B] mb-6">My Orders</h2>

          {/* Pending Orders */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-[#244367] mb-4">Pending Orders</h3>
            {pendingOrders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-12 text-center">
                <Package size={64} className="mx-auto text-[#cdd8e7] mb-4" />
                <p className="text-[#5d7497] text-lg">You have no pending orders.</p>
                <Link
                  href="/shop"
                  className="inline-block mt-6 px-8 py-3 bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold rounded-lg transition"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl shadow-md border border-[#e4ebf5] p-6 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-bold text-[#244367]">Order #{order.orderNumber}</p>
                      <p className="text-sm text-[#5d7497]">Delivery: {order.deliveryDate}</p>
                      <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                        {order.status}
                      </span>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-xl font-black text-[#1B3A6B]">R{(order.totalCents / 100).toFixed(2)}</p>
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-block px-6 py-2 bg-[#1B3A6B] hover:bg-[#122844] text-white text-sm font-bold rounded-lg transition"
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
              <h3 className="text-lg font-bold text-[#244367] mb-4">Recent Orders</h3>
              <div className="space-y-4">
                {recentOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="bg-white rounded-xl shadow-md border border-[#e4ebf5] p-6 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-bold text-[#244367]">Order #{order.orderNumber}</p>
                      <p className="text-sm text-[#5d7497]">Delivered: {order.deliveryDate}</p>
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        {order.status}
                      </span>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-xl font-black text-[#1B3A6B]">R{(order.totalCents / 100).toFixed(2)}</p>
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-block px-6 py-2 bg-[#1B3A6B] hover:bg-[#122844] text-white text-sm font-bold rounded-lg transition"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/orders"
                className="block mt-6 w-full text-center py-3 border-2 border-[#1B3A6B] text-[#1B3A6B] font-bold rounded-lg hover:bg-[#1B3A6B] hover:text-white transition"
              >
                VIEW ALL ORDERS
              </Link>
            </div>
          )}
        </section>

        {/* Recommended Products */}
        <section>
          <h2 className="text-2xl font-black text-[#1B3A6B] mb-6">Recommended Products</h2>
          {recommendedProducts.length === 0 ? (
            <p className="text-[#5d7497] text-center py-8">No products available at the moment.</p>
          ) : (
            <div className="grid md:grid-cols-4 gap-6">
              {recommendedProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] overflow-hidden hover:shadow-xl transition">
                  <img
                    src={product.imageUrl || "/placeholder-product.jpg"}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4 space-y-3">
                    <h3 className="font-bold text-[#244367] line-clamp-2">{product.name}</h3>
                    <p className="text-2xl font-black text-[#2E7D32]">R{(product.priceCents / 100).toFixed(2)}</p>
                    <button className="w-full bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold py-2 rounded-lg transition">
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
