"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Play, Pause, StopCircle, Gavel, CheckCircle, X, ArrowLeft, Users, Eye } from "lucide-react";

type Lot = {
  id: string; lotNumber: number; title: string; breed: string | null;
  weightKg: number | null; region: string | null; description: string;
  startingPriceCents: number; reservePriceCents: number | null;
  currentBidCents: number; winnerName: string | null; winnerEmail: string | null;
  status: string; _count: { bids: number };
  bids: Array<{ id: string; bidderName: string; bidderEmail: string; amountCents: number; createdAt: string }>;
};

type Session = {
  id: string; title: string; slug: string; status: string; description: string;
  scheduledAt: string; videoUrl: string | null; videoType: string | null;
  lots: Lot[];
  registrations: Array<{ biddingNumber: string; fullName: string; email: string }>;
};

function zar(cents: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(cents / 100);
}

const LOT_STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  OPEN: "bg-green-100 text-green-800",
  SOLD: "bg-blue-100 text-blue-800",
  PASSED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function AdminControlRoomPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [manualBid, setManualBid] = useState({ amount: "", bidderName: "Phone Bid", bidderEmail: "phone@manual.bid" });
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const esRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

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
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
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
      if (!res.ok) { showToast(data.error || "Action failed", false); return; }
      showToast(data.message || "Done");
      await loadData();
    } catch { showToast("Network error", false); }
    finally { setActing(false); }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#1B3A6B] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!session) return (
    <div className="p-8 text-center text-[#5d7497]">
      Session not found. <Link href="/admin/auctions" className="text-[#2E7D32] hover:underline">Back to Auctions</Link>
    </div>
  );

  const currentLot = session.lots.find((l) => l.status === "OPEN") || null;
  const pendingLots = session.lots.filter((l) => l.status === "PENDING");
  const completedLots = session.lots.filter((l) => ["SOLD", "PASSED", "CANCELLED"].includes(l.status));
  const allBids = currentLot?.bids || [];
  const isLive = session.status === "LIVE";
  const reserveMet = currentLot && currentLot.reservePriceCents && currentLot.currentBidCents >= currentLot.reservePriceCents;

  return (
    <div className="space-y-4 pb-10">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold ${toast.ok ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
          {toast.ok ? <CheckCircle size={16} /> : <X size={16} />} {toast.msg}
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-[#1B3A6B] text-white rounded-xl px-5 py-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/auctions" className="p-1.5 hover:bg-white/10 rounded-lg"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="font-black text-lg leading-tight">{session.title}</h1>
            <div className="flex items-center gap-2 text-xs text-white/70">
              {isLive && <span className="flex items-center gap-1 text-green-400"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />LIVE</span>}
              <span>{session.lots.length} lots</span>
              <span>{session.registrations.length} approved bidders</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!isLive && (
            <button onClick={() => doAction("start-session")} disabled={acting}
              className="flex items-center gap-2 px-4 py-2 bg-[#2E7D32] hover:bg-[#1d5e20] rounded-lg text-sm font-bold transition disabled:opacity-50">
              <Play size={16} /> Start Auction
            </button>
          )}
          {isLive && (
            <>
              <button onClick={() => doAction("pause-session")} disabled={acting}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-sm font-bold transition disabled:opacity-50">
                <Pause size={16} /> Pause
              </button>
              <button onClick={() => { if (window.confirm("End the auction? All remaining lots will be passed.")) doAction("end-session"); }} disabled={acting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-bold transition disabled:opacity-50">
                <StopCircle size={16} /> End Auction
              </button>
            </>
          )}
          <Link href={`/auction/live/${session.slug}`} target="_blank" className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition">
            <Eye size={16} /> Public View
          </Link>
          <Link href={`/admin/auctions/${sessionId}/registrations`} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition">
            <Users size={16} /> Bidders
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        {/* LEFT — Current Lot Control */}
        <div className="space-y-4">
          {currentLot ? (
            <div className="bg-white rounded-xl border border-[#e4ebf5] shadow-sm p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5d7497]">Lot {currentLot.lotNumber} of {session.lots.length}</span>
                  <h2 className="text-2xl font-black text-[#1B3A6B] mt-0.5">{currentLot.title}</h2>
                  <div className="flex gap-3 text-sm text-[#5d7497] mt-1 flex-wrap">
                    {currentLot.breed && <span>Breed: {currentLot.breed}</span>}
                    {currentLot.weightKg && <span>Weight: {currentLot.weightKg}kg</span>}
                    {currentLot.region && <span>Region: {currentLot.region}</span>}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${LOT_STATUS_STYLE["OPEN"]}`}>OPEN</span>
              </div>

              {/* Bid info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                <div className="bg-[#f5f8fd] rounded-xl p-3">
                  <p className="text-xs text-[#5d7497]">Start Price</p>
                  <p className="text-lg font-black text-[#1B3A6B]">{zar(currentLot.startingPriceCents)}</p>
                </div>
                <div className={`rounded-xl p-3 ${currentLot.currentBidCents > 0 ? "bg-[#2E7D32]/10" : "bg-[#f5f8fd]"}`}>
                  <p className="text-xs text-[#5d7497]">Current Bid</p>
                  <p className={`text-2xl font-black ${currentLot.currentBidCents > 0 ? "text-[#2E7D32]" : "text-[#9aabb9]"}`}>
                    {currentLot.currentBidCents > 0 ? zar(currentLot.currentBidCents) : "—"}
                  </p>
                  {currentLot.winnerName && <p className="text-xs text-[#5d7497] mt-0.5">by {currentLot.winnerName}</p>}
                </div>
                <div className={`rounded-xl p-3 ${reserveMet ? "bg-green-50" : "bg-red-50"}`}>
                  <p className="text-xs text-[#5d7497]">Reserve</p>
                  <p className={`text-sm font-bold ${reserveMet ? "text-green-700" : "text-red-600"}`}>
                    {reserveMet ? "✓ Met" : currentLot.reservePriceCents ? `${zar(currentLot.reservePriceCents)}` : "No reserve"}
                  </p>
                </div>
              </div>

              {/* Main action buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button onClick={() => { if (window.confirm("Sell this lot to the highest bidder?")) doAction("sell-lot", currentLot.id); }}
                  disabled={acting || currentLot.currentBidCents === 0}
                  className="flex items-center justify-center gap-2 py-3 bg-[#2E7D32] hover:bg-[#1d5e20] text-white text-sm font-bold rounded-xl transition disabled:opacity-50">
                  <Gavel size={18} /> SELL
                </button>
                <button onClick={() => { if (window.confirm("Pass this lot with no sale?")) doAction("pass-lot", currentLot.id); }}
                  disabled={acting}
                  className="flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl transition disabled:opacity-50">
                  Pass
                </button>
                <button onClick={() => { if (window.confirm("Withdraw this lot?")) doAction("withdraw-lot", currentLot.id); }}
                  disabled={acting}
                  className="flex items-center justify-center gap-2 py-3 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white text-sm font-bold rounded-xl transition disabled:opacity-50">
                  Withdraw
                </button>
                <Link href={`/admin/auctions`} className="flex items-center justify-center gap-2 py-3 bg-[#f0f4fb] text-[#5d7497] hover:bg-[#e4ebf5] text-sm font-bold rounded-xl transition">
                  ← Lots
                </Link>
              </div>

              {/* Manual bid */}
              <div className="border-t border-[#f0f4fb] pt-4">
                <p className="text-sm font-bold text-[#1B3A6B] mb-3">Place Manual / Phone Bid</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input value={manualBid.bidderName} onChange={(e) => setManualBid((p) => ({ ...p, bidderName: e.target.value }))} placeholder="Bidder name / HF-001" className="px-3 py-2 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30" />
                  <input type="number" value={manualBid.amount} onChange={(e) => setManualBid((p) => ({ ...p, amount: e.target.value }))} placeholder={`Min: ${Math.floor((currentLot.currentBidCents + 100) / 100)}`} className="px-3 py-2 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30" />
                  <button
                    onClick={() => {
                      const amount = Math.round(parseFloat(manualBid.amount) * 100);
                      if (!amount || amount <= currentLot.currentBidCents) { showToast("Bid must exceed current bid", false); return; }
                      doAction("manual-bid", currentLot.id, { amount, bidderName: manualBid.bidderName, bidderEmail: "manual@bid.hf" });
                      setManualBid((p) => ({ ...p, amount: "" }));
                    }}
                    disabled={acting}
                    className="py-2 bg-[#1B3A6B] hover:bg-[#122844] text-white text-sm font-bold rounded-lg transition disabled:opacity-50"
                  >
                    Place Bid (R {manualBid.amount || "0"})
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#e4ebf5] shadow-sm p-8 text-center">
              <p className="text-[#5d7497] font-semibold">No lot is currently open.</p>
              <p className="text-sm text-[#9aabb9] mt-1">Select a lot below to open it for bidding.</p>
            </div>
          )}

          {/* All lots list */}
          <div className="bg-white rounded-xl border border-[#e4ebf5] shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[#f0f4fb] bg-[#f5f8fd]">
              <h3 className="font-bold text-[#1B3A6B] text-sm">All Lots — {session.lots.length} total</h3>
            </div>
            <div className="divide-y divide-[#f0f4fb] max-h-80 overflow-y-auto">
              {session.lots.map((lot) => (
                <div key={lot.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f8fafd] transition">
                  <span className="text-xs font-mono text-[#9aabb9] w-8 shrink-0">#{lot.lotNumber}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1B3A6B] truncate">{lot.title}</p>
                    <p className="text-xs text-[#9aabb9]">
                      {lot.currentBidCents > 0 ? `Current: ${zar(lot.currentBidCents)}` : `Start: ${zar(lot.startingPriceCents)}`}
                      {" · "}{lot._count.bids} bid{lot._count.bids !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${LOT_STATUS_STYLE[lot.status] ?? "bg-gray-100"}`}>{lot.status}</span>
                  {lot.status === "PENDING" && isLive && (
                    <button onClick={() => doAction("open-lot", lot.id)} disabled={acting}
                      className="px-3 py-1 bg-[#2E7D32] hover:bg-[#1d5e20] text-white text-xs font-bold rounded-lg transition disabled:opacity-50">
                      Open
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Live bid feed + registered bidders */}
        <div className="space-y-4">
          {/* Live bid feed */}
          <div className="bg-white rounded-xl border border-[#e4ebf5] shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[#f0f4fb] bg-[#f5f8fd] flex items-center justify-between">
              <h3 className="font-bold text-[#1B3A6B] text-sm">Live Bid Feed</h3>
              <span className="text-xs text-[#9aabb9]">{allBids.length} bids</span>
            </div>
            <div className="divide-y divide-[#f0f4fb] max-h-64 overflow-y-auto">
              {allBids.length === 0 ? (
                <p className="p-4 text-sm text-center text-[#9aabb9]">No bids yet on current lot</p>
              ) : (
                [...allBids].reverse().map((bid, i) => (
                  <div key={bid.id} className={`flex items-center gap-3 px-4 py-2 ${i === 0 ? "bg-green-50" : ""}`}>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-[#1B3A6B]">{bid.bidderName}</p>
                      <p className="text-[10px] text-[#9aabb9]">{new Date(bid.createdAt).toLocaleTimeString("en-ZA")}</p>
                    </div>
                    <p className={`text-sm font-black ${i === 0 ? "text-[#2E7D32]" : "text-[#244367]"}`}>{zar(bid.amountCents)}</p>
                    {i === 0 && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Registered bidders */}
          <div className="bg-white rounded-xl border border-[#e4ebf5] shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[#f0f4fb] bg-[#f5f8fd] flex items-center justify-between">
              <h3 className="font-bold text-[#1B3A6B] text-sm">Approved Bidders</h3>
              <span className="text-xs text-[#9aabb9]">{session.registrations.length} registered</span>
            </div>
            <div className="divide-y divide-[#f0f4fb] max-h-48 overflow-y-auto">
              {session.registrations.length === 0 ? (
                <p className="p-4 text-sm text-center text-[#9aabb9]">No approved bidders yet</p>
              ) : (
                session.registrations.map((r) => (
                  <div key={r.biddingNumber} className="flex items-center gap-3 px-4 py-2">
                    <span className="font-mono text-xs font-bold text-[#1B3A6B] w-16 shrink-0">{r.biddingNumber}</span>
                    <span className="text-sm text-[#244367] truncate">{r.fullName}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Video stream setup */}
          <div className="bg-white rounded-xl border border-[#e4ebf5] shadow-sm p-4">
            <h3 className="font-bold text-[#1B3A6B] text-sm mb-3">Video Stream</h3>
            <div className="space-y-2">
              <input
                value={videoUrlInput || session.videoUrl || ""}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                placeholder="YouTube / Vimeo stream URL…"
                className="w-full px-3 py-2 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
              />
              <button
                onClick={async () => {
                  const res = await fetch(`/api/admin/auctions`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: sessionId, action: "update", data: { videoUrl: videoUrlInput, videoType: videoUrlInput.includes("youtube") ? "YOUTUBE" : videoUrlInput.includes("vimeo") ? "VIMEO" : "OTHER" } }),
                  });
                  const d = await res.json().catch(() => ({}));
                  showToast(res.ok ? "Stream URL saved" : (d.error || "Failed"), res.ok);
                }}
                className="w-full py-2 bg-[#1B3A6B] hover:bg-[#122844] text-white text-sm font-bold rounded-lg transition"
              >
                Save Stream URL
              </button>
              {(videoUrlInput || session.videoUrl) && (
                <p className="text-xs text-[#9aabb9] truncate">
                  Current: {videoUrlInput || session.videoUrl}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
