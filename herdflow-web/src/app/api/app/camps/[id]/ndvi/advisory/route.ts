// WEBSITE — herdflow-web/src/app/api/app/camps/[id]/ndvi/advisory/route.ts
// Mobile-facing: generates (or regenerates) the Claude "AI Advisory" for a
// camp's latest NDVI reading. The actual prompt/context-gathering logic
// lives in src/lib/pastureAdvisory.ts, shared with the web farm app's
// server action (app/(farmapp)/app/camps/actions.ts) -- this route's only
// job is auth + resolving the camp id (including the mobile app's
// local-id fallback, same as every other /api/app/camps/[id]/* route).
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";
import { getCampForFarmer } from "@/lib/tenant-lookups";
import { generateCampAdvisory } from "@/lib/pastureAdvisory";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;
  const { id } = await ctx.params;

  const camp = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    getCampForFarmer(tx, id, auth.effectiveFarmerId),
  );
  if (!camp) return NextResponse.json({ error: "Camp not found" }, { status: 404 });

  const result = await generateCampAdvisory(camp);
  if ("error" in result) {
    const status = result.error.startsWith("No NDVI reading") ? 400 : 502;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result);
}
