"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Calendar } from "lucide-react";
import { type Period } from "@/lib/farm-finance/periods";

const OPTIONS: Period[] = ["this_month", "last_month", "this_quarter", "this_financial_year", "custom"];

export function PeriodSelector({ current }: { current: Period }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("finance");

  function setPeriod(p: Period) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", p);
    if (p !== "custom") {
      params.delete("from");
      params.delete("to");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function setCustomRange(from: string, to: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", "custom");
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Calendar size={16} className="text-navy-300" />
      {OPTIONS.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => setPeriod(p)}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
            current === p
              ? "border-navy-600 bg-navy-600 text-white"
              : "border-navy-100 text-navy-500 hover:bg-navy-25"
          }`}
        >
          {p === "custom" ? t("custom_range") : t(p)}
        </button>
      ))}
      {current === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            defaultValue={searchParams.get("from") ?? ""}
            onChange={(e) => setCustomRange(e.target.value, searchParams.get("to") ?? "")}
            className="rounded-lg border border-navy-100 px-2 py-1.5 text-sm text-navy-600"
            aria-label={t("from_date_label")}
          />
          <span className="text-navy-300">{t("date_range_to")}</span>
          <input
            type="date"
            defaultValue={searchParams.get("to") ?? ""}
            onChange={(e) => setCustomRange(searchParams.get("from") ?? "", e.target.value)}
            className="rounded-lg border border-navy-100 px-2 py-1.5 text-sm text-navy-600"
            aria-label={t("to_date_label")}
          />
        </div>
      )}
    </div>
  );
}
