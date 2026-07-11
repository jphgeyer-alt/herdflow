import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUserIdFromSession, USER_SESSION_COOKIE } from "@/lib/user-auth";
import { withUserContext } from "@/lib/tenant-prisma";
import { ConfirmReceivedButton } from "./confirm-received-button";

export const metadata = { title: "My Orders | HerdFlow" };

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-[#f5f4ef] text-[#8fa1b8]",
  PAID: "bg-[#eef3fb] text-[#1B3A6B]",
  PROCESSING: "bg-[#eef3fb] text-[#1B3A6B]",
  SHIPPED: "bg-[#A07C3A]/10 text-[#A07C3A]",
  COMPLETED: "bg-[#2E7D32]/10 text-[#2E7D32]",
  CANCELLED: "bg-red-50 text-red-600",
  FAILED: "bg-red-50 text-red-600",
};

function toCurrency(cents: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(date);
}

export default async function OrderHistoryPage() {
  const jar = await cookies();
  const sessionValue = jar.get(USER_SESSION_COOKIE)?.value;
  const userId = await getUserIdFromSession(sessionValue);

  if (!userId) {
    redirect("/auth/login?redirect=/orders");
  }

  const orders = await withUserContext(userId, (tx) =>
    tx.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { items: { select: { id: true } } },
    }),
  );

  return (
    <main className="space-y-6 pb-10">
      <nav className="text-sm text-[#38537a]">
        <Link className="text-brand-navy font-semibold" href="/shop">
          Back to Shop
        </Link>
      </nav>

      <header>
        <h1 className="text-brand-navy text-3xl font-semibold">My Orders</h1>
        <p className="mt-1 text-sm text-[#5d7497]">Track your orders and confirm delivery.</p>
      </header>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-[#d8e0ec] bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-[#5d7497]">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/shop"
            className="mt-4 inline-block rounded-lg bg-[#2E7D32] px-6 py-2 text-sm font-bold text-white"
          >
            Browse the Shop
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article
              key={order.id}
              className="grid gap-3 rounded-2xl border border-[#d8e0ec] bg-white p-5 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/orders/${order.orderNumber}`}
                    className="text-brand-navy font-semibold hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[order.status] ?? "bg-[#f5f4ef] text-[#8fa1b8]"}`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#5d7497]">
                  {formatDate(order.createdAt)} &middot; {order.items.length}{" "}
                  {order.items.length === 1 ? "item" : "items"} &middot;{" "}
                  <span className="text-brand-gold font-semibold">{toCurrency(order.totalCents)}</span>
                </p>
              </div>

              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                {order.status === "SHIPPED" && <ConfirmReceivedButton orderNumber={order.orderNumber} />}
                <Link
                  href={`/orders/${order.orderNumber}`}
                  className="text-brand-navy text-sm font-semibold hover:underline"
                >
                  View Details
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
