import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { PricingClient } from "./pricing-client";

export const metadata: Metadata = {
  title: "Pricing | HerdFlow",
  description: "HerdFlow subscription plans and marketplace fees — herd management, selling, transport and sponsorship.",
};

export const revalidate = 3600;

const FEE_GROUPS: { titleKey: string; keys: string[] }[] = [
  {
    titleKey: "fee_group_selling_livestock",
    keys: ["listing_basic", "listing_featured", "verified_seller"],
  },
  {
    titleKey: "fee_group_vendor_store",
    keys: ["vendor_registration", "vendor_plan_basic", "vendor_plan_unlimited", "vendor_commission"],
  },
  {
    titleKey: "fee_group_transport",
    keys: ["transport_booking", "transport_partner_fee"],
  },
  {
    titleKey: "fee_group_classifieds",
    keys: ["classified_equipment", "classified_equipment_featured", "classified_job", "classified_grazing", "classified_wanted"],
  },
  {
    titleKey: "fee_group_services_directory",
    keys: ["directory_standard", "directory_premium"],
  },
];

const FAQ_KEYS = [
  { q: "pricing_faq_q1", a: "pricing_faq_a1" },
  { q: "pricing_faq_q2", a: "pricing_faq_a2" },
  { q: "pricing_faq_q3", a: "pricing_faq_a3" },
  { q: "pricing_faq_q4", a: "pricing_faq_a4" },
];

export default async function PricingPage() {
  const t = await getTranslations("marketing");
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
          {t("pricing_eyebrow")}
        </p>
        <h1 className="mb-4 text-3xl font-black sm:text-5xl">{t("pricing_hero_title")}</h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/80">
          {t("pricing_hero_sub")}
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <PricingClient plans={planCards} />

        {/* Fees table */}
        <div className="mt-20">
          <h2 className="mb-8 text-center text-2xl font-black text-[#1B3A6B]">
            {t("marketplace_fees_title")}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {FEE_GROUPS.map((group) => (
              <div key={group.titleKey} className="rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg">
                <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-[#1B3A6B]">
                  {t(group.titleKey)}
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
            {t("pricing_faq_title")}
          </h2>
          <div className="divide-y divide-[#e4ebf5] rounded-2xl border border-[#e4ebf5] bg-white px-6">
            {FAQ_KEYS.map(({ q, a }) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-[#244367]">
                  {t(q)}
                  <span className="ml-4 text-[#A07C3A] transition-transform group-open:rotate-180">
                    v
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-[#5d7497]">{t(a)}</p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 rounded-2xl bg-[#1B3A6B] p-10 text-center text-white">
          <h2 className="mb-3 text-2xl font-black">{t("pricing_cta_title")}</h2>
          <p className="mb-6 text-white/80">
            {t("pricing_cta_sub")}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/download"
              className="rounded-lg bg-[#2E7D32] px-8 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20]"
            >
              {t("download_app_button")}
            </Link>
            <Link
              href="/shop"
              className="rounded-lg border-2 border-white px-8 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-white/10"
            >
              {t("browse_shop_button")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
