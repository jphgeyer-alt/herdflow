"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ClaimButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function claim() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/logistics/requests/${requestId}/claim`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to claim this job.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={claim}
        className="w-full rounded-lg bg-[#2E7D32] py-3 font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20] disabled:opacity-50"
      >
        {busy ? "Claiming…" : "Claim This Job"}
      </button>
    </div>
  );
}

export function StatusButton({
  requestId,
  nextStatus,
  label,
}: {
  requestId: string;
  nextStatus: "IN_TRANSIT" | "DELIVERED";
  label: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function update() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/logistics/requests/${requestId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update status.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={update}
        className="w-full rounded-lg bg-[#1B3A6B] py-3 font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#122844] disabled:opacity-50"
      >
        {busy ? "Updating…" : label}
      </button>
    </div>
  );
}
