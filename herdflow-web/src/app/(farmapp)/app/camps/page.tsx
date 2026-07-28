// WEBSITE — herdflow-web/src/app/(farmapp)/app/camps/page.tsx
import Link from "next/link";
import { Download } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { parseGpsCoordinates } from "@/lib/geo";
import { buildBoundingBox } from "@/lib/satellite";
import { buildPastureReport } from "@/lib/pastureReport";
import { CampsMap, type MapCamp, type OverlayLayer } from "@/components/farm/camps/CampsMap";

export const dynamic = "force-dynamic";

// Mirrors herdflow-app/src/constants/ndviOptions.ts NDVI_COLOR exactly, so
// the web and mobile overlays never disagree on what a vegetation-health
// band looks like.
const NDVI_COLOR: Record<string, string> = {
  poor: "#C62828",
  fair: "#F57F17",
  good: "#9ACD32",
  excellent: "#2E7D32",
};

export default async function CampsMapPage() {
  const t = await getTranslations("camps");
  const user = await getFarmWebUser();
  if (!user) return null; // layout already redirects; satisfies the type checker

  const report = await buildPastureReport(user.effectiveFarmerId);

  // Decimal/Date fields aren't directly serializable across the server/
  // client component boundary -- flatten to plain JSON-safe values here,
  // once, rather than in the client component.
  const mapCamps: MapCamp[] = report.camps.map((camp) => {
    const coords = parseGpsCoordinates(camp.gpsCoordinates);
    return {
      id: camp.id,
      name: camp.name,
      currentStatus: camp.currentStatus,
      currentHeadCount: camp.currentHeadCount,
      hectares: camp.hectares,
      notes: camp.notes,
      lat: coords?.lat ?? null,
      lon: coords?.lon ?? null,
      ndvi: camp.ndvi
        ? {
            score10: camp.ndvi.reading.score10,
            interpretation: camp.ndvi.reading.interpretation,
            trend: camp.ndvi.trend,
            satellitePassDate: camp.ndvi.reading.satellitePassDate.toISOString(),
            aiAdvisory: camp.ndvi.reading.aiAdvisory,
            aiAdvisoryPriority: camp.ndvi.reading.aiAdvisoryPriority,
          }
        : null,
    };
  });

  // NDVI overlay geometry: the same approximate bounding box the NDVI value
  // was actually computed over (see satellite.ts), so the colored area on
  // the map always matches the number in the panel -- never a separate,
  // disagreeing shape.
  const overlayLayers: OverlayLayer[] = report.camps
    .flatMap((camp) => {
      if (!camp.ndvi) return [];
      const coords = parseGpsCoordinates(camp.gpsCoordinates);
      if (!coords) return [];
      return [
        {
          campId: camp.id,
          geometry: buildBoundingBox(coords.lat, coords.lon, camp.hectares || 5),
          color: NDVI_COLOR[camp.ndvi.reading.interpretation] ?? "#6B6B6B",
        },
      ];
    });

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-navy-600 text-2xl font-semibold">{t("camps_map_title")}</h1>
          <p className="text-sm text-navy-300">{t("camps_map_subtitle")}</p>
        </div>
        <Link
          href="/app/camps/pasture-report/pdf"
          className="flex items-center gap-2 rounded-lg bg-navy-600 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700"
        >
          <Download size={16} />
          {t("download_pasture_report")}
        </Link>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-navy-50">
        <CampsMap camps={mapCamps} overlayLayers={overlayLayers} />
      </div>
    </div>
  );
}
