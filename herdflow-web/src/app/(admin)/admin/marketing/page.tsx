"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { formatRand } from "@/lib/marketing/format";
import { SingleImageUpload } from "@/components/ui/SingleImageUpload";

type PackageOption = {
  id: string;
  name: string;
  monthlyFee: string;
  isActive: boolean;
};

type SponsorRow = {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  website: string | null;
  businessType: string;
  package: string;
  packageId: string | null;
  targetProvinces: string[];
  marketingGoal: string;
  brief: string | null;
  logoUrl: string | null;
  status: string;
  createdAt: string;
  monthlyFee: string | null;
  notes: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-700",
};

function EditSponsorModal({
  sponsor,
  packages,
  onClose,
  onSaved,
}: {
  sponsor: SponsorRow;
  packages: PackageOption[];
  onClose: () => void;
  onSaved: (updated: SponsorRow) => void;
}) {
  const [form, setForm] = useState({
    companyName: sponsor.companyName,
    contactPerson: sponsor.contactPerson,
    email: sponsor.email,
    phone: sponsor.phone,
    website: sponsor.website ?? "",
    logoUrl: sponsor.logoUrl,
    businessType: sponsor.businessType,
    packageId: sponsor.packageId ?? "",
    monthlyFee: sponsor.monthlyFee ?? "",
    notes: sponsor.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/marketing/sponsors/${sponsor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          packageId: form.packageId || null,
          monthlyFee: form.monthlyFee === "" ? null : Number(form.monthlyFee),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save.");
        return;
      }
      onSaved(data.sponsor);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1B3A6B]">Edit Sponsor</h2>
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { key: "companyName", label: "Company Name" },
            { key: "contactPerson", label: "Contact Person" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "website", label: "Website" },
            { key: "businessType", label: "Business Type" },
          ].map((f) => (
            <label key={f.key} className="text-sm">
              <span className="mb-1 block font-semibold text-[#244367]">{f.label}</span>
              <input
                value={form[f.key as keyof typeof form] as string}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
              />
            </label>
          ))}

          <div className="sm:col-span-2">
            <SingleImageUpload
              label="Logo"
              value={form.logoUrl}
              onChange={(url) => setForm((p) => ({ ...p, logoUrl: url }))}
              hint="Shown in the sponsor logo strip across the site."
            />
          </div>

          <label className="text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Package</span>
            <select
              value={form.packageId}
              onChange={(e) => setForm((p) => ({ ...p, packageId: e.target.value }))}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            >
              <option value="">— None —</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id} disabled={!p.isActive}>
                  {p.name} ({formatRand(p.monthlyFee)}/mo){!p.isActive ? " — inactive" : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">
              Monthly Fee Override (R)
            </span>
            <input
              type="number"
              value={form.monthlyFee}
              onChange={(e) => setForm((p) => ({ ...p, monthlyFee: e.target.value }))}
              placeholder="Leave blank to use package price"
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>

          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block font-semibold text-[#244367]">Internal Notes</span>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#cdd8e7] px-4 py-2 text-sm font-semibold text-[#5d7497]"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminMarketingPage() {
  const router = useRouter();
  const [sponsors, setSponsors] = useState<SponsorRow[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "ACTIVE" | "REJECTED">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<SponsorRow | null>(null);
  const [creatingQuoteFor, setCreatingQuoteFor] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/marketing").then((r) => r.json()),
      fetch("/api/admin/marketing/packages").then((r) => r.json()),
    ])
      .then(([sponsorData, packageData]) => {
        setSponsors(sponsorData.sponsors || []);
        setPackages(packageData.packages || []);
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

  async function createQuote(sponsor: SponsorRow) {
    setCreatingQuoteFor(sponsor.id);
    try {
      const res = await fetch("/api/admin/marketing/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sponsorId: sponsor.id, packageId: sponsor.packageId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create quote.");
        return;
      }
      router.push(`/admin/marketing/quotes/${data.quote.id}`);
    } finally {
      setCreatingQuoteFor(null);
    }
  }

  const filtered = filter === "ALL" ? sponsors : sponsors.filter((s) => s.status === filter);

  const packageFeeById = new Map(packages.map((p) => [p.id, Number(p.monthlyFee)]));

  const stats = {
    total: sponsors.length,
    active: sponsors.filter((s) => s.status === "ACTIVE").length,
    pending: sponsors.filter((s) => s.status === "PENDING").length,
    mrr: sponsors
      .filter((s) => s.status === "ACTIVE")
      .reduce((sum, s) => {
        const fee =
          s.monthlyFee !== null
            ? Number(s.monthlyFee)
            : (packageFeeById.get(s.packageId ?? "") ?? 0);
        return sum + fee;
      }, 0),
  };

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Applications", value: stats.total },
          { label: "Active Sponsors", value: stats.active },
          { label: "Pending Review", value: stats.pending },
          { label: "Monthly Revenue", value: formatRand(stats.mrr) },
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
                        <div className="flex flex-wrap gap-2">
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
                          <button
                            onClick={() => setEditTarget(s)}
                            className="rounded-lg border border-[#cdd8e7] px-3 py-1 text-xs font-bold text-[#5d7497] transition hover:border-[#1B3A6B]"
                          >
                            Edit
                          </button>
                          <button
                            disabled={creatingQuoteFor === s.id}
                            onClick={() => createQuote(s)}
                            className="rounded-lg bg-[#1B3A6B] px-3 py-1 text-xs font-bold text-white transition hover:bg-[#122844] disabled:opacity-50"
                          >
                            {creatingQuoteFor === s.id ? "Creating…" : "New Quote"}
                          </button>
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

      {editTarget && (
        <EditSponsorModal
          sponsor={editTarget}
          packages={packages}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) =>
            setSponsors((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)))
          }
        />
      )}
    </div>
  );
}
