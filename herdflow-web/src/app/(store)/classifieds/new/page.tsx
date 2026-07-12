"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MultiImageUpload } from "@/components/ui/MultiImageUpload";

type Category = "FARM_EQUIPMENT" | "FARM_JOBS" | "GRAZING_LAND" | "WANTED";

const CATEGORIES: { value: Category; label: string; fee: string }[] = [
  { value: "FARM_EQUIPMENT", label: "Farm Equipment", fee: "R99 (R199 Featured)" },
  { value: "FARM_JOBS", label: "Farm Job", fee: "R149" },
  { value: "GRAZING_LAND", label: "Grazing & Land", fee: "R199" },
  { value: "WANTED", label: "Wanted", fee: "R49" },
];

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

export default function NewClassifiedPage() {
  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  const [category, setCategory] = useState<Category>("FARM_EQUIPMENT");
  const [tier, setTier] = useState<"BASIC" | "FEATURED">("BASIC");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [priceType, setPriceType] = useState("FIXED");
  const [province, setProvince] = useState("");
  const [town, setTown] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [contactPhone, setContactPhone] = useState("");
  const [contactWhatsApp, setContactWhatsApp] = useState("");
  const [jobType, setJobType] = useState("PERMANENT");
  const [hectares, setHectares] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setSignedIn(Boolean(d.user)))
      .finally(() => setChecking(false));
  }, []);

  async function save() {
    setError("");
    if (!title.trim() || !description.trim() || !province.trim() || !contactPhone.trim()) {
      setError("Title, description, province, and contact phone are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/classifieds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title,
          description,
          price: price ? Number(price) : undefined,
          priceType,
          province,
          town: town || undefined,
          photos,
          contactPhone,
          contactWhatsApp: contactWhatsApp || undefined,
          jobType: category === "FARM_JOBS" ? jobType : undefined,
          hectares: category === "GRAZING_LAND" && hectares ? Number(hectares) : undefined,
          availableFrom: category === "GRAZING_LAND" && availableFrom ? availableFrom : undefined,
          tier: category === "FARM_EQUIPMENT" ? tier : "BASIC",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create ad.");
        setSaving(false);
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

  if (!signedIn) {
    return (
      <div className="mx-auto max-w-lg p-12 text-center">
        <p className="mb-4 text-[#5d7497]">Please sign in to post a classified ad.</p>
        <Link href="/auth/login?redirect=/classifieds/new" className="text-[#2E7D32] underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-black text-[#1B3A6B]">Post a Classified Ad</h1>
        <p className="mt-1 text-sm text-[#5d7497]">
          Choose a category, complete the details, pay the fee, and your ad goes live immediately.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            className={`rounded-2xl border-2 p-4 text-left transition ${
              category === c.value ? "border-[#1B3A6B] bg-[#eef3fb]" : "border-[#e4ebf5] bg-white"
            }`}
          >
            <p className="font-black text-[#1B3A6B]">{c.label}</p>
            <p className="mt-1 text-xs text-[#5d7497]">{c.fee}</p>
          </button>
        ))}
      </div>

      {category === "FARM_EQUIPMENT" && (
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setTier("BASIC")}
            className={`rounded-2xl border-2 p-4 text-left transition ${
              tier === "BASIC" ? "border-[#1B3A6B] bg-[#eef3fb]" : "border-[#e4ebf5] bg-white"
            }`}
          >
            <p className="font-black text-[#1B3A6B]">Basic</p>
            <p className="mt-1 text-xl font-black text-[#244367]">R99</p>
          </button>
          <button
            type="button"
            onClick={() => setTier("FEATURED")}
            className={`rounded-2xl border-2 p-4 text-left transition ${
              tier === "FEATURED" ? "border-[#A07C3A] bg-[#A07C3A]/10" : "border-[#e4ebf5] bg-white"
            }`}
          >
            <p className="font-black text-[#A07C3A]">Featured</p>
            <p className="mt-1 text-xl font-black text-[#244367]">R199</p>
          </button>
        </div>
      )}

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

        {category !== "FARM_JOBS" && (
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-[#244367]">Price (R)</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-[#244367]">Price Type</span>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value)}
                className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
              >
                <option value="FIXED">Fixed</option>
                <option value="NEGOTIABLE">Negotiable</option>
                <option value="POA">Price on Application</option>
              </select>
            </label>
          </div>
        )}

        {category === "FARM_JOBS" && (
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Job Type</span>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            >
              <option value="PERMANENT">Permanent</option>
              <option value="SEASONAL">Seasonal</option>
              <option value="CONTRACT">Contract</option>
            </select>
          </label>
        )}

        {category === "GRAZING_LAND" && (
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-[#244367]">Size (hectares)</span>
              <input
                type="number"
                value={hectares}
                onChange={(e) => setHectares(e.target.value)}
                className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-[#244367]">Available From</span>
              <input
                type="date"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
              />
            </label>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Province</span>
            <input
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Town (optional)</span>
            <input
              value={town}
              onChange={(e) => setTown(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Contact Phone</span>
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">WhatsApp (optional)</span>
            <input
              value={contactWhatsApp}
              onChange={(e) => setContactWhatsApp(e.target.value)}
              placeholder="+27 82 123 4567"
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>
        </div>

        <MultiImageUpload label="Photos" values={photos} onChange={setPhotos} />
      </div>

      <div className="flex justify-end gap-3">
        <Link
          href="/classifieds"
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
          {saving ? "Processing…" : "Pay & Publish"}
        </button>
      </div>
    </div>
  );
}
