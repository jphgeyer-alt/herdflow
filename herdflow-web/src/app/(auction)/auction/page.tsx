"use client";

import { useState, FormEvent } from "react";
import { Gavel, Bell, Users, ShieldCheck } from "lucide-react";

const HOW_IT_WORKS = [
  {
    icon: Gavel,
    title: "Live Bidding, Online",
    text: "Watch and bid on livestock lots in real time, from anywhere in South Africa.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Sellers & Agents",
    text: "Every session is run through a registered livestock agent, with verified sellers.",
  },
  {
    icon: Bell,
    title: "Get Notified First",
    text: "Register your interest below and we'll let you know the moment auctions open.",
  },
];

function InterestForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [livestockType, setLivestockType] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          subject: "Auction Interest",
          message: `Livestock type: ${livestockType || "Not specified"}`,
        }),
      });
      const data = await res.json();
      if (res.ok) setDone(true);
      else setError(data.error || "Failed to submit.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center text-sm text-green-800">
        Thanks! We&apos;ll email you as soon as auctions open.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <input
        required
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Full Name"
        className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 focus:border-[#1B3A6B] focus:outline-none"
      />
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email Address"
        className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 focus:border-[#1B3A6B] focus:outline-none"
      />
      <input
        required
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone Number"
        className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 focus:border-[#1B3A6B] focus:outline-none"
      />
      <input
        value={livestockType}
        onChange={(e) => setLivestockType(e.target.value)}
        placeholder="Livestock type you're interested in (e.g. Cattle)"
        className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 focus:border-[#1B3A6B] focus:outline-none"
      />
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-[#2E7D32] py-3 font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Submitting…" : "Notify Me When Auctions Launch"}
      </button>
    </form>
  );
}

function AgentPartnerForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agency, setAgency] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          subject: "Auction Agent Partnership",
          message: `Registered agency/practice: ${agency || "Not specified"}`,
        }),
      });
      const data = await res.json();
      if (res.ok) setDone(true);
      else setError(data.error || "Failed to submit.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center text-sm text-green-800">
        Thanks! Our team will be in touch to discuss partnership.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <input
        required
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Full Name"
        className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 focus:border-[#1B3A6B] focus:outline-none"
      />
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email Address"
        className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 focus:border-[#1B3A6B] focus:outline-none"
      />
      <input
        required
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone Number"
        className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 focus:border-[#1B3A6B] focus:outline-none"
      />
      <input
        value={agency}
        onChange={(e) => setAgency(e.target.value)}
        placeholder="Registered Agency / Practice Name"
        className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 focus:border-[#1B3A6B] focus:outline-none"
      />
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg border-2 border-[#1B3A6B] py-3 font-bold uppercase tracking-wide text-[#1B3A6B] transition hover:bg-[#1B3A6B] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Submitting…" : "Register Partnership Interest"}
      </button>
    </form>
  );
}

export default function AuctionLaunchingSoonPage() {
  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      {/* Hero */}
      <div className="bg-linear-to-br from-[#1B3A6B] to-[#122844] px-4 py-20 text-center text-white md:px-8">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#A07C3A]">
          Coming Soon
        </p>
        <h1 className="mb-4 text-3xl font-black sm:text-5xl">HerdFlow Auctions — Launching Soon</h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/80">
          Live online livestock auctions are on the way. Register your interest below and be the
          first to know when we go live.
        </p>
      </div>

      {/* How it will work */}
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <h2 className="mb-10 text-center text-2xl font-black text-[#1B3A6B]">How It Will Work</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {HOW_IT_WORKS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-[#e4ebf5] bg-white p-6 text-center shadow-lg">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2E7D32]/10">
                <Icon className="h-7 w-7 text-[#2E7D32]" />
              </div>
              <h3 className="mb-2 font-black text-[#1B3A6B]">{title}</h3>
              <p className="text-sm text-[#5d7497]">{text}</p>
            </div>
          ))}
        </div>

        {/* Two forms */}
        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#e4ebf5] bg-white p-8 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <Bell className="h-6 w-6 text-[#2E7D32]" />
              <h3 className="text-xl font-black text-[#1B3A6B]">Farmer Interest</h3>
            </div>
            <p className="mb-6 text-sm text-[#5d7497]">
              Want to buy or sell at auction once we launch? Tell us what you&apos;re interested
              in.
            </p>
            <InterestForm />
          </div>

          <div className="rounded-2xl border border-[#e4ebf5] bg-white p-8 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <Users className="h-6 w-6 text-[#1B3A6B]" />
              <h3 className="text-xl font-black text-[#1B3A6B]">
                Registered Livestock Agents — Partner With Us
              </h3>
            </div>
            <p className="mb-6 text-sm text-[#5d7497]">
              We&apos;re looking for registered livestock agents to run auction sessions on
              HerdFlow. Register your interest and our team will follow up.
            </p>
            <AgentPartnerForm />
          </div>
        </div>
      </div>
    </div>
  );
}
