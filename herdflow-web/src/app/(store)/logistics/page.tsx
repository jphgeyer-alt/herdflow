import Link from "next/link";
import type { Metadata } from "next";
import { Truck, Package } from "lucide-react";
import { RequestTransportButton } from "./request-transport-button";

export const metadata: Metadata = {
  title: "Livestock Transport | HerdFlow",
  description:
    "HerdFlow's verified livestock transport network. Become a transport partner or request a delivery.",
};

const partnerSteps = [
  "Apply with your company, fleet size and routes covered",
  "Our team verifies your fleet documentation (2–3 business days)",
  "See open delivery jobs matched to your routes from your logistics dashboard",
  "Claim jobs and get paid — transparent, on-time payouts",
];

const clientSteps = [
  "Tell us your pickup and drop-off regions",
  "Share load type, size and preferred dates",
  "We match you with a verified transport partner",
  "Track your delivery through to completion",
];

export default function LogisticsLandingPage() {
  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      {/* Hero */}
      <div className="bg-[#1B3A6B] px-4 py-16 text-white md:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#A07C3A]">
            Verified Transport Network
          </p>
          <h1 className="mb-4 text-3xl font-black sm:text-5xl">Livestock Transport</h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/80">
            HerdFlow connects sellers who need livestock moved with vetted transport partners —
            matched by region and route.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Partner panel */}
          <div className="rounded-2xl border border-[#e4ebf5] bg-white p-8 shadow-lg md:p-10">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2E7D32]/10">
              <Truck className="h-7 w-7 text-[#2E7D32]" />
            </div>
            <h2 className="mb-2 text-xl font-black uppercase text-[#1B3A6B]">
              Transport Partners
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-[#5d7497]">
              Fill empty return trips and grow your fleet&apos;s income with route-matched
              delivery jobs.
            </p>
            <ul className="mb-8 space-y-3">
              {partnerSteps.map((step, i) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1B3A6B] text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 text-sm text-[#5d7497]">{step}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/register/logistics"
              className="inline-flex items-center gap-2 rounded-lg bg-[#2E7D32] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20]"
            >
              Apply to Become a Partner
            </Link>
          </div>

          {/* Client panel */}
          <div className="rounded-2xl border border-[#e4ebf5] bg-white p-8 shadow-lg md:p-10">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2E7D32]/10">
              <Package className="h-7 w-7 text-[#2E7D32]" />
            </div>
            <h2 className="mb-2 text-xl font-black uppercase text-[#1B3A6B]">
              Need Livestock Moved?
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-[#5d7497]">
              Selling livestock or farm goods and need transport arranged? Tell our team the
              details and we&apos;ll match you with a verified partner.
            </p>
            <ul className="mb-8 space-y-3">
              {clientSteps.map((step, i) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1B3A6B] text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 text-sm text-[#5d7497]">{step}</span>
                </li>
              ))}
            </ul>
            <p className="mb-6 text-sm font-semibold text-[#1B3A6B]">
              R195 booking fee to submit — the final transport price is agreed with your matched
              partner.
            </p>
            <RequestTransportButton />
          </div>
        </div>

        {/* Pricing */}
        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-[#1B3A6B]">
              For Transport Partners
            </h3>
            <ul className="space-y-2 text-sm text-[#5d7497]">
              <li className="flex justify-between border-b border-[#e4ebf5] pb-2">
                <span>Registration</span>
                <span className="font-bold text-[#2E7D32]">Free</span>
              </li>
              <li className="flex justify-between border-b border-[#e4ebf5] pb-2">
                <span>Premium Listing (optional)</span>
                <span className="font-bold text-[#244367]">R299/month</span>
              </li>
              <li className="flex justify-between">
                <span>Service Fee (on completed jobs)</span>
                <span className="font-bold text-[#244367]">4%</span>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-[#1B3A6B]">
              For Farmers &amp; Sellers
            </h3>
            <ul className="space-y-2 text-sm text-[#5d7497]">
              <li className="flex justify-between border-b border-[#e4ebf5] pb-2">
                <span>Booking Fee</span>
                <span className="font-bold text-[#244367]">R195</span>
              </li>
              <li className="flex justify-between">
                <span>Transport Price</span>
                <span className="font-bold text-[#244367]">Quoted &amp; agreed upfront</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
