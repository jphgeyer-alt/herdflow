import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { FinanceClient } from "./finance-client";
import { AffiliatePartnersRow } from "@/components/marketing/AffiliatePartnersRow";

export const metadata: Metadata = {
  title: "Farm Finance & Insurance | HerdFlow",
  description: "Get quotes from trusted, FSCA-licensed finance and insurance providers.",
};

export const revalidate = 3600;

export default async function FinancePage() {
  const categories = await prisma.leadCategory.findMany({
    where: { isActive: true },
    orderBy: { displayName: "asc" },
  });

  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      <div className="bg-linear-to-br from-[#1B3A6B] to-[#122844] px-4 py-16 text-center text-white md:px-8">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#A07C3A]">
          Farm Finance &amp; Insurance
        </p>
        <h1 className="mb-4 text-3xl font-black sm:text-5xl">
          Get Quotes from Trusted Providers
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/80">
          Tell us what you need — we&apos;ll refer your request to an independent, licensed
          provider who will contact you directly.
        </p>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <FinanceClient
          categories={categories.map((c) => ({
            key: c.key,
            displayName: c.displayName,
            description: c.description,
            partnerName: c.partnerName,
          }))}
        />

        <div className="mt-12 rounded-2xl border border-[#e4ebf5] bg-white p-6 text-xs leading-relaxed text-[#5d7497]">
          HerdFlow is not a Financial Services Provider and does not provide financial advice
          or intermediary services. Quote requests are referred to independent, FSCA-licensed
          providers who will contact you directly. HerdFlow may receive a referral fee from
          partners.
        </div>

        <div className="mt-8 max-w-sm">
          <AffiliatePartnersRow placement="FINANCE_PAGE" title="More Options" />
        </div>
      </div>
    </div>
  );
}
