"use client";

import { useState } from "react";
import { Landmark, ShieldCheck, Tractor, Home } from "lucide-react";

type Category = {
  key: string;
  displayName: string;
  description: string;
  partnerName: string;
};

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  AGRI_FINANCE: Landmark,
  EQUIPMENT_FINANCE: Tractor,
  LIVESTOCK_INSURANCE: ShieldCheck,
  ASSET_INSURANCE: Home,
};

const isInsurance = (key: string) => key.includes("INSURANCE");

function QuoteForm({ category, onDone }: { category: Category; onDone: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [province, setProvince] = useState("");
  const [farmName, setFarmName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [redirect, setRedirect] = useState<{ url: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !phone.trim() || !province.trim()) {
      setError("Name, phone, and province are required.");
      return;
    }
    setSaving(true);
    try {
      const insurance = isInsurance(category.key);
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryKey: category.key,
          name,
          phone,
          email: email || undefined,
          province,
          farmName: farmName || undefined,
          message: message || undefined,
          amountSought: !insurance && amount ? Number(amount) : undefined,
          livestockValue: insurance && amount ? Number(amount) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit. Please try again.");
        return;
      }
      if (data.useExternalRedirect && data.externalUrl) {
        setRedirect({ url: data.externalUrl });
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="mb-2 font-black text-[#1B3A6B]">Request received!</p>
        <p className="mb-4 text-sm text-[#5d7497]">
          We&apos;ve referred your details to {category.partnerName}. They&apos;ll contact you
          directly. A confirmation has been emailed to you.
        </p>
        {redirect && (
          <a
            href={redirect.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 inline-block rounded-lg bg-[#2E7D32] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20]"
          >
            Continue to Secure Application
          </a>
        )}
        <button
          type="button"
          onClick={onDone}
          className="block w-full text-sm font-semibold text-[#1B3A6B] underline"
        >
          Back to categories
        </button>
      </div>
    );
  }

  const insurance = isInsurance(category.key);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full Name *"
          className="col-span-2 w-full rounded-lg border border-[#cdd8e7] px-4 py-3 text-sm focus:border-[#1B3A6B] focus:outline-none sm:col-span-1"
        />
        <input
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone Number *"
          className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 text-sm focus:border-[#1B3A6B] focus:outline-none"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email Address"
          className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 text-sm focus:border-[#1B3A6B] focus:outline-none"
        />
        <input
          required
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          placeholder="Province *"
          className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 text-sm focus:border-[#1B3A6B] focus:outline-none"
        />
        <input
          value={farmName}
          onChange={(e) => setFarmName(e.target.value)}
          placeholder="Farm Name (optional)"
          className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 text-sm focus:border-[#1B3A6B] focus:outline-none"
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={insurance ? "Livestock Value (R)" : "Amount Sought (R)"}
          className="col-span-2 w-full rounded-lg border border-[#cdd8e7] px-4 py-3 text-sm focus:border-[#1B3A6B] focus:outline-none"
        />
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Anything else we should know? (optional)"
          className="col-span-2 w-full rounded-lg border border-[#cdd8e7] px-4 py-3 text-sm focus:border-[#1B3A6B] focus:outline-none"
        />
      </div>

      <div className="rounded-lg border border-[#e4ebf5] bg-[#f5f8fd] p-3 text-xs leading-relaxed text-[#5d7497]">
        HerdFlow is not a Financial Services Provider and does not provide financial advice or
        intermediary services. Quote requests are referred to independent, FSCA-licensed
        providers who will contact you directly. HerdFlow may receive a referral fee from
        partners.
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-[#2E7D32] py-3 font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Submitting…" : `Get ${category.displayName} Quote`}
      </button>
    </form>
  );
}

export function FinanceClient({ categories }: { categories: Category[] }) {
  const [selected, setSelected] = useState<Category | null>(null);

  if (selected) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-[#e4ebf5] bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-black text-[#1B3A6B]">{selected.displayName}</h2>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="text-sm text-[#5d7497] hover:underline"
          >
            ← Back
          </button>
        </div>
        <QuoteForm category={selected} onDone={() => setSelected(null)} />
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {categories.map((c) => {
        const Icon = ICONS[c.key] ?? Landmark;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => setSelected(c)}
            className="rounded-2xl border border-[#e4ebf5] bg-white p-6 text-left shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2E7D32]/10">
              <Icon size={26} className="text-[#2E7D32]" />
            </div>
            <h3 className="mb-2 text-lg font-black text-[#1B3A6B]">{c.displayName}</h3>
            <p className="mb-3 text-sm text-[#5d7497]">{c.description}</p>
            <span className="text-sm font-bold text-[#A07C3A]">Get a Quote →</span>
          </button>
        );
      })}
    </div>
  );
}
