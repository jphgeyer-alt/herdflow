"use client";

import { useState } from "react";

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

export function ResourceCheckoutClient({ slug, price }: { slug: string; price: number }) {
  const [open, setOpen] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function checkout(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!buyerEmail.trim()) {
      setError("Email is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/digital-products/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, buyerName, buyerEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start checkout.");
        setSaving(false);
        return;
      }
      submitToPayFast(data.payment.processUrl, data.payment.fields);
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg bg-[#2E7D32] py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20] sm:w-auto sm:px-10"
      >
        Buy Now — R{price.toFixed(2)}
      </button>
    );
  }

  return (
    <form onSubmit={checkout} className="space-y-4 rounded-xl border border-[#e4ebf5] bg-[#f5f8fd] p-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      <input
        value={buyerName}
        onChange={(e) => setBuyerName(e.target.value)}
        placeholder="Full Name"
        className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 text-sm focus:border-[#1B3A6B] focus:outline-none"
      />
      <input
        required
        type="email"
        value={buyerEmail}
        onChange={(e) => setBuyerEmail(e.target.value)}
        placeholder="Email Address *"
        className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 text-sm focus:border-[#1B3A6B] focus:outline-none"
      />
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-[#2E7D32] py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20] disabled:opacity-50"
      >
        {saving ? "Processing…" : `Pay R${price.toFixed(2)} & Download`}
      </button>
    </form>
  );
}
