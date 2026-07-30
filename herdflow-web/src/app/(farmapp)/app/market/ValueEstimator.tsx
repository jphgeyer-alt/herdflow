"use client";
// WEBSITE — herdflow-web/src/app/(farmapp)/app/market/ValueEstimator.tsx
// Manual "estimate animal value" calculator -- web port of mobile
// MarketPricesScreen's estimator (weight x price/kg x dressing %), typed by
// hand rather than wired to a specific animal (v1 scope, see plan).
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader } from "@/components/farm/Card";
import { formatCurrency } from "@/lib/farm-finance/format";

export function ValueEstimator({ defaultPricePerKg }: { defaultPricePerKg: number }) {
  const t = useTranslations("market");
  const [liveWeight, setLiveWeight] = useState("");
  const [dressingPct, setDressingPct] = useState("55");
  const [pricePerKg, setPricePerKg] = useState(String(defaultPricePerKg));

  const { carcassWeight, estimatedValue } = useMemo(() => {
    const w = parseFloat(liveWeight) || 0;
    const d = parseFloat(dressingPct) || 0;
    const p = parseFloat(pricePerKg) || 0;
    const carcass = w * (d / 100);
    return { carcassWeight: carcass, estimatedValue: carcass * p };
  }, [liveWeight, dressingPct, pricePerKg]);

  const inputClass = "w-full rounded-lg border border-navy-100 px-3 py-2 text-sm text-navy-600";

  return (
    <Card>
      <CardHeader title={t("estimator_title")} description={t("estimator_subtitle")} />
      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
            {t("live_weight_kg")}
          </label>
          <input
            type="number"
            step="1"
            min="0"
            value={liveWeight}
            onChange={(e) => setLiveWeight(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
            {t("dressing_percentage")}
          </label>
          <input
            type="number"
            step="1"
            min="0"
            max="100"
            value={dressingPct}
            onChange={(e) => setDressingPct(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
            {t("price_per_kg")}
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={pricePerKg}
            onChange={(e) => setPricePerKg(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 border-t border-navy-50 p-5 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold tracking-wide text-navy-300 uppercase">{t("estimated_carcass_weight")}</p>
          <p className="mt-1 text-xl font-semibold text-navy-600">{carcassWeight.toFixed(1)} kg</p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-navy-300 uppercase">{t("estimated_value")}</p>
          <p className="mt-1 text-xl font-semibold text-navy-600">{formatCurrency(estimatedValue)}</p>
        </div>
      </div>
    </Card>
  );
}
