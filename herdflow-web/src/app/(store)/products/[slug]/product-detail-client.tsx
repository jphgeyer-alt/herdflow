"use client";

import { useMemo, useState } from "react";
import { SafeImg } from "@/components/safe-img";

type ProductImage = {
  src: string;
  alt: string;
};

type ProductDetailClientProps = {
  slug: string;
  name: string;
  description: string;
  priceLabel: string;
  stockOnHand: number;
  images: ProductImage[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ProductDetailClient({
  slug,
  name,
  description,
  priceLabel,
  stockOnHand,
  images,
}: ProductDetailClientProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const maxQty = useMemo(() => Math.max(1, Math.min(stockOnHand, 99)), [stockOnHand]);
  const selectedImage = images[selectedIndex] || images[0];
  const canPurchase = stockOnHand > 0;

  return (
    <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-3">
        <div className="overflow-hidden rounded-2xl border border-[#d8e0ec] bg-white shadow-sm">
          {selectedImage ? (
            <SafeImg
              alt={selectedImage.alt}
              className="h-[380px] w-full object-cover"
              src={selectedImage.src}
            />
          ) : (
            <div className="bg-cream flex h-[380px] items-center justify-center text-sm text-[#5d7497]">
              No product image available
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {images.map((image, index) => (
            <button
              key={`${image.src}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`overflow-hidden rounded-lg border ${
                selectedIndex === index ? "border-navy ring-navy/30 ring-2" : "border-[#d8e0ec]"
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <SafeImg alt={image.alt} className="h-20 w-full object-cover" src={image.src} />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-[#d8e0ec] bg-white p-5 shadow-sm">
        <h1 className="text-brand-navy text-3xl font-semibold">{name}</h1>
        <p className="text-brand-gold text-2xl font-semibold">{priceLabel}</p>
        <p className="text-sm leading-7 text-[#38537a]">{description}</p>

        <div className="rounded-lg bg-[#eef3fb] p-3 text-sm text-[#244367]">
          <p>
            <span className="font-semibold">Stock:</span>{" "}
            {stockOnHand > 0 ? `${stockOnHand} available` : "Out of stock"}
          </p>
        </div>

        <form className="space-y-3" action="/cart" method="GET">
          <input type="hidden" name="add" value={slug} />

          <label className="text-brand-navy block text-sm font-semibold" htmlFor="qty">
            Quantity
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-[#cdd8e7] px-3 py-2 text-sm font-semibold text-[#244367]"
              onClick={() => setQuantity((prev) => clamp(prev - 1, 1, maxQty))}
              disabled={!canPurchase}
            >
              -
            </button>
            <input
              id="qty"
              name="addQty"
              type="number"
              min={1}
              max={maxQty}
              value={quantity}
              onChange={(event) => {
                const raw = Number.parseInt(event.target.value || "1", 10);
                const next = Number.isNaN(raw) ? 1 : raw;
                setQuantity(clamp(next, 1, maxQty));
              }}
              className="w-20 rounded-md border border-[#cdd8e7] px-3 py-2 text-center text-sm font-semibold text-[#244367]"
              disabled={!canPurchase}
            />
            <button
              type="button"
              className="rounded-md border border-[#cdd8e7] px-3 py-2 text-sm font-semibold text-[#244367]"
              onClick={() => setQuantity((prev) => clamp(prev + 1, 1, maxQty))}
              disabled={!canPurchase}
            >
              +
            </button>
          </div>

          <button
            type="submit"
            disabled={!canPurchase}
            className="bg-brand-navy inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {canPurchase ? "Add to Cart" : "Out of Stock"}
          </button>
        </form>
      </div>
    </section>
  );
}
