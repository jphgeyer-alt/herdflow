"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { formatRand } from "@/lib/marketing/format";

type InvoiceRow = {
  id: string;
  number: string;
  description: string;
  amount: string;
  status: string;
  dueDate: string;
  sponsor: { companyName: string; email: string };
};

type SponsorOption = { id: string; companyName: string; packageId: string | null };

const STATUS_COLORS: Record<string, string> = {
  UNPAID: "bg-amber-100 text-amber-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

const TABS = ["ALL", "UNPAID", "PAID", "OVERDUE", "CANCELLED"] as const;

function isOverdue(inv: InvoiceRow) {
  return inv.status === "UNPAID" && new Date(inv.dueDate) < new Date();
}

function NewInvoiceModal({
  sponsors,
  onClose,
  onCreated,
}: {
  sponsors: SponsorOption[];
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [sponsorId, setSponsorId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [periodLabel, setPeriodLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    if (!sponsorId) {
      setError("Please select a sponsor.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/marketing/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sponsorId,
          description: description || undefined,
          amount: amount === "" ? undefined : Number(amount),
          periodLabel: periodLabel || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create invoice.");
        return;
      }
      onCreated(data.invoice.id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1B3A6B]">New Invoice</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[#9aabb9] hover:text-[#1B3A6B]"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Sponsor</span>
            <select
              value={sponsorId}
              onChange={(e) => setSponsorId(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            >
              <option value="">— Select sponsor —</option>
              {sponsors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.companyName}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">
              Description — leave blank to use their package name
            </span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">
              Amount (R) — leave blank to use sponsor&apos;s fee
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">
              Billing Period (optional)
            </span>
            <input
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
              placeholder="e.g. July 2026"
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#cdd8e7] px-4 py-2 text-sm font-semibold text-[#5d7497]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={create}
            disabled={saving}
            className="rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InvoicesAdminPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [sponsors, setSponsors] = useState<SponsorOption[]>([]);
  const [filter, setFilter] = useState<(typeof TABS)[number]>("ALL");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  function load(status: string) {
    setLoading(true);
    const qs = status === "ALL" ? "" : `?status=${status}`;
    fetch(`/api/admin/marketing/invoices${qs}`)
      .then((r) => r.json())
      .then((d) => setInvoices(d.invoices || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(filter);
  }, [filter]);

  useEffect(() => {
    fetch("/api/admin/marketing")
      .then((r) => r.json())
      .then((d) => setSponsors(d.sponsors || []));
  }, []);

  if (createdId) {
    return (
      <div className="rounded-xl border border-[#e4ebf5] bg-white p-8 text-center">
        <p className="mb-4 text-sm text-[#5d7497]">Invoice created.</p>
        <Link
          href={`/admin/marketing/invoices/${createdId}`}
          className="rounded-lg bg-[#1B3A6B] px-4 py-2 text-sm font-bold text-white"
        >
          View Invoice →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                filter === tab
                  ? "bg-[#1B3A6B] text-white"
                  : "border border-[#cdd8e7] bg-white text-[#5d7497] hover:border-[#1B3A6B]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-bold text-white hover:bg-[#1d5e20]"
        >
          + New Invoice
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e4ebf5] bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#5d7497]">Loading…</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#5d7497]">No invoices found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#f5f8fd] text-xs font-semibold uppercase tracking-wide text-[#5d7497]">
              <tr>
                <th className="px-4 py-3 text-left">Number</th>
                <th className="px-4 py-3 text-left">Sponsor</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f9]">
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="cursor-pointer hover:bg-[#f5f8fd]"
                  onClick={() => (window.location.href = `/admin/marketing/invoices/${inv.id}`)}
                >
                  <td className="px-4 py-3 font-semibold text-[#1B3A6B]">{inv.number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#244367]">{inv.sponsor.companyName}</div>
                    <div className="text-xs text-[#5d7497]">{inv.sponsor.email}</div>
                  </td>
                  <td className="px-4 py-3 text-[#244367]">{formatRand(inv.amount)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isOverdue(inv)
                          ? STATUS_COLORS.OVERDUE
                          : (STATUS_COLORS[inv.status] ?? "bg-gray-100 text-gray-700")
                      }`}
                    >
                      {isOverdue(inv) ? "OVERDUE" : inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#5d7497]">
                    {new Date(inv.dueDate).toLocaleDateString("en-ZA")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showNew && (
        <NewInvoiceModal
          sponsors={sponsors}
          onClose={() => setShowNew(false)}
          onCreated={(id) => {
            setShowNew(false);
            setCreatedId(id);
          }}
        />
      )}
    </div>
  );
}
