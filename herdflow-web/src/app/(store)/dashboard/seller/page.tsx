import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, DollarSign, TrendingUp, Clock, Eye, Edit } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getUserIdFromSession, USER_SESSION_COOKIE } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

export default async function SellerDashboard() {
  const jar = await cookies();
  const sessionValue = jar.get(USER_SESSION_COOKIE)?.value;
  const userId = getUserIdFromSession(sessionValue);

  if (!userId) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { sellerProfile: true },
  });

  if (!user?.sellerProfile) {
    redirect("/register/seller");
  }

  // Fetch seller listings
  const activeListings = await prisma.product.findMany({
    where: { sellerId: user.sellerProfile.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      priceCents: true,
      photos: true,
      stockOnHand: true,
      status: true,
    },
  });

  const pendingListings = await prisma.product.findMany({
    where: { sellerId: user.sellerProfile.id, status: "DRAFT" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      priceCents: true,
      photos: true,
      stockOnHand: true,
      status: true,
    },
  });

  const soldListings = await prisma.product.findMany({
    where: { sellerId: user.sellerProfile.id, status: "ARCHIVED" },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      name: true,
      priceCents: true,
      photos: true,
      stockOnHand: true,
      status: true,
    },
  });

  // Calculate stats (stubbed for now - OrderItem model not in schema yet)
  const totalSales = 0;
  const productsToday = 0;
  const pendingOrders = 0;

  // Recent orders (stubbed)
  const recentOrders: Array<{
    id: string;
    orderNumber: string;
    buyerName: string;
    productName: string;
    quantity: number;
    totalCents: number;
    status: string;
    createdAt: string;
  }> = [];

  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      {/* Hero Header */}
      <div className="bg-[#1B3A6B] text-white py-12 px-4 md:px-8">
        <div className="mx-auto max-w-7xl flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-black mb-2">Seller Dashboard</h1>
            <p className="text-lg text-white/80">{user.sellerProfile.farmName || user.fullName}</p>
          </div>
          <Link
            href="/seller/listings/new"
            className="px-8 py-3 bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold uppercase tracking-wide rounded-lg shadow-lg transition"
          >
            + Create New Listing
          </Link>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-12 space-y-12">
        {/* Sales Overview */}
        <section>
          <h2 className="text-2xl font-black text-[#1B3A6B] mb-6">Sales Overview</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-green-100 rounded-xl">
                  <DollarSign size={32} className="text-[#2E7D32]" />
                </div>
                <div>
                  <p className="text-sm text-[#5d7497] font-semibold">Total Sales</p>
                  <p className="text-3xl font-black text-[#1B3A6B]">R{totalSales.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Package size={32} className="text-[#1B3A6B]" />
                </div>
                <div>
                  <p className="text-sm text-[#5d7497] font-semibold">Active Listings</p>
                  <p className="text-3xl font-black text-[#1B3A6B]">{activeListings.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <TrendingUp size={32} className="text-[#A07C3A]" />
                </div>
                <div>
                  <p className="text-sm text-[#5d7497] font-semibold">Products Sold Today</p>
                  <p className="text-3xl font-black text-[#1B3A6B]">{productsToday}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Clock size={32} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-[#5d7497] font-semibold">Pending Orders</p>
                  <p className="text-3xl font-black text-[#1B3A6B]">{pendingOrders}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* My Listings */}
        <section>
          <h2 className="text-2xl font-black text-[#1B3A6B] mb-6">My Listings</h2>
          
          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-[#e4ebf5]">
            <button className="px-6 py-3 font-bold text-[#1B3A6B] border-b-4 border-[#2E7D32]">
              ACTIVE ({activeListings.length})
            </button>
            <button className="px-6 py-3 font-bold text-[#5d7497] hover:text-[#1B3A6B] transition">
              PENDING ({pendingListings.length})
            </button>
            <button className="px-6 py-3 font-bold text-[#5d7497] hover:text-[#1B3A6B] transition">
              SOLD ({soldListings.length})
            </button>
          </div>

          {/* Active Listings */}
          {activeListings.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-12 text-center">
              <Package size={64} className="mx-auto text-[#cdd8e7] mb-4" />
              <p className="text-[#5d7497] text-lg mb-6">You have no active listings.</p>
              <Link
                href="/seller/listings/new"
                className="inline-block px-8 py-3 bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold rounded-lg transition"
              >
                Create Your First Listing
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {activeListings.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] overflow-hidden">
                  <img
                    src={product.photos[0] || "/placeholder-product.jpg"}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-[#244367] line-clamp-2">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-black text-[#2E7D32]">R{(product.priceCents / 100).toFixed(2)}</p>
                      <p className="text-sm text-[#5d7497]">Stock: {product.stockOnHand}</p>
                    </div>
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      {product.status}
                    </span>
                    <div className="flex gap-2 pt-2">
                      <Link
                        href={`/seller/listings/${product.id}/edit`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#1B3A6B] hover:bg-[#122844] text-white text-sm font-bold rounded-lg transition"
                      >
                        <Edit size={16} />
                        EDIT
                      </Link>
                      <Link
                        href={`/seller/listings/${product.id}/sales`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-[#1B3A6B] text-[#1B3A6B] text-sm font-bold rounded-lg hover:bg-[#1B3A6B] hover:text-white transition"
                      >
                        <Eye size={16} />
                        VIEW SALES
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-[#1B3A6B] mb-6">Recent Orders</h2>
            <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f5f8fd]">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-bold text-[#244367]">Order Number</th>
                    <th className="text-left px-6 py-4 text-sm font-bold text-[#244367]">Buyer</th>
                    <th className="text-left px-6 py-4 text-sm font-bold text-[#244367]">Product</th>
                    <th className="text-left px-6 py-4 text-sm font-bold text-[#244367]">Quantity</th>
                    <th className="text-left px-6 py-4 text-sm font-bold text-[#244367]">Total</th>
                    <th className="text-left px-6 py-4 text-sm font-bold text-[#244367]">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-bold text-[#244367]">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-t border-[#e4ebf5] hover:bg-[#f5f8fd] transition">
                      <td className="px-6 py-4 text-sm font-semibold text-[#244367]">{order.orderNumber}</td>
                      <td className="px-6 py-4 text-sm text-[#5d7497]">{order.buyerName}</td>
                      <td className="px-6 py-4 text-sm text-[#5d7497]">{order.productName}</td>
                      <td className="px-6 py-4 text-sm text-[#5d7497]">{order.quantity}</td>
                      <td className="px-6 py-4 text-sm font-bold text-[#2E7D32]">R{(order.totalCents / 100).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#5d7497]">{order.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
