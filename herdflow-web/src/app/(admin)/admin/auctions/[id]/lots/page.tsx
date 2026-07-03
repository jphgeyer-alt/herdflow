"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, ArrowLeft, Pencil, Trash2, Copy, ImageIcon, AlertTriangle, CheckCircle, X, ChevronDown } from "lucide-react";
import { MultiImageUpload } from "@/components/ui/MultiImageUpload";

// ── Types ─────────────────────────────────────────────────────────────────────

type AuctionLot = {
  id: string;
  lotNumber: number;
  title: string;
  description: string;
  species: string | null;
  breed: string | null;
  quantity: number;
  gender: string | null;
  weightKg: number | null;
  region: string | null;
  location: string | null;
  healthStatus: string | null;
  images: string[];
  documents: string[];
  startingPriceCents: number;
  reservePriceCents: number | null;
  status: string;
  _count: { bids: number };
};

type LotFormData = {
  title: string;
  description: string;
  species: string;
  breed: string;
  quantity: number;
  gender: string;
  weightKg: string;
  region: string;
  location: string;
  healthStatus: string;
  images: string[];
  startPriceRand: string;
  reservePriceRand: string;
};

const EMPTY_FORM: LotFormData = {
  title: "", description: "", species: "Cattle", breed: "", quantity: 1,
  gender: "", weightKg: "", region: "", location: "", healthStatus: "",
  images: [], startPriceRand: "", reservePriceRand: "",
};

const SPECIES = ["Cattle", "Sheep", "Goats", "Pigs", "Game", "Horses", "Poultry", "Other"];
const GENDERS = ["Mixed", "Bulls", "Steers", "Heifers", "Cows", "Rams", "Ewes", "Wethers", "Does", "Bucks"];
const PROVINCES = ["North West", "Gauteng", "Limpopo", "Free State", "KwaZulu-Natal", "Eastern Cape", "Western Cape", "Northern Cape", "Mpumalanga"];
const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  OPEN: "bg-green-100 text-green-800",
  SOLD: "bg-blue-100 text-blue-800",
  PASSED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-700",
};

function zar(cents: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(cents / 100);
}

function lotToForm(lot: AuctionLot): LotFormData {
  return {
    title: lot.title, description: lot.description, species: lot.species || "Cattle",
    breed: lot.breed || "", quantity: lot.quantity, gender: lot.gender || "",
    weightKg: lot.weightKg ? String(lot.weightKg) : "", region: lot.region || "",
    location: lot.location || "", healthStatus: lot.healthStatus || "",
    images: [...lot.images], startPriceRand: String(lot.startingPriceCents / 100),
    reservePriceRand: lot.reservePriceCents ? String(lot.reservePriceCents / 100) : "",
  };
}

// ── Lot Form Panel ─────────────────────────────────────────────────────────────

