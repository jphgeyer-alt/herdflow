// WEBSITE — herdflow-web/src/app/(farmapp)/app/market/page.tsx
import { getTranslations } from "next-intl/server";
import { getMarketPrices } from "@/lib/market-prices";
import { Card, CardHeader } from "@/components/farm/Card";
import { ValueEstimator } from "./ValueEstimator";

export const dynamic = "force-dynamic";

export default async function MarketPricesPage() {
  const t = await getTranslations("market");
  const prices = await getMarketPrices();

  return (
    <div className="space-y-6 pb-10">
      <header>
        <h1 className="text-navy-600 text-2xl font-semibold">{t("prices_title")}</h1>
        <p className="text-sm text-navy-300">{t("prices_subtitle")}</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={t("beef_prices")} description={prices.beef.weekEnded ? t("week_ended", { date: prices.beef.weekEnded }) : undefined} />
          <div className="divide-y divide-navy-50">
            <PriceRow label={t("grade_a")} value={prices.beef.a23} />
            <PriceRow label={t("grade_b")} value={prices.beef.b23} />
            <PriceRow label={t("grade_c")} value={prices.beef.c23} />
            <PriceRow label={t("weaner_calves")} value={prices.beef.weanerCalves} />
          </div>
        </Card>

        <Card>
          <CardHeader title={t("mutton_prices")} description={prices.mutton.weekEnded ? t("week_ended", { date: prices.mutton.weekEnded }) : undefined} />
          <div className="divide-y divide-navy-50">
            <PriceRow label={t("grade_a")} value={prices.mutton.a23} />
            <PriceRow label={t("grade_b")} value={prices.mutton.b23} />
            <PriceRow label={t("grade_c")} value={prices.mutton.c23} />
            <PriceRow label={t("feeder_lamb")} value={prices.mutton.feederLamb} />
          </div>
        </Card>

        <Card>
          <CardHeader title={t("feed_prices")} />
          <div className="divide-y divide-navy-50">
            <PriceRow label={t("safex_maize")} value={prices.feed.safexMaize} unit="/t" />
          </div>
        </Card>

        <Card>
          <CardHeader title={t("marketplace_prices")} />
          <div className="divide-y divide-navy-50">
            <PriceRow label={t("cattle")} value={prices.marketplace.cattleAvgPerHead} unit="/head" />
            <PriceRow label={t("sheep")} value={prices.marketplace.sheepAvgPerHead} unit="/head" />
            <PriceRow label={t("goats")} value={prices.marketplace.goatsAvgPerHead} unit="/head" />
          </div>
        </Card>
      </div>

      <ValueEstimator defaultPricePerKg={prices.beef.a23} />

      <p className="text-xs text-navy-300">{prices.disclaimer}</p>
    </div>
  );
}

function PriceRow({ label, value, unit = "/kg" }: { label: string; value: number | null; unit?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <p className="text-sm text-navy-500">{label}</p>
      <p className="text-sm font-semibold text-navy-600">{value != null ? `R ${value.toFixed(2)} ${unit}` : "—"}</p>
    </div>
  );
}
