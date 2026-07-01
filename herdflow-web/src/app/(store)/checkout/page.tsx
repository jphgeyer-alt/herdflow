import Link from "next/link";
import { CheckoutForm } from "./checkout-form";
import { buildCartItems, calculateCartTotals, parseCartParam, serializeCartParam } from "@/lib/storefront-cart";

type CheckoutPageProps = {
  searchParams: Promise<{
    cart?: string;
    status?: string;
    paymentId?: string;
  }>;
};

function toCurrency(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const query = await searchParams;
  const lines = parseCartParam(query.cart);
  const items = buildCartItems(lines);
  const totals = calculateCartTotals(items);
  const cartParam = serializeCartParam(lines);

  return (
    <main className="space-y-5 pb-10">
      <h1 className="text-3xl font-semibold text-brand-navy">Checkout</h1>

      {query.status === "return" && (
        <section className="rounded-xl border border-[#bad9c1] bg-[#eef8f0] p-4 text-sm text-[#255638] shadow-sm">
          <p className="font-semibold">Payment was returned from PayFast.</p>
          <p>Please wait for payment confirmation. Reference: {query.paymentId || "Pending"}</p>
        </section>
      )}

      {query.status === "cancel" && (
        <section className="rounded-xl border border-[#e4cbc8] bg-[#fbefee] p-4 text-sm text-[#7a2d2d] shadow-sm">
          <p className="font-semibold">Payment was cancelled.</p>
          <p>You can review your cart and try checkout again when ready.</p>
        </section>
      )}

      {items.length === 0 ? (
        <section className="rounded-xl border border-[#d8e0ec] bg-white p-5 text-sm text-[#38537a] shadow-sm">
          <p>Your cart is empty. Add products before checkout.</p>
          <Link className="mt-3 inline-flex rounded-lg bg-brand-navy px-4 py-2 font-semibold text-white" href="/listings">
            Browse Listings
          </Link>
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          <div className="space-y-3 rounded-xl border border-[#d8e0ec] bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-brand-navy">Order Details</h2>

            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.product.slug} className="flex items-center justify-between text-sm text-[#244367]">
                  <span>
                    {item.product.title} x {item.quantity}
                  </span>
                  <span className="font-semibold">{toCurrency(item.lineTotal)}</span>
                </li>
              ))}
            </ul>

            <div className="border-t border-[#e4ebf5] pt-3 text-sm text-[#244367]">
              <p>Total Items: {totals.totalItems}</p>
              <p className="text-xl font-semibold text-brand-gold">Order Total: {toCurrency(totals.subtotal)}</p>
            </div>
          </div>

          <aside className="space-y-3 rounded-xl border border-[#d8e0ec] bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-brand-navy">Customer Information</h2>
            <CheckoutForm cart={cartParam} totalLabel={toCurrency(totals.subtotal)} />
            <Link
              className="inline-flex text-sm font-semibold text-[#5d7497]"
              href={`/cart?cart=${encodeURIComponent(cartParam)}`}
            >
              Back to Cart
            </Link>
          </aside>
        </section>
      )}
    </main>
  );
}
