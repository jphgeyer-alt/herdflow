"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { formatRand } from "@/lib/marketing/format";

type QuoteRow = {
  id: string;
  number: string;
  description: string;
  amount: string;
  status: string;
  validUntil: string;
  createdAt: string;
  sponsor: { companyName: string; email: string };
};

type SponsorOption = { id: string; companyName: string; packageId: string | null };
type PackageOption = { id: string; name: string; monthlyFee: string };

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-green-100 text-green-700",
  DECLINED: "bg-red-100 text-red-700",
  EXPIRED: "bg-slate-100 text-slate-500",
};

const TABS = ["ALL", "DRAFT", "SENT", "ACCEPTED", "DECLINED", "EXPIRED"] as const;

function NewQuoteModal({
  sponsors,
  packages,
  onClose,
  onCreated,
}: {
  sponsors: SponsorOption[];
  packages: PackageOption[];
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [sponsorId, setSponsorId] = useState("");
  const [packageId, setPackageId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
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
      const res = await fetch("/api/admin/marketing/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sponsorId,
          packageId: packageId || undefined,
          amount: amount === "" ? undefined : Number(amount),
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create quote.");
        return;
      }
      onCreated(data.quote.id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1B3A6B]">New Quote</h2>
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
            <span className="mb-1 block font-semibold text-[#244367]">Package (optional)</span>
            <select
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            >
              <option value="">— Custom / no package —</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatRand(p.monthlyFee)}/mo)
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">
              Amount (R) — leave blank to use package price
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Notes (optional)</span>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
            {saving ? "Creating…" : "Create Quote"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuotesAdminPage() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [sponsors, setSponsors] = useState<SponsorOption[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [filter, setFilter] = useState<(typeof TABS)[number]>("ALL");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  function load(status: string) {
    setLoading(true);
    const qs = status === "ALL" ? "" : `?status=${status}`;
    fetch(`/api/admin/marketing/quotes${qs}`)
      .then((r) => r.json())
      .then((d) => setQuotes(d.quotes || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(filter);
  }, [filter]);

  useEffect(() => {
    fetch("/api/admin/marketing")
      .then((r) => r.json())
      .then((d) => setSponsors(d.sponsors || []));
    fetch("/api/admin/marketing/packages")
      .then((r) => r.json())
      .then((d) =>
        setPackages(
          (d.packages || []).filter((p: PackageOption & { isActive: boolean }) => p.isActive),
        ),
      );
  }, []);

  if (createdId) {
    return (
      <div className="rounded-xl border border-[#e4ebf5] bg-white p-8 text-center">
        <p className="mb-4 text-sm text-[#5d7497]">Quote created.</p>
        <Link
          href={`/admin/marketing/quotes/${createdId}`}
          className="rounded-lg bg-[#1B3A6B] px-4 py-2 text-sm font-bold text-white"
        >
          View Quote →
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
          + New Quote
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e4ebf5] bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#5d7497]">Loading…</div>
        ) : quotes.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#5d7497]">No quotes found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#f5f8fd] text-xs font-semibold uppercase tracking-wide text-[#5d7497]">
              <tr>
                <th className="px-4 py-3 text-left">Number</th>
                <th className="px-4 py-3 text-left">Sponsor</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Valid Until</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f9]">
              {quotes.map((q) => (
                <tr
                  key={q.id}
                  className="cursor-pointer hover:bg-[#f5f8fd]"
                  onClick={() => (window.location.href = `/admin/marketing/quotes/${q.id}`)}
                >
                  <td className="px-4 py-3 font-semibold text-[#1B3A6B]">{q.number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#244367]">{q.sponsor.companyName}</div>
                    <div className="text-xs text-[#5d7497]">{q.sponsor.email}</div>
                  </td>
                  <td className="px-4 py-3 text-[#244367]">{formatRand(q.amount)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[q.status] ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#5d7497]">
                    {new Date(q.validUntil).toLocaleDateString("en-ZA")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showNew && (
        <NewQuoteModal
          sponsors={sponsors}
          packages={packages}
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
