"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MultiImageUpload } from "@/components/ui/MultiImageUpload";

type Category = { id: string; name: string };

export default function NewSellerProductPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceRand, setPriceRand] = useState("");
  const [stockOnHand, setStockOnHand] = useState("0");
  const [region, setRegion] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.sellerProfile?.status === "APPROVED") {
          setAllowed(true);
          fetch("/api/seller/categories")
            .then((r) => r.json())
            .then((cd) => setCategories(cd.categories || []));
        }
      })
      .finally(() => setChecking(false));
  }, []);

  async function save() {
    setError("");
    if (!name.trim() || !description.trim() || !categoryId) {
      setError("Name, description and category are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          priceCents: Math.round(Number(priceRand || 0) * 100),
          stockOnHand: Number(stockOnHand || 0),
          region,
          categoryId,
          photos,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create product.");
        return;
      }
      router.push("/dashboard/seller");
    } finally {
      setSaving(false);
    }
  }

  if (checking) {
    return <p className="p-12 text-center text-sm text-[#5d7497]">Loading…</p>;
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-lg p-12 text-center">
        <p className="mb-4 text-[#5d7497]">You need an approved seller account to list products.</p>
        <Link href="/register/seller" className="text-[#2E7D32] underline">
          Apply to become a seller
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-black text-[#1B3A6B]">New Product</h1>
        <p className="mt-1 text-sm text-[#5d7497]">
          New listings are reviewed by HerdFlow before they go live on the shop.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4 rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-sm">
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-[#244367]">Product Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-[#244367]">Description</span>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Price (R)</span>
            <input
              type="number"
              value={priceRand}
              onChange={(e) => setPriceRand(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Stock on Hand</span>
            <input
              type="number"
              value={stockOnHand}
              onChange={(e) => setStockOnHand(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Category</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            >
              <option value="">— Select —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Region</span>
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>
        </div>

        <MultiImageUpload label="Photos" values={photos} onChange={setPhotos} />
      </div>

      <div className="flex justify-end gap-3">
        <Link
          href="/dashboard/seller"
          className="rounded-lg border border-[#cdd8e7] px-4 py-2 text-sm font-semibold text-[#5d7497]"
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-[#2E7D32] px-6 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "Creating…" : "Create Product"}
        </button>
      </div>
    </div>
  );
}
