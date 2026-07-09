"use client";

import { useMemo, useState } from "react";
import { HerdflowTrusted } from "@/components/ui/HerdflowTrusted";

type Partner = {
  id: string;
  companyName: string;
  fleetSize: number;
  routesCovered: string;
  vehicleDocumentsUrl: string;
  status: string;
  createdAt: Date | string;
  user: { fullName: string; email: string };
};

type LogisticsManagerProps = {
  initialPartners: Partner[];
};

const STATUS_OPTIONS = ["PENDING", "APPROVED", "REJECTED"];
const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

function formatDate(v: Date | string) {
  return new Date(v).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function LogisticsManager({ initialPartners }: LogisticsManagerProps) {
  const [partners, setPartners] = useState<Partner[]>(initialPartners);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return partners.filter((p) => {
      const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
      if (!matchStatus) return false;
      if (!q) return true;
      return (
        p.companyName.toLowerCase().includes(q) ||
        p.user.email.toLowerCase().includes(q) ||
        p.routesCovered.toLowerCase().includes(q)
      );
    });
  }, [partners, search, statusFilter]);

  async function updateStatus(id: string, status: string) {
    setError(null);
    setSavingId(id);
    const res = await fetch("/api/admin/logistics", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setSavingId(null);
    if (!res.ok) {
      const p = await res.json().catch(() => ({}));
      setError(typeof p.error === "string" ? p.error : "Failed to update.");
      return;
    }
    setPartners((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search company, email, or routes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="focus:ring-brand-navy/40 w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 sm:w-64"
        />
        <select
          aria-label="Filter logistics partners by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="focus:ring-brand-navy/40 rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
        >
          <option value="ALL">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="ml-auto self-center text-xs text-gray-500">
          {filtered.length} partners
        </span>
      </div>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Company</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-right">Fleet Size</th>
              <th className="px-4 py-3 text-left">Routes Covered</th>
              <th className="px-4 py-3 text-left">Documents</th>
              <th className="px-4 py-3 text-left">Registered</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  No logistics partners found.
                </td>
              </tr>
            )}
            {filtered.map((partner) => (
              <tr key={partner.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">
                  <div className="space-y-1">
                    <div>{partner.companyName}</div>
                    {partner.status === "APPROVED" && <HerdflowTrusted compact />}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-gray-700">{partner.user.fullName}</div>
                  <div className="text-xs text-gray-500">{partner.user.email}</div>
                </td>
                <td className="px-4 py-3 text-right text-gray-700">{partner.fleetSize}</td>
                <td className="max-w-xs truncate px-4 py-3 text-gray-600">
                  {partner.routesCovered}
                </td>
                <td className="px-4 py-3">
                  {partner.vehicleDocumentsUrl ? (
                    <a
                      href={partner.vehicleDocumentsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-navy text-xs underline"
                    >
                      View
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{formatDate(partner.createdAt)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[partner.status] ?? "bg-gray-100 text-gray-700"}`}
                  >
                    {partner.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    aria-label={`Update status for ${partner.companyName}`}
                    disabled={savingId === partner.id}
                    value={partner.status}
                    onChange={(e) => updateStatus(partner.id, e.target.value)}
                    className="focus:ring-brand-navy/40 rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
