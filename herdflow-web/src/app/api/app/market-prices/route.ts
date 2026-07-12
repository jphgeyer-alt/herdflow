// WEBSITE — herdflow-web/src/app/api/app/market-prices/route.ts
// Returns SA livestock market prices: RPO/ABSA official weekly + Digikraal marketplace
// Cached for 6 hours to reduce scraping load. Core logic lives in
// src/lib/market-prices.ts so the weekly price email cron can reuse it.

import { NextResponse } from "next/server";
import { getMarketPrices } from "@/lib/market-prices";

export const dynamic = "force-dynamic";

export async function GET() {
  const prices = await getMarketPrices();
  return NextResponse.json(prices);
}
