"use client";

import Link from "next/link";

export function StoreBanner() {
  return (
    <div
      className="relative min-h-[500px] overflow-hidden rounded-xl bg-cover bg-center"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(27,58,92,0.75) 0%, rgba(107,166,64,0.6) 100%), url(https://images.unsplash.com/photo-1560493676-04071c5f467b?w=1400&h=600&fit=crop)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute right-10 top-10 h-64 w-64 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-5 left-20 h-48 w-48 rounded-full bg-white blur-2xl" />
      </div>

      <div className="relative flex h-full flex-col items-center justify-center px-4 py-24 text-center">
        {/* Badge */}
        <div className="bg-brand-green/20 border-brand-green/40 mb-6 inline-block rounded-full border px-4 py-2 backdrop-blur">
          <span className="text-brand-green text-sm font-bold">
            🇿🇦 PROUDLY SOUTH AFRICAN AGRICULTURAL PRODUCTS
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="mb-4 max-w-4xl text-5xl font-bold leading-tight text-white md:text-6xl">
          Premium Livestock & Produce
        </h1>

        {/* Subheading */}
        <p className="mb-2 max-w-2xl text-xl text-white/90">Direct from South African Farmers</p>
        <p className="text-brand-green mb-8 text-lg font-semibold">
          Smarter Herds. Stronger Futures.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/shop"
            className="bg-brand-green transform rounded-lg px-8 py-4 font-bold text-white shadow-lg transition hover:scale-105 hover:bg-emerald-700 hover:shadow-xl"
          >
            Shop Now
          </Link>
          <Link
            href="/auction"
            className="rounded-lg border-2 border-white px-8 py-4 font-bold text-white shadow-lg transition hover:bg-white/10"
          >
            Live Auctions
          </Link>
        </div>

        {/* Features */}
        <div className="mt-12 grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-3">
          <div className="text-white">
            <div className="mb-2 text-3xl">✓</div>
            <p className="font-semibold">Quality Assured</p>
            <p className="text-sm text-white/70">Premium products verified</p>
          </div>
          <div className="text-white">
            <div className="mb-2 text-3xl">🚚</div>
            <p className="font-semibold">Fast Delivery</p>
            <p className="text-sm text-white/70">Across South Africa</p>
          </div>
          <div className="text-white">
            <div className="mb-2 text-3xl">🤝</div>
            <p className="font-semibold">Fair Prices</p>
            <p className="text-sm text-white/70">Direct from farmers</p>
          </div>
        </div>
      </div>
    </div>
  );
}
