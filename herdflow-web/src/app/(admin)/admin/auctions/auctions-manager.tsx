"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────

type AuctionLot = {
  id: string;
  lotNumber: number;
  title: string;
  description: string;
  breed: string | null;
  weightKg: number | null;
  region: string | null;
  startingPriceCents: number;
  reservePriceCents: number | null;
  currentBidCents: number;
  winnerName: string | null;
  winnerEmail: string | null;
  status: string;
  _count: { bids: number };
};

type AuctionSession = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: string;
  scheduledAt: Date | string;
  closedAt: Date | string | null;
  lots: AuctionLot[];
};

type Props = { initialSessions: AuctionSession[] };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function zar(cents: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(cents / 100);
}

function fmtDate(v: Date | string) {
  return new Date(v).toLocaleString("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const STATUS_BADGE: Record<string, string> = {
  UPCOMING: "bg-blue-100 text-blue-800",
  LIVE: "bg-green-100 text-green-800",
  CLOSED: "bg-neutral-100 text-neutral-700",
  CANCELLED: "bg-red-100 text-red-800",
};

const LOT_STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  OPEN: "bg-green-100 text-green-800",
  SOLD: "bg-blue-100 text-blue-800",
  PASSED: "bg-neutral-100 text-neutral-700",
  CANCELLED: "bg-red-100 text-red-800",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function AuctionsManager({ initialSessions }: Props) {
  const [sessions, setSessions] = useState<AuctionSession[]>(initialSessions);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Create session form
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newScheduledAt, setNewScheduledAt] = useState("");
  const [creating, setCreating] = useState(false);

  // Add lot form (per-session)
  const [addLotFor, setAddLotFor] = useState<string | null>(null);
  const [lotTitle, setLotTitle] = useState("");
  const [lotDesc, setLotDesc] = useState("");
  const [lotBreed, setLotBreed] = useState("");
  const [lotWeight, setLotWeight] = useState("");
  const [lotRegion, setLotRegion] = useState("");
  const [lotStart, setLotStart] = useState("");
  const [lotReserve, setLotReserve] = useState("");
  const [addingLot, setAddingLot] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  let toastTimer: ReturnType<typeof setTimeout> | null = null;

  function toast(msg: string) {
    setToastMsg(msg);
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => setToastMsg(null), 4000);
  }

  async function createSession(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newScheduledAt) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim(), scheduledAt: newScheduledAt }),
      });
      const data = await res.json();
      if (res.ok && data.session) {
        setSessions((prev) => [{ ...data.session, lots: [] }, ...prev]);
        setShowCreate(false);
        setNewTitle("");
        setNewDesc("");
        setNewScheduledAt("");
        toast("Auction created.");
      } else {
        toast((data as { error?: string }).error || "Failed to create.");
      }
    } catch {
      toast("Network error.");
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(sessionId: string, status: string) {
    try {
      const res = await fetch("/api/admin/auctions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, status }),
      });
      const data = await res.json();
      if (res.ok) {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== sessionId) return s;
            const updatedLots = s.lots.map((l) => {
              if (status === "LIVE" && l.status === "PENDING") return { ...l, status: "OPEN" };
              if (status === "CLOSED" && l.status === "OPEN") return { ...l, status: "PASSED" };
              return l;
            });
            return { ...s, status: data.session.status, closedAt: data.session.closedAt, lots: updatedLots };
          }),
        );
        toast(`Auction set to ${status}.`);
      } else {
        toast((data as { error?: string }).error || "Failed to update.");
      }
    } catch {
      toast("Network error.");
    }
  }

  async function deleteSession(sessionId: string) {
    if (!confirm("Delete this auction and all its lots? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/auctions?sessionId=${sessionId}`, { method: "DELETE" });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        toast("Auction deleted.");
      } else {
        toast("Failed to delete.");
      }
    } catch {
      toast("Network error.");
    }
  }

  async function addLot(e: React.FormEvent, sessionId: string) {
    e.preventDefault();
    if (!lotTitle.trim() || !lotStart) return;
    const startingPriceCents = Math.round(parseFloat(lotStart) * 100);
    if (Number.isNaN(startingPriceCents) || startingPriceCents < 1) {
      toast("Starting price must be > 0.");
      return;
    }
    const reservePriceCents = lotReserve ? Math.round(parseFloat(lotReserve) * 100) : undefined;
    setAddingLot(true);
    try {
      const res = await fetch("/api/admin/auctions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addLotToSession: sessionId,
          title: lotTitle.trim(),
          description: lotDesc.trim(),
          breed: lotBreed.trim() || undefined,
          weightKg: lotWeight ? parseInt(lotWeight) : undefined,
          region: lotRegion.trim() || undefined,
          startingPriceCents,
          reservePriceCents,
        }),
      });
      const data = await res.json();
      if (res.ok && data.lot) {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, lots: [...s.lots, { ...data.lot, _count: { bids: 0 } }] } : s)),
        );
        setAddLotFor(null);
        setLotTitle("");
        setLotDesc("");
        setLotBreed("");
        setLotWeight("");
        setLotRegion("");
        setLotStart("");
        setLotReserve("");
        toast("Lot added.");
      } else {
        toast((data as { error?: string }).error || "Failed to add lot.");
      }
    } catch {
      toast("Network error.");
    } finally {
      setAddingLot(false);
    }
  }

  async function updateLotStatus(lotId: string, sessionId: string, lotStatus: string) {
    try {
      const res = await fetch("/api/admin/auctions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lotId, lotStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? { ...s, lots: s.lots.map((l) => (l.id === lotId ? { ...l, status: data.lot.status } : l)) }
              : s,
          ),
        );
        toast(`Lot status → ${lotStatus}.`);
      } else {
        toast((data as { error?: string }).error || "Failed.");
      }
    } catch {
      toast("Network error.");
    }
  }

  async function deleteLot(lotId: string, sessionId: string) {
    if (!confirm("Delete this lot?")) return;
    try {
      const res = await fetch(`/api/admin/auctions?lotId=${lotId}`, { method: "DELETE" });
      if (res.ok) {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, lots: s.lots.filter((l) => l.id !== lotId) } : s)),
        );
        toast("Lot deleted.");
      } else {
        toast("Failed to delete.");
      }
    } catch {
      toast("Network error.");
    }
  }

  return (
    <div className="space-y-4">
      {toastMsg && (
        <div role="alert" className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
          {toastMsg}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white"
        >
          {showCreate ? "Cancel" : "+ New Auction"}
        </button>
      </div>

      {/* Create session form */}
      {showCreate && (
        <form onSubmit={createSession} className="max-w-lg space-y-3 rounded-xl border border-[#d8e0ec] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-brand-navy">New Auction Session</h2>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-[#244367]">Title *</label>
            <input
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm outline-none focus:border-brand-navy"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Spring Cattle Auction"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-[#244367]">Description</label>
            <input
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm outline-none focus:border-brand-navy"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-[#244367]">Scheduled Date & Time *</label>
            <input
              type="datetime-local"
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm outline-none focus:border-brand-navy"
              value={newScheduledAt}
              onChange={(e) => setNewScheduledAt(e.target.value)}
                            title="Scheduled Date & Time"
              required
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create Auction"}
          </button>
        </form>
      )}

      {/* Sessions list */}
      {sessions.length === 0 ? (
        <p className="rounded-xl border border-[#d8e0ec] bg-white p-6 text-sm text-[#5d7497]">
          No auction sessions yet. Create your first one above.
        </p>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <article key={s.id} className="rounded-xl border border-[#d8e0ec] bg-white shadow-sm">
              {/* Session header */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-semibold text-brand-navy">{s.title}</h2>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[s.status] ?? ""}`}>
                      {s.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#5d7497]">
                    {fmtDate(s.scheduledAt)} · {s.lots.length} lot{s.lots.length !== 1 ? "s" : ""} · /auction/live/{s.slug}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {s.status === "UPCOMING" && (
                    <button
                      onClick={() => updateStatus(s.id, "LIVE")}
                      className="rounded-lg border border-green-400 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-800"
                    >
                      Go Live
                    </button>
                  )}
                  {s.status === "LIVE" && (
                    <>
                      <Link
                        href={`/admin/auctions/${s.id}/control`}
                        className="rounded-lg bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-xs font-bold"
                      >
                        🎙 Control Room
                      </Link>
                      <button
                        onClick={() => updateStatus(s.id, "CLOSED")}
                        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700"
                      >
                        Close Auction
                      </button>
                    </>
                  )}
                  <Link
                    href={`/admin/auctions/${s.id}/registrations`}
                    className="rounded-lg border border-[#1B3A6B]/30 bg-[#f5f8fd] px-3 py-1.5 text-xs font-semibold text-[#1B3A6B]"
                  >
                    Bidders
                  </Link>
                  <button
                    onClick={() => setExpandedId((prev) => (prev === s.id ? null : s.id))}
                    className="rounded-lg border border-[#cdd8e7] px-3 py-1.5 text-xs font-semibold text-[#244367]"
                  >
                    {expandedId === s.id ? "Hide Lots" : "Manage Lots"}
                  </button>
                  {s.status !== "LIVE" && (
                    <button
                      onClick={() => deleteSession(s.id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Lots panel */}
              {expandedId === s.id && (
                <div className="border-t border-[#e4ebf5] px-4 pb-4 pt-3 space-y-3">
                  {/* Add lot form */}
                  {addLotFor === s.id ? (
                    <form onSubmit={(e) => addLot(e, s.id)} className="space-y-3 rounded-lg border border-[#d8e0ec] bg-[#f8fafd] p-4">
                      <h3 className="text-sm font-semibold text-brand-navy">Add Lot</h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-[#244367]">Title *</label>
                          <input
                            className="w-full rounded border border-[#cdd8e7] px-2 py-1.5 text-sm outline-none focus:border-brand-navy"
                            value={lotTitle}
                            onChange={(e) => setLotTitle(e.target.value)}
                            placeholder="3x Angus Heifers"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-[#244367]">Breed</label>
                          <input
                            className="w-full rounded border border-[#cdd8e7] px-2 py-1.5 text-sm outline-none focus:border-brand-navy"
                            value={lotBreed}
                            onChange={(e) => setLotBreed(e.target.value)}
                            placeholder="Angus"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-[#244367]">Weight (kg)</label>
                          <input
                            type="number"
                            className="w-full rounded border border-[#cdd8e7] px-2 py-1.5 text-sm outline-none focus:border-brand-navy"
                            value={lotWeight}
                            onChange={(e) => setLotWeight(e.target.value)}
                            placeholder="320"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-[#244367]">Region</label>
                          <input
                            className="w-full rounded border border-[#cdd8e7] px-2 py-1.5 text-sm outline-none focus:border-brand-navy"
                            value={lotRegion}
                            onChange={(e) => setLotRegion(e.target.value)}
                            placeholder="Limpopo"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-[#244367]">Starting Price (ZAR) *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            className="w-full rounded border border-[#cdd8e7] px-2 py-1.5 text-sm outline-none focus:border-brand-navy"
                            value={lotStart}
                            onChange={(e) => setLotStart(e.target.value)}
                            placeholder="5000"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-[#244367]">Reserve Price (ZAR)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full rounded border border-[#cdd8e7] px-2 py-1.5 text-sm outline-none focus:border-brand-navy"
                            value={lotReserve}
                            onChange={(e) => setLotReserve(e.target.value)}
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-[#244367]">Description</label>
                        <input
                          className="w-full rounded border border-[#cdd8e7] px-2 py-1.5 text-sm outline-none focus:border-brand-navy"
                          value={lotDesc}
                          onChange={(e) => setLotDesc(e.target.value)}
                          placeholder="Optional lot description"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={addingLot}
                          className="rounded-lg bg-brand-navy px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          {addingLot ? "Adding…" : "Add Lot"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddLotFor(null)}
                          className="rounded-lg border border-[#cdd8e7] px-3 py-1.5 text-xs font-semibold text-[#244367]"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setAddLotFor(s.id)}
                      className="rounded-lg border border-dashed border-[#8faacc] px-3 py-2 text-xs font-semibold text-[#244367]"
                    >
                      + Add Lot
                    </button>
                  )}

                  {/* Lots table */}
                  {s.lots.length === 0 ? (
                    <p className="text-xs text-[#5d7497]">No lots added yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#e4ebf5] text-left text-xs font-semibold uppercase tracking-wide text-[#5d7497]">
                            <th className="pb-2 pr-4">#</th>
                            <th className="pb-2 pr-4">Title</th>
                            <th className="pb-2 pr-4">Breed</th>
                            <th className="pb-2 pr-4">Start</th>
                            <th className="pb-2 pr-4">Current Bid</th>
                            <th className="pb-2 pr-4">Bids</th>
                            <th className="pb-2 pr-4">Status</th>
                            <th className="pb-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0f4fa]">
                          {s.lots.map((lot) => (
                            <tr key={lot.id} className="text-[#244367]">
                              <td className="py-2 pr-4 font-semibold">{lot.lotNumber}</td>
                              <td className="py-2 pr-4">{lot.title}</td>
                              <td className="py-2 pr-4 text-[#5d7497]">{lot.breed ?? "—"}</td>
                              <td className="py-2 pr-4">{zar(lot.startingPriceCents)}</td>
                              <td className="py-2 pr-4">
                                {lot.currentBidCents > 0 ? (
                                  <span className="font-semibold text-brand-gold">{zar(lot.currentBidCents)}</span>
                                ) : (
                                  <span className="text-[#9aabb9]">—</span>
                                )}
                              </td>
                              <td className="py-2 pr-4">{lot._count.bids}</td>
                              <td className="py-2 pr-4">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${LOT_STATUS_BADGE[lot.status] ?? ""}`}>
                                  {lot.status}
                                </span>
                              </td>
                              <td className="py-2">
                                <div className="flex gap-1.5">
                                  {lot.status === "OPEN" && (
                                    <button
                                      onClick={() => updateLotStatus(lot.id, s.id, "SOLD")}
                                      className="rounded border border-blue-300 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800"
                                    >
                                      Sold
                                    </button>
                                  )}
                                  <button
                                    onClick={() => deleteLot(lot.id, s.id)}
                                    className="rounded border border-red-200 px-2 py-0.5 text-xs font-semibold text-red-700"
                                  >
                                    Del
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
