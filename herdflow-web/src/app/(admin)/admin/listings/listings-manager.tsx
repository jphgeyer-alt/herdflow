"use client";

import { Fragment, useState, useMemo } from "react";
import {
  Search, Filter, ChevronDown, ChevronRight, MoreVertical,
  Star, CheckCircle, Eye, EyeOff, RefreshCw, Edit3,
  AlertTriangle, X, Check, Trash2, Download, Plus,
  ArrowUpDown, ArrowUp, ArrowDown, BarChart3,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type Listing = {
  id: string;
  title: string;
  slug: string;
  description: string;
  breed: string;
  region: string;
  priceCents: number;
  weightKg: number | null;
  ageMonths: number | null;
  photos: string[];
  status: string;
  isFeatured: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedBy: string | null;
  deleteReason: string | null;
  createdAt: string;
  category: { id: string; name: string };
  seller: {
    id: string;
    farmName: string;
    location: string;
    status: string;
    user: { email: string; phone: string | null };
  };
};

type Props = {
  initialListings: Listing[];
  sellers: Array<{ id: string; farmName: string; status: string }>;
  categories: Array<{ id: string; name: string }>;
};

type ViewMode = "category" | "seller" | "all";
type SortKey = "newest" | "oldest" | "priceHigh" | "priceLow" | "seller";

const REMOVE_REASONS = [
  "Seller requested removal",
  "Listing rules violation",
  "Sold outside platform",
  "Duplicate listing",
  "Fraudulent listing",
  "Other",
];

const PROVINCES = [
  "All Provinces", "North West", "Gauteng", "Limpopo", "Free State",
  "KwaZulu-Natal", "Eastern Cape", "Western Cape", "Northern Cape", "Mpumalanga",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function zar(cents: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(cents / 100);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status, isDeleted }: { status: string; isDeleted: boolean }) {
  if (isDeleted) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 line-through">Removed</span>;
  const map: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    PENDING: "bg-amber-100 text-amber-800",
    SOLD: "bg-blue-100 text-blue-800",
    DRAFT: "bg-gray-100 text-gray-600",
    ARCHIVED: "bg-gray-100 text-gray-600",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${map[status] ?? "bg-gray-100 text-gray-600"}`}>{status}</span>;
}

// ── Remove Modal ─────────────────────────────────────────────────────────────

function RemoveModal({
  listing,
  onCancel,
  onConfirm,
}: {
  listing: Listing;
  onCancel: () => void;
  onConfirm: (reason: string, notes: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  function submit() {
    if (!reason) { setError("Please select a reason for removal."); return; }
    onConfirm(reason, notes);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#e4ebf5] max-w-md w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-amber-700" />
          </div>
          <div>
            <h3 className="font-bold text-[#1B3A6B] text-base">Remove This Listing</h3>
            <p className="text-sm text-[#5d7497] mt-1">
              <strong>&ldquo;{listing.title}&rdquo;</strong> will be hidden from the public site.
              All sales history, order data and statistics will be permanently preserved.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#244367] mb-1">
              Reason for removal <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(""); }}
              className="w-full px-3 py-2 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40"
            >
              <option value="">Select a reason…</option>
              {REMOVE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#244367] mb-1">Additional notes (optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context…"
              className="w-full px-3 py-2 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5 justify-end">
          <button onClick={onCancel} className="px-5 py-2 rounded-lg border border-[#cdd8e7] text-sm font-semibold text-[#5d7497] hover:bg-[#f5f8fd] transition">Cancel</button>
          <button onClick={submit} className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition">
            Remove Listing
          </button>
        </div>
        <p className="text-center text-xs text-[#9aabb9] mt-3">
          No data will be lost. Orders and statistics are always preserved.
        </p>
      </div>
    </div>
  );
}

// ── Row Actions Menu ──────────────────────────────────────────────────────────

function ActionsMenu({
  listing,
  onAction,
}: {
  listing: Listing;
  onAction: (action: string, listing: Listing) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-[#f0f4fb] text-[#5d7497] transition"
        title="Actions"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-40 w-48 bg-white rounded-xl shadow-xl border border-[#e4ebf5] py-1 text-sm">
            <a
              href={`/listings/${listing.slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 hover:bg-[#f5f8fd] text-[#244367]"
              onClick={() => setOpen(false)}
            >
              <Eye size={14} /> View on Site
            </a>
            <button className="flex w-full items-center gap-2 px-4 py-2 hover:bg-[#f5f8fd] text-[#244367]" onClick={() => { setOpen(false); onAction("edit", listing); }}>
              <Edit3 size={14} /> Edit Listing
            </button>
            <button className="flex w-full items-center gap-2 px-4 py-2 hover:bg-[#f5f8fd] text-[#244367]" onClick={() => { setOpen(false); onAction("feature", listing); }}>
              <Star size={14} /> {listing.isFeatured ? "Un-feature" : "Feature on Homepage"}
            </button>
            {listing.status !== "SOLD" && !listing.isDeleted && (
              <button className="flex w-full items-center gap-2 px-4 py-2 hover:bg-[#f5f8fd] text-[#244367]" onClick={() => { setOpen(false); onAction("markSold", listing); }}>
                <CheckCircle size={14} /> Mark as Sold
              </button>
            )}
            {listing.status === "ARCHIVED" && !listing.isDeleted && (
              <button className="flex w-full items-center gap-2 px-4 py-2 hover:bg-[#f5f8fd] text-green-700" onClick={() => { setOpen(false); onAction("approve", listing); }}>
                <Check size={14} /> Approve Listing
              </button>
            )}
            {!listing.isDeleted && (
              <>
                <div className="border-t border-[#f0f4fb] my-1" />
                <button className="flex w-full items-center gap-2 px-4 py-2 hover:bg-amber-50 text-amber-700" onClick={() => { setOpen(false); onAction("remove", listing); }}>
                  <EyeOff size={14} /> Remove Listing
                </button>
              </>
            )}
            {listing.isDeleted && (
              <>
                <div className="border-t border-[#f0f4fb] my-1" />
                <button className="flex w-full items-center gap-2 px-4 py-2 hover:bg-green-50 text-green-700" onClick={() => { setOpen(false); onAction("restore", listing); }}>
                  <RefreshCw size={14} /> Restore Listing
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Listing Row ───────────────────────────────────────────────────────────────

function ListingRow({
  listing,
  selected,
  onSelect,
  onAction,
  processing,
}: {
  listing: Listing;
  selected: boolean;
  onSelect: () => void;
  onAction: (action: string, listing: Listing) => void;
  processing: boolean;
}) {
  const thumb = listing.photos[0];

  return (
    <tr className={`border-b border-[#f0f4fb] hover:bg-[#f8fafd] transition ${listing.isDeleted ? "opacity-60" : ""} ${processing ? "opacity-50 pointer-events-none" : ""}`}>
      <td className="px-3 py-3 w-8">
        <input type="checkbox" checked={selected} onChange={onSelect} className="accent-[#1B3A6B] w-4 h-4" />
      </td>
      <td className="px-3 py-3 w-16">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={listing.title} className="w-12 h-10 rounded-lg object-cover border border-[#e4ebf5]" />
        ) : (
          <div className="w-12 h-10 rounded-lg bg-[#f0f5ff] border border-[#e4ebf5] flex items-center justify-center text-[#cdd8e7]">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        )}
      </td>
      <td className="px-3 py-3 min-w-[160px]">
        <p className={`font-semibold text-sm text-[#1B3A6B] truncate max-w-[200px] ${listing.isDeleted ? "line-through text-[#9aabb9]" : ""}`}>{listing.title}</p>
        <p className="text-xs text-[#5d7497]">{listing.breed}</p>
      </td>
      <td className="px-3 py-3 hidden md:table-cell">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eef3fb] text-[#1B3A6B]">{listing.category.name}</span>
      </td>
      <td className="px-3 py-3 hidden lg:table-cell text-sm text-[#244367]">
        <p className="font-medium truncate max-w-[130px]">{listing.seller.farmName}</p>
        <p className="text-xs text-[#9aabb9] truncate max-w-[130px]">{listing.seller.user.email}</p>
      </td>
      <td className="px-3 py-3 hidden md:table-cell text-xs text-[#5d7497]">{listing.region}</td>
      <td className="px-3 py-3 text-sm font-semibold text-[#2E7D32]">{zar(listing.priceCents)}</td>
      <td className="px-3 py-3">
        <StatusBadge status={listing.status} isDeleted={listing.isDeleted} />
        {listing.isFeatured && !listing.isDeleted && (
          <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700">⭐ Featured</span>
        )}
      </td>
      <td className="px-3 py-3 hidden lg:table-cell text-xs text-[#9aabb9]">{fmtDate(listing.createdAt)}</td>
      <td className="px-3 py-3 w-10">
        <ActionsMenu listing={listing} onAction={onAction} />
      </td>
    </tr>
  );
}

// ── Category Group ────────────────────────────────────────────────────────────

function CategoryGroup({
  name,
  listings,
  selectedIds,
  onSelectAll,
  onSelect,
  onAction,
  processingId,
}: {
  name: string;
  listings: Listing[];
  selectedIds: Set<string>;
  onSelectAll: (ids: string[], checked: boolean) => void;
  onSelect: (id: string) => void;
  onAction: (action: string, listing: Listing) => void;
  processingId: string | null;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const activeCount = listings.filter((l) => !l.isDeleted && l.status === "ACTIVE").length;
  const ids = listings.map((l) => l.id);
  const allSelected = ids.every((id) => selectedIds.has(id));

  return (
    <div className="bg-white rounded-xl border border-[#e4ebf5] shadow-sm overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 bg-[#f5f8fd] cursor-pointer hover:bg-[#eef3fb] transition select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <input
          type="checkbox"
          checked={allSelected}
          onChange={(e) => { e.stopPropagation(); onSelectAll(ids, e.target.checked); }}
          className="accent-[#1B3A6B] w-4 h-4"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1 flex items-center gap-2">
          <span className="font-bold text-[#1B3A6B] uppercase text-sm tracking-wide">{name}</span>
          <span className="text-xs text-[#5d7497]">— {listings.length} listing{listings.length !== 1 ? "s" : ""}</span>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">{activeCount} active</span>
          )}
        </div>
        {collapsed ? <ChevronRight size={16} className="text-[#5d7497]" /> : <ChevronDown size={16} className="text-[#5d7497]" />}
      </div>

      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f5f8fd] text-xs font-semibold text-[#5d7497] uppercase tracking-wide border-b border-[#e4ebf5]">
              <tr>
                <th className="w-8 px-3 py-2" />
                <th className="w-16 px-3 py-2" />
                <th className="px-3 py-2 text-left">Title / Breed</th>
                <th className="px-3 py-2 text-left hidden md:table-cell">Category</th>
                <th className="px-3 py-2 text-left hidden lg:table-cell">Seller</th>
                <th className="px-3 py-2 text-left hidden md:table-cell">Province</th>
                <th className="px-3 py-2 text-left">Price</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left hidden lg:table-cell">Listed</th>
                <th className="w-10 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <ListingRow
                  key={listing.id}
                  listing={listing}
                  selected={selectedIds.has(listing.id)}
                  onSelect={() => onSelect(listing.id)}
                  onAction={onAction}
                  processing={processingId === listing.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Seller Group ──────────────────────────────────────────────────────────────

function SellerGroup({
  seller,
  listings,
  selectedIds,
  onSelectAll,
  onSelect,
  onAction,
  processingId,
}: {
  seller: Listing["seller"];
  listings: Listing[];
  selectedIds: Set<string>;
  onSelectAll: (ids: string[], checked: boolean) => void;
  onSelect: (id: string) => void;
  onAction: (action: string, listing: Listing) => void;
  processingId: string | null;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const activeCount = listings.filter((l) => !l.isDeleted && l.status === "ACTIVE").length;
  const ids = listings.map((l) => l.id);
  const allSelected = ids.every((id) => selectedIds.has(id));
  const initial = seller.farmName.charAt(0).toUpperCase();

  return (
    <div className="bg-white rounded-xl border border-[#e4ebf5] shadow-sm overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 bg-[#f5f8fd] cursor-pointer hover:bg-[#eef3fb] transition select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <input
          type="checkbox"
          checked={allSelected}
          onChange={(e) => { e.stopPropagation(); onSelectAll(ids, e.target.checked); }}
          className="accent-[#1B3A6B] w-4 h-4"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="w-8 h-8 rounded-full bg-[#1B3A6B] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{initial}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[#1B3A6B] text-sm">{seller.farmName}</span>
            {seller.status === "APPROVED" && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#1B3A6B] text-white">HerdFlow Trusted</span>
            )}
            <span className="text-xs text-[#5d7497]">{listings.length} listing{listings.length !== 1 ? "s" : ""}</span>
            {activeCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">{activeCount} active</span>
            )}
          </div>
          <div className="flex gap-3 text-xs text-[#9aabb9] mt-0.5 flex-wrap">
            <span>{seller.user.email}</span>
            {seller.user.phone && <span>{seller.user.phone}</span>}
            <span>{seller.location}</span>
          </div>
        </div>
        {collapsed ? <ChevronRight size={16} className="text-[#5d7497]" /> : <ChevronDown size={16} className="text-[#5d7497]" />}
      </div>

      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f5f8fd] text-xs font-semibold text-[#5d7497] uppercase tracking-wide border-b border-[#e4ebf5]">
              <tr>
                <th className="w-8 px-3 py-2" />
                <th className="w-16 px-3 py-2" />
                <th className="px-3 py-2 text-left">Title / Breed</th>
                <th className="px-3 py-2 text-left hidden md:table-cell">Category</th>
                <th className="px-3 py-2 text-left hidden lg:table-cell">Seller</th>
                <th className="px-3 py-2 text-left hidden md:table-cell">Province</th>
                <th className="px-3 py-2 text-left">Price</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left hidden lg:table-cell">Listed</th>
                <th className="w-10 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <ListingRow
                  key={listing.id}
                  listing={listing}
                  selected={selectedIds.has(listing.id)}
                  onSelect={() => onSelect(listing.id)}
                  onAction={onAction}
                  processing={processingId === listing.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({
  listing,
  categories,
  onClose,
  onSaved,
}: {
  listing: Listing;
  categories: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSaved: (updated: Partial<Listing>) => void;
}) {
  const REGIONS = ["North West", "Free State", "Limpopo", "Gauteng", "Mpumalanga", "Northern Cape", "KwaZulu-Natal", "Western Cape", "Eastern Cape"];
  const [form, setForm] = useState({
    title: listing.title,
    breed: listing.breed,
    region: listing.region,
    priceRand: String(listing.priceCents / 100),
    weightKg: listing.weightKg ? String(listing.weightKg) : "",
    ageMonths: listing.ageMonths ? String(listing.ageMonths) : "",
    status: listing.status,
    isFeatured: listing.isFeatured,
    description: listing.description || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/listings/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title.trim(),
        breed: form.breed.trim(),
        region: form.region,
        priceCents: Math.round(parseFloat(form.priceRand) * 100),
        weightKg: form.weightKg ? parseInt(form.weightKg) : null,
        ageMonths: form.ageMonths ? parseInt(form.ageMonths) : null,
        status: form.status,
        isFeatured: form.isFeatured,
        description: form.description.trim(),
      }),
    });
    setSaving(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error || "Failed to save."); return; }
    onSaved(data.listing);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#e4ebf5] max-w-2xl w-full p-6 my-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-[#1B3A6B] text-lg">Edit Listing</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f4fb] text-[#5d7497]"><X size={18} /></button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#244367] mb-1">Title</label>
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#244367] mb-1">Breed</label>
            <input value={form.breed} onChange={(e) => setForm((p) => ({ ...p, breed: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#244367] mb-1">Price (R)</label>
            <input type="number" min="0" step="0.01" value={form.priceRand} onChange={(e) => setForm((p) => ({ ...p, priceRand: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#244367] mb-1">Province</label>
            <select value={form.region} onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30">
              {REGIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#244367] mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30">
              {["ACTIVE", "DRAFT", "SOLD", "ARCHIVED"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#244367] mb-1">Weight (kg)</label>
            <input type="number" min="0" value={form.weightKg} onChange={(e) => setForm((p) => ({ ...p, weightKg: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30" placeholder="e.g. 480" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#244367] mb-1">Age (months)</label>
            <input type="number" min="0" value={form.ageMonths} onChange={(e) => setForm((p) => ({ ...p, ageMonths: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30" placeholder="e.g. 24" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#244367] mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 resize-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((p) => ({ ...p, isFeatured: e.target.checked }))} className="accent-[#1B3A6B] w-4 h-4" />
              <span className="text-sm font-semibold text-[#244367]">Feature this listing on the homepage</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-lg border border-[#cdd8e7] text-sm font-semibold text-[#5d7497] hover:bg-[#f5f8fd] transition">Cancel</button>
          <button onClick={save} disabled={saving} className="px-6 py-2 rounded-lg bg-[#2E7D32] hover:bg-[#1d5e20] disabled:opacity-60 text-white text-sm font-bold transition">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  return (
    <div className={`fixed top-4 right-4 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-semibold max-w-sm animate-in slide-in-from-top-2 ${
      type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
    }`}>
      {type === "success" ? <Check size={16} /> : <X size={16} />}
      <span className="flex-1">{msg}</span>
      <button onClick={onClose}><X size={14} /></button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AdminListingsManager({ initialListings, sellers, categories }: Props) {
  const [listings, setListings] = useState(initialListings);
  const [viewMode, setViewMode] = useState<ViewMode>("category");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProvince, setFilterProvince] = useState("all");
  const [filterSeller, setFilterSeller] = useState("all");
  const [showRemoved, setShowRemoved] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Listing | null>(null);
  const [editTarget, setEditTarget] = useState<Listing | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: listings.filter((l) => !l.isDeleted && l.status === "ACTIVE").length,
    pending: listings.filter((l) => !l.isDeleted && l.status === "DRAFT").length,
    sold: listings.filter((l) => !l.isDeleted && l.status === "SOLD").length,
    removed: listings.filter((l) => l.isDeleted).length,
  }), [listings]);

  // ── Filtered & sorted ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = listings.filter((l) => showRemoved ? l.isDeleted : !l.isDeleted);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((l) =>
        l.title.toLowerCase().includes(q) ||
        l.breed.toLowerCase().includes(q) ||
        l.seller.farmName.toLowerCase().includes(q) ||
        l.region.toLowerCase().includes(q)
      );
    }
    if (filterCategory !== "all") result = result.filter((l) => l.category.name === filterCategory);
    if (filterStatus !== "all") result = result.filter((l) => l.status === filterStatus);
    if (filterProvince !== "all") result = result.filter((l) => l.region === filterProvince);
    if (filterSeller !== "all") result = result.filter((l) => l.seller.id === filterSeller);

    result = [...result].sort((a, b) => {
      if (sortKey === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortKey === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortKey === "priceHigh") return b.priceCents - a.priceCents;
      if (sortKey === "priceLow") return a.priceCents - b.priceCents;
      if (sortKey === "seller") return a.seller.farmName.localeCompare(b.seller.farmName);
      return 0;
    });
    return result;
  }, [listings, showRemoved, search, filterCategory, filterStatus, filterProvince, filterSeller, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = viewMode === "all" ? filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : filtered;

  // ── Selection ─────────────────────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function selectAll(ids: string[], checked: boolean) {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      ids.forEach((id) => checked ? n.add(id) : n.delete(id));
      return n;
    });
  }

  // ── API actions ────────────────────────────────────────────────────────────
  async function doAction(action: string, listing: Listing) {
    if (action === "remove") { setRemoveTarget(listing); return; }
    if (action === "edit") { setEditTarget(listing); return; }

    setProcessingId(listing.id);
    try {
      if (action === "restore") {
        const res = await fetch(`/api/admin/listings/${listing.id}`, { method: "POST" });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) { showToast(d.error || "Failed to restore", "error"); return; }
        setListings((prev) => prev.map((l) => l.id === listing.id ? { ...l, isDeleted: false, status: "ACTIVE" } : l));
        showToast("Listing restored and set to Active.");
        return;
      }

      const patchData: Record<string, unknown> =
        action === "feature" ? { isFeatured: !listing.isFeatured } :
        action === "markSold" ? { status: "SOLD" } :
        action === "approve" ? { status: "ACTIVE" } : {};

      const res = await fetch(`/api/admin/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchData),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { showToast(d.error || "Action failed", "error"); return; }
      setListings((prev) => prev.map((l) => l.id === listing.id ? { ...l, ...(d.listing || patchData) } : l));
      showToast(
        action === "feature" ? (listing.isFeatured ? "Listing un-featured." : "Listing featured on homepage.") :
        action === "markSold" ? "Listing marked as Sold." :
        action === "approve" ? "Listing approved and Active." : "Updated."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function confirmRemove(reason: string, notes: string) {
    if (!removeTarget) return;
    const id = removeTarget.id;
    setRemoveTarget(null);
    setProcessingId(id);
    const res = await fetch(`/api/admin/listings/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, notes }),
    });
    const d = await res.json().catch(() => ({}));
    setProcessingId(null);
    if (!res.ok) { showToast(d.error || "Failed to remove", "error"); return; }
    setListings((prev) => prev.map((l) => l.id === id ? { ...l, isDeleted: true, status: "ARCHIVED" } : l));
    showToast("Listing removed. All history preserved.");
  }

  // ── Grouped views ──────────────────────────────────────────────────────────
  const byCategory = useMemo(() => {
    const map = new Map<string, Listing[]>();
    filtered.forEach((l) => {
      const key = l.category.name;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const bySeller = useMemo(() => {
    const map = new Map<string, Listing[]>();
    filtered.forEach((l) => {
      const key = l.seller.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    });
    return Array.from(map.entries()).sort(([aId], [bId]) => {
      const an = filtered.find((l) => l.seller.id === aId)?.seller.farmName ?? "";
      const bn = filtered.find((l) => l.seller.id === bId)?.seller.farmName ?? "";
      return an.localeCompare(bn);
    });
  }, [filtered]);

  // ── CSV Export ─────────────────────────────────────────────────────────────
  function exportCSV() {
    const rows = filtered.map((l) => [
      l.title, l.breed, l.category.name, l.seller.farmName, l.region,
      (l.priceCents / 100).toFixed(2), l.status, l.isDeleted ? "Removed" : "Active",
      fmtDate(l.createdAt),
    ]);
    const header = ["Title", "Breed", "Category", "Seller", "Province", "Price", "Status", "Visibility", "Listed Date"];
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `herdflow-listings-${Date.now()}.csv`;
    a.click();
  }

  function clearFilters() {
    setSearch(""); setFilterCategory("all"); setFilterStatus("all");
    setFilterProvince("all"); setFilterSeller("all"); setSortKey("newest");
    setPage(1);
  }

  const hasFilters = search || filterCategory !== "all" || filterStatus !== "all" || filterProvince !== "all" || filterSeller !== "all";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {removeTarget && <RemoveModal listing={removeTarget} onCancel={() => setRemoveTarget(null)} onConfirm={confirmRemove} />}
      {editTarget && <EditModal listing={editTarget} categories={categories} onClose={() => setEditTarget(null)} onSaved={(updated) => { setListings((prev) => prev.map((l) => l.id === editTarget.id ? { ...l, ...updated } : l)); setEditTarget(null); showToast("Listing saved successfully."); }} />}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1B3A6B]">Manage Listings</h1>
          <p className="text-sm text-[#5d7497] mt-0.5">All livestock listings across all registered sellers.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 border border-[#cdd8e7] rounded-lg text-sm font-semibold text-[#244367] hover:border-[#1B3A6B] transition">
            <Download size={16} /> Export CSV
          </button>
          <a href="/admin/products" className="flex items-center gap-2 px-4 py-2 bg-[#2E7D32] hover:bg-[#1d5e20] rounded-lg text-sm font-bold text-white transition">
            <Plus size={16} /> Add New Listing
          </a>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Listings", value: stats.total, color: "text-[#2E7D32]", icon: <CheckCircle size={18} className="text-[#2E7D32]" /> },
          { label: "Pending / Draft", value: stats.pending, color: "text-amber-700", icon: <BarChart3 size={18} className="text-amber-600" /> },
          { label: "Sold", value: stats.sold, color: "text-blue-700", icon: <Star size={18} className="text-blue-600" /> },
          { label: "Removed", value: stats.removed, color: "text-red-700", icon: <EyeOff size={18} className="text-red-500" /> },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#e4ebf5] shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f5f8fd] flex items-center justify-center flex-shrink-0">{s.icon}</div>
            <div>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-[#5d7497]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── View Toggle & Removed Tab ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex bg-[#f5f8fd] rounded-xl p-1 gap-1">
          {(["category", "seller", "all"] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setViewMode(m); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${viewMode === m ? "bg-white text-[#1B3A6B] shadow-sm" : "text-[#5d7497] hover:text-[#1B3A6B]"}`}
            >
              {m === "category" ? "By Category" : m === "seller" ? "By Seller" : "All Listings"}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setShowRemoved(!showRemoved); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-semibold transition border ${showRemoved ? "bg-red-50 border-red-200 text-red-700" : "border-[#cdd8e7] text-[#5d7497] hover:border-[#1B3A6B]"}`}
        >
          <EyeOff size={14} />
          {showRemoved ? "Viewing Removed" : `Removed (${stats.removed})`}
        </button>
      </div>

      {/* ── Search & Filters ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#e4ebf5] shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aabb9]" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by title, breed, seller, location…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {[
              { key: "filterCategory", value: filterCategory, setter: setFilterCategory, label: "Category", opts: [["all", "All Categories"], ...categories.map((c) => [c.name, c.name])] },
              { key: "filterStatus", value: filterStatus, setter: setFilterStatus, label: "Status", opts: [["all","All Status"],["ACTIVE","Active"],["DRAFT","Pending/Draft"],["SOLD","Sold"],["ARCHIVED","Archived"]] },
              { key: "filterProvince", value: filterProvince, setter: setFilterProvince, label: "Province", opts: PROVINCES.map((p) => p === "All Provinces" ? ["all", p] : [p, p]) },
              { key: "filterSeller", value: filterSeller, setter: setFilterSeller, label: "Seller", opts: [["all","All Sellers"], ...sellers.map((s) => [s.id, s.farmName])] },
              { key: "sort", value: sortKey, setter: (v: string) => setSortKey(v as SortKey), label: "Sort", opts: [["newest","Newest First"],["oldest","Oldest First"],["priceHigh","Price High–Low"],["priceLow","Price Low–High"],["seller","Seller A–Z"]] },
            ].map(({ key, value, setter, opts }) => (
              <select
                key={key}
                value={value}
                onChange={(e) => { (setter as (v: string) => void)(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-lg border border-[#cdd8e7] text-sm text-[#244367] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 bg-white"
              >
                {(opts as [string, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ))}
            {hasFilters && (
              <button onClick={clearFilters} className="text-[#2E7D32] text-sm font-semibold hover:underline flex items-center gap-1">
                <X size={14} /> Clear
              </button>
            )}
          </div>
        </div>
        <div className="text-xs text-[#9aabb9]">
          Showing {filtered.length} listing{filtered.length !== 1 ? "s" : ""}
          {showRemoved ? " (removed)" : ""}
          {hasFilters ? " — filtered" : ""}
        </div>
      </div>

      {/* ── Bulk Action Bar ──────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="bg-[#1B3A6B] text-white rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap shadow-lg">
          <span className="font-bold text-sm">{selectedIds.size} listing{selectedIds.size !== 1 ? "s" : ""} selected</span>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "Approve", action: "approve" },
              { label: "Feature", action: "feature" },
            ].map(({ label, action }) => (
              <button key={action} onClick={() => {
                Array.from(selectedIds).forEach((id) => {
                  const l = listings.find((x) => x.id === id);
                  if (l) doAction(action, l);
                });
                setSelectedIds(new Set());
              }} className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition">
                {label} Selected
              </button>
            ))}
            <button onClick={() => { setSelectedIds(new Set()); }} className="ml-auto px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition">
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* ── Empty State ──────────────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-[#e4ebf5] shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[#f5f8fd] flex items-center justify-center mx-auto mb-4">
            <Filter size={28} className="text-[#cdd8e7]" />
          </div>
          <h3 className="font-bold text-[#1B3A6B] text-lg mb-1">
            {showRemoved ? "No removed listings" : "No listings found"}
          </h3>
          <p className="text-sm text-[#5d7497]">
            {hasFilters ? "Try adjusting your filters." : showRemoved ? "No listings have been removed yet." : "No livestock listings have been added yet."}
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-4 px-6 py-2 bg-[#2E7D32] hover:bg-[#1d5e20] text-white text-sm font-bold rounded-lg transition">
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* ── Category View ─────────────────────────────────────────────────── */}
      {viewMode === "category" && filtered.length > 0 && (
        <div className="space-y-4">
          {byCategory.map(([catName, catListings]) => (
            <CategoryGroup
              key={catName}
              name={catName}
              listings={catListings}
              selectedIds={selectedIds}
              onSelectAll={selectAll}
              onSelect={toggleSelect}
              onAction={doAction}
              processingId={processingId}
            />
          ))}
        </div>
      )}

      {/* ── Seller View ──────────────────────────────────────────────────── */}
      {viewMode === "seller" && filtered.length > 0 && (
        <div className="space-y-4">
          {bySeller.map(([sellerId, sellerListings]) => {
            const seller = sellerListings[0].seller;
            return (
              <SellerGroup
                key={sellerId}
                seller={seller}
                listings={sellerListings}
                selectedIds={selectedIds}
                onSelectAll={selectAll}
                onSelect={toggleSelect}
                onAction={doAction}
                processingId={processingId}
              />
            );
          })}
        </div>
      )}

      {/* ── All Listings (flat) ──────────────────────────────────────────── */}
      {viewMode === "all" && filtered.length > 0 && (
        <div className="bg-white rounded-xl border border-[#e4ebf5] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f5f8fd] text-xs font-semibold text-[#5d7497] uppercase tracking-wide border-b border-[#e4ebf5]">
                <tr>
                  <th className="w-8 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={paginated.every((l) => selectedIds.has(l.id))}
                      onChange={(e) => selectAll(paginated.map((l) => l.id), e.target.checked)}
                      className="accent-[#1B3A6B] w-4 h-4"
                    />
                  </th>
                  <th className="w-16 px-3 py-3" />
                  <th className="px-3 py-3 text-left">Title / Breed</th>
                  <th className="px-3 py-3 text-left hidden md:table-cell">Category</th>
                  <th className="px-3 py-3 text-left hidden lg:table-cell">Seller</th>
                  <th className="px-3 py-3 text-left hidden md:table-cell">Province</th>
                  <th className="px-3 py-3 text-left">Price</th>
                  <th className="px-3 py-3 text-left">Status</th>
                  <th className="px-3 py-3 text-left hidden lg:table-cell">Listed</th>
                  <th className="w-10 px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {paginated.map((listing) => (
                  <ListingRow
                    key={listing.id}
                    listing={listing}
                    selected={selectedIds.has(listing.id)}
                    onSelect={() => toggleSelect(listing.id)}
                    onAction={doAction}
                    processing={processingId === listing.id}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#f0f4fb] bg-[#f5f8fd] text-sm">
              <span className="text-[#5d7497]">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} listings
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-lg border border-[#cdd8e7] text-[#244367] hover:border-[#1B3A6B] disabled:opacity-40 transition">
                  ← Prev
                </button>
                <span className="text-[#5d7497]">Page {page} of {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded-lg border border-[#cdd8e7] text-[#244367] hover:border-[#1B3A6B] disabled:opacity-40 transition">
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Removed Listings Details ──────────────────────────────────────── */}
      {showRemoved && filtered.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
          <p className="font-semibold mb-2 flex items-center gap-2"><AlertTriangle size={16} />Removed Listing Details</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {filtered.map((l) => (
              <div key={l.id} className="flex items-start justify-between gap-3 py-1 border-b border-red-100 last:border-0">
                <div>
                  <span className="font-medium">{l.title}</span>
                  <span className="text-red-600 text-xs ml-2">— {l.deleteReason ?? "No reason recorded"}</span>
                  {l.deletedAt && <span className="text-xs text-red-400 ml-2">{fmtDate(l.deletedAt)}</span>}
                </div>
                <button
                  onClick={() => doAction("restore", l)}
                  className="flex items-center gap-1 px-2 py-0.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition whitespace-nowrap"
                >
                  <RefreshCw size={12} /> Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// needed by outer const
