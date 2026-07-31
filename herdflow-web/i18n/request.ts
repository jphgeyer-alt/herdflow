// WEBSITE — herdflow-web/i18n/request.ts
// G2: resolves the active locale + its messages for next-intl. Deliberately
// NOT using next-intl's [locale] URL-segment/middleware pattern -- the
// finance routes (/app/finance/*) were already built without a locale
// prefix during the Finance upgrade, and restructuring every route under
// /[locale]/... would be a large, unrelated change this task doesn't call
// for. Locale is resolved per-request: a signed-in farmer's saved
// LocaleConfig first (G4 -- shared farm-wide, see schema.prisma), then a
// saved cookie, then the browser's Accept-Language header (first-visit
// auto-detect), else en-ZA.
import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getFarmWebUser } from "@/lib/farm-web-auth";

import enZACommon from "../src/locales/en-ZA/common.json";
import enZAFinance from "../src/locales/en-ZA/finance.json";
import enZAHerd from "../src/locales/en-ZA/herd.json";
import enZABreeding from "../src/locales/en-ZA/breeding.json";
import enZARecords from "../src/locales/en-ZA/records.json";
import enZAReports from "../src/locales/en-ZA/reports.json";
import enZAMarketing from "../src/locales/en-ZA/marketing.json";
import enZACamps from "../src/locales/en-ZA/camps.json";
import enZAHealth from "../src/locales/en-ZA/health.json";
import enZAMarket from "../src/locales/en-ZA/market.json";
import enZAProfile from "../src/locales/en-ZA/profile.json";
import enZAHub from "../src/locales/en-ZA/hub.json";

export const SUPPORTED_LOCALES = ["en-ZA", "af-ZA", "sw", "fr", "pt"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = "en-ZA";
export const LOCALE_COOKIE = "hf_locale";

// G11: af-ZA/sw/fr/pt are selectable but have no real translated content
// yet -- unlike i18next (mobile), next-intl has no automatic per-key
// fallback across locale message sets, so each placeholder locale
// explicitly reuses the en-ZA message objects rather than showing a raw
// key or throwing. Framework scaffolding only; swap a locale's entry for
// its own imported JSON files once real translation work lands for it.
const EN_ZA_MESSAGES = {
  common: enZACommon,
  finance: enZAFinance,
  herd: enZAHerd,
  breeding: enZABreeding,
  records: enZARecords,
  reports: enZAReports,
  marketing: enZAMarketing,
  camps: enZACamps,
  health: enZAHealth,
  market: enZAMarket,
  profile: enZAProfile,
  hub: enZAHub,
};

const MESSAGES: Record<SupportedLocale, Record<string, unknown>> = {
  "en-ZA": EN_ZA_MESSAGES,
  "af-ZA": EN_ZA_MESSAGES,
  sw: EN_ZA_MESSAGES,
  fr: EN_ZA_MESSAGES,
  pt: EN_ZA_MESSAGES,
};

export function resolveFromAcceptLanguage(header: string | null): SupportedLocale | undefined {
  if (!header) return undefined;
  const preferred = header.split(",").map((part) => part.split(";")[0].trim());
  for (const tag of preferred) {
    const exact = SUPPORTED_LOCALES.find((l) => l.toLowerCase() === tag.toLowerCase());
    if (exact) return exact;
    const languageOnly = tag.split("-")[0].toLowerCase();
    const match = SUPPORTED_LOCALES.find((l) => l.split("-")[0].toLowerCase() === languageOnly);
    if (match) return match;
  }
  return undefined;
}

export default getRequestConfig(async () => {
  try {
    const farmUser = await getFarmWebUser();
    if (farmUser) {
      const config = await prisma.localeConfig.findUnique({
        where: { farmerId: farmUser.effectiveFarmerId },
        select: { locale: true },
      });
      if (config && (SUPPORTED_LOCALES as readonly string[]).includes(config.locale)) {
        const locale = config.locale as SupportedLocale;
        return { locale, messages: MESSAGES[locale] };
      }
    }

    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;

    let locale: SupportedLocale = DEFAULT_LOCALE;
    if (cookieLocale && (SUPPORTED_LOCALES as readonly string[]).includes(cookieLocale)) {
      locale = cookieLocale as SupportedLocale;
    } else {
      const headerList = await headers();
      locale = resolveFromAcceptLanguage(headerList.get("accept-language")) ?? DEFAULT_LOCALE;
    }

    return {
      locale,
      messages: MESSAGES[locale],
    };
  } catch (error) {
    console.error("[next-intl] getRequestConfig REAL ERROR:", error);
    console.error(
      "[next-intl] error message:",
      error instanceof Error ? error.message : String(error),
    );
    console.error("[next-intl] error stack:", error instanceof Error ? error.stack : "no stack");
    throw error;
  }
});
