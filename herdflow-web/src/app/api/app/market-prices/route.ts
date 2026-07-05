// WEBSITE — herdflow-web/src/app/api/app/market-prices/route.ts
// Returns SA livestock market prices: RPO/ABSA official weekly + Digikraal marketplace
// Cached for 6 hours to reduce scraping load

import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CACHE_MS = 6 * 60 * 60 * 1000; // 6 hours

const DISCLAIMER =
  "Carcass prices published weekly by RPO/ABSA. Prices are approximately 7 days old due " +
  "to industry data verification requirements (law). These are market trend indicators only " +
  "— not negotiated farm gate prices. Consult your livestock agent for current prices. " +
  "Sources: rpo.co.za & digikraal.co.za";

// ── Reference prices July 2026 ────────────────────────────────────────────────
const FALLBACK = {
  beef: {
    a23: 64.89, b23: 58.86, c23: 58.13,
    weanerCalves: 44.69,
    unit: "R/kg carcass weight",
    weekEnded: "Reference — July 2026",
  },
  mutton: {
    a23: 108.97, b23: 78.09, c23: 77.99,
    feederLamb: 55.87,
    unit: "R/kg carcass weight",
    weekEnded: "Reference — July 2026",
  },
  feed: {
    safexMaize: 3122,
    unit: "R/ton",
  },
  marketplace: {
    cattleAvgPerHead: 15000,
    sheepAvgPerHead: 3200,
    goatsAvgPerHead: 2100,
    byProvince: {
      "North West": 17604,
      "Limpopo": 20436,
      "Mpumalanga": 15689,
      "Free State": 15276,
      "Western Cape": 13383,
      "Eastern Cape": 10620,
      "Northern Cape": 12535,
      "Gauteng": 8999,
    },
    listingsCount: 0,
  },
};

// ── GET handler ───────────────────────────────────────────────────────────────
export async function GET() {
  try {
    // Check fresh cache first
    const cached = await prisma.marketPriceCache.findFirst({
      where: {
        cacheKey: "sa-livestock-prices",
        updatedAt: { gte: new Date(Date.now() - CACHE_MS) },
      },
    });

    if (cached) {
      return NextResponse.json({
        ...JSON.parse(cached.priceData),
        source: "cache",
        cachedAt: cached.updatedAt,
        disclaimer: DISCLAIMER,
      });
    }

    // Fetch live data
    const [rpoResult, digiResult] = await Promise.allSettled([
      scrapeRPO(),
      scrapeDigikraal(),
    ]);

    const rpo  = rpoResult.status  === "fulfilled" ? rpoResult.value  : {};
    const digi = digiResult.status === "fulfilled" ? digiResult.value : {};

    const payload = {
      beef: {
        a23:          (rpo as any).beefA23        ?? FALLBACK.beef.a23,
        b23:          (rpo as any).beefB23        ?? FALLBACK.beef.b23,
        c23:          (rpo as any).beefC23        ?? FALLBACK.beef.c23,
        weanerCalves: (rpo as any).weanerCalves   ?? FALLBACK.beef.weanerCalves,
        unit:         "R/kg carcass weight",
        weekEnded:    (rpo as any).weekEnded       ?? null,
      },
      mutton: {
        a23:        (rpo as any).muttonA23  ?? FALLBACK.mutton.a23,
        b23:        (rpo as any).muttonB23  ?? FALLBACK.mutton.b23,
        c23:        (rpo as any).muttonC23  ?? FALLBACK.mutton.c23,
        feederLamb: (rpo as any).feederLamb ?? FALLBACK.mutton.feederLamb,
        unit:       "R/kg carcass weight",
        weekEnded:  (rpo as any).weekEnded  ?? null,
      },
      feed: {
        safexMaize: (rpo as any).safexMaize ?? FALLBACK.feed.safexMaize,
        unit: "R/ton",
      },
      marketplace: {
        cattleAvgPerHead: (digi as any).cattle    ?? FALLBACK.marketplace.cattleAvgPerHead,
        sheepAvgPerHead:  (digi as any).sheep     ?? FALLBACK.marketplace.sheepAvgPerHead,
        goatsAvgPerHead:  (digi as any).goats     ?? FALLBACK.marketplace.goatsAvgPerHead,
        byProvince:       (digi as any).byProvince ?? FALLBACK.marketplace.byProvince,
        listingsCount:    (digi as any).listingsCount ?? 0,
      },
      updatedAt: new Date().toISOString(),
      sources: [
        { name: "RPO / ABSA", description: "Official weekly carcass prices", url: "https://rpo.co.za/carcass-prices", frequency: "Weekly — Thursdays" },
        { name: "Digikraal",  description: "Live marketplace asking prices",  url: "https://digikraal.co.za/market-prices", frequency: "Daily" },
      ],
    };

    // Cache the result
    await prisma.marketPriceCache.upsert({
      where:  { cacheKey: "sa-livestock-prices" },
      update: { priceData: JSON.stringify(payload), updatedAt: new Date() },
      create: { cacheKey: "sa-livestock-prices", priceData: JSON.stringify(payload), updatedAt: new Date() },
    });

    return NextResponse.json({ ...payload, source: "live", disclaimer: DISCLAIMER });

  } catch (err) {
    console.error("[market-prices]", err);

    // Return stale cache on error
    const stale = await prisma.marketPriceCache.findFirst({
      where: { cacheKey: "sa-livestock-prices" },
      orderBy: { updatedAt: "desc" },
    }).catch(() => null);

    if (stale) {
      return NextResponse.json({
        ...JSON.parse(stale.priceData),
        source: "stale-cache",
        cachedAt: stale.updatedAt,
        warning: "Live prices temporarily unavailable. Showing last available prices.",
        disclaimer: DISCLAIMER,
      });
    }

    return NextResponse.json({
      ...FALLBACK,
      source: "static-fallback",
      warning: "Using reference prices. Connect to internet for live market data.",
      disclaimer: DISCLAIMER,
    });
  }
}

