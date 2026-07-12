import { NextResponse } from "next/server";
import { env } from "@/lib/env";

// TEMPORARY — diagnosing a CRON_SECRET mismatch between this web service and
// the Render cron jobs. Reveals only length + first/last 2 characters, never
// the full secret. Delete this route once the mismatch is resolved.
export async function GET() {
  const s = env.CRON_SECRET;
  return NextResponse.json({
    length: s.length,
    first2: s.slice(0, 2),
    last2: s.slice(-2),
  });
}
