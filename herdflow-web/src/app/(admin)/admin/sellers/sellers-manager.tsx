"use client";

import { useMemo, useState } from "react";

type Seller = {
  id: string;
  farmName: string;
  location: string;
  region: string;
  contactPhone: string;
  idDocumentUrl: string;
  status: string;
  createdAt: Date | string;
  totalSalesCents: number;
  user: { fullName: string; email: string };
  _count: { livestockListings: number; products: number };
};

type SellersManagerProps = {
  initialSellers: Seller[];
};

const STATUS_OPTIONS = ["PENDING", "APPROVED", "REJECTED"];
const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

function toCurrency(cents: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 2 }).format(
    cents / 100,
  );
}

function formatDate(v: Date | string) {
  return new Date(v).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
}

export function SellersManager({ initialSellers }: SellersManagerProps) {
  const [sellers, setSellers] = useState<Seller[]>(initialSellers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sellers.filter((s) => {
      const matchStatus = statusFilter === "ALL" || s.status === statusFilter;
      if (!matchStatus) return false;
      if (!q) return true;
      return (
        s.farmName.toLowerCase().includes(q) ||
        s.user.email.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q)
      );
    });
  }, [sellers, search, statusFilter]);

  async function updateStatus(id: string, status: string) {
    setError(null);
    setSavingId(id);
    const res = await fetch("/api/admin/sellers", {
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
    setSellers((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search farm, email, or region…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/40 w-full sm:w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/40"
        >
          <option value="ALL">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="ml-auto self-center text-xs text-gray-500">{filtered.length} sellers</span>
      </div>

      {error && <p className="rounded bg-red-50 px-4 py-2 text-sm text-red-700 border border-red-200">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Farm</th>
              <th className="px-4 py-3 text-left">Owner</th>
              <th className="px-4 py-3 text-left">Region</th>
              <th className="px-4 py-3 text-right">Livestock</th>
              <th className="px-4 py-3 text-right">Products</th>
              <th className="px-4 py-3 text-right">Total Sales</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No sellers found.</td></tr>
            )}
            {filtered.map((seller) => (
              <tr key={seller.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{seller.farmName}</div>
                  <div className="text-xs text-gray-500">{seller.location}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-gray-700">{seller.user.fullName}</div>
                  <div className="text-xs text-gray-500">{seller.user.email}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">{seller.region}</td>
                <td className="px-4 py-3 text-right text-gray-700">{seller._count.livestockListings}</td>
                <td className="px-4 py-3 text-right text-gray-700">{seller._count.products}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-800">{toCurrency(seller.totalSalesCents)}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(seller.createdAt)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[seller.status] ?? "bg-gray-100 text-gray-700"}`}>
                    {seller.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    disabled={savingId === seller.id}
                    value={seller.status}
                    onChange={(e) => updateStatus(seller.id, e.target.value)}
                    className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-navy/40 disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
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
