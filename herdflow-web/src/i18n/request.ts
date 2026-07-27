// WEBSITE — herdflow-web/src/i18n/request.ts
// G2: resolves the active locale + its messages for next-intl. Deliberately
// NOT using next-intl's [locale] URL-segment/middleware pattern -- the
// finance routes (/app/finance/*) were already built without a locale
// prefix during the Finance upgrade, and restructuring every route under
// /[locale]/... would be a large, unrelated change this task doesn't call
// for. Locale is resolved per-request instead: a saved cookie first, then
// the browser's Accept-Language header (first-visit auto-detect), else
// en-ZA. G4's LocaleConfig will take priority over both once that schema
// lands (see the TODO below) -- deliberately not built here since DB
// schema changes are G4's task, not G2's.
import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

import enZACommon from "../locales/en-ZA/common.json";
import enZAFinance from "../locales/en-ZA/finance.json";
import enZAHerd from "../locales/en-ZA/herd.json";
import enZABreeding from "../locales/en-ZA/breeding.json";
import enZARecords from "../locales/en-ZA/records.json";
import enZAReports from "../locales/en-ZA/reports.json";
import enZAMarketing from "../locales/en-ZA/marketing.json";

export const SUPPORTED_LOCALES = ["en-ZA"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = "en-ZA";
export const LOCALE_COOKIE = "hf_locale";

const MESSAGES: Record<SupportedLocale, Record<string, unknown>> = {
  "en-ZA": {
    common: enZACommon,
    finance: enZAFinance,
    herd: enZAHerd,
    breeding: enZABreeding,
    records: enZARecords,
    reports: enZAReports,
    marketing: enZAMarketing,
  },
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
  // TODO(G4): once LocaleConfig lands, check the signed-in farmer's saved
  // language preference here first (via getFarmWebUser()), ahead of the
  // cookie/header fallback below, so it syncs across devices as required.
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
});
