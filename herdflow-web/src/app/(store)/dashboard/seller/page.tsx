import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, DollarSign, TrendingUp, Clock, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { Prisma, OrderStatus } from "@prisma/client";
import { getUserIdFromSession, USER_SESSION_COOKIE } from "@/lib/user-auth";
import { formatRand } from "@/lib/marketing/format";
import { ListingsTabs } from "./ListingsTabs";

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

  const PAID_STATUSES: OrderStatus[] = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"];

  const sellerOrderItemInclude = {
    order: {
      select: {
        orderNumber: true,
        status: true,
        createdAt: true,
        guestEmail: true,
        user: { select: { fullName: true } },
      },
    },
    product: { select: { name: true } },
  } satisfies Prisma.OrderItemInclude;

  let sellerOrderItems: Prisma.OrderItemGetPayload<{ include: typeof sellerOrderItemInclude }>[] =
    [];
  let pendingOrders = 0;

  try {
    [sellerOrderItems, pendingOrders] = await Promise.all([
      prisma.orderItem.findMany({
        where: {
          product: { sellerId: user.sellerProfile.id },
          order: { status: { in: PAID_STATUSES } },
        },
        include: sellerOrderItemInclude,
        orderBy: { order: { createdAt: "desc" } },
      }),
      prisma.order.count({
        where: {
          status: "PENDING",
          items: { some: { product: { sellerId: user.sellerProfile.id } } },
        },
      }),
    ]);
  } catch {
    // DB error — show empty stats
  }

  const totalSales = sellerOrderItems.reduce((sum, i) => sum + i.lineTotalCents, 0) / 100;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const productsToday = sellerOrderItems
    .filter((i) => i.order.createdAt >= todayStart)
    .reduce((sum, i) => sum + i.quantity, 0);

  const recentOrders = sellerOrderItems.slice(0, 10).map((i) => ({
    id: i.id,
    orderNumber: i.order.orderNumber,
    buyerName: i.order.user?.fullName || i.order.guestEmail || "Guest",
    productName: i.product.name,
    quantity: i.quantity,
    totalCents: i.lineTotalCents,
    status: i.order.status,
    createdAt: i.order.createdAt.toLocaleDateString("en-ZA"),
  }));

  // Earnings: net revenue after HerdFlow's commission.
  const totalEarnedCents = sellerOrderItems.reduce(
    (sum, i) => sum + (i.lineTotalCents - i.commissionCents),
    0,
  );
  const pendingPayoutCents = sellerOrderItems
    .filter((i) => i.payoutId === null)
    .reduce((sum, i) => sum + (i.lineTotalCents - i.commissionCents), 0);

  let recentPayouts: Array<{
    id: string;
    number: string;
    amountCents: number;
    status: string;
    createdAt: Date;
  }> = [];
  let totalPaidOutCents = 0;
  try {
    const [payouts, paidAggregate] = await Promise.all([
      prisma.sellerPayout.findMany({
        where: { sellerId: user.sellerProfile.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, number: true, amountCents: true, status: true, createdAt: true },
      }),
      prisma.sellerPayout.aggregate({
        where: { sellerId: user.sellerProfile.id, status: "PAID" },
        _sum: { amountCents: true },
      }),
    ]);
    recentPayouts = payouts;
    totalPaidOutCents = paidAggregate._sum.amountCents ?? 0;
  } catch {
    // DB error — show empty payouts
  }

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

        {/* My Listings */}
        <section>
          <h2 className="mb-6 text-2xl font-black text-[#1B3A6B]">My Listings</h2>
          <ListingsTabs active={activeListings} pending={pendingListings} sold={soldListings} />
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
