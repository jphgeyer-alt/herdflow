"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, Edit, Eye } from "lucide-react";

type ListingItem = {
  id: string;
  name: string;
  priceCents: number;
  photos: string[];
  stockOnHand: number;
  status: string;
};

function ProductGrid({ products }: { products: ListingItem[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-[#e4ebf5] bg-white p-12 text-center shadow-lg">
        <Package size={64} className="mx-auto mb-4 text-[#cdd8e7]" />
        <p className="mb-6 text-lg text-[#5d7497]">No listings here yet.</p>
        <Link
          href="/seller/listings/new"
          className="inline-block rounded-lg bg-[#2E7D32] px-8 py-3 font-bold text-white transition hover:bg-[#1d5e20]"
        >
          Create Your First Listing
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {products.map((product) => (
        <div
          key={product.id}
          className="overflow-hidden rounded-2xl border border-[#e4ebf5] bg-white shadow-lg"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
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
  );
}

export function ListingsTabs({
  active,
  pending,
  sold,
}: {
  active: ListingItem[];
  pending: ListingItem[];
  sold: ListingItem[];
}) {
  const [tab, setTab] = useState<"ACTIVE" | "PENDING" | "SOLD">("ACTIVE");

  const groups = { ACTIVE: active, PENDING: pending, SOLD: sold };

  return (
    <>
      <div className="mb-6 flex gap-4 border-b border-[#e4ebf5]">
        {(["ACTIVE", "PENDING", "SOLD"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-6 py-3 font-bold transition ${
              tab === t
                ? "border-b-4 border-[#2E7D32] text-[#1B3A6B]"
                : "text-[#5d7497] hover:text-[#1B3A6B]"
            }`}
          >
            {t} ({groups[t].length})
          </button>
        ))}
      </div>

      <ProductGrid products={groups[tab]} />
    </>
  );
}