// ── RPO/ABSA scraper ──────────────────────────────────────────────────────────
async function scrapeRPO() {
  const res = await fetch("https://rpo.co.za/carcass-prices/", {
    headers: { "User-Agent": "Mozilla/5.0 HerdFlow/1.2" },
    signal: AbortSignal.timeout(10000),
  });
  const html = await res.text();
  const $    = cheerio.load(html);

  const result = {
    beefA23: null as number | null, beefB23: null as number | null, beefC23: null as number | null,
    weanerCalves: null as number | null,
    muttonA23: null as number | null, muttonB23: null as number | null, muttonC23: null as number | null,
    feederLamb: null as number | null,
    safexMaize: null as number | null,
    weekEnded: null as string | null,
  };

  const parseCell = (el: any): number | null => {
    const t = $(el).text().trim().replace(/[R\s,]/g, "");
    const n = parseFloat(t);
    return isNaN(n) ? null : n;
  };

  let parsed = false;
  $("table tr").each((_i, row) => {
    if (parsed) return;
    const cells = $(row).find("td");
    if (cells.length >= 8) {
      const date = $(cells[0]).text().trim();
      if (date && date.length > 3) {
        result.weekEnded     = date;
        result.beefA23       = parseCell(cells[1]);
        result.beefB23       = parseCell(cells[2]);
        result.beefC23       = parseCell(cells[3]);
        result.weanerCalves  = parseCell(cells[4]);
        result.muttonA23     = parseCell(cells[5]);
        result.muttonB23     = parseCell(cells[6]);
        result.muttonC23     = parseCell(cells[7]);
        if (cells.length > 8) result.feederLamb = parseCell(cells[8]);
        parsed = true;
      }
    }
  });

  $('*').each((_: any, el: any) => {
    const text = $(el).text();
    if (!result.safexMaize && (text.includes("SAFEX") || text.includes("YMAZ"))) {
      const m = text.match(/R[\s]*([\d\s,]+)\/t/i);
      if (m) result.safexMaize = parseFloat(m[1].replace(/[\s,]/g, ""));
    }
  });

  return result;
}

// ── Digikraal scraper ─────────────────────────────────────────────────────────
async function scrapeDigikraal() {
  const res = await fetch("https://digikraal.co.za/market-prices", {
    headers: { "User-Agent": "Mozilla/5.0 HerdFlow/1.2" },
    signal: AbortSignal.timeout(10000),
  });
  const html = await res.text();
  const $    = cheerio.load(html);

  const byProvince: Record<string, number> = {};
  const PROVINCES = ["Western Cape","Eastern Cape","Free State","KwaZulu-Natal","North West","Northern Cape","Gauteng","Limpopo","Mpumalanga"];

  PROVINCES.forEach(province => {
    $('*').each((_: any, el: any) => {
      if (byProvince[province]) return;
      const text = $(el).text();
      if (text.includes(province)) {
        const m = text.match(/R\s*([\d\s,]+)/);
        if (m) {
          const n = parseFloat(m[1].replace(/[\s,]/g, ""));
          if (n > 1000 && n < 100000) byProvince[province] = n;
        }
      }
    });
  });

  return { cattle: null, sheep: null, goats: null, byProvince, listingsCount: 0 };
}
