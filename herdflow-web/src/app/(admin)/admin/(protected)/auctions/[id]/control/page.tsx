"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Play, Pause, StopCircle, Gavel, ArrowLeft, Users, Eye } from "lucide-react";
import { Button } from "@/components/admin/Button";
import { StatusBadge } from "@/components/admin/Badge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

type Lot = {
  id: string;
  lotNumber: number;
  title: string;
  breed: string | null;
  weightKg: number | null;
  region: string | null;
  description: string;
  startingPriceCents: number;
  reservePriceCents: number | null;
  currentBidCents: number;
  winnerName: string | null;
  winnerEmail: string | null;
  status: string;
  _count: { bids: number };
  bids: Array<{
    id: string;
    bidderName: string;
    bidderEmail: string;
    amountCents: number;
    createdAt: string;
  }>;
};

type Session = {
  id: string;
  title: string;
  slug: string;
  status: string;
  description: string;
  scheduledAt: string;
  videoUrl: string | null;
  videoType: string | null;
  lots: Lot[];
  registrations: Array<{ biddingNumber: string; fullName: string; email: string }>;
};

function zar(cents: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

type PendingAction =
  | { type: "end-session" }
  | { type: "sell-lot"; lotId: string }
  | { type: "pass-lot"; lotId: string }
  | { type: "withdraw-lot"; lotId: string };

export default function AdminControlRoomPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [manualBid, setManualBid] = useState({
    amount: "",
    bidderName: "Phone Bid",
    bidderEmail: "phone@manual.bid",
  });
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const esRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/auctions/${sessionId}/control`);
      const data = await res.json();
      if (data.session) setSession(data.session);
    } catch {}
  }, [sessionId]);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
    // Poll every 3s for live updates
    pollRef.current = setInterval(loadData, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadData]);

  async function doAction(action: string, lotId?: string, extra?: Record<string, unknown>) {
    setActing(true);
    try {
      const res = await fetch(`/api/admin/auctions/${sessionId}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, lotId, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Action failed");
        return;
      }
      toast.success(data.message || "Done");
      await loadData();
    } catch {
      toast.error("Network error");
    } finally {
      setActing(false);
    }
  }

  async function confirmPendingAction() {
    if (!pendingAction) return;
    if (pendingAction.type === "end-session") {
      await doAction("end-session");
    } else {
      await doAction(pendingAction.type, pendingAction.lotId);
    }
    setPendingAction(null);
  }

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy-600 border-t-transparent" />
      </div>
    );

  if (!session)
    return (
      <div className="p-8 text-center text-navy-300">
        Session not found.{" "}
        <Link href="/admin/auctions" className="text-green hover:underline">
          Back to Auctions
        </Link>
      </div>
    );

  const currentLot = session.lots.find((l) => l.status === "OPEN") || null;
  const isLive = session.status === "LIVE";
  const reserveMet =
    currentLot &&
    currentLot.reservePriceCents &&
    currentLot.currentBidCents >= currentLot.reservePriceCents;
  const allBids = currentLot?.bids || [];

  return (
    <div className="space-y-4 pb-10">
      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-navy-600 px-5 py-3 text-white">
        <div className="flex items-center gap-3">
          <Link href="/admin/auctions" className="rounded-lg p-1.5 hover:bg-white/10">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-black leading-tight">{session.title}</h1>
            <div className="flex items-center gap-2 text-xs text-white/70">
              {isLive && (
                <span className="flex items-center gap-1 text-green-400">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-400" />
                  LIVE
                </span>
              )}
              <span>{session.lots.length} lots</span>
              <span>{session.registrations.length} approved bidders</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isLive && (
            <Button variant="secondary" onClick={() => doAction("start-session")} disabled={acting}>
              <Play size={16} /> Start Auction
            </Button>
          )}
          {isLive && (
            <>
              <Button
                className="bg-amber-600 hover:bg-amber-700"
                onClick={() => doAction("pause-session")}
                disabled={acting}
              >
                <Pause size={16} /> Pause
              </Button>
              <Button
                variant="danger"
                onClick={() => setPendingAction({ type: "end-session" })}
                disabled={acting}
              >
                <StopCircle size={16} /> End Auction
              </Button>
            </>
          )}
          <Link href={`/auction/live/${session.slug}`} target="_blank">
            <Button variant="ghost" className="bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <Eye size={16} /> Public View
            </Button>
          </Link>
          <Link href={`/admin/auctions/${sessionId}/registrations`}>
            <Button variant="ghost" className="bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <Users size={16} /> Bidders
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        {/* LEFT — Current Lot Control */}
        <div className="space-y-4">
          {currentLot ? (
            <div className="space-y-4 rounded-xl border border-navy-50 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-navy-300">
                    Lot {currentLot.lotNumber} of {session.lots.length}
                  </span>
                  <h2 className="mt-0.5 text-2xl font-black text-navy-600">{currentLot.title}</h2>
                  <div className="mt-1 flex flex-wrap gap-3 text-sm text-navy-300">
                    {currentLot.breed && <span>Breed: {currentLot.breed}</span>}
                    {currentLot.weightKg && <span>Weight: {currentLot.weightKg}kg</span>}
                    {currentLot.region && <span>Region: {currentLot.region}</span>}
                  </div>
                </div>
                <StatusBadge status="OPEN" />
              </div>

              {/* Bid info */}
              <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-3">
                <div className="rounded-xl bg-navy-25 p-3">
                  <p className="text-xs text-navy-300">Start Price</p>
                  <p className="text-lg font-black text-navy-600">{zar(currentLot.startingPriceCents)}</p>
                </div>
                <div className={`rounded-xl p-3 ${currentLot.currentBidCents > 0 ? "bg-green/10" : "bg-navy-25"}`}>
                  <p className="text-xs text-navy-300">Current Bid</p>
                  <p className={`text-2xl font-black ${currentLot.currentBidCents > 0 ? "text-green" : "text-navy-200"}`}>
                    {currentLot.currentBidCents > 0 ? zar(currentLot.currentBidCents) : "—"}
                  </p>
                  {currentLot.winnerName && (
                    <p className="mt-0.5 text-xs text-navy-300">by {currentLot.winnerName}</p>
                  )}
                </div>
                <div className={`rounded-xl p-3 ${reserveMet ? "bg-green-50" : "bg-red-50"}`}>
                  <p className="text-xs text-navy-300">Reserve</p>
                  <p className={`text-sm font-bold ${reserveMet ? "text-green-700" : "text-red-600"}`}>
                    {reserveMet
                      ? "✓ Met"
                      : currentLot.reservePriceCents
                        ? `${zar(currentLot.reservePriceCents)}`
                        : "No reserve"}
                  </p>
                </div>
              </div>

              {/* Main action buttons */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Button
                  className="rounded-xl py-3"
                  variant="secondary"
                  onClick={() => setPendingAction({ type: "sell-lot", lotId: currentLot.id })}
                  disabled={acting || currentLot.currentBidCents === 0}
                >
                  <Gavel size={18} /> SELL
                </Button>
                <Button
                  className="rounded-xl bg-amber-600 py-3 hover:bg-amber-700"
                  onClick={() => setPendingAction({ type: "pass-lot", lotId: currentLot.id })}
                  disabled={acting}
                >
                  Pass
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl border-2 border-red-600 py-3 text-red-600 hover:bg-red-600 hover:text-white"
                  onClick={() => setPendingAction({ type: "withdraw-lot", lotId: currentLot.id })}
                  disabled={acting}
                >
                  Withdraw
                </Button>
                <Link
                  href={`/admin/auctions`}
                  className="flex items-center justify-center gap-2 rounded-xl bg-navy-25 py-3 text-sm font-bold text-navy-300 transition hover:bg-navy-50"
                >
                  ← Lots
                </Link>
              </div>

              {/* Manual bid */}
              <div className="border-t border-navy-50 pt-4">
                <p className="mb-3 text-sm font-bold text-navy-600">Place Manual / Phone Bid</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <input
                    value={manualBid.bidderName}
                    onChange={(e) => setManualBid((p) => ({ ...p, bidderName: e.target.value }))}
                    placeholder="Bidder name / HF-001"
                    className="rounded-lg border border-navy-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600/30"
                  />
                  <input
                    type="number"
                    value={manualBid.amount}
                    onChange={(e) => setManualBid((p) => ({ ...p, amount: e.target.value }))}
                    placeholder={`Min: ${Math.floor((currentLot.currentBidCents + 100) / 100)}`}
                    className="rounded-lg border border-navy-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600/30"
                  />
                  <Button
                    onClick={() => {
                      const amount = Math.round(parseFloat(manualBid.amount) * 100);
                      if (!amount || amount <= currentLot.currentBidCents) {
                        toast.error("Bid must exceed current bid");
                        return;
                      }
                      doAction("manual-bid", currentLot.id, {
                        amount,
                        bidderName: manualBid.bidderName,
                        bidderEmail: "manual@bid.hf",
                      });
                      setManualBid((p) => ({ ...p, amount: "" }));
                    }}
                    disabled={acting}
                  >
                    Place Bid (R {manualBid.amount || "0"})
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-navy-50 bg-white p-8 text-center shadow-sm">
              <p className="font-semibold text-navy-300">No lot is currently open.</p>
              <p className="mt-1 text-sm text-navy-200">Select a lot below to open it for bidding.</p>
            </div>
          )}

          {/* All lots list */}
          <div className="overflow-hidden rounded-xl border border-navy-50 bg-white shadow-sm">
            <div className="border-b border-navy-50 bg-navy-25 px-4 py-3">
              <h3 className="text-sm font-bold text-navy-600">All Lots — {session.lots.length} total</h3>
            </div>
            <div className="max-h-80 divide-y divide-navy-50 overflow-y-auto">
              {session.lots.map((lot) => (
                <div key={lot.id} className="flex items-center gap-3 px-4 py-3 transition hover:bg-navy-25/60">
                  <span className="w-8 shrink-0 font-mono text-xs text-navy-200">#{lot.lotNumber}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy-600">{lot.title}</p>
                    <p className="text-xs text-navy-200">
                      {lot.currentBidCents > 0
                        ? `Current: ${zar(lot.currentBidCents)}`
                        : `Start: ${zar(lot.startingPriceCents)}`}
                      {" · "}
                      {lot._count.bids} bid{lot._count.bids !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <StatusBadge status={lot.status} />
                  {lot.status === "PENDING" && isLive && (
                    <Button variant="secondary" size="sm" onClick={() => doAction("open-lot", lot.id)} disabled={acting}>
                      Open
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Live bid feed + registered bidders */}
        <div className="space-y-4">
          {/* Live bid feed */}
          <div className="overflow-hidden rounded-xl border border-navy-50 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-navy-50 bg-navy-25 px-4 py-3">
              <h3 className="text-sm font-bold text-navy-600">Live Bid Feed</h3>
              <span className="text-xs text-navy-200">{allBids.length} bids</span>
            </div>
            <div className="max-h-64 divide-y divide-navy-50 overflow-y-auto">
              {allBids.length === 0 ? (
                <p className="p-4 text-center text-sm text-navy-200">No bids yet on current lot</p>
              ) : (
                [...allBids].reverse().map((bid, i) => (
                  <div key={bid.id} className={`flex items-center gap-3 px-4 py-2 ${i === 0 ? "bg-green-50" : ""}`}>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-navy-600">{bid.bidderName}</p>
                      <p className="text-[10px] text-navy-200">
                        {new Date(bid.createdAt).toLocaleTimeString("en-ZA")}
                      </p>
                    </div>
                    <p className={`text-sm font-black ${i === 0 ? "text-green" : "text-navy-500"}`}>
                      {zar(bid.amountCents)}
                    </p>
                    {i === 0 && <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-green-500" />}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Registered bidders */}
          <div className="overflow-hidden rounded-xl border border-navy-50 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-navy-50 bg-navy-25 px-4 py-3">
              <h3 className="text-sm font-bold text-navy-600">Approved Bidders</h3>
              <span className="text-xs text-navy-200">{session.registrations.length} registered</span>
            </div>
            <div className="max-h-48 divide-y divide-navy-50 overflow-y-auto">
              {session.registrations.length === 0 ? (
                <p className="p-4 text-center text-sm text-navy-200">No approved bidders yet</p>
              ) : (
                session.registrations.map((r) => (
                  <div key={r.biddingNumber} className="flex items-center gap-3 px-4 py-2">
                    <span className="w-16 shrink-0 font-mono text-xs font-bold text-navy-600">
                      {r.biddingNumber}
                    </span>
                    <span className="truncate text-sm text-navy-500">{r.fullName}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Video stream setup */}
          <div className="rounded-xl border border-navy-50 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-navy-600">Video Stream</h3>
            <div className="space-y-2">
              <input
                value={videoUrlInput || session.videoUrl || ""}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                placeholder="YouTube / Vimeo stream URL…"
                className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600/30"
              />
              <Button
                className="w-full"
                onClick={async () => {
                  const res = await fetch(`/api/admin/auctions`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      id: sessionId,
                      action: "update",
                      data: {
                        videoUrl: videoUrlInput,
                        videoType: videoUrlInput.includes("youtube")
                          ? "YOUTUBE"
                          : videoUrlInput.includes("vimeo")
                            ? "VIMEO"
                            : "OTHER",
                      },
                    }),
                  });
                  const d = await res.json().catch(() => ({}));
                  if (res.ok) toast.success("Stream URL saved");
                  else toast.error(d.error || "Failed");
                }}
              >
                Save Stream URL
              </Button>
              {(videoUrlInput || session.videoUrl) && (
                <p className="truncate text-xs text-navy-200">Current: {videoUrlInput || session.videoUrl}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={pendingAction !== null}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmPendingAction}
        variant="danger"
        title={
          pendingAction?.type === "end-session"
            ? "End this auction?"
            : pendingAction?.type === "sell-lot"
              ? "Sell this lot?"
              : pendingAction?.type === "pass-lot"
                ? "Pass this lot?"
                : "Withdraw this lot?"
        }
        description={
          pendingAction?.type === "end-session"
            ? "This cannot be undone. All remaining lots will be passed."
            : pendingAction?.type === "sell-lot"
              ? "This sells the lot to the highest bidder. This cannot be undone."
              : pendingAction?.type === "pass-lot"
                ? "This lot will be marked as passed with no sale."
                : "This lot will be withdrawn from the auction."
        }
        confirmLabel={
          pendingAction?.type === "end-session"
            ? "End Auction"
            : pendingAction?.type === "sell-lot"
              ? "Sell"
              : pendingAction?.type === "pass-lot"
                ? "Pass"
                : "Withdraw"
        }
      />
    </div>
  );
}
