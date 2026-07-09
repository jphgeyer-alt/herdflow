"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SponsorRow = {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  package: string;
  status: string;
  createdAt: string;
  monthlyFee: number | null;
  businessType: string;
  phone: string;
  website: string | null;
  targetProvinces: string[];
  marketingGoal: string;
  brief: string | null;
  logoUrl: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-700",
};

export default function AdminMarketingPage() {
  const [sponsors, setSponsors] = useState<SponsorRow[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "ACTIVE" | "REJECTED">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/marketing")
      .then((r) => r.json())
      .then((d) => {
        setSponsors(d.sponsors || []);
      })
      .catch(() => setError("Failed to load sponsors."))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    setSaving(id);
    const res = await fetch("/api/admin/marketing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await res.json();
    setSaving(null);
    if (!res.ok) {
      setError(data.error || "Failed to update.");
      return;
    }
    setSponsors((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  }

  const filtered = filter === "ALL" ? sponsors : sponsors.filter((s) => s.status === filter);

  const stats = {
    total: sponsors.length,
    active: sponsors.filter((s) => s.status === "ACTIVE").length,
    pending: sponsors.filter((s) => s.status === "PENDING").length,
    mrr: sponsors
      .filter((s) => s.status === "ACTIVE")
      .reduce((sum, s) => {
        const fees: Record<string, number> = { starter: 2500, growth: 5500, premium: 12000 };
        return sum + (s.monthlyFee ?? fees[s.package] ?? 0);
      }, 0),
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1B3A6B]">Marketing & Sponsors</h1>
          <p className="mt-1 text-sm text-[#5d7497]">
            Review sponsorship applications and manage active sponsors.
          </p>
        </div>
        <Link href="/admin" className="text-sm text-[#2E7D32] hover:underline">
          ← Dashboard
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Applications", value: stats.total },
          { label: "Active Sponsors", value: stats.active },
          { label: "Pending Review", value: stats.pending },
          { label: "Monthly Revenue", value: `R ${stats.mrr.toLocaleString()}` },
        ].map((s) => (
          <article
            key={s.label}
            className="rounded-xl border border-[#e4ebf5] bg-white p-4 shadow-sm"
          >
            <p className="text-xs uppercase tracking-wide text-[#5d7497]">{s.label}</p>
            <p className="mt-1 text-2xl font-black text-[#1B3A6B]">{s.value}</p>
          </article>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "PENDING", "ACTIVE", "REJECTED"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              filter === tab
                ? "bg-[#1B3A6B] text-white"
                : "border border-[#cdd8e7] bg-white text-[#5d7497] hover:border-[#1B3A6B]"
            }`}
          >
            {tab}{" "}
            {tab === "ALL"
              ? `(${stats.total})`
              : tab === "PENDING"
                ? `(${stats.pending})`
                : tab === "ACTIVE"
                  ? `(${stats.active})`
                  : ""}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#e4ebf5] bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#5d7497]">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#5d7497]">
            No {filter !== "ALL" ? filter.toLowerCase() : ""} applications found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f5f8fd] text-xs font-semibold uppercase tracking-wide text-[#5d7497]">
                <tr>
                  <th className="px-4 py-3 text-left">Company</th>
                  <th className="px-4 py-3 text-left">Package</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Applied</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4f9]">
                {filtered.map((s) => (
                  <>
                    <tr
                      key={s.id}
                      className="cursor-pointer transition hover:bg-[#f5f8fd]"
                      onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#1B3A6B]">{s.companyName}</div>
                        <div className="text-xs text-[#5d7497]">{s.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium capitalize text-[#244367]">{s.package}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[s.status] ?? "bg-gray-100 text-gray-700"}`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#5d7497]">
                        {new Date(s.createdAt).toLocaleDateString("en-ZA")}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          {s.status !== "ACTIVE" && (
                            <button
                              disabled={saving === s.id}
                              onClick={() => updateStatus(s.id, "ACTIVE")}
                              className="rounded-lg bg-[#2E7D32] px-3 py-1 text-xs font-bold text-white transition hover:bg-[#1d5e20] disabled:opacity-50"
                            >
                              Approve
                            </button>
                          )}
                          {s.status !== "REJECTED" && (
                            <button
                              disabled={saving === s.id}
                              onClick={() => updateStatus(s.id, "REJECTED")}
                              className="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expanded === s.id && (
                      <tr key={`${s.id}-detail`} className="bg-[#f5f8fd]">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                            <div>
                              <span className="text-[#5d7497]">Contact</span>
                              <br />
                              <strong>{s.contactPerson}</strong>
                            </div>
                            <div>
                              <span className="text-[#5d7497]">Phone</span>
                              <br />
                              <strong>{s.phone}</strong>
                            </div>
                            <div>
                              <span className="text-[#5d7497]">Business Type</span>
                              <br />
                              <strong>{s.businessType}</strong>
                            </div>
                            <div>
                              <span className="text-[#5d7497]">Goal</span>
                              <br />
                              <strong>{s.marketingGoal}</strong>
                            </div>
                            <div>
                              <span className="text-[#5d7497]">Provinces</span>
                              <br />
                              <strong>{s.targetProvinces.join(", ") || "—"}</strong>
                            </div>
                            {s.website && (
                              <div>
                                <span className="text-[#5d7497]">Website</span>
                                <br />
                                <a
                                  href={s.website}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#2E7D32] hover:underline"
                                >
                                  {s.website}
                                </a>
                              </div>
                            )}
                            {s.brief && (
                              <div className="col-span-full">
                                <span className="text-[#5d7497]">Brief</span>
                                <br />
                                {s.brief}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
