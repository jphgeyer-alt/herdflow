"use client";

import { useState } from "react";
import { SingleImageUpload } from "@/components/ui/SingleImageUpload";

type SellerSettings = {
  location: string;
  contactPhone: string;
  storeDescription: string | null;
  storeLogoUrl: string | null;
  bankName: string | null;
  accountNumber: string | null;
  branchCode: string | null;
  accountHolder: string | null;
  storefrontPlan: string;
};

export function StorefrontSettingsForm({ initial }: { initial: SellerSettings }) {
  const [location, setLocation] = useState(initial.location);
  const [contactPhone, setContactPhone] = useState(initial.contactPhone);
  const [storeDescription, setStoreDescription] = useState(initial.storeDescription || "");
  const [storeLogoUrl, setStoreLogoUrl] = useState<string | null>(initial.storeLogoUrl);
  const [bankName, setBankName] = useState(initial.bankName || "");
  const [accountNumber, setAccountNumber] = useState(initial.accountNumber || "");
  const [branchCode, setBranchCode] = useState(initial.branchCode || "");
  const [accountHolder, setAccountHolder] = useState(initial.accountHolder || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function save() {
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch("/api/seller/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          contactPhone,
          storeDescription,
          storeLogoUrl,
          bankName,
          accountNumber,
          branchCode,
          accountHolder,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save settings.");
        return;
      }
      setSaved(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg md:grid-cols-2">
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wide text-[#1B3A6B]">
          Store Presentation
        </h3>
        <SingleImageUpload
          label="Store Logo"
          value={storeLogoUrl}
          onChange={setStoreLogoUrl}
          aspectRatio="1/1"
          placeholder="Upload store logo"
        />
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-[#244367]">Store Description</span>
          <textarea
            rows={4}
            value={storeDescription}
            onChange={(e) => setStoreDescription(e.target.value)}
            placeholder="Tell buyers about your farm and what you sell..."
            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-[#244367]">Location</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-[#244367]">Contact Phone</span>
          <input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
          />
        </label>
        <p className="text-xs text-[#9aabb9]">
          Storefront Plan: <span className="font-semibold text-[#1B3A6B]">{initial.storefrontPlan}</span>
          {initial.storefrontPlan === "BASIC" && " — up to 20 products. Contact support to upgrade to Unlimited."}
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wide text-[#1B3A6B]">
          Payout Bank Details
        </h3>
        <p className="text-xs text-[#9aabb9]">
          Used to pay out your marketplace earnings. Kept private — never shown to buyers.
        </p>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-[#244367]">Account Holder Name</span>
          <input
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-[#244367]">Bank Name</span>
          <input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Account Number</span>
            <input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Branch Code</span>
            <input
              value={branchCode}
              onChange={(e) => setBranchCode(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-[#2E7D32]">Settings saved.</p>}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-[#2E7D32] px-6 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
