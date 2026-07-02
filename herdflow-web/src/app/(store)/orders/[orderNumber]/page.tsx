import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type OrderPageProps = {
  params: Promise<{ orderNumber: string }>;
};

const TRACK_STEPS = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "COMPLETED"] as const;

function toCurrency(cents: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function paymentStatusFromOrder(status: string) {
  if (["PAID", "PROCESSING", "SHIPPED", "COMPLETED"].includes(status)) {
    return "PAID";
  }
  if (["FAILED", "CANCELLED"].includes(status)) {
    return "FAILED";
  }
  return "PENDING";
}

function normalizePhoto(photo?: string) {
  if (!photo) {
    return "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=900&h=700&fit=crop";
  }
  if (photo.startsWith("http://") || photo.startsWith("https://") || photo.startsWith("/")) {
    return photo;
  }
  return `https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=900&h=700&fit=crop&sig=${encodeURIComponent(photo)}`;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { orderNumber } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let order: any = null;

  try {
    order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                photos: true,
              },
            },
          },
        },
      },
    });
  } catch {
    notFound();
  }

  if (!order) {
    notFound();
  }

  const paymentStatus = paymentStatusFromOrder(order.status);
  const stepIndex = Math.max(0, TRACK_STEPS.indexOf(order.status as (typeof TRACK_STEPS)[number]));

  return (
    <main className="space-y-6 pb-10">
      <nav className="text-sm text-[#38537a]">
        <Link className="font-semibold text-brand-navy" href="/shop">
          Back to Shop
        </Link>
      </nav>

      <header className="rounded-2xl border border-[#d8e0ec] bg-white p-5 shadow-sm">
        <h1 className="text-3xl font-semibold text-brand-navy">Order Tracking</h1>
        <div className="mt-3 grid gap-2 text-sm text-[#38537a] sm:grid-cols-2">
          <p>
            <span className="font-semibold text-brand-navy">Order Number:</span> {order.orderNumber}
          </p>
          <p>
            <span className="font-semibold text-brand-navy">Order Date:</span> {formatDate(order.createdAt)}
          </p>
          <p>
            <span className="font-semibold text-brand-navy">Current Status:</span> {order.status}
          </p>
          <p>
            <span className="font-semibold text-brand-navy">Payment Status:</span> {paymentStatus}
          </p>
        </div>
      </header>

      <section className="rounded-2xl border border-[#d8e0ec] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-brand-navy">Order Progress</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-5">
          {TRACK_STEPS.map((step, index) => {
            const done = index <= stepIndex;
            return (
              <div key={step} className="space-y-1">
                <div className={`h-2 rounded-full ${done ? "bg-green" : "bg-[#d8e0ec]"}`} />
                <p className={`text-xs font-semibold uppercase tracking-wide ${done ? "text-brand-navy" : "text-[#8fa1b8]"}`}>
                  {step}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3 rounded-2xl border border-[#d8e0ec] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-brand-navy">Items Ordered</h2>
          {order.items.length === 0 ? (
            <p className="text-sm text-[#5d7497]">No items were recorded for this order.</p>
          ) : (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            order.items.map((item: any) => (
              <article key={item.id} className="grid gap-3 rounded-xl border border-[#e4ebf5] p-3 sm:grid-cols-[88px_1fr_auto] sm:items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={normalizePhoto(item.product.photos[0])}
                  alt={item.product.name}
                  className="h-20 w-22 rounded-lg object-cover"
                />
                <div>
                  <p className="font-semibold text-brand-navy">{item.product.name}</p>
                  <p className="text-sm text-[#38537a]">Qty: {item.quantity}</p>
                  <p className="text-xs text-[#5d7497]">Unit: {toCurrency(item.unitPriceCents)}</p>
                </div>
                <p className="text-sm font-semibold text-brand-gold">{toCurrency(item.lineTotalCents)}</p>
              </article>
            ))
          )}
          <p className="pt-1 text-right text-lg font-semibold text-brand-gold">Total: {toCurrency(order.totalCents)}</p>
        </div>

        <aside className="space-y-3 rounded-2xl border border-[#d8e0ec] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-brand-navy">Delivery Address</h2>
          <div className="text-sm text-[#38537a]">
            <p>{order.user?.fullName || "Guest customer"}</p>
            <p>{order.guestEmail || order.user?.email || "No email provided"}</p>
            <p>{order.user?.phone || "No phone provided"}</p>
            <p className="mt-2 text-[#5d7497]">
              Delivery address details are not yet captured for this order.
            </p>
          </div>

          <h3 className="pt-2 text-sm font-semibold uppercase tracking-wide text-brand-navy">Payment Reference</h3>
          <p className="text-sm text-[#38537a]">{order.paymentReference || "Not available"}</p>
        </aside>
      </section>
    </main>
  );
}
