"use client";

import { useEffect, useState } from "react";
import { Stethoscope, Scissors, Fence, Droplets, Syringe, Beaker, Gavel, ShieldAlert, Wrench, MoreHorizontal } from "lucide-react";

type ListingRow = {
  id: string;
  businessName: string;
  category: string;
  phone: string;
  whatsapp: string | null;
  provinces: string[];
  description: string;
  logoUrl: string | null;
  verified: boolean;
  plan: string;
};

const CATEGORIES: { value: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { value: "VETERINARIAN", label: "Veterinarians", icon: Stethoscope },
  { value: "SHEARER", label: "Shearers", icon: Scissors },
  { value: "FENCING_CONTRACTOR", label: "Fencing Contractors", icon: Fence },
  { value: "BOREHOLE_DRILLING", label: "Borehole Drilling", icon: Droplets },
  { value: "AI_TECHNICIAN", label: "AI Technicians", icon: Syringe },
  { value: "DIP_SUPPLIER", label: "Dip Suppliers", icon: Beaker },
  { value: "AUCTIONEER", label: "Auctioneers", icon: Gavel },
  { value: "FARM_SECURITY", label: "Farm Security", icon: ShieldAlert },
  { value: "MECHANIC", label: "Mechanics", icon: Wrench },
  { value: "OTHER", label: "Other Services", icon: MoreHorizontal },
];

const PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
  "Mpumalanga", "North West", "Northern Cape", "Western Cape",
];

