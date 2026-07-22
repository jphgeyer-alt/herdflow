// WEBSITE — herdflow-web/src/app/api/app/weather/route.ts
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { getWeather } from "@/lib/weather";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lon = parseFloat(searchParams.get("lon") ?? "");
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
  }

  const weather = await getWeather(lat, lon);
  if (!weather) {
    return NextResponse.json({ error: "Weather data unavailable" }, { status: 503 });
  }
  return NextResponse.json(weather);
}
