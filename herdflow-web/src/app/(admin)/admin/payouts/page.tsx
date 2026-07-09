"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatRand } from "@/lib/marketing/format";

type PendingBalance = { sellerId: string; farmName: string; amountCents: number };
type PayoutRow = {
  id: string;
  number: string;
  amountCents: number;
  status: string;
  paymentReference: string | null;
  createdAt: string;
  paidAt: string | null;
  seller: { farmName: string };
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

function MarkPaidRow({ payout, onDone }: { payout: PayoutRow; onDone: (p: PayoutRow) => void }) {
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function markPaid() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/payouts/${payout.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID", paymentReference: reference || undefined }),
      });
      const data = await res.json();
      if (res.ok) onDone(data.payout);
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/payouts/${payout.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const data = await res.json();
      if (res.ok) onDone(data.payout);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg bg-[#2E7D32] px-3 py-1 text-xs font-bold text-white hover:bg-[#1d5e20]"
        >
          Mark Paid
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={cancel}
          className="rounded-lg border border-[#cdd8e7] px-3 py-1 text-xs font-bold text-[#5d7497] hover:border-red-400 hover:text-red-600"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder="Payment ref (optional)"
        className="w-36 rounded-lg border border-[#cdd8e7] px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
      />
      <button
        type="button"
        disabled={busy}
        onClick={markPaid}
        className="rounded-lg bg-[#2E7D32] px-3 py-1 text-xs font-bold text-white disabled:opacity-60"
      >
        Confirm
      </button>
    </div>
  );
}

export default function AdminPayoutsPage() {
  const [pending, setPending] = useState<PendingBalance[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/payouts/pending").then((r) => r.json()),
      fetch("/api/admin/payouts").then((r) => r.json()),
    ])
      .then(([pendingData, payoutsData]) => {
        setPending(pendingData.pending || []);
        setPayouts(payoutsData.payouts || []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function createPayout(sellerId: string) {
    setCreating(sellerId);
    setError("");
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create payout.");
        return;
      }
      load();
    } finally {
      setCreating(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1B3A6B]">Seller Payouts</h1>
          <p className="mt-1 text-sm text-[#5d7497]">
            Track what HerdFlow owes each seller and settle it via EFT.
          </p>
        </div>
        <Link href="/admin" className="text-sm text-[#2E7D32] hover:underline">
          ← Dashboard
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1B3A6B]">Pending Balances</h2>
        <div className="overflow-hidden rounded-xl border border-[#e4ebf5] bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-sm text-[#5d7497]">Loading…</div>
          ) : pending.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#5d7497]">
              No sellers currently owed a payout.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#f5f8fd] text-xs font-semibold uppercase tracking-wide text-[#5d7497]">
                <tr>
                  <th className="px-4 py-3 text-left">Seller</th>
                  <th className="px-4 py-3 text-left">Owed</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4f9]">
                {pending.map((p) => (
                  <tr key={p.sellerId}>
                    <td className="px-4 py-3 font-semibold text-[#1B3A6B]">{p.farmName}</td>
                    <td className="px-4 py-3 font-bold text-[#244367]">
                      {formatRand(p.amountCents / 100)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={creating === p.sellerId}
                        onClick={() => createPayout(p.sellerId)}
                        className="rounded-lg bg-[#1B3A6B] px-3 py-1 text-xs font-bold text-white transition hover:bg-[#122844] disabled:opacity-50"
                      >
                        {creating === p.sellerId ? "Creating…" : "Create Payout"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1B3A6B]">Payout History</h2>
        <div className="overflow-hidden rounded-xl border border-[#e4ebf5] bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-sm text-[#5d7497]">Loading…</div>
          ) : payouts.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#5d7497]">No payouts yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#f5f8fd] text-xs font-semibold uppercase tracking-wide text-[#5d7497]">
                <tr>
                  <th className="px-4 py-3 text-left">Number</th>
                  <th className="px-4 py-3 text-left">Seller</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4f9]">
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-semibold text-[#1B3A6B]">{p.number}</td>
                    <td className="px-4 py-3 text-[#244367]">{p.seller.farmName}</td>
                    <td className="px-4 py-3 font-bold text-[#244367]">
                      {formatRand(p.amountCents / 100)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#5d7497]">{p.paymentReference || "—"}</td>
                    <td className="px-4 py-3">
                      {p.status === "PENDING" && (
                        <MarkPaidRow
                          payout={p}
                          onDone={(updated) => {
                            setPayouts((prev) =>
                              prev.map((row) => (row.id === updated.id ? updated : row)),
                            );
                            load();
                          }}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
