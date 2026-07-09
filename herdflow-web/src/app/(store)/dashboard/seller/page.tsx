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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let user: any = null;
  try {
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: { sellerProfile: true },
    });
  } catch {
    redirect("/register/seller");
  }

  if (!user?.sellerProfile) {
    redirect("/register/seller");
  }

  // Fetch seller listings
  type ListingItem = {
    id: string;
    name: string;
    priceCents: number;
    photos: string[];
    stockOnHand: number;
    status: string;
  };
  let activeListings: ListingItem[] = [];
  let pendingListings: ListingItem[] = [];
  let soldListings: ListingItem[] = [];

  try {
    [activeListings, pendingListings, soldListings] = await Promise.all([
      prisma.product.findMany({
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
      }),
      prisma.product.findMany({
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
      }),
      prisma.product.findMany({
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
      }),
    ]);
  } catch {
    // DB error — show empty listings
  }

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
      <div className="bg-[#1B3A6B] px-4 py-12 text-white md:px-8">
        <div className="mx-auto flex max-w-7xl items-start justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-black">Seller Dashboard</h1>
            <p className="text-lg text-white/80">{user.sellerProfile.farmName || user.fullName}</p>
          </div>
          <Link
            href="/seller/listings/new"
            className="rounded-lg bg-[#2E7D32] px-8 py-3 font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20]"
          >
            + Create New Listing
          </Link>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 md:px-8">
        {/* Sales Overview */}
        <section>
          <h2 className="mb-6 text-2xl font-black text-[#1B3A6B]">Sales Overview</h2>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg">
              <div className="mb-2 flex items-center gap-4">
                <div className="rounded-xl bg-green-100 p-3">
                  <DollarSign size={32} className="text-[#2E7D32]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#5d7497]">Total Sales</p>
                  <p className="text-3xl font-black text-[#1B3A6B]">R{totalSales.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg">
              <div className="mb-2 flex items-center gap-4">
                <div className="rounded-xl bg-blue-100 p-3">
                  <Package size={32} className="text-[#1B3A6B]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#5d7497]">Active Listings</p>
                  <p className="text-3xl font-black text-[#1B3A6B]">{activeListings.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg">
              <div className="mb-2 flex items-center gap-4">
                <div className="rounded-xl bg-yellow-100 p-3">
                  <TrendingUp size={32} className="text-[#A07C3A]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#5d7497]">Products Sold Today</p>
                  <p className="text-3xl font-black text-[#1B3A6B]">{productsToday}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg">
              <div className="mb-2 flex items-center gap-4">
                <div className="rounded-xl bg-orange-100 p-3">
                  <Clock size={32} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#5d7497]">Pending Orders</p>
                  <p className="text-3xl font-black text-[#1B3A6B]">{pendingOrders}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* My Listings */}
        <section>
          <h2 className="mb-6 text-2xl font-black text-[#1B3A6B]">My Listings</h2>

          {/* Tabs */}
          <div className="mb-6 flex gap-4 border-b border-[#e4ebf5]">
            <button className="border-b-4 border-[#2E7D32] px-6 py-3 font-bold text-[#1B3A6B]">
              ACTIVE ({activeListings.length})
            </button>
            <button className="px-6 py-3 font-bold text-[#5d7497] transition hover:text-[#1B3A6B]">
              PENDING ({pendingListings.length})
            </button>
            <button className="px-6 py-3 font-bold text-[#5d7497] transition hover:text-[#1B3A6B]">
              SOLD ({soldListings.length})
            </button>
          </div>

          {/* Active Listings */}
          {activeListings.length === 0 ? (
            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-12 text-center shadow-lg">
              <Package size={64} className="mx-auto mb-4 text-[#cdd8e7]" />
              <p className="mb-6 text-lg text-[#5d7497]">You have no active listings.</p>
              <Link
                href="/seller/listings/new"
                className="inline-block rounded-lg bg-[#2E7D32] px-8 py-3 font-bold text-white transition hover:bg-[#1d5e20]"
              >
                Create Your First Listing
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {activeListings.map((product) => (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-[#e4ebf5] bg-white shadow-lg"
                >
                  <img
                    src={product.photos[0] || "/placeholder-product.jpg"}
                    alt={product.name}
                    className="h-48 w-full object-cover"
                  />
                  <div className="space-y-3 p-5">
                    <h3 className="line-clamp-2 font-bold text-[#244367]">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-black text-[#2E7D32]">
                        R{(product.priceCents / 100).toFixed(2)}
                      </p>
                      <p className="text-sm text-[#5d7497]">Stock: {product.stockOnHand}</p>
                    </div>
                    <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                      {product.status}
                    </span>
                    <div className="flex gap-2 pt-2">
                      <Link
                        href={`/seller/listings/${product.id}/edit`}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#1B3A6B] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#122844]"
                      >
                        <Edit size={16} />
                        EDIT
                      </Link>
                      <Link
                        href={`/seller/listings/${product.id}/sales`}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-[#1B3A6B] px-4 py-2 text-sm font-bold text-[#1B3A6B] transition hover:bg-[#1B3A6B] hover:text-white"
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
            <h2 className="mb-6 text-2xl font-black text-[#1B3A6B]">Recent Orders</h2>
            <div className="overflow-x-auto rounded-2xl border border-[#e4ebf5] bg-white shadow-lg">
              <table className="w-full">
                <thead className="bg-[#f5f8fd]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-[#244367]">
                      Order Number
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-[#244367]">Buyer</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-[#244367]">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-[#244367]">
                      Quantity
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-[#244367]">Total</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-[#244367]">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-[#244367]">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-t border-[#e4ebf5] transition hover:bg-[#f5f8fd]"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-[#244367]">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#5d7497]">{order.buyerName}</td>
                      <td className="px-6 py-4 text-sm text-[#5d7497]">{order.productName}</td>
                      <td className="px-6 py-4 text-sm text-[#5d7497]">{order.quantity}</td>
                      <td className="px-6 py-4 text-sm font-bold text-[#2E7D32]">
                        R{(order.totalCents / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
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
