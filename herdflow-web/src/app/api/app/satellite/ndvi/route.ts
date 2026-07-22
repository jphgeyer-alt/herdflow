// WEBSITE — herdflow-web/src/app/api/app/satellite/ndvi/route.ts
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { getVegetationHealth } from "@/lib/satellite";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lon = parseFloat(searchParams.get("lon") ?? "");
  const hectaresParam = searchParams.get("hectares");
  const hectares = hectaresParam ? parseFloat(hectaresParam) : null;

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
  }

  const result = await getVegetationHealth(lat, lon, hectares);
  if (!result) {
    return NextResponse.json({ error: "Vegetation health data unavailable" }, { status: 503 });
  }
  return NextResponse.json(result);
}
