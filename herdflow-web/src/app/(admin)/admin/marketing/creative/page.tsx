"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { SingleImageUpload } from "@/components/ui/SingleImageUpload";

type SponsorOption = { id: string; companyName: string; website: string | null };
type CreativeRow = {
  id: string;
  placement: string;
  imageUrl: string;
  linkUrl: string | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  impressions: number;
  clicks: number;
  sponsor: { companyName: string };
};

const PLACEMENTS = [
  { value: "HOMEPAGE", label: "Homepage (below hero)" },
  { value: "SHOP", label: "Shop page" },
  { value: "LISTINGS", label: "Livestock Listings page" },
];

function CreativeModal({
  creative,
  sponsors,
  onClose,
  onSaved,
  onCreated,
}: {
  creative: CreativeRow | null;
  sponsors: SponsorOption[];
  onClose: () => void;
  onSaved: (updated: CreativeRow) => void;
  onCreated: (created: CreativeRow) => void;
}) {
  const [sponsorId, setSponsorId] = useState("");
  const [placement, setPlacement] = useState(creative?.placement ?? "HOMEPAGE");
  const [imageUrl, setImageUrl] = useState<string | null>(creative?.imageUrl ?? null);
  const [linkUrl, setLinkUrl] = useState(creative?.linkUrl ?? "");
  const [isActive, setIsActive] = useState(creative?.isActive ?? true);
  const [startDate, setStartDate] = useState(creative?.startDate?.slice(0, 10) ?? "");
  const [endDate, setEndDate] = useState(creative?.endDate?.slice(0, 10) ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setError("");
    if (!creative && !sponsorId) {
      setError("Please select a sponsor.");
      return;
    }
    if (!imageUrl) {
      setError("An image is required.");
      return;
    }
    setSaving(true);
    const payload = {
      ...(!creative && { sponsorId }),
      placement,
      imageUrl,
      linkUrl: linkUrl || undefined,
      isActive,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
    try {
      const res = await fetch(
        creative
          ? `/api/admin/marketing/creatives/${creative.id}`
          : "/api/admin/marketing/creatives",
        {
          method: creative ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save.");
        return;
      }
      if (creative) onSaved(data.creative);
      else onCreated(data.creative);
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
            {creative ? "Edit Creative" : "New Creative"}
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
          {!creative && (
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-[#244367]">Sponsor</span>
              <select
                value={sponsorId}
                onChange={(e) => {
                  setSponsorId(e.target.value);
                  const s = sponsors.find((x) => x.id === e.target.value);
                  if (s?.website && !linkUrl) setLinkUrl(s.website);
                }}
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
          )}
          {creative && (
            <p className="text-sm text-[#5d7497]">
              Sponsor:{" "}
              <span className="font-semibold text-[#1B3A6B]">{creative.sponsor.companyName}</span>
            </p>
          )}

          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Placement</span>
            <select
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            >
              {PLACEMENTS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <SingleImageUpload
            label="Banner Image"
            value={imageUrl}
            onChange={setImageUrl}
            required
            hint="Shown as a labeled 'Sponsored' banner on the chosen page."
          />

          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">
              Link URL — leave blank to use the sponsor&apos;s website
            </span>
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-[#244367]">Start Date (optional)</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-[#244367]">End Date (optional)</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-[#244367]">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active
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

export default function AdminCreativePage() {
  const [creatives, setCreatives] = useState<CreativeRow[]>([]);
  const [sponsors, setSponsors] = useState<SponsorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<CreativeRow | null | "new">(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/marketing/creatives")
      .then((r) => r.json())
      .then((d) => setCreatives(d.creatives || []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  useEffect(() => {
    fetch("/api/admin/marketing")
      .then((r) => r.json())
      .then((d) =>
        setSponsors(
          (d.sponsors || [])
            .filter((s: { status: string }) => s.status === "ACTIVE")
            .map((s: { id: string; companyName: string; website: string | null }) => ({
              id: s.id,
              companyName: s.companyName,
              website: s.website,
            })),
        ),
      );
  }, []);

  async function toggleActive(c: CreativeRow) {
    const res = await fetch(`/api/admin/marketing/creatives/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    const data = await res.json();
    if (res.ok) setCreatives((prev) => prev.map((x) => (x.id === c.id ? data.creative : x)));
  }

  async function deleteCreative(id: string) {
    if (!confirm("Delete this creative? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/marketing/creatives/${id}`, { method: "DELETE" });
      if (res.ok) setCreatives((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setDeleting(null);
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
          + New Creative
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e4ebf5] bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#5d7497]">Loading…</div>
        ) : creatives.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#5d7497]">
            No creative yet. Only sponsors with an active status can be assigned a banner.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#f5f8fd] text-xs font-semibold uppercase tracking-wide text-[#5d7497]">
              <tr>
                <th className="px-4 py-3 text-left">Preview</th>
                <th className="px-4 py-3 text-left">Sponsor</th>
                <th className="px-4 py-3 text-left">Placement</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Impressions</th>
                <th className="px-4 py-3 text-left">Clicks</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f9]">
              {creatives.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.imageUrl}
                      alt=""
                      className="h-10 w-20 rounded border border-[#e4ebf5] object-cover"
                    />
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#1B3A6B]">
                    {c.sponsor.companyName}
                  </td>
                  <td className="px-4 py-3 text-[#244367]">
                    {PLACEMENTS.find((p) => p.value === c.placement)?.label ?? c.placement}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        c.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#5d7497]">{c.impressions}</td>
                  <td className="px-4 py-3 text-[#5d7497]">{c.clicks}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditTarget(c)}
                        className="rounded-lg border border-[#cdd8e7] px-3 py-1 text-xs font-bold text-[#5d7497] hover:border-[#1B3A6B]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(c)}
                        className="rounded-lg border border-[#cdd8e7] px-3 py-1 text-xs font-bold text-[#5d7497] hover:border-[#1B3A6B]"
                      >
                        {c.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        disabled={deleting === c.id}
                        onClick={() => deleteCreative(c.id)}
                        className="rounded-lg border border-[#cdd8e7] px-3 py-1 text-xs font-bold text-[#5d7497] hover:border-red-400 hover:text-red-600 disabled:opacity-50"
                      >
                        Delete
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
        <CreativeModal
          creative={editTarget === "new" ? null : editTarget}
          sponsors={sponsors}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) =>
            setCreatives((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
          }
          onCreated={(created) => setCreatives((prev) => [created, ...prev])}
        />
      )}
    </div>
  );
}
