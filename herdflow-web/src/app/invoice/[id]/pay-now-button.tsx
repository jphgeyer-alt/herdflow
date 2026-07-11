"use client";

import { useState } from "react";

export function PayNowButton({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  async function handlePay() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/marketing/invoices/${invoiceId}/pay`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.payment) {
        submitToPayFast(data.payment.processUrl, data.payment.fields);
      } else {
        setError(data.error || "Failed to start payment.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handlePay}
        disabled={loading}
        className="rounded-lg bg-[#2E7D32] px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Processing…" : "Pay Now with PayFast"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
