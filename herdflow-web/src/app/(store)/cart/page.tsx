import Link from "next/link";
import {
  addToCart,
  buildCartItems,
  calculateCartTotals,
  parseCartParam,
  removeFromCart,
  serializeCartParam,
  updateCartQuantity,
} from "@/lib/storefront-cart";

type CartPageProps = {
  searchParams: Promise<{
    cart?: string;
    add?: string;
    inc?: string;
    dec?: string;
    remove?: string;
    clear?: string;
  }>;
};

function toCurrency(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function CartPage({ searchParams }: CartPageProps) {
  const query = await searchParams;
  let lines = parseCartParam(query.cart);

  if (query.clear === "1") {
    lines = [];
  }

  if (query.add) {
    lines = addToCart(lines, query.add);
  }

  if (query.inc) {
    lines = updateCartQuantity(lines, query.inc, 1);
  }

  if (query.dec) {
    lines = updateCartQuantity(lines, query.dec, -1);
  }

  if (query.remove) {
    lines = removeFromCart(lines, query.remove);
  }

  const cartParam = serializeCartParam(lines);
  const encodedCartParam = encodeURIComponent(cartParam);
  const items = buildCartItems(lines);
  const totals = calculateCartTotals(items);

  return (
    <main className="space-y-5 pb-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-navy">Your Cart</h1>
        <p className="text-sm text-[#38537a]">Review product items before continuing to secure checkout.</p>
      </div>

      {items.length === 0 ? (
        <section className="rounded-xl border border-[#d8e0ec] bg-white p-5 text-sm text-[#38537a] shadow-sm">
          <p>Your cart is currently empty.</p>
          <Link className="mt-3 inline-flex rounded-lg bg-brand-navy px-4 py-2 font-semibold text-white" href="/listings">
            Browse Listings
          </Link>
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-3">
            {items.map((item) => {
              const linkCartParam = encodeURIComponent(cartParam);

              return (
                <article key={item.product.slug} className="rounded-xl border border-[#d8e0ec] bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#5d7497]">{item.product.category}</p>
                      <h2 className="text-lg font-semibold text-brand-navy">{item.product.title}</h2>
                      <p className="text-sm text-[#38537a]">{toCurrency(item.unitPrice)} each</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        className="rounded-md border border-[#cdd8e7] px-3 py-1 text-sm text-[#244367]"
                        href={`/cart?cart=${linkCartParam}&dec=${encodeURIComponent(item.product.slug)}`}
                      >
                        -
                      </Link>
                      <span className="min-w-8 text-center text-sm font-semibold text-brand-navy">{item.quantity}</span>
                      <Link
                        className="rounded-md border border-[#cdd8e7] px-3 py-1 text-sm text-[#244367]"
                        href={`/cart?cart=${linkCartParam}&inc=${encodeURIComponent(item.product.slug)}`}
                      >
                        +
                      </Link>
                      <Link
                        className="ml-2 text-sm font-semibold text-[#8b1f1f]"
                        href={`/cart?cart=${linkCartParam}&remove=${encodeURIComponent(item.product.slug)}`}
                      >
                        Remove
                      </Link>
                    </div>
                  </div>

                  <p className="mt-3 text-sm font-semibold text-brand-gold">Line Total: {toCurrency(item.lineTotal)}</p>
                </article>
              );
            })}
          </div>

          <aside className="space-y-3 rounded-xl border border-[#d8e0ec] bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-brand-navy">Summary</h2>
            <p className="text-sm text-[#38537a]">Items: {totals.totalItems}</p>
            <p className="text-xl font-semibold text-brand-gold">Total: {toCurrency(totals.subtotal)}</p>

            <Link
              className="inline-flex w-full items-center justify-center rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white"
              href={`/checkout?cart=${encodedCartParam}`}
            >
              Continue to Checkout
            </Link>

            <Link className="inline-flex text-sm font-semibold text-[#5d7497]" href="/cart?clear=1">
              Clear Cart
            </Link>
          </aside>
        </section>
      )}
    </main>
  );
}
