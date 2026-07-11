"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MultiImageUpload } from "@/components/ui/MultiImageUpload";

type Category = { id: string; name: string };

function submitToPayFast(processUrl: string, fields: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = processUrl;
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

export default function NewLivestockListingPage() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceRand, setPriceRand] = useState("");
  const [region, setRegion] = useState("");
  const [breed, setBreed] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [ageMonths, setAgeMonths] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [contactWhatsApp, setContactWhatsApp] = useState("");
  const [tier, setTier] = useState<"BASIC" | "FEATURED">("BASIC");
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
    if (!title.trim() || !description.trim() || !breed.trim() || !region.trim() || !categoryId) {
      setError("Title, description, breed, region and category are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/seller/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          priceCents: Math.round(Number(priceRand || 0) * 100),
          region,
          breed,
          weightKg: weightKg ? Number(weightKg) : undefined,
          ageMonths: ageMonths ? Number(ageMonths) : undefined,
          categoryId,
          photos,
          contactWhatsApp,
          tier,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create listing.");
        return;
      }
      submitToPayFast(data.payment.processUrl, data.payment.fields);
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  if (checking) {
    return <p className="p-12 text-center text-sm text-[#5d7497]">Loading…</p>;
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-lg p-12 text-center">
        <p className="mb-4 text-[#5d7497]">You need an approved seller account to list livestock.</p>
        <Link href="/register/seller" className="text-[#2E7D32] underline">
          Apply to become a seller
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-black text-[#1B3A6B]">New Livestock Listing</h1>
        <p className="mt-1 text-sm text-[#5d7497]">
          Choose a listing tier, pay the fee, and your listing goes live immediately.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tier picker */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setTier("BASIC")}
          className={`rounded-2xl border-2 p-5 text-left transition ${
            tier === "BASIC" ? "border-[#1B3A6B] bg-[#eef3fb]" : "border-[#e4ebf5] bg-white"
          }`}
        >
          <p className="font-black text-[#1B3A6B]">Basic</p>
          <p className="mt-1 text-2xl font-black text-[#244367]">R49</p>
          <p className="mt-1 text-xs text-[#5d7497]">Standard listing, 30 days</p>
        </button>
        <button
          type="button"
          onClick={() => setTier("FEATURED")}
          className={`rounded-2xl border-2 p-5 text-left transition ${
            tier === "FEATURED" ? "border-[#A07C3A] bg-[#A07C3A]/10" : "border-[#e4ebf5] bg-white"
          }`}
        >
          <p className="font-black text-[#A07C3A]">Featured</p>
          <p className="mt-1 text-2xl font-black text-[#244367]">R149</p>
          <p className="mt-1 text-xs text-[#5d7497]">Pinned to top, 30 days</p>
        </button>
      </div>

      <div className="space-y-4 rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-sm">
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-[#244367]">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
            <span className="mb-1 block font-semibold text-[#244367]">Breed</span>
            <input
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Weight (kg, optional)</span>
            <input
              type="number"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Age (months, optional)</span>
            <input
              type="number"
              value={ageMonths}
              onChange={(e) => setAgeMonths(e.target.value)}
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

        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-[#244367]">WhatsApp Number (optional)</span>
          <input
            value={contactWhatsApp}
            onChange={(e) => setContactWhatsApp(e.target.value)}
            placeholder="+27 82 123 4567"
            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
          />
        </label>

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
          {saving ? "Processing…" : `Pay R${tier === "FEATURED" ? "149" : "49"} & Publish`}
        </button>
      </div>
    </div>
  );
}
