"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  ArrowLeft,
  Pencil,
  Trash2,
  Copy,
  ImageIcon,
  AlertTriangle,
} from "lucide-react";
import { MultiImageUpload } from "@/components/ui/MultiImageUpload";
import { Button } from "@/components/admin/Button";
import { Card, StatCard } from "@/components/admin/Card";
import { Input, Select, Textarea } from "@/components/admin/Field";
import { Modal } from "@/components/admin/Modal";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { StatusBadge } from "@/components/admin/Badge";
import { EmptyState } from "@/components/admin/EmptyState";

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
  title: "",
  description: "",
  species: "Cattle",
  breed: "",
  quantity: 1,
  gender: "",
  weightKg: "",
  region: "",
  location: "",
  healthStatus: "",
  images: [],
  startPriceRand: "",
  reservePriceRand: "",
};

const SPECIES = ["Cattle", "Sheep", "Goats", "Pigs", "Game", "Horses", "Poultry", "Other"];
const GENDERS = [
  "Mixed",
  "Bulls",
  "Steers",
  "Heifers",
  "Cows",
  "Rams",
  "Ewes",
  "Wethers",
  "Does",
  "Bucks",
];
const PROVINCES = [
  "North West",
  "Gauteng",
  "Limpopo",
  "Free State",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Western Cape",
  "Northern Cape",
  "Mpumalanga",
];