function LotFormPanel({ lot, onClose, onSaved, sessionId }: {
  lot: AuctionLot | null;
  onClose: () => void;
  onSaved: (lot: AuctionLot) => void;
  sessionId: string;
}) {
  const [form, setForm] = useState<LotFormData>(lot ? lotToForm(lot) : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field: keyof LotFormData, value: unknown) {
    setForm((p) => ({ ...p, [field]: value }));
    setError("");
  }

  function suggestTitle() {
    if (form.species && form.breed && form.quantity) {
      set("title", `${form.quantity} x ${form.breed} ${form.species}`);
    }
  }

  async function save(addAnother = false) {
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.startPriceRand || Number(form.startPriceRand) <= 0) { setError("Valid start price required"); return; }
    setSaving(true); setError("");

    const body = {
      title: form.title.trim(), description: form.description.trim(),
      species: form.species, breed: form.breed.trim(), quantity: form.quantity,
      gender: form.gender, weightKg: form.weightKg ? Number(form.weightKg) : null,
      region: form.region, location: form.location.trim(), healthStatus: form.healthStatus,
      images: form.images, documents: [],
      startingPriceCents: Math.round(Number(form.startPriceRand) * 100),
      reservePriceCents: form.reservePriceRand ? Math.round(Number(form.reservePriceRand) * 100) : null,
    };

    try {
      let res: Response;
      if (lot) {
        res = await fetch(`/api/admin/auctions/${sessionId}/lots/${lot.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`/api/admin/auctions/${sessionId}/lots`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
      }
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save lot"); return; }
      onSaved(data.lot);
      if (addAnother) { setForm(EMPTY_FORM); } else { onClose(); }
    } catch { setError("Network error. Please try again."); }
    finally { setSaving(false); }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      {/* Slide-in panel */}
      <div className="fixed top-0 right-0 h-full z-50 bg-white shadow-2xl border-l border-[#e4ebf5] flex flex-col"
        style={{ width: "min(600px, 100vw)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4ebf5] bg-[#f5f8fd]">
          <div className="flex items-center gap-3">
            <h2 className="font-black text-[#1B3A6B] text-lg">{lot ? `Edit Lot ${lot.lotNumber}` : "Add New Lot"}</h2>
            {lot && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[lot.status] ?? "bg-gray-100"}`}>{lot.status}</span>}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[#e4ebf5] rounded-lg transition"><X size={18} /></button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {/* ── SECTION 1: IMAGES ─────────────────────────────────── */}
          <div>
            <h3 className="font-bold text-[#1B3A6B] mb-1 flex items-center gap-2"><ImageIcon size={16} />Lot Images</h3>
            <p className="text-xs text-[#9aabb9] mb-3">Upload high quality photos. First image is the main display image shown to bidders.</p>
            <MultiImageUpload
              values={form.images}
              onChange={(urls) => set("images", urls)}
              maxImages={10}
              required
              hint="Minimum 1 image required. JPEG, PNG, WebP · Auto-compressed · Stored in database"
            />

            {/* Photography tips */}
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 space-y-1">
              <p className="font-semibold">Photography tips for livestock auctions:</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li>Front profile showing full body</li>
                <li>Side profile showing body condition</li>
                <li>Close up of face and horns if applicable</li>
                <li>Brand or ear tag clearly visible</li>
                <li>Group shot showing all animals if multiple</li>
              </ul>
            </div>
          </div>

          {/* ── SECTION 2: BASIC DETAILS ──────────────────────────── */}
          <div className="space-y-4">
            <h3 className="font-bold text-[#1B3A6B]">Lot Details</h3>

            <div>
              <label className="block text-sm font-semibold text-[#244367] mb-1">Title <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <input value={form.title} onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. 5 x Brahman Steers" className="flex-1 px-3 py-2 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30" />
                <button type="button" onClick={suggestTitle} title="Auto-suggest title"
                  className="px-3 py-2 bg-[#f0f5ff] hover:bg-[#e4ebf5] border border-[#cdd8e7] rounded-lg text-xs font-semibold text-[#5d7497] whitespace-nowrap">
                  Suggest
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-[#244367] mb-1">Species <span className="text-red-500">*</span></label>
                <select value={form.species} onChange={(e) => set("species", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30">
                  {SPECIES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#244367] mb-1">Breed</label>
                <input value={form.breed} onChange={(e) => set("breed", e.target.value)}
                  placeholder="e.g. Brahman, Merino" className="w-full px-3 py-2 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#244367] mb-1">Quantity <span className="text-red-500">*</span></label>
                <input type="number" min="1" value={form.quantity} onChange={(e) => set("quantity", parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#244367] mb-1">Gender</label>
                <select value={form.gender} onChange={(e) => set("gender", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30">
                  <option value="">Select…</option>
                  {GENDERS.map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#244367] mb-1">Avg Weight (kg)</label>
                <input type="number" min="0" value={form.weightKg} onChange={(e) => set("weightKg", e.target.value)}
                  placeholder="e.g. 350" className="w-full px-3 py-2 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#244367] mb-1">Province</label>
                <select value={form.region} onChange={(e) => set("region", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30">
                  <option value="">Select…</option>
                  {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#244367] mb-1">Location (farm/town)</label>
              <input value={form.location} onChange={(e) => set("location", e.target.value)}
                placeholder="Farm name, town" className="w-full px-3 py-2 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#244367] mb-1">Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)}
                placeholder="Health status, feeding, vaccinations, temperament…"
                className="w-full px-3 py-2 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 resize-none" />
            </div>
          </div>

          {/* ── SECTION 3: PRICING ────────────────────────────────── */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B3A6B]">Pricing</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-[#244367] mb-1">Start Price (R) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aabb9] text-sm">R</span>
                  <input type="number" min="0" step="0.01" value={form.startPriceRand} onChange={(e) => set("startPriceRand", e.target.value)}
                    placeholder="5000" className="w-full pl-7 pr-3 py-2 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30" />
                </div>
                <p className="text-xs text-[#9aabb9] mt-0.5">Bidding opens at this price</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#244367] mb-1">Reserve Price (R)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aabb9] text-sm">R</span>
                  <input type="number" min="0" step="0.01" value={form.reservePriceRand} onChange={(e) => set("reservePriceRand", e.target.value)}
                    placeholder="8000" className="w-full pl-7 pr-3 py-2 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30" />
                </div>
                <p className="text-xs text-[#9aabb9] mt-0.5">Minimum you will accept</p>
              </div>
            </div>

            {form.reservePriceRand && Number(form.reservePriceRand) > 0 && (
              <div className="bg-[#f5f8fd] rounded-lg p-3 text-xs text-[#5d7497] grid grid-cols-3 gap-2">
                <div><span className="text-[#9aabb9]">Reserve:</span><br /><strong className="text-[#244367]">R {Number(form.reservePriceRand).toLocaleString()}</strong></div>
                <div><span className="text-[#9aabb9]">Commission (5%):</span><br /><strong className="text-[#244367]">R {(Number(form.reservePriceRand) * 0.05).toFixed(0)}</strong></div>
                <div><span className="text-[#9aabb9]">Seller receives:</span><br /><strong className="text-[#2E7D32]">R {(Number(form.reservePriceRand) * 0.95).toFixed(0)}</strong></div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky footer */}
        <div className="px-5 py-4 border-t border-[#e4ebf5] bg-white flex gap-2">
          <button type="button" onClick={onClose}
            className="flex-shrink-0 px-4 py-2 border border-[#cdd8e7] rounded-lg text-sm font-semibold text-[#5d7497] hover:border-[#1B3A6B] transition">
            Cancel
          </button>
          {!lot && (
            <button type="button" onClick={() => save(true)} disabled={saving}
              className="flex-1 px-4 py-2 border-2 border-[#1B3A6B] text-[#1B3A6B] hover:bg-[#1B3A6B] hover:text-white rounded-lg text-sm font-bold transition disabled:opacity-50">
              Save & Add Another
            </button>
          )}
          <button type="button" onClick={() => save(false)} disabled={saving}
            className="flex-1 px-4 py-2 bg-[#2E7D32] hover:bg-[#1d5e20] text-white rounded-lg text-sm font-bold transition disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
            {saving ? "Saving…" : (lot ? "Save Changes" : "Save Lot")}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AdminLotsPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [lots, setLots] = useState<AuctionLot[]>([]);
  const [sessionTitle, setSessionTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [panelLot, setPanelLot] = useState<AuctionLot | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  const loadData = useCallback(async () => {
    try {
      const [lotsRes, sessionRes] = await Promise.all([
        fetch(`/api/admin/auctions/${sessionId}/lots`),
        fetch(`/api/admin/auctions/${sessionId}/control`),
      ]);
      const [lotsData, sessionData] = await Promise.all([lotsRes.json(), sessionRes.json()]);
      if (lotsData.lots) setLots(lotsData.lots);
      if (sessionData.session?.title) setSessionTitle(sessionData.session.title);
    } catch {}
    setLoading(false);
  }, [sessionId]);

  useEffect(() => { loadData(); }, [loadData]);

  async function duplicateLot(lot: AuctionLot) {
    const body = {
      title: lot.title, description: lot.description, species: lot.species,
      breed: lot.breed, quantity: lot.quantity, gender: lot.gender,
      weightKg: lot.weightKg, region: lot.region, location: lot.location,
      healthStatus: lot.healthStatus, images: [...lot.images],
      startingPriceCents: lot.startingPriceCents, reservePriceCents: lot.reservePriceCents,
    };
    try {
      const res = await fetch(`/api/admin/auctions/${sessionId}/lots`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Failed to duplicate", false); return; }
      setLots((prev) => [...prev, data.lot]);
      showToast(`Lot duplicated as Lot ${data.lot.lotNumber}`);
    } catch { showToast("Network error", false); }
  }

  async function deleteLot(id: string) {
    if (!window.confirm("Delete this lot? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/auctions/${sessionId}/lots/${id}`, { method: "DELETE" });
      if (!res.ok) { showToast("Failed to delete", false); return; }
      setLots((prev) => prev.filter((l) => l.id !== id));
      showToast("Lot deleted");
    } catch { showToast("Network error", false); }
    finally { setDeletingId(null); }
  }

  function handleSaved(lot: AuctionLot) {
    setLots((prev) => {
      const idx = prev.findIndex((l) => l.id === lot.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = lot; return n; }
      return [...prev, lot];
    });
    showToast(panelLot === "new" ? `Lot ${lot.lotNumber} created!` : "Lot saved");
  }

  const stats = {
    total: lots.length,
    withImages: lots.filter((l) => l.images.length > 0).length,
    missing: lots.filter((l) => l.images.length === 0).length,
  };

  return (
    <div className="space-y-5 pb-10 relative">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold border ${toast.ok ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          {toast.ok ? <CheckCircle size={16} /> : <AlertTriangle size={16} />} {toast.msg}
        </div>
      )}

      {/* Lot form panel */}
      {panelLot !== null && (
        <LotFormPanel
          lot={panelLot === "new" ? null : panelLot}
          onClose={() => setPanelLot(null)}
          onSaved={handleSaved}
          sessionId={sessionId}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/admin/auctions" className="flex items-center gap-1 text-sm text-[#2E7D32] hover:underline mb-1"><ArrowLeft size={14} />Back to Auctions</Link>
          <h1 className="text-2xl font-black text-[#1B3A6B]">Manage Lots</h1>
          {sessionTitle && <p className="text-sm text-[#5d7497] mt-0.5">{sessionTitle}</p>}
        </div>
        <button onClick={() => setPanelLot("new")}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2E7D32] hover:bg-[#1d5e20] text-white text-sm font-bold rounded-lg transition shadow-sm">
          <Plus size={18} /> Add New Lot
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Lots", value: stats.total, color: "text-[#1B3A6B]" },
          { label: "With Images", value: stats.withImages, color: "text-[#2E7D32]" },
          { label: "Missing Images", value: stats.missing, color: stats.missing > 0 ? "text-amber-700" : "text-[#9aabb9]" },
          { label: "Est. Duration", value: `${Math.max(1, Math.ceil(stats.total * 3))} min`, color: "text-[#5d7497]" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#e4ebf5] shadow-sm p-3">
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[#9aabb9]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Missing images warning */}
      {stats.missing > 0 && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <AlertTriangle size={18} className="text-amber-600 shrink-0" />
          <span><strong>{stats.missing} lot{stats.missing !== 1 ? "s" : ""}</strong> still need images. Buyers expect photos — lots with images get more bids.</span>
        </div>
      )}

      {/* Lots list */}
      {loading ? (
        <div className="bg-white rounded-xl border border-[#e4ebf5] p-8 text-center text-[#5d7497] text-sm">Loading lots…</div>
      ) : lots.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e4ebf5] shadow-sm p-12 text-center">
          <ImageIcon size={40} className="text-[#cdd8e7] mx-auto mb-4" />
          <h3 className="font-bold text-[#1B3A6B] text-lg mb-1">No lots yet</h3>
          <p className="text-sm text-[#5d7497] mb-5">Add lots to this auction. Each lot is a group of animals being sold together.</p>
          <button onClick={() => setPanelLot("new")}
            className="px-6 py-3 bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold text-sm rounded-lg transition">
            Add First Lot
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {lots.map((lot) => (
            <div key={lot.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition ${deletingId === lot.id ? "opacity-50 pointer-events-none" : ""} border-[#e4ebf5]`}>
              <div className="flex items-center gap-3 p-3">
                {/* Lot number */}
                <div className="w-10 h-10 rounded-lg bg-[#1B3A6B] text-white flex items-center justify-center text-xs font-black shrink-0">
                  {String(lot.lotNumber).padStart(2, "0")}
                </div>

                {/* Main image */}
                <div className="w-16 h-12 rounded-lg overflow-hidden border border-[#e4ebf5] shrink-0 bg-[#f5f8fd] flex items-center justify-center">
                  {lot.images.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={lot.images[0]} alt={lot.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-0.5">
                      <AlertTriangle size={14} className="text-amber-500" />
                      <span className="text-[8px] text-amber-600 font-bold">No img</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-[#1B3A6B] text-sm truncate">{lot.title}</p>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${STATUS_COLORS[lot.status] ?? "bg-gray-100"}`}>{lot.status}</span>
                  </div>
                  <div className="flex gap-3 text-xs text-[#9aabb9] mt-0.5 flex-wrap">
                    {lot.species && <span>{lot.species}</span>}
                    {lot.breed && <span>{lot.breed}</span>}
                    {lot.quantity > 1 && <span>Qty: {lot.quantity}</span>}
                    {lot.weightKg && <span>{lot.weightKg}kg</span>}
                  </div>
                </div>

                {/* Price */}
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-sm font-bold text-[#2E7D32]">{zar(lot.startingPriceCents)}</p>
                  {lot.reservePriceCents && <p className="text-xs text-[#9aabb9]">Res: {zar(lot.reservePriceCents)}</p>}
                </div>

                {/* Image count */}
                <div className={`flex items-center gap-1 text-xs font-semibold shrink-0 ${lot.images.length === 0 ? "text-amber-600" : "text-[#5d7497]"}`}>
                  <ImageIcon size={14} /> {lot.images.length}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setPanelLot(lot)} title="Edit"
                    className="p-1.5 rounded-lg hover:bg-[#f0f4fb] text-[#5d7497] transition">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => duplicateLot(lot)} title="Duplicate"
                    className="p-1.5 rounded-lg hover:bg-[#f0f4fb] text-[#5d7497] transition">
                    <Copy size={14} />
                  </button>
                  <button onClick={() => deleteLot(lot.id)} title="Delete"
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add another */}
          <button onClick={() => setPanelLot("new")}
            className="w-full py-3 border-2 border-dashed border-[#cdd8e7] rounded-xl text-sm font-semibold text-[#9aabb9] hover:border-[#2E7D32] hover:text-[#2E7D32] transition flex items-center justify-center gap-2">
            <Plus size={16} /> Add Another Lot
          </button>
        </div>
      )}
    </div>
  );
}
