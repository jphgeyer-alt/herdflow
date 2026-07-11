import { NextResponse } from "next/server";
import { releaseFunds } from "@/lib/payments/payouts";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

// Called by a scheduled job (Render cron — see README) with:
//   Authorization: Bearer <CRON_SECRET>
export async function POST(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const expected = `Bearer ${env.CRON_SECRET}`;

  if (!env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await releaseFunds();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("release-funds cron error:", err);
    return NextResponse.json({ error: "Failed to release funds." }, { status: 500 });
  }
}
