"use server";
// WEBSITE — herdflow-web/src/app/(farmapp)/app/camps/actions.ts
// Manual per-camp NDVI refresh + AI advisory generation for the web camps
// map. Cookie-session authenticated (getFarmWebUser), unlike the mobile
// app's Bearer-token routes under /api/app/camps/[id]/ndvi -- same
// underlying logic (getOrRefreshCampNdvi / generateCampAdvisory), different
// auth boundary, since a browser can't easily attach the session cookie as
// a Bearer header the way the mobile app does.
import { revalidatePath } from "next/cache";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";
import { getCampForFarmer } from "@/lib/tenant-lookups";
import { getCampLivestockSummary } from "@/lib/camps";
import { getOrRefreshCampNdvi, type CampNdviSnapshot } from "@/lib/ndvi";
import { generateCampAdvisory, type CampAdvisoryResult } from "@/lib/pastureAdvisory";
import { prisma } from "@/lib/prisma";

export async function refreshCampNdviAction(
  campId: string,
): Promise<{ snapshot: CampNdviSnapshot | null; error?: string }> {
  const user = await getFarmWebUser();
  if (!user) return { snapshot: null, error: "Not authenticated" };

  const camp = await withFarmerContext(user.effectiveFarmerId, (tx) =>
    getCampForFarmer(tx, campId, user.effectiveFarmerId),
  );
  if (!camp) return { snapshot: null, error: "Camp not found" };

  const profile = await prisma.farmerProfile.findFirst({
    where: { userId: user.effectiveFarmerId },
    select: { country: true },
  });
  const livestock = await withFarmerContext(user.effectiveFarmerId, (tx) =>
    getCampLivestockSummary(tx, camp.id, user.effectiveFarmerId),
  );

  const snapshot = await getOrRefreshCampNdvi(
    { id: camp.id, farmerId: camp.farmerId, gpsCoordinates: camp.gpsCoordinates, hectares: camp.hectares },
    { livestockType: livestock.primaryLivestockType, countryCode: profile?.country ?? null, force: true },
  );

  revalidatePath("/app/camps");
  return { snapshot };
}

export async function generateCampAdvisoryAction(
  campId: string,
): Promise<CampAdvisoryResult | { error: string }> {
  const user = await getFarmWebUser();
  if (!user) return { error: "Not authenticated" };

  const camp = await withFarmerContext(user.effectiveFarmerId, (tx) =>
    getCampForFarmer(tx, campId, user.effectiveFarmerId),
  );
  if (!camp) return { error: "Camp not found" };

  const result = await generateCampAdvisory(camp);
  revalidatePath("/app/camps");
  return result;
}
