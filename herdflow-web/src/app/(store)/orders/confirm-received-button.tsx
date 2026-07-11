"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ConfirmReceivedButton({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${orderNumber}/confirm`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to confirm order.");
        setSaving(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="text-right">
      {error && <p className="mb-1 text-xs text-red-600">{error}</p>}
      <button
        type="button"
        onClick={confirm}
        disabled={saving}
        className="rounded-lg bg-[#2E7D32] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-[#1d5e20] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Confirming…" : "Confirm Received"}
      </button>
    </div>
  );
}
