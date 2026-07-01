import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center bg-[radial-gradient(circle_at_top_left,#f7fee7,#ffffff_50%)]">
      <main className="mx-auto w-full max-w-4xl space-y-8 px-6 py-14">
        <p className="inline-block rounded-full border border-lime-300 bg-lime-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-lime-900">
          Geyer Holdings
        </p>
        <h1 className="text-5xl font-semibold tracking-tight text-neutral-900">
          HerdFlow Web
        </h1>
        <p className="max-w-2xl text-lg text-neutral-700">
          Standalone website project for ecommerce storefront and live auction.
          Herd management modules are intentionally excluded.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link className="rounded-xl border border-neutral-200 bg-white px-4 py-3 font-medium hover:border-neutral-400" href="/shop">
            Storefront
          </Link>
          <Link className="rounded-xl border border-neutral-200 bg-white px-4 py-3 font-medium hover:border-neutral-400" href="/auction">
            Auction
          </Link>
          <Link className="rounded-xl border border-neutral-200 bg-white px-4 py-3 font-medium hover:border-neutral-400" href="/admin">
            Admin Backend
          </Link>
        </div>
      </main>
    </div>
  );
}