function ApplicationForm({ onDone }: { onDone: () => void }) {
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [provinces, setProvinces] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [plan, setPlan] = useState<"STANDARD" | "PREMIUM">("STANDARD");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function toggleProvince(p: string) {
    setProvinces((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!businessName.trim() || !contactName.trim() || !phone.trim() || !description.trim()) {
      setError("Business name, contact name, phone, and description are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/directory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          category,
          contactName,
          phone,
          email: email || undefined,
          whatsapp: whatsapp || undefined,
          provinces,
          description,
          plan,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit application.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <p className="mb-2 font-black text-[#1B3A6B]">Application received!</p>
        <p className="mb-4 text-sm text-[#5d7497]">
          Our team will review your application. Once approved, we&apos;ll email you a secure
          link to activate your listing.
        </p>
        <button type="button" onClick={onDone} className="text-sm font-semibold text-[#1B3A6B] underline">
          Back to Directory
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl space-y-4 rounded-2xl border border-[#e4ebf5] bg-white p-8 shadow-xl">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      <input
        required
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        placeholder="Business Name *"
        className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 text-sm focus:border-[#1B3A6B] focus:outline-none"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 text-sm focus:border-[#1B3A6B] focus:outline-none"
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-4">
        <input
          required
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          placeholder="Contact Name *"
          className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 text-sm focus:border-[#1B3A6B] focus:outline-none"
        />
        <input
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone *"
          className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 text-sm focus:border-[#1B3A6B] focus:outline-none"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (for payment link)"
          className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 text-sm focus:border-[#1B3A6B] focus:outline-none"
        />
        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="WhatsApp (optional)"
          className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 text-sm focus:border-[#1B3A6B] focus:outline-none"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-[#244367]">Provinces Served</p>
        <div className="flex flex-wrap gap-2">
          {PROVINCES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => toggleProvince(p)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                provinces.includes(p)
                  ? "border-[#1B3A6B] bg-[#1B3A6B] text-white"
                  : "border-[#cdd8e7] bg-white text-[#5d7497]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <textarea
        required
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe your services *"
        className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 text-sm focus:border-[#1B3A6B] focus:outline-none"
      />

      <div>
        <p className="mb-2 text-sm font-semibold text-[#244367]">Plan</p>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setPlan("STANDARD")}
            className={`rounded-xl border-2 p-4 text-left transition ${
              plan === "STANDARD" ? "border-[#1B3A6B] bg-[#eef3fb]" : "border-[#e4ebf5] bg-white"
            }`}
          >
            <p className="font-black text-[#1B3A6B]">Standard</p>
            <p className="text-lg font-black text-[#244367]">R149/mo</p>
          </button>
          <button
            type="button"
            onClick={() => setPlan("PREMIUM")}
            className={`rounded-xl border-2 p-4 text-left transition ${
              plan === "PREMIUM" ? "border-[#A07C3A] bg-[#A07C3A]/10" : "border-[#e4ebf5] bg-white"
            }`}
          >
            <p className="font-black text-[#A07C3A]">Premium</p>
            <p className="text-lg font-black text-[#244367]">R299/mo</p>
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-[#2E7D32] py-3 font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20] disabled:opacity-50"
      >
        {saving ? "Submitting…" : "Submit Application"}
      </button>
    </form>
  );
}

export function DirectoryClient() {
  const [applying, setApplying] = useState(false);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qs = activeCat ? `?category=${activeCat}` : "";
    fetch(`/api/directory${qs}`)
      .then((r) => r.json())
      .then((d) => setListings(d.listings || []))
      .finally(() => setLoading(false));
  }, [activeCat]);

  function selectCategory(value: string | null) {
    setActiveCat(value);
    setLoading(true);
  }

  if (applying) {
    return <ApplicationForm onDone={() => setApplying(false)} />;
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => selectCategory(null)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              activeCat === null ? "bg-[#1B3A6B] text-white" : "border border-[#cdd8e7] bg-white text-[#5d7497]"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => selectCategory(c.value)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${
                activeCat === c.value ? "bg-[#1B3A6B] text-white" : "border border-[#cdd8e7] bg-white text-[#5d7497]"
              }`}
            >
              <c.icon size={14} />
              {c.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setApplying(true)}
          className="whitespace-nowrap rounded-lg bg-[#2E7D32] px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20]"
        >
          + List Your Business
        </button>
      </div>

      {activeCat === "AUCTIONEER" && (
        <div className="mb-6 rounded-lg border border-[#e4ebf5] bg-[#f5f8fd] p-4 text-sm text-[#5d7497]">
          Livestock agents listed here are independently registered with APAC.
        </div>
      )}

      {loading ? (
        <p className="text-center text-sm text-[#5d7497]">Loading…</p>
      ) : listings.length === 0 ? (
        <div className="rounded-2xl border border-[#e4ebf5] bg-white p-12 text-center text-[#5d7497]">
          No providers in this category yet.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <div
              key={l.id}
              className={`rounded-2xl border bg-white p-6 shadow-lg ${
                l.plan === "PREMIUM" ? "border-2 border-[#A07C3A]" : "border-[#e4ebf5]"
              }`}
            >
              <div className="mb-3 flex items-center gap-3">
                {l.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.logoUrl} alt={l.businessName} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f8fd] text-[#9aabb9]">
                    {l.businessName[0]}
                  </div>
                )}
                <div>
                  <h3 className="font-black text-[#1B3A6B]">{l.businessName}</h3>
                  {l.verified && (
                    <span className="text-xs font-semibold text-[#2E7D32]">✓ Verified</span>
                  )}
                </div>
              </div>
              <p className="mb-3 line-clamp-2 text-sm text-[#5d7497]">{l.description}</p>
              <p className="mb-4 text-xs text-[#9aabb9]">{l.provinces.join(", ") || "Nationwide"}</p>
              <div className="flex gap-2">
                <a
                  href={`tel:${l.phone}`}
                  className="flex-1 rounded-lg bg-[#1B3A6B] py-2 text-center text-xs font-bold uppercase text-white"
                >
                  Call
                </a>
                {l.whatsapp && (
                  <a
                    href={`https://wa.me/${l.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-lg bg-[#2E7D32] py-2 text-center text-xs font-bold uppercase text-white"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