function zar(cents: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function lotToForm(lot: AuctionLot): LotFormData {
  return {
    title: lot.title,
    description: lot.description,
    species: lot.species || "Cattle",
    breed: lot.breed || "",
    quantity: lot.quantity,
    gender: lot.gender || "",
    weightKg: lot.weightKg ? String(lot.weightKg) : "",
    region: lot.region || "",
    location: lot.location || "",
    healthStatus: lot.healthStatus || "",
    images: [...lot.images],
    startPriceRand: String(lot.startingPriceCents / 100),
    reservePriceRand: lot.reservePriceCents ? String(lot.reservePriceCents / 100) : "",
  };
}

// ── Lot Form Modal ─────────────────────────────────────────────────────────────

function LotFormModal({
  lot,
  onClose,
  onSaved,
  sessionId,
}: {
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
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!form.startPriceRand || Number(form.startPriceRand) <= 0) {
      setError("Valid start price required");
      return;
    }
    setSaving(true);
    setError("");

    const body = {
      title: form.title.trim(),
      description: form.description.trim(),
      species: form.species,
      breed: form.breed.trim(),
      quantity: form.quantity,
      gender: form.gender,
      weightKg: form.weightKg ? Number(form.weightKg) : null,
      region: form.region,
      location: form.location.trim(),
      healthStatus: form.healthStatus,
      images: form.images,
      documents: [],
      startingPriceCents: Math.round(Number(form.startPriceRand) * 100),
      reservePriceCents: form.reservePriceRand
        ? Math.round(Number(form.reservePriceRand) * 100)
        : null,
    };

    try {
      let res: Response;
      if (lot) {
        res = await fetch(`/api/admin/auctions/${sessionId}/lots/${lot.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`/api/admin/auctions/${sessionId}/lots`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save lot");
        return;
      }
      onSaved(data.lot);
      if (addAnother) {
        setForm(EMPTY_FORM);
      } else {
        onClose();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={
        <div className="flex items-center gap-3">
          <span>{lot ? `Edit Lot ${lot.lotNumber}` : "Add New Lot"}</span>
          {lot && <StatusBadge status={lot.status} />}
        </div>
      }
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {!lot && (
            <Button type="button" variant="outline" onClick={() => save(true)} loading={saving}>
              Save & Add Another
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={() => save(false)} loading={saving}>
            {lot ? "Save Changes" : "Save Lot"}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* ── SECTION 1: IMAGES ─────────────────────────────────── */}
        <div>
          <h3 className="mb-1 flex items-center gap-2 font-bold text-navy-600">
            <ImageIcon size={16} />
            Lot Images
          </h3>
          <p className="mb-3 text-xs text-navy-200">
            Upload high quality photos. First image is the main display image shown to bidders.
          </p>
          <MultiImageUpload
            values={form.images}
            onChange={(urls) => set("images", urls)}
            maxImages={10}
            required
            hint="Minimum 1 image required. JPEG, PNG, WebP · Auto-compressed · Stored in database"
          />

          {/* Photography tips */}
          <div className="mt-3 space-y-1 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
            <p className="font-semibold">Photography tips for livestock auctions:</p>
            <ul className="list-inside list-disc space-y-0.5">
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
          <h3 className="font-bold text-navy-600">Lot Details</h3>

          <div>
            <label className="mb-1 block text-sm font-semibold text-navy-500">
              Title <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <Input
                className="flex-1"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. 5 x Brahman Steers"
              />
              <Button type="button" variant="outline" size="sm" onClick={suggestTitle} title="Auto-suggest title">
                Suggest
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Species"
              required
              value={form.species}
              onChange={(e) => set("species", e.target.value)}
            >
              {SPECIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
            <Input
              label="Breed"
              value={form.breed}
              onChange={(e) => set("breed", e.target.value)}
              placeholder="e.g. Brahman, Merino"
            />
            <Input
              label="Quantity"
              required
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => set("quantity", parseInt(e.target.value) || 1)}
            />
            <Select label="Gender" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
              <option value="">Select…</option>
              {GENDERS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </Select>
            <Input
              label="Avg Weight (kg)"
              type="number"
              min="0"
              value={form.weightKg}
              onChange={(e) => set("weightKg", e.target.value)}
              placeholder="e.g. 350"
            />
            <Select label="Province" value={form.region} onChange={(e) => set("region", e.target.value)}>
              <option value="">Select…</option>
              {PROVINCES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </div>

          <Input
            label="Location (farm/town)"
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Farm name, town"
          />

          <Textarea
            label="Description"
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Health status, feeding, vaccinations, temperament…"
          />
        </div>

        {/* ── SECTION 3: PRICING ────────────────────────────────── */}
        <div className="space-y-3">
          <h3 className="font-bold text-navy-600">Pricing</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-navy-500">
                Start Price (R) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-navy-200">R</span>
                <Input
                  className="pl-7"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.startPriceRand}
                  onChange={(e) => set("startPriceRand", e.target.value)}
                  placeholder="5000"
                />
              </div>
              <p className="mt-0.5 text-xs text-navy-200">Bidding opens at this price</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-navy-500">Reserve Price (R)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-navy-200">R</span>
                <Input
                  className="pl-7"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.reservePriceRand}
                  onChange={(e) => set("reservePriceRand", e.target.value)}
                  placeholder="8000"
                />
              </div>
              <p className="mt-0.5 text-xs text-navy-200">Minimum you will accept</p>
            </div>
          </div>

          {form.reservePriceRand && Number(form.reservePriceRand) > 0 && (
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-navy-25 p-3 text-xs text-navy-300">
              <div>
                <span className="text-navy-200">Reserve:</span>
                <br />
                <strong className="text-navy-500">R {Number(form.reservePriceRand).toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-navy-200">Commission (5%):</span>
                <br />
                <strong className="text-navy-500">
                  R {(Number(form.reservePriceRand) * 0.05).toFixed(0)}
                </strong>
              </div>
              <div>
                <span className="text-navy-200">Seller receives:</span>
                <br />
                <strong className="text-green">
                  R {(Number(form.reservePriceRand) * 0.95).toFixed(0)}
                </strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadData = useCallback(() => {
    return Promise.all([
      fetch(`/api/admin/auctions/${sessionId}/lots`),
      fetch(`/api/admin/auctions/${sessionId}/control`),
    ])
      .then(([lotsRes, sessionRes]) => Promise.all([lotsRes.json(), sessionRes.json()]))
      .then(([lotsData, sessionData]) => {
        if (lotsData.lots) setLots(lotsData.lots);
        if (sessionData.session?.title) setSessionTitle(sessionData.session.title);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function duplicateLot(lot: AuctionLot) {
    const body = {
      title: lot.title,
      description: lot.description,
      species: lot.species,
      breed: lot.breed,
      quantity: lot.quantity,
      gender: lot.gender,
      weightKg: lot.weightKg,
      region: lot.region,
      location: lot.location,
      healthStatus: lot.healthStatus,
      images: [...lot.images],
      startingPriceCents: lot.startingPriceCents,
      reservePriceCents: lot.reservePriceCents,
    };
    try {
      const res = await fetch(`/api/admin/auctions/${sessionId}/lots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to duplicate");
        return;
      }
      setLots((prev) => [...prev, data.lot]);
      toast.success(`Lot duplicated as Lot ${data.lot.lotNumber}`);
    } catch {
      toast.error("Network error");
    }
  }

  async function confirmDeleteLot() {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/auctions/${sessionId}/lots/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete");
        return;
      }
      setLots((prev) => prev.filter((l) => l.id !== id));
      toast.success("Lot deleted");
    } catch {
      toast.error("Network error");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  function handleSaved(lot: AuctionLot) {
    setLots((prev) => {
      const idx = prev.findIndex((l) => l.id === lot.id);
      if (idx >= 0) {
        const n = [...prev];
        n[idx] = lot;
        return n;
      }
      return [...prev, lot];
    });
    toast.success(panelLot === "new" ? `Lot ${lot.lotNumber} created!` : "Lot saved");
  }

  const stats = {
    total: lots.length,
    withImages: lots.filter((l) => l.images.length > 0).length,
    missing: lots.filter((l) => l.images.length === 0).length,
  };

  return (
    <div className="relative space-y-5 pb-10">
      {/* Lot form modal */}
      {panelLot !== null && (
        <LotFormModal
          lot={panelLot === "new" ? null : panelLot}
          onClose={() => setPanelLot(null)}
          onSaved={handleSaved}
          sessionId={sessionId}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/auctions" className="mb-1 flex items-center gap-1 text-sm text-green hover:underline">
            <ArrowLeft size={14} />
            Back to Auctions
          </Link>
          <h1 className="text-2xl font-black text-navy-600">Manage Lots</h1>
          {sessionTitle && <p className="mt-0.5 text-sm text-navy-300">{sessionTitle}</p>}
        </div>
        <Button variant="secondary" onClick={() => setPanelLot("new")}>
          <Plus size={18} /> Add New Lot
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Lots" value={stats.total} accent="navy" />
        <StatCard label="With Images" value={stats.withImages} accent="green" />
        <StatCard
          label="Missing Images"
          value={stats.missing}
          accent={stats.missing > 0 ? "gold" : "navy"}
        />
        <StatCard label="Est. Duration" value={`${Math.max(1, Math.ceil(stats.total * 3))} min`} accent="navy" />
      </div>

      {/* Missing images warning */}
      {stats.missing > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle size={18} className="shrink-0 text-amber-600" />
          <span>
            <strong>
              {stats.missing} lot{stats.missing !== 1 ? "s" : ""}
            </strong>{" "}
            still need images. Buyers expect photos — lots with images get more bids.
          </span>
        </div>
      )}

      {/* Lots list */}
      {loading ? (
        <Card className="p-8 text-center text-sm text-navy-300">Loading lots…</Card>
      ) : lots.length === 0 ? (
        <Card>
          <EmptyState
            icon={ImageIcon}
            title="No lots yet"
            description="Add lots to this auction. Each lot is a group of animals being sold together."
            action={
              <Button variant="secondary" onClick={() => setPanelLot("new")}>
                Add First Lot
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {lots.map((lot) => (
            <Card
              key={lot.id}
              className={`overflow-hidden transition hover:shadow-md ${deletingId === lot.id ? "pointer-events-none opacity-50" : ""}`}
            >
              <div className="flex items-center gap-3 p-3">
                {/* Lot number */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-600 text-xs font-black text-white">
                  {String(lot.lotNumber).padStart(2, "0")}
                </div>

                {/* Main image */}
                <div className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-navy-50 bg-navy-25">
                  {lot.images.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={lot.images[0]} alt={lot.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-0.5">
                      <AlertTriangle size={14} className="text-amber-500" />
                      <span className="text-[8px] font-bold text-amber-600">No img</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-navy-600">{lot.title}</p>
                    <StatusBadge status={lot.status} />
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-navy-200">
                    {lot.species && <span>{lot.species}</span>}
                    {lot.breed && <span>{lot.breed}</span>}
                    {lot.quantity > 1 && <span>Qty: {lot.quantity}</span>}
                    {lot.weightKg && <span>{lot.weightKg}kg</span>}
                  </div>
                </div>

                {/* Price */}
                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-sm font-bold text-green">{zar(lot.startingPriceCents)}</p>
                  {lot.reservePriceCents && (
                    <p className="text-xs text-navy-200">Res: {zar(lot.reservePriceCents)}</p>
                  )}
                </div>

                {/* Image count */}
                <div
                  className={`flex shrink-0 items-center gap-1 text-xs font-semibold ${lot.images.length === 0 ? "text-amber-600" : "text-navy-300"}`}
                >
                  <ImageIcon size={14} /> {lot.images.length}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setPanelLot(lot)} title="Edit">
                    <Pencil size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => duplicateLot(lot)} title="Duplicate">
                    <Copy size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => setConfirmDeleteId(lot.id)}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {/* Add another */}
          <button
            onClick={() => setPanelLot("new")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-navy-100 py-3 text-sm font-semibold text-navy-200 transition hover:border-green hover:text-green"
          >
            <Plus size={16} /> Add Another Lot
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={confirmDeleteLot}
        title="Delete this lot?"
        description="This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
