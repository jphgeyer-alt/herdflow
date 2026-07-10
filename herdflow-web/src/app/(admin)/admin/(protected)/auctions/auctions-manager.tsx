"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Package } from "lucide-react";
import { Button } from "@/components/admin/Button";
import { Card } from "@/components/admin/Card";
import { Input } from "@/components/admin/Field";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { StatusBadge } from "@/components/admin/Badge";
import { EmptyState } from "@/components/admin/EmptyState";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

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

  // Delete confirmations
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [deleteLotTarget, setDeleteLotTarget] = useState<{ lotId: string; sessionId: string } | null>(
    null,
  );

  async function createSession(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newScheduledAt) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          scheduledAt: newScheduledAt,
        }),
      });
      const data = await res.json();
      if (res.ok && data.session) {
        setSessions((prev) => [{ ...data.session, lots: [] }, ...prev]);
        setShowCreate(false);
        setNewTitle("");
        setNewDesc("");
        setNewScheduledAt("");
        toast.success("Auction created.");
      } else {
        toast.error((data as { error?: string }).error || "Failed to create.");
      }
    } catch {
      toast.error("Network error.");
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
            return {
              ...s,
              status: data.session.status,
              closedAt: data.session.closedAt,
              lots: updatedLots,
            };
          }),
        );
        toast.success(`Auction set to ${status}.`);
      } else {
        toast.error((data as { error?: string }).error || "Failed to update.");
      }
    } catch {
      toast.error("Network error.");
    }
  }

  async function confirmDeleteSession() {
    if (!deleteSessionId) return;
    const sessionId = deleteSessionId;
    try {
      const res = await fetch(`/api/admin/auctions?sessionId=${sessionId}`, { method: "DELETE" });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        toast.success("Auction deleted.");
      } else {
        toast.error("Failed to delete.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setDeleteSessionId(null);
    }
  }

  async function addLot(e: React.FormEvent, sessionId: string) {
    e.preventDefault();
    if (!lotTitle.trim() || !lotStart) return;
    const startingPriceCents = Math.round(parseFloat(lotStart) * 100);
    if (Number.isNaN(startingPriceCents) || startingPriceCents < 1) {
      toast.error("Starting price must be > 0.");
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
          prev.map((s) =>
            s.id === sessionId
              ? { ...s, lots: [...s.lots, { ...data.lot, _count: { bids: 0 } }] }
              : s,
          ),
        );
        setAddLotFor(null);
        setLotTitle("");
        setLotDesc("");
        setLotBreed("");
        setLotWeight("");
        setLotRegion("");
        setLotStart("");
        setLotReserve("");
        toast.success("Lot added.");
      } else {
        toast.error((data as { error?: string }).error || "Failed to add lot.");
      }
    } catch {
      toast.error("Network error.");
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
              ? {
                  ...s,
                  lots: s.lots.map((l) => (l.id === lotId ? { ...l, status: data.lot.status } : l)),
                }
              : s,
          ),
        );
        toast.success(`Lot status → ${lotStatus}.`);
      } else {
        toast.error((data as { error?: string }).error || "Failed.");
      }
    } catch {
      toast.error("Network error.");
    }
  }

  async function confirmDeleteLot() {
    if (!deleteLotTarget) return;
    const { lotId, sessionId } = deleteLotTarget;
    try {
      const res = await fetch(`/api/admin/auctions?lotId=${lotId}`, { method: "DELETE" });
      if (res.ok) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId ? { ...s, lots: s.lots.filter((l) => l.id !== lotId) } : s,
          ),
        );
        toast.success("Lot deleted.");
      } else {
        toast.error("Failed to delete.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setDeleteLotTarget(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex gap-3">
        <Button onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? "Cancel" : "+ New Auction"}
        </Button>
      </div>

      {/* Create session form */}
      {showCreate && (
        <Card className="max-w-lg space-y-3 p-5">
          <form onSubmit={createSession} className="space-y-3">
            <h2 className="text-navy-600 text-base font-semibold">New Auction Session</h2>
            <Input
              label="Title"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Spring Cattle Auction"
            />
            <Input
              label="Description"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Optional description"
            />
            <Input
              label="Scheduled Date & Time"
              type="datetime-local"
              required
              value={newScheduledAt}
              onChange={(e) => setNewScheduledAt(e.target.value)}
            />
            <Button type="submit" loading={creating}>
              {creating ? "Creating…" : "Create Auction"}
            </Button>
          </form>
        </Card>
      )}

      {/* Sessions list */}
      {sessions.length === 0 ? (
        <Card>
          <EmptyState title="No auction sessions yet" description="Create your first one above." />
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <Card key={s.id}>
              {/* Session header */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-navy-600 truncate font-semibold">{s.title}</h2>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="text-xs text-navy-300">
                    {fmtDate(s.scheduledAt)} · {s.lots.length} lot{s.lots.length !== 1 ? "s" : ""} ·
                    /auction/live/{s.slug}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {s.status === "UPCOMING" && (
                    <Button variant="secondary" size="sm" onClick={() => updateStatus(s.id, "LIVE")}>
                      Go Live
                    </Button>
                  )}
                  {s.status === "LIVE" && (
                    <>
                      <Link href={`/admin/auctions/${s.id}/control`}>
                        <Button variant="secondary" size="sm">
                          Control Room
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => updateStatus(s.id, "CLOSED")}>
                        Close Auction
                      </Button>
                    </>
                  )}
                  <Link href={`/admin/auctions/${s.id}/registrations`}>
                    <Button variant="outline" size="sm">
                      Bidders
                    </Button>
                  </Link>
                  <Link href={`/admin/auctions/${s.id}/lots`}>
                    <Button variant="primary" size="sm">
                      <Package size={14} /> Manage Lots
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId((prev) => (prev === s.id ? null : s.id))}
                  >
                    {expandedId === s.id ? "Hide Lots" : "Quick Lots"}
                  </Button>
                  {s.status !== "LIVE" && (
                    <Button variant="danger" size="sm" onClick={() => setDeleteSessionId(s.id)}>
                      Delete
                    </Button>
                  )}
                </div>
              </div>

              {/* Lots panel */}
              {expandedId === s.id && (
                <div className="space-y-3 border-t border-navy-50 px-4 pb-4 pt-3">
                  {/* Add lot form */}
                  {addLotFor === s.id ? (
                    <form
                      onSubmit={(e) => addLot(e, s.id)}
                      className="space-y-3 rounded-lg border border-navy-100 bg-navy-25 p-4"
                    >
                      <h3 className="text-navy-600 text-sm font-semibold">Add Lot</h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          label="Title"
                          required
                          value={lotTitle}
                          onChange={(e) => setLotTitle(e.target.value)}
                          placeholder="3x Angus Heifers"
                        />
                        <Input
                          label="Breed"
                          value={lotBreed}
                          onChange={(e) => setLotBreed(e.target.value)}
                          placeholder="Angus"
                        />
                        <Input
                          label="Weight (kg)"
                          type="number"
                          value={lotWeight}
                          onChange={(e) => setLotWeight(e.target.value)}
                          placeholder="320"
                        />
                        <Input
                          label="Region"
                          value={lotRegion}
                          onChange={(e) => setLotRegion(e.target.value)}
                          placeholder="Limpopo"
                        />
                        <Input
                          label="Starting Price (ZAR)"
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={lotStart}
                          onChange={(e) => setLotStart(e.target.value)}
                          placeholder="5000"
                        />
                        <Input
                          label="Reserve Price (ZAR)"
                          type="number"
                          step="0.01"
                          min="0"
                          value={lotReserve}
                          onChange={(e) => setLotReserve(e.target.value)}
                          placeholder="Optional"
                        />
                      </div>
                      <Input
                        label="Description"
                        value={lotDesc}
                        onChange={(e) => setLotDesc(e.target.value)}
                        placeholder="Optional lot description"
                      />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" loading={addingLot}>
                          {addingLot ? "Adding…" : "Add Lot"}
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setAddLotFor(null)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-dashed"
                      onClick={() => setAddLotFor(s.id)}
                    >
                      + Add Lot
                    </Button>
                  )}

                  {/* Lots table */}
                  {s.lots.length === 0 ? (
                    <p className="text-xs text-navy-300">No lots added yet.</p>
                  ) : (
                    <Table>
                      <Thead>
                        <Tr>
                          <Th>#</Th>
                          <Th>Title</Th>
                          <Th>Breed</Th>
                          <Th>Start</Th>
                          <Th>Current Bid</Th>
                          <Th>Bids</Th>
                          <Th>Status</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {s.lots.map((lot) => (
                          <Tr key={lot.id}>
                            <Td className="font-semibold text-navy-600">{lot.lotNumber}</Td>
                            <Td>{lot.title}</Td>
                            <Td className="text-navy-300">{lot.breed ?? "—"}</Td>
                            <Td>{zar(lot.startingPriceCents)}</Td>
                            <Td>
                              {lot.currentBidCents > 0 ? (
                                <span className="text-brand-gold font-semibold">
                                  {zar(lot.currentBidCents)}
                                </span>
                              ) : (
                                <span className="text-navy-200">—</span>
                              )}
                            </Td>
                            <Td>{lot._count.bids}</Td>
                            <Td>
                              <StatusBadge status={lot.status} />
                            </Td>
                            <Td>
                              <div className="flex gap-1.5">
                                {lot.status === "OPEN" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateLotStatus(lot.id, s.id, "SOLD")}
                                  >
                                    Sold
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteLotTarget({ lotId: lot.id, sessionId: s.id })}
                                >
                                  Del
                                </Button>
                              </div>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteSessionId !== null}
        onCancel={() => setDeleteSessionId(null)}
        onConfirm={confirmDeleteSession}
        title="Delete auction?"
        description="This deletes the auction session and all its lots. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />

      <ConfirmDialog
        open={deleteLotTarget !== null}
        onCancel={() => setDeleteLotTarget(null)}
        onConfirm={confirmDeleteLot}
        title="Delete this lot?"
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
