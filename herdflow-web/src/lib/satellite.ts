// WEBSITE — herdflow-web/src/lib/satellite.ts
// Free, unrestricted-for-commercial-use satellite vegetation health (NDVI)
// via the Copernicus Data Space Ecosystem's Sentinel Hub Statistical API —
// NOT Google Earth Engine (Earth Engine's own terms require a paid Google
// Cloud commercial billing account for a paid product like HerdFlow; the
// underlying Sentinel-2 data is free either way, but Earth Engine's compute
// layer isn't for commercial use). The Statistical API computes NDVI
// server-side from an evalscript and returns just the aggregated numbers —
// no raster/GDAL processing needed on our side.
//
// NDVI needs an area, but FarmerCamp only stores a single GPS point plus a
// hectares figure — no surveyed camp-boundary polygon exists anywhere in
// the app. This builds an APPROXIMATE square bounding box centered on that
// point, sized from hectares (defaulting to 5ha if not set). Callers must
// treat the result as an approximation of the camp's location, not its
// exact boundary — the disclaimer string says so explicitly.
import { env } from "@/lib/env";

const TOKEN_URL =
  "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token";
const STATISTICS_URL = "https://sh.dataspace.copernicus.eu/statistics/v1";

const NDVI_EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08", "dataMask"] }],
    output: [
      { id: "data", bands: 1, sampleType: "FLOAT32" },
      { id: "dataMask", bands: 1 },
    ],
  };
}
function evaluatePixel(samples) {
  let ndvi = (samples.B08 - samples.B04) / (samples.B08 + samples.B04);
  return { data: [ndvi], dataMask: [samples.dataMask] };
}`;

export const NDVI_DISCLAIMER =
  "Vegetation health from Sentinel-2 satellite imagery (Copernicus/ESA), for an " +
  "approximate area centered on this camp's tagged location -- not its exact surveyed " +
  "boundary. Updated roughly every few days as new satellite passes become available.";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  if (!env.COPERNICUS_CLIENT_ID || !env.COPERNICUS_CLIENT_SECRET) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.token;

  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: env.COPERNICUS_CLIENT_ID,
        client_secret: env.COPERNICUS_CLIENT_SECRET,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in ?? 300) * 1000,
    };
    return cachedToken.token;
  } catch (err) {
    console.error("[satellite] token fetch failed:", err);
    return null;
  }
}

// Builds a square lat/lon bounding box centered on (lat, lon), sized so its
// area approximates `hectares`. 1 hectare = 10,000 m². Degree-per-meter
// conversion is approximate (WGS84 sphere), fine at this scale (a few
// hundred meters across).
function buildBoundingBox(lat: number, lon: number, hectares: number) {
  const areaM2 = hectares * 10_000;
  const sideM = Math.sqrt(areaM2);
  const halfDegLat = sideM / 2 / 111_320;
  const halfDegLon = sideM / 2 / (111_320 * Math.cos((lat * Math.PI) / 180));
  return {
    type: "Polygon" as const,
    coordinates: [
      [
        [lon - halfDegLon, lat - halfDegLat],
        [lon + halfDegLon, lat - halfDegLat],
        [lon + halfDegLon, lat + halfDegLat],
        [lon - halfDegLon, lat + halfDegLat],
        [lon - halfDegLon, lat - halfDegLat],
      ],
    ],
  };
}

export type VegetationInterpretation = "poor" | "fair" | "good" | "excellent";

function interpretNdvi(ndvi: number): VegetationInterpretation {
  if (ndvi < 0.2) return "poor";
  if (ndvi < 0.4) return "fair";
  if (ndvi < 0.7) return "good";
  return "excellent";
}

export interface VegetationHealthResult {
  ndvi: number;
  date: string;
  interpretation: VegetationInterpretation;
  approximate: true;
  disclaimer: string;
}

const DEFAULT_HECTARES = 5;

export async function getVegetationHealth(
  lat: number,
  lon: number,
  hectares: number | null | undefined,
): Promise<VegetationHealthResult | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const now = new Date();
  const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // last 30 days

  try {
    const res = await fetch(STATISTICS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        input: {
          bounds: {
            geometry: buildBoundingBox(lat, lon, hectares || DEFAULT_HECTARES),
            properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" },
          },
          data: [{ type: "sentinel-2-l2a", dataFilter: { mosaickingOrder: "leastCC" } }],
        },
        aggregation: {
          timeRange: { from: from.toISOString(), to: now.toISOString() },
          aggregationInterval: { of: "P30D" },
          evalscript: NDVI_EVALSCRIPT,
          resx: 10,
          resy: 10,
        },
      }),
    });

    if (!res.ok) {
      console.error("[satellite] statistics request failed:", res.status, await res.text().catch(() => ""));
      return null;
    }

    const data = await res.json();
    // Response shape: data.data is an array of aggregation intervals, each
    // with outputs.data.bands.B0.stats.mean — take the most recent interval
    // that actually has samples (an all-cloudy period has none).
    const intervals = (data?.data ?? []) as any[];
    const latest = [...intervals].reverse().find((i) => i?.outputs?.data?.bands?.B0?.stats?.sampleCount > 0);
    if (!latest) return null;

    const mean = latest.outputs.data.bands.B0.stats.mean;
    return {
      ndvi: Math.round(mean * 100) / 100,
      date: latest.interval?.to ?? now.toISOString(),
      interpretation: interpretNdvi(mean),
      approximate: true,
      disclaimer: NDVI_DISCLAIMER,
    };
  } catch (err) {
    console.error("[satellite] getVegetationHealth error:", err);
    return null;
  }
}
