import { NextResponse } from "next/server";
import { refreshStaleNdviReadings } from "@/lib/ndviRefresh";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

// Called by a scheduled job (Render cron — see README) with:
//   Authorization: Bearer <CRON_SECRET>
// Recommended schedule: daily. getOrRefreshCampNdvi only actually calls
// Copernicus for camps whose own configured refreshIntervalDays has
// elapsed, so a daily cadence here doesn't over-fetch against the ~5-day
// Sentinel-2 revisit cycle.
export async function POST(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const expected = `Bearer ${env.CRON_SECRET}`;

  if (!env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await refreshStaleNdviReadings();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("ndvi-refresh cron error:", err);
    return NextResponse.json({ error: "Failed to refresh NDVI readings." }, { status: 500 });
  }
}
