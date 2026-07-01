"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type LotSnapshot = {
  id: string;
  lotNumber: number;
  title: string;
  breed: string | null;
  weightKg: number | null;
  region: string | null;
  startingPriceCents: number;
  reservePriceCents: number | null;
  currentBidCents: number;
  winnerName: string | null;
  status: string;
  _count: { bids: number };
};

type BidFormState = {
  lotId: string;
  lotTitle: string;
  minBid: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function zar(cents: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(cents / 100);
}

const LOT_STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  OPEN: "bg-green-100 text-green-800",
  SOLD: "bg-blue-100 text-blue-800",
  PASSED: "bg-neutral-100 text-neutral-700",
  CANCELLED: "bg-red-100 text-red-800",
};

// ─── Props ───────────────────────────────────────────────────────────────────

type Props = {
  auctionId: string;
  auctionTitle: string;
  auctionStatus: string;
  initialLots: LotSnapshot[];
};

// ─── Component ───────────────────────────────────────────────────────────────

export function LiveAuctionRoom({ auctionId, auctionTitle, auctionStatus, initialLots }: Props) {
  const [lots, setLots] = useState<LotSnapshot[]>(initialLots);
  const [connected, setConnected] = useState(false);
  const [bidForm, setBidForm] = useState<BidFormState | null>(null);
  const [bidName, setBidName] = useState("");
  const [bidEmail, setBidEmail] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [bidding, setBidding] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const esRef = useRef<EventSource | null>(null);

  function showToast(ok: boolean, msg: string) {
    setToast({ ok, msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }

  // SSE connection
  useEffect(() => {
    if (auctionStatus !== "LIVE") return;

    const es = new EventSource(`/api/auction/${auctionId}/stream`);
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as { lots?: LotSnapshot[] };
        if (Array.isArray(data.lots)) {
          setLots(data.lots);
        }
      } catch {
        /* ignore parse errors */
      }
    };

    return () => {
      es.close();
      esRef.current = null;
      setConnected(false);
    };
  }, [auctionId, auctionStatus]);

  const openBidForm = useCallback(
    (lot: LotSnapshot) => {
      const minBid = Math.max(lot.startingPriceCents, lot.currentBidCents + 100);
      setBidForm({ lotId: lot.id, lotTitle: lot.title, minBid });
      setBidAmount((minBid / 100).toFixed(2));
    },
    [],
  );

  async function placeBid(e: React.FormEvent) {
    e.preventDefault();
    if (!bidForm) return;

    const amountCents = Math.round(parseFloat(bidAmount) * 100);
    if (Number.isNaN(amountCents) || amountCents < bidForm.minBid) {
      showToast(false, `Minimum bid is ${zar(bidForm.minBid)}.`);
      return;
    }

    setBidding(true);
    try {
      const res = await fetch(`/api/auction/${auctionId}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lotId: bidForm.lotId,
          bidderName: bidName.trim(),
          bidderEmail: bidEmail.trim(),
          amountCents,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(true, `Bid of ${zar(amountCents)} placed successfully!`);
        setBidForm(null);
        setBidName("");
        setBidEmail("");
        setBidAmount("");
      } else {
        showToast(false, (data as { error?: string }).error || "Failed to place bid.");
      }
    } catch {
      showToast(false, "Network error. Please try again.");
    } finally {
      setBidding(false);
    }
  }

  const isLive = auctionStatus === "LIVE";

  return (
    <div className="space-y-4">
      {/* Connection indicator */}
      {isLive && (
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className={`inline-block h-2 w-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-red-400"}`} />
          {connected ? "Live feed connected — bids update automatically" : "Connecting to live feed…"}
        </div>
      )}

      {!isLive && (
        <div className="rounded-lg border border-[#e4ebf5] bg-[#f5f8fd] px-4 py-3 text-sm text-[#5d7497]">
          {auctionStatus === "UPCOMING"
            ? "This auction has not started yet. Lots are shown for preview."
            : "This auction is closed. Final results are shown below."}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          role="alert"
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${
            toast.ok ? "border-green-300 bg-green-50 text-green-800" : "border-red-300 bg-red-50 text-red-800"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Bid form modal */}
      {bidForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <form
            onSubmit={placeBid}
            className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl space-y-4"
          >
            <div>
              <h2 className="text-lg font-semibold text-brand-navy">Place Bid</h2>
              <p className="text-sm text-[#38537a]">{bidForm.lotTitle}</p>
              <p className="text-xs text-[#5d7497]">Minimum bid: {zar(bidForm.minBid)}</p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-[#244367]">Your Name *</label>
              <input
                className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm outline-none focus:border-brand-navy"
                value={bidName}
                onChange={(e) => setBidName(e.target.value)}
                required
                placeholder="John Smith"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-[#244367]">Email Address *</label>
              <input
                type="email"
                className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm outline-none focus:border-brand-navy"
                value={bidEmail}
                onChange={(e) => setBidEmail(e.target.value)}
                required
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-[#244367]">Bid Amount (ZAR) *</label>
              <input
                type="number"
                step="1"
                min={(bidForm.minBid / 100).toFixed(2)}
                className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm outline-none focus:border-brand-navy"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={zar(bidForm.minBid)}
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={bidding}
                className="flex-1 rounded-lg bg-brand-navy py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {bidding ? "Placing Bid…" : "Confirm Bid"}
              </button>
              <button
                type="button"
                onClick={() => setBidForm(null)}
                className="rounded-lg border border-[#cdd8e7] px-4 py-2.5 text-sm font-semibold text-[#244367]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lots grid */}
      {lots.length === 0 ? (
        <p className="rounded-xl border border-[#d8e0ec] bg-white p-8 text-center text-sm text-[#5d7497]">
          No lots available in this auction yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lots.map((lot) => (
            <article key={lot.id} className="flex flex-col rounded-xl border border-[#d8e0ec] bg-white shadow-sm">
              <div className="flex-1 p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#5d7497]">Lot {lot.lotNumber}</p>
                    <h3 className="font-semibold text-brand-navy">{lot.title}</h3>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${LOT_STATUS_BADGE[lot.status]}`}>
                    {lot.status}
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-1 text-xs text-[#5d7497]">
                  {lot.breed && (
                    <>
                      <dt className="font-medium text-[#38537a]">Breed</dt>
                      <dd>{lot.breed}</dd>
                    </>
                  )}
                  {lot.weightKg && (
                    <>
                      <dt className="font-medium text-[#38537a]">Weight</dt>
                      <dd>{lot.weightKg} kg</dd>
                    </>
                  )}
                  {lot.region && (
                    <>
                      <dt className="font-medium text-[#38537a]">Region</dt>
                      <dd>{lot.region}</dd>
                    </>
                  )}
                  <dt className="font-medium text-[#38537a]">Starting</dt>
                  <dd>{zar(lot.startingPriceCents)}</dd>
                </dl>

                <div className="rounded-lg bg-[#f5f8fd] p-3">
                  {lot.currentBidCents > 0 ? (
                    <>
                      <p className="text-xs text-[#5d7497]">Current Bid</p>
                      <p className="text-xl font-bold text-brand-gold">{zar(lot.currentBidCents)}</p>
                      <p className="text-xs text-[#9aabb9]">{lot._count.bids} bid{lot._count.bids !== 1 ? "s" : ""}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-[#5d7497]">Opening Bid</p>
                      <p className="text-xl font-bold text-brand-navy">{zar(lot.startingPriceCents)}</p>
                    </>
                  )}
                </div>

                {lot.status === "SOLD" && lot.winnerName && (
                  <p className="text-xs text-green-700 font-medium">
                    Sold to {lot.winnerName}
                  </p>
                )}
              </div>

              {isLive && lot.status === "OPEN" && (
                <div className="border-t border-[#e4ebf5] px-4 py-3">
                  <button
                    onClick={() => openBidForm(lot)}
                    className="w-full rounded-lg bg-brand-navy py-2 text-sm font-semibold text-white"
                  >
                    Place Bid
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Auction context */}
      <p className="text-center text-xs text-[#9aabb9]">
        Auction: {auctionTitle} · All bids are final once confirmed.
      </p>
    </div>
  );
}
