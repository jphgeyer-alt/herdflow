"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { formatRand } from "@/lib/marketing/format";

type PackageRow = {
  id: string;
  slug: string;
  name: string;
  monthlyFee: string;
  badge: string | null;
  isCustom: boolean;
  features: string[];
  isActive: boolean;
  sortOrder: number;
};

function PackageModal({
  pkg,
  onClose,
  onSaved,
  onCreated,
}: {
  pkg: PackageRow | null;
  onClose: () => void;
  onSaved: (updated: PackageRow) => void;
  onCreated: (created: PackageRow) => void;
}) {
  const [form, setForm] = useState({
    name: pkg?.name ?? "",
    monthlyFee: pkg?.monthlyFee ?? "0",
    badge: pkg?.badge ?? "",
    isCustom: pkg?.isCustom ?? false,
    isActive: pkg?.isActive ?? true,
    sortOrder: pkg?.sortOrder ?? 0,
    featuresText: pkg?.features.join("\n") ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    const payload = {
      name: form.name,
      monthlyFee: Number(form.monthlyFee),
      badge: form.badge || null,
      isCustom: form.isCustom,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder),
      features: form.featuresText
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
    };
    try {
      const res = await fetch(
        pkg ? `/api/admin/marketing/packages/${pkg.id}` : "/api/admin/marketing/packages",
        {
          method: pkg ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save.");
        return;
      }
      if (pkg) onSaved(data.package);
      else onCreated(data.package);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1B3A6B]">
            {pkg ? "Edit Package" : "New Package"}
          </h2>
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
            <span className="mb-1 block font-semibold text-[#244367]">Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-[#244367]">Monthly Fee (R)</span>
              <input
                type="number"
                value={form.monthlyFee}
                onChange={(e) => setForm((p) => ({ ...p, monthlyFee: e.target.value }))}
                className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-[#244367]">Badge (optional)</span>
              <input
                value={form.badge}
                onChange={(e) => setForm((p) => ({ ...p, badge: e.target.value }))}
                placeholder="e.g. MOST POPULAR"
                className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Features (one per line)</span>
            <textarea
              rows={6}
              value={form.featuresText}
              onChange={(e) => setForm((p) => ({ ...p, featuresText: e.target.value }))}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-[#244367]">
              <input
                type="checkbox"
                checked={form.isCustom}
                onChange={(e) => setForm((p) => ({ ...p, isCustom: e.target.checked }))}
              />
              Custom pricing (hide price on public page)
            </label>
            <label className="flex items-center gap-2 text-sm text-[#244367]">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              />
              Active
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Sort Order</span>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
              className="w-32 rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
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
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PackagesAdminPage() {
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<PackageRow | null | "new">(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/marketing/packages")
      .then((r) => r.json())
      .then((d) => setPackages(d.packages || []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function toggleActive(pkg: PackageRow) {
    const res = await fetch(`/api/admin/marketing/packages/${pkg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !pkg.isActive }),
    });
    const data = await res.json();
    if (res.ok) {
      setPackages((prev) => prev.map((p) => (p.id === pkg.id ? data.package : p)));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEditTarget("new")}
          className="rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-bold text-white hover:bg-[#1d5e20]"
        >
          + New Package
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e4ebf5] bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#5d7497]">Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#f5f8fd] text-xs font-semibold uppercase tracking-wide text-[#5d7497]">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Badge</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f9]">
              {packages.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-semibold text-[#1B3A6B]">{p.name}</td>
                  <td className="px-4 py-3 text-[#244367]">
                    {p.isCustom ? "Custom" : `${formatRand(p.monthlyFee)}/mo`}
                  </td>
                  <td className="px-4 py-3 text-[#5d7497]">{p.badge || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        p.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditTarget(p)}
                        className="rounded-lg border border-[#cdd8e7] px-3 py-1 text-xs font-bold text-[#5d7497] hover:border-[#1B3A6B]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(p)}
                        className="rounded-lg border border-[#cdd8e7] px-3 py-1 text-xs font-bold text-[#5d7497] hover:border-[#1B3A6B]"
                      >
                        {p.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editTarget && (
        <PackageModal
          pkg={editTarget === "new" ? null : editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) =>
            setPackages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
          }
          onCreated={(created) => setPackages((prev) => [...prev, created])}
        />
      )}
    </div>
  );
}
