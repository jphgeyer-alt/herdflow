"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { formatRand } from "@/lib/marketing/format";

type RequestRow = {
  id: string;
  number: string;
  pickupAddress: string;
  pickupRegion: string;
  dropoffAddress: string;
  dropoffRegion: string;
  cargoDescription: string;
  neededBy: string | null;
  priceCents: number | null;
  commissionCents: number;
  status: string;
  notes: string | null;
  createdAt: string;
  logisticsPartner: { companyName: string } | null;
  order: { orderNumber: string } | null;
};

type PartnerOption = { id: string; companyName: string; status: string };

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-slate-100 text-slate-600",
  ASSIGNED: "bg-blue-100 text-blue-700",
  IN_TRANSIT: "bg-amber-100 text-amber-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const TABS = ["ALL", "OPEN", "ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED"] as const;

function NewRequestModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupRegion, setPickupRegion] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [dropoffRegion, setDropoffRegion] = useState("");
  const [cargoDescription, setCargoDescription] = useState("");
  const [neededBy, setNeededBy] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    if (
      !pickupAddress.trim() ||
      !pickupRegion.trim() ||
      !dropoffAddress.trim() ||
      !dropoffRegion.trim() ||
      !cargoDescription.trim() ||
      !price
    ) {
      setError("Please complete all required fields.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/logistics/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupAddress,
          pickupRegion,
          dropoffAddress,
          dropoffRegion,
          cargoDescription,
          neededBy: neededBy || undefined,
          priceCents: Math.round(Number(price) * 100),
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create delivery request.");
        return;
      }
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1B3A6B]">New Delivery Request</h2>
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

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-semibold text-[#244367]">Pickup Address</span>
            <input
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Pickup Region</span>
            <input
              value={pickupRegion}
              onChange={(e) => setPickupRegion(e.target.value)}
              placeholder="e.g. Gauteng"
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-semibold text-[#244367]">Dropoff Address</span>
            <input
              value={dropoffAddress}
              onChange={(e) => setDropoffAddress(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Dropoff Region</span>
            <input
              value={dropoffRegion}
              onChange={(e) => setDropoffRegion(e.target.value)}
              placeholder="e.g. Free State"
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-semibold text-[#244367]">Cargo Description</span>
            <input
              value={cargoDescription}
              onChange={(e) => setCargoDescription(e.target.value)}
              placeholder="e.g. 12 head of cattle"
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Needed By (optional)</span>
            <input
              type="date"
              value={neededBy}
              onChange={(e) => setNeededBy(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Transport Price (R)</span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-semibold text-[#244367]">Notes (optional)</span>
            <textarea
              rows={2}
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
            {saving ? "Creating…" : "Create Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SetPriceRow({ requestId, onDone }: { requestId: string; onDone: () => void }) {
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    const priceCents = Math.round(Number(price) * 100);
    if (!priceCents || priceCents <= 0) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/logistics/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceCents }),
      });
      if (res.ok) onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Quote R"
        className="w-24 rounded-lg border border-[#cdd8e7] px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
      />
      <button
        type="button"
        disabled={busy || !price}
        onClick={save}
        className="rounded-lg bg-[#1B3A6B] px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
      >
        Set Price
      </button>
    </div>
  );
}

function AssignRow({
  requestId,
  partners,
  onDone,
}: {
  requestId: string;
  partners: PartnerOption[];
  onDone: () => void;
}) {
  const [partnerId, setPartnerId] = useState("");
  const [busy, setBusy] = useState(false);

  async function assign() {
    if (!partnerId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/logistics/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logisticsPartnerId: partnerId }),
      });
      if (res.ok) onDone();
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/logistics/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label="Assign partner"
        value={partnerId}
        onChange={(e) => setPartnerId(e.target.value)}
        className="rounded-lg border border-[#cdd8e7] px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
      >
        <option value="">Assign partner…</option>
        {partners.map((p) => (
          <option key={p.id} value={p.id}>
            {p.companyName}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={busy || !partnerId}
        onClick={assign}
        className="rounded-lg bg-[#1B3A6B] px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
      >
        Assign
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={cancel}
        className="rounded-lg border border-[#cdd8e7] px-3 py-1 text-xs font-bold text-[#5d7497] hover:border-red-400 hover:text-red-600"
      >
        Cancel
      </button>
    </div>
  );
}

export default function LogisticsRequestsPage() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [filter, setFilter] = useState<(typeof TABS)[number]>("ALL");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  function load(status: string) {
    const qs = status === "ALL" ? "" : `?status=${status}`;
    fetch(`/api/admin/logistics/requests${qs}`)
      .then((r) => r.json())
      .then((d) => setRequests(d.requests || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(filter);
  }, [filter]);

  function selectFilter(tab: (typeof TABS)[number]) {
    setFilter(tab);
    setLoading(true);
  }

  useEffect(() => {
    fetch("/api/admin/logistics?status=APPROVED")
      .then((r) => r.json())
      .then((d) => setPartners(d.partners || []));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => selectFilter(tab)}
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
          + New Request
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e4ebf5] bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#5d7497]">Loading…</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#5d7497]">No delivery requests found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#f5f8fd] text-xs font-semibold uppercase tracking-wide text-[#5d7497]">
              <tr>
                <th className="px-4 py-3 text-left">Number</th>
                <th className="px-4 py-3 text-left">Route</th>
                <th className="px-4 py-3 text-left">Cargo</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Partner</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f9]">
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-semibold text-[#1B3A6B]">
                    {r.number}
                    {r.order && (
                      <div className="text-xs font-normal text-[#5d7497]">
                        Order {r.order.orderNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#244367]">
                    <div>{r.pickupRegion}</div>
                    <div className="text-xs text-[#5d7497]">→ {r.dropoffRegion}</div>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-[#5d7497]">
                    {r.cargoDescription}
                  </td>
                  <td className="px-4 py-3 font-bold text-[#244367]">
                    {r.priceCents === null ? (
                      <span className="text-xs font-normal text-[#9aabb9]">Awaiting quote</span>
                    ) : (
                      formatRand(r.priceCents / 100)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#5d7497]">
                    {r.logisticsPartner?.companyName || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "OPEN" && r.priceCents === null && (
                      <SetPriceRow requestId={r.id} onDone={() => load(filter)} />
                    )}
                    {r.status === "OPEN" && r.priceCents !== null && (
                      <AssignRow requestId={r.id} partners={partners} onDone={() => load(filter)} />
                    )}
                    {(r.status === "ASSIGNED" || r.status === "IN_TRANSIT") && (
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await fetch(`/api/admin/logistics/requests/${r.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "CANCELLED" }),
                          });
                          if (res.ok) load(filter);
                        }}
                        className="rounded-lg border border-[#cdd8e7] px-3 py-1 text-xs font-bold text-[#5d7497] hover:border-red-400 hover:text-red-600"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showNew && (
        <NewRequestModal
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            load(filter);
          }}
        />
      )}
    </div>
  );
}
