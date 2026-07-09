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
        <Link className="text-brand-navy font-semibold" href="/shop">
          Back to Shop
        </Link>
      </nav>

      <header className="rounded-2xl border border-[#d8e0ec] bg-white p-5 shadow-sm">
        <h1 className="text-brand-navy text-3xl font-semibold">Order Tracking</h1>
        <div className="mt-3 grid gap-2 text-sm text-[#38537a] sm:grid-cols-2">
          <p>
            <span className="text-brand-navy font-semibold">Order Number:</span> {order.orderNumber}
          </p>
          <p>
            <span className="text-brand-navy font-semibold">Order Date:</span>{" "}
            {formatDate(order.createdAt)}
          </p>
          <p>
            <span className="text-brand-navy font-semibold">Current Status:</span> {order.status}
          </p>
          <p>
            <span className="text-brand-navy font-semibold">Payment Status:</span> {paymentStatus}
          </p>
        </div>
      </header>

      <section className="rounded-2xl border border-[#d8e0ec] bg-white p-5 shadow-sm">
        <h2 className="text-brand-navy text-xl font-semibold">Order Progress</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-5">
          {TRACK_STEPS.map((step, index) => {
            const done = index <= stepIndex;
            return (
              <div key={step} className="space-y-1">
                <div className={`h-2 rounded-full ${done ? "bg-green" : "bg-[#d8e0ec]"}`} />
                <p
                  className={`text-xs font-semibold uppercase tracking-wide ${done ? "text-brand-navy" : "text-[#8fa1b8]"}`}
                >
                  {step}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3 rounded-2xl border border-[#d8e0ec] bg-white p-5 shadow-sm">
          <h2 className="text-brand-navy text-xl font-semibold">Items Ordered</h2>
          {order.items.length === 0 ? (
            <p className="text-sm text-[#5d7497]">No items were recorded for this order.</p>
          ) : (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            order.items.map((item: any) => (
              <article
                key={item.id}
                className="grid gap-3 rounded-xl border border-[#e4ebf5] p-3 sm:grid-cols-[88px_1fr_auto] sm:items-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={normalizePhoto(item.product.photos[0])}
                  alt={item.product.name}
                  className="w-22 h-20 rounded-lg object-cover"
                />
                <div>
                  <p className="text-brand-navy font-semibold">{item.product.name}</p>
                  <p className="text-sm text-[#38537a]">Qty: {item.quantity}</p>
                  <p className="text-xs text-[#5d7497]">Unit: {toCurrency(item.unitPriceCents)}</p>
                </div>
                <p className="text-brand-gold text-sm font-semibold">
                  {toCurrency(item.lineTotalCents)}
                </p>
              </article>
            ))
          )}
          <p className="text-brand-gold pt-1 text-right text-lg font-semibold">
            Total: {toCurrency(order.totalCents)}
          </p>
        </div>

        <aside className="space-y-3 rounded-2xl border border-[#d8e0ec] bg-white p-5 shadow-sm">
          <h2 className="text-brand-navy text-xl font-semibold">
            {order.deliveryMethod === "PICKUP" ? "Pickup" : "Delivery Address"}
          </h2>
          <div className="text-sm text-[#38537a]">
            <p>{order.user?.fullName || "Guest customer"}</p>
            <p>{order.guestEmail || order.user?.email || "No email provided"}</p>
            <p>{order.user?.phone || "No phone provided"}</p>
            {order.deliveryMethod === "PICKUP" ? (
              <p className="mt-2 text-[#5d7497]">
                This order will be collected directly from the seller.
              </p>
            ) : order.shippingAddress ? (
              <div className="mt-2 space-y-0.5">
                <p>{order.shippingAddress}</p>
                <p>
                  {[order.shippingCity, order.shippingProvince, order.shippingPostalCode]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-[#5d7497]">
                Delivery address details are not yet captured for this order.
              </p>
            )}
          </div>

          <h3 className="text-brand-navy pt-2 text-sm font-semibold uppercase tracking-wide">
            Payment Reference
          </h3>
          <p className="text-sm text-[#38537a]">{order.paymentReference || "Not available"}</p>
        </aside>
      </section>
    </main>
  );
}
