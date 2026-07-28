// WEBSITE — herdflow-web/src/app/api/app/camps/[id]/ndvi/route.ts
// Cached-first NDVI reading for a camp: serves the latest stored reading
// instantly, only calling out to Copernicus when it's missing, stale beyond
// its configured refresh interval, or ?force=true (manual refresh button).
// See src/lib/ndvi.ts for the actual fetch/persist/trend logic.
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";
import { getCampForFarmer } from "@/lib/tenant-lookups";
import { getCampLivestockSummary } from "@/lib/camps";
import { getOrRefreshCampNdvi } from "@/lib/ndvi";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;
  const { id } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "true";

  const camp = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    getCampForFarmer(tx, id, auth.effectiveFarmerId),
  );
  if (!camp) return NextResponse.json({ error: "Camp not found" }, { status: 404 });

  // FarmerProfile isn't RLS-protected (see mobile-auth.ts/farm-web-auth.ts,
  // which already read it directly) -- countryCode narrows the threshold
  // lookup, not tenant data itself.
  const profile = await prisma.farmerProfile.findFirst({
    where: { userId: auth.effectiveFarmerId },
    select: { country: true },
  });

  const livestock = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    getCampLivestockSummary(tx, camp.id, auth.effectiveFarmerId),
  );

  const snapshot = await getOrRefreshCampNdvi(
    {
      id: camp.id,
      farmerId: camp.farmerId,
      gpsCoordinates: camp.gpsCoordinates,
      hectares: camp.hectares,
    },
    { livestockType: livestock.primaryLivestockType, countryCode: profile?.country ?? null, force },
  );

  return NextResponse.json({
    hasGps: !!camp.gpsCoordinates,
    livestock,
    ...snapshot,
  });
}
