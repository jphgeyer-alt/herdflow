"use client";

import { useState, FormEvent } from "react";
import { X } from "lucide-react";

export function BookTransportForm({ onClose }: { onClose: () => void }) {
  const [pickupRegion, setPickupRegion] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffRegion, setDropoffRegion] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [livestockType, setLivestockType] = useState("");
  const [headCount, setHeadCount] = useState("");
  const [neededBy, setNeededBy] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function submitToPayFast(processUrl: string, fields: Record<string, string>) {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = processUrl;
    for (const [name, value] of Object.entries(fields)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/logistics/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupRegion,
          pickupAddress,
          dropoffRegion,
          dropoffAddress,
          livestockType,
          headCount: Number(headCount),
          neededBy: neededBy || undefined,
          notes,
        }),
      });
      const data = await res.json();
      if (res.ok && data.payment) {
        submitToPayFast(data.payment.processUrl, data.payment.fields);
      } else if (res.status === 401) {
        window.location.href = "/auth/login?next=/logistics";
      } else {
        setError(data.error || "Failed to submit request");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-black text-[#1B3A6B]">Request Transport</h2>
          <button onClick={onClose} aria-label="Close" className="text-[#5d7497] hover:text-[#1B3A6B]">
            <X size={22} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#244367]">
                Pickup Region *
              </label>
              <input
                type="text"
                required
                value={pickupRegion}
                onChange={(e) => setPickupRegion(e.target.value)}
                className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 focus:border-[#1B3A6B] focus:outline-none"
                placeholder="e.g. North West"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#244367]">
                Drop-off Region *
              </label>
              <input
                type="text"
                required
                value={dropoffRegion}
                onChange={(e) => setDropoffRegion(e.target.value)}
                className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 focus:border-[#1B3A6B] focus:outline-none"
                placeholder="e.g. Gauteng"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[#244367]">
              Pickup Address (optional)
            </label>
            <input
              type="text"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 focus:border-[#1B3A6B] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[#244367]">
              Drop-off Address (optional)
            </label>
            <input
              type="text"
              value={dropoffAddress}
              onChange={(e) => setDropoffAddress(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 focus:border-[#1B3A6B] focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#244367]">
                Livestock Type *
              </label>
              <input
                type="text"
                required
                value={livestockType}
                onChange={(e) => setLivestockType(e.target.value)}
                className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 focus:border-[#1B3A6B] focus:outline-none"
                placeholder="e.g. Cattle"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#244367]">
                Head Count *
              </label>
              <input
                type="number"
                min={1}
                required
                value={headCount}
                onChange={(e) => setHeadCount(e.target.value)}
                className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 focus:border-[#1B3A6B] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[#244367]">
              Preferred Date (optional)
            </label>
            <input
              type="date"
              value={neededBy}
              onChange={(e) => setNeededBy(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 focus:border-[#1B3A6B] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[#244367]">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-[#cdd8e7] px-3 py-2 focus:border-[#1B3A6B] focus:outline-none"
            />
          </div>

          <div className="rounded-lg bg-[#f5f8fd] p-3 text-xs text-[#5d7497]">
            A R195 booking fee is required to submit your request — this confirms your slot in
            the job board so verified partners can quote you. The final transport price is agreed
            with your matched partner.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#2E7D32] py-3 font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Processing…" : "Pay R195 & Submit Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
