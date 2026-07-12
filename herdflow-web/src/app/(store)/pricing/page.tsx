import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PricingClient } from "./pricing-client";

export const metadata: Metadata = {
  title: "Pricing | HerdFlow",
  description: "HerdFlow subscription plans and marketplace fees — herd management, selling, transport and sponsorship.",
};

export const dynamic = "force-dynamic";

const FEE_GROUPS: { title: string; keys: string[] }[] = [
  {
    title: "Selling Livestock",
    keys: ["listing_basic", "listing_featured", "verified_seller"],
  },
  {
    title: "Vendor Store",
    keys: ["vendor_registration", "vendor_plan_basic", "vendor_plan_unlimited", "vendor_commission"],
  },
  {
    title: "Transport",
    keys: ["transport_booking", "transport_partner_fee"],
  },
  {
    title: "Classifieds",
    keys: ["classified_equipment", "classified_equipment_featured", "classified_job", "classified_grazing", "classified_wanted"],
  },
  {
    title: "Services Directory",
    keys: ["directory_standard", "directory_premium"],
  },
];

const FAQS = [
  {
    q: "Can I change plans later?",
    a: "Yes — upgrade or downgrade any time from your account. Changes apply from your next billing cycle.",
  },
  {
    q: "Is the Starter plan really free?",
    a: "Yes. Starter is free forever, for up to 10 animals and 1 user — no card required.",
  },
  {
    q: "What happens if I go over my plan's animal limit?",
    a: "We'll let you know so you can upgrade — your existing data is never deleted or locked.",
  },
  {
    q: "How does marketplace commission work?",
    a: "HerdFlow takes a small commission only when you actually sell through the Shop or Transport marketplace — listing and subscription fees are separate and don't depend on sales.",
  },
];

export default async function PricingPage() {
  const [plans, fees] = await Promise.all([
    prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.platformFee.findMany({ where: { isActive: true } }),
  ]);

  const feeMap = new Map(fees.map((f) => [f.feeKey, f]));

  const planCards = plans.map((p) => ({
    key: p.key,
    displayName: p.displayName,
    monthlyPrice: p.monthlyPrice.toString(),
    annualPrice: p.annualPrice.toString(),
    maxAnimals: p.maxAnimals,
    maxUsers: p.maxUsers,
    maxFarms: p.maxFarms,
    features: Array.isArray(p.features) ? (p.features as string[]) : [],
    isPopular: p.isPopular,
  }));

  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      {/* Hero */}
      <div className="bg-linear-to-br from-[#1B3A6B] to-[#122844] px-4 py-16 text-center text-white md:px-8">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#A07C3A]">
          Simple, Transparent Pricing
        </p>
        <h1 className="mb-4 text-3xl font-black sm:text-5xl">Plans for Every Farm</h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/80">
          From a free herd tracker to full co-op management — pick the plan that fits, upgrade any
          time.
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <PricingClient plans={planCards} />

        {/* Fees table */}
        <div className="mt-20">
          <h2 className="mb-8 text-center text-2xl font-black text-[#1B3A6B]">
            Marketplace &amp; Service Fees
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {FEE_GROUPS.map((group) => (
              <div key={group.title} className="rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg">
                <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-[#1B3A6B]">
                  {group.title}
                </h3>
                <ul className="space-y-2 text-sm">
                  {group.keys.map((key) => {
                    const fee = feeMap.get(key);
                    if (!fee) return null;
                    return (
                      <li
                        key={key}
                        className="flex justify-between border-b border-[#e4ebf5] pb-2 last:border-0"
                      >
                        <span className="text-[#5d7497]">{fee.name}</span>
                        <span className="font-bold text-[#244367]">
                          {fee.feeType === "PERCENT"
                            ? `${Number(fee.amount)}%`
                            : `R${Number(fee.amount).toLocaleString("en-ZA")}`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mx-auto mt-20 max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-black text-[#1B3A6B]">
            Frequently Asked Questions
          </h2>
          <div className="divide-y divide-[#e4ebf5] rounded-2xl border border-[#e4ebf5] bg-white px-6">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-[#244367]">
                  {q}
                  <span className="ml-4 text-[#A07C3A] transition-transform group-open:rotate-180">
                    v
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-[#5d7497]">{a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 rounded-2xl bg-[#1B3A6B] p-10 text-center text-white">
          <h2 className="mb-3 text-2xl font-black">Ready to get started?</h2>
          <p className="mb-6 text-white/80">
            Download the free HerdFlow app or explore the marketplace today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/download"
              className="rounded-lg bg-[#2E7D32] px-8 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20]"
            >
              Download the App
            </Link>
            <Link
              href="/shop"
              className="rounded-lg border-2 border-white px-8 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-white/10"
            >
              Browse the Shop
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
