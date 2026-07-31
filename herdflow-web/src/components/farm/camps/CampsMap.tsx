"use client";

// WEBSITE — herdflow-web/src/components/farm/camps/CampsMap.tsx
// CAMPS-MAP: live map of a farmer's camps for web/desktop (herdflow-desktop
// is just this app in an Electron shell -- see main.js -- so one
// implementation serves both), now with a Copernicus/Sentinel-2 NDVI
// vegetation-health overlay. Mirrors herdflow-app's CampsMapScreen: same
// status-color and NDVI-color conventions, same "click a marker for
// details" intent (here an in-page side panel instead of navigating to a
// separate screen), plus a worst-first ranking panel the mobile map doesn't
// have room for.
import { useEffect, useRef, useState, useTransition } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { X, LocateFixed, RefreshCw, Sparkles, ListOrdered, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card } from "../Card";
import { refreshCampNdviAction, generateCampAdvisoryAction } from "@/app/(farmapp)/app/camps/actions";

// MAP PROVIDER — Consider switching to
// MapLibre GL JS + OpenStreetMap before
// go-live to eliminate per-load costs.
// Current provider: Mapbox GL JS
// Mapbox free tier: ~50,000 loads/month
// See mapbox.com/pricing before launch.
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// Mirrors herdflow-app/src/constants/campOptions.ts CAMP_STATUS_COLOR (which
// pulls from theme/colors.ts) exactly, so the web map and mobile map never
// disagree on what a status color means.
const STATUS_COLOR: Record<string, string> = {
  GRAZING: "#2E7D32",
  RESTING: "#00695C",
  OVERGRAZED: "#C62828",
  LOCKED: "#546E7A",
  DROUGHT_RESERVE: "#F57F17",
};

// Mirrors herdflow-app/src/constants/ndviOptions.ts NDVI_COLOR exactly.
const NDVI_COLOR: Record<string, string> = {
  poor: "#C62828",
  fair: "#F57F17",
  good: "#9ACD32",
  excellent: "#2E7D32",
};

export interface MapCampNdvi {
  score10: number;
  interpretation: "poor" | "fair" | "good" | "excellent";
  trend: "improving" | "declining" | "stable" | "unknown";
  satellitePassDate: string;
  aiAdvisory: string | null;
  aiAdvisoryPriority: string | null;
}

export interface MapCamp {
  id: string;
  name: string;
  currentStatus: string;
  currentHeadCount: number;
  hectares: number | null;
  notes: string | null;
  lat: number | null;
  lon: number | null;
  ndvi: MapCampNdvi | null;
}

// NDVI overlay: one tinted polygon per camp with a reading (satellite.ts's
// buildBoundingBox -- the same approximate area the NDVI value was actually
// computed over -- drops straight into `geometry`).
export interface OverlayLayer {
  campId: string;
  geometry: GeoJSON.Geometry;
  color: string;
  opacity?: number;
}

const DEFAULT_CENTER: [number, number] = [24, -29]; // South Africa
const SOURCE_PREFIX = "camp-overlay-";

function TrendIcon({ trend }: { trend: MapCampNdvi["trend"] }) {
  if (trend === "improving") return <TrendingUp size={13} />;
  if (trend === "declining") return <TrendingDown size={13} />;
  if (trend === "stable") return <Minus size={13} />;
  return null;
}

export function CampsMap({
  camps: initialCamps,
  overlayLayers = [],
}: {
  camps: MapCamp[];
  overlayLayers?: OverlayLayer[];
}) {
  const t = useTranslations("camps");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [camps, setCamps] = useState(initialCamps);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [rankingOpen, setRankingOpen] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"refresh" | "advisory" | null>(null);

  const selected = camps.find((c) => c.id === selectedId) ?? null;
  const located = camps.filter(
    (c): c is MapCamp & { lat: number; lon: number } => c.lat != null && c.lon != null,
  );
  // Already sorted worst-first by buildPastureReport server-side, but
  // sorted defensively here too so the panel is correct regardless of prop
  // order after a client-side update.
  const ranked = [...camps].sort((a, b) => (a.ndvi?.score10 ?? 99) - (b.ndvi?.score10 ?? 99));

  function updateCamp(id: string, patch: Partial<MapCampNdvi>) {
    setCamps((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ndvi: c.ndvi ? { ...c.ndvi, ...patch } : c.ndvi } : c)),
    );
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: DEFAULT_CENTER,
      zoom: 4,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.on("load", () => setMapReady(true));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // (Re)draw camp markers whenever the camp list changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    located.forEach((camp) => {
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", camp.name);
      el.style.cssText = `
        width: 30px; height: 30px; border-radius: 50%;
        border: 2px solid white; cursor: pointer; padding: 0;
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 12px; font-weight: 800;
        background: ${STATUS_COLOR[camp.currentStatus] || "#6B6B6B"};
        box-shadow: 0 1px 4px rgba(0,0,0,0.35);
      `;
      el.textContent = String(camp.currentHeadCount);
      el.onclick = () => setSelectedId(camp.id);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([camp.lon, camp.lat])
        .addTo(map);
      markersRef.current.push(marker);
    });

    if (located.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      located.forEach((c) => bounds.extend([c.lon, c.lat]));
      map.fitBounds(bounds, { padding: 80, maxZoom: 14, duration: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [located.map((c) => `${c.id}:${c.currentHeadCount}:${c.currentStatus}`).join(","), mapReady]);

  // NDVI overlay -- draws each layer as a tinted fill under the markers,
  // keyed by campId so re-renders replace rather than accumulate
  // sources/layers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    overlayLayers.forEach((layer) => {
      const id = `${SOURCE_PREFIX}${layer.campId}`;
      const geojson: GeoJSON.Feature = { type: "Feature", properties: {}, geometry: layer.geometry };

      if (map.getSource(id)) {
        (map.getSource(id) as mapboxgl.GeoJSONSource).setData(geojson);
      } else {
        map.addSource(id, { type: "geojson", data: geojson });
        map.addLayer({
          id: `${id}-fill`,
          type: "fill",
          source: id,
          paint: { "fill-color": layer.color, "fill-opacity": layer.opacity ?? 0.35 },
        });
      }
    });

    return () => {
      overlayLayers.forEach((layer) => {
        const id = `${SOURCE_PREFIX}${layer.campId}`;
        if (map.getLayer(`${id}-fill`)) map.removeLayer(`${id}-fill`);
        if (map.getSource(id)) map.removeSource(id);
      });
    };
  }, [overlayLayers, mapReady]);

  // Blue "you are here" dot via the browser Geolocation API, watched
  // continuously (not just on Locate Me) so it stays current while the
  // page is open -- same intent as react-native-maps' showsUserLocation.
  useEffect(() => {
    if (!mapReady || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const map = mapRef.current;
        if (!map) return;
        const lngLat: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        if (!userMarkerRef.current) {
          const el = document.createElement("div");
          el.style.cssText = `
            width: 16px; height: 16px; border-radius: 50%;
            background: #1a73e8; border: 3px solid white;
            box-shadow: 0 0 0 2px rgba(26,115,232,0.4);
          `;
          userMarkerRef.current = new mapboxgl.Marker({ element: el }).setLngLat(lngLat).addTo(map);
        } else {
          userMarkerRef.current.setLngLat(lngLat);
        }
      },
      () => {
        /* permission denied or unavailable — no blue dot, not fatal */
      },
      { enableHighAccuracy: false },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
    };
  }, [mapReady]);

  function locateMe() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 13 });
        setLocating(false);
      },
      () => setLocating(false),
    );
  }

  function selectAndFly(camp: MapCamp) {
    setSelectedId(camp.id);
    if (camp.lat != null && camp.lon != null) {
      mapRef.current?.flyTo({ center: [camp.lon, camp.lat], zoom: 13 });
    }
  }

  function refreshNdvi(campId: string) {
    setPendingAction("refresh");
    startTransition(async () => {
      const { snapshot } = await refreshCampNdviAction(campId);
      if (snapshot) {
        updateCamp(campId, {
          score10: snapshot.reading.score10,
          interpretation: snapshot.reading.interpretation,
          trend: snapshot.trend,
          satellitePassDate: snapshot.reading.satellitePassDate as unknown as string,
          aiAdvisory: snapshot.reading.aiAdvisory,
          aiAdvisoryPriority: snapshot.reading.aiAdvisoryPriority,
        });
      }
      setPendingAction(null);
    });
  }

  function requestAdvisory(campId: string) {
    setPendingAction("advisory");
    startTransition(async () => {
      const result = await generateCampAdvisoryAction(campId);
      if (!("error" in result)) {
        updateCamp(campId, { aiAdvisory: result.aiAdvisory, aiAdvisoryPriority: result.aiAdvisoryPriority });
      }
      setPendingAction(null);
    });
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {located.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 p-6 text-center">
          <p className="max-w-sm text-sm text-navy-300">{t("no_gps_camps_message")}</p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setRankingOpen((v) => !v)}
        className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-navy-600 shadow-lg hover:bg-navy-25"
      >
        <ListOrdered size={16} />
        {t("ranking_panel_toggle")}
      </button>

      <button
        type="button"
        onClick={locateMe}
        disabled={locating}
        className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-lg bg-navy-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-navy-700 disabled:opacity-60"
      >
        <LocateFixed size={16} />
        {t("locate_me")}
      </button>

      {rankingOpen && (
        <div className="absolute inset-y-0 left-0 z-20 w-full max-w-xs overflow-y-auto border-r border-navy-50 bg-white shadow-xl">
          <Card className="h-full rounded-none border-0 shadow-none">
            <div className="border-b border-navy-50 p-4">
              <h3 className="text-navy-600 text-sm font-bold">{t("ranking_panel_title")}</h3>
              <p className="text-xs text-navy-300">{t("ranking_panel_subtitle")}</p>
            </div>
            {ranked.length === 0 ? (
              <p className="p-4 text-sm text-navy-300">{t("no_ndvi_camps_message")}</p>
            ) : (
              <div className="divide-y divide-navy-50">
                {ranked.map((camp) => (
                  <button
                    key={camp.id}
                    type="button"
                    onClick={() => selectAndFly(camp)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-navy-25 ${
                      selectedId === camp.id ? "bg-navy-25" : ""
                    }`}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{
                        backgroundColor: camp.ndvi ? NDVI_COLOR[camp.ndvi.interpretation] : "#9CA3AF",
                      }}
                    >
                      {camp.ndvi ? camp.ndvi.score10 : "—"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy-600">{camp.name}</p>
                      <p className="text-xs text-navy-300">
                        {camp.ndvi ? t(`ndvi_${camp.ndvi.interpretation}`) : t("no_satellite_data_yet")}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {selected && (
        <div className="absolute inset-y-0 right-0 z-20 w-full max-w-sm overflow-y-auto border-l border-navy-50 bg-white shadow-xl sm:w-96">
          <Card className="h-full rounded-none border-0 shadow-none">
            <div className="flex items-start justify-between gap-3 border-b border-navy-50 p-4">
              <div>
                <h3 className="text-navy-600 text-lg font-semibold">{selected.name}</h3>
                <span
                  className="mt-1 inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: STATUS_COLOR[selected.currentStatus] || "#6B6B6B" }}
                >
                  {t(`status_${selected.currentStatus.toLowerCase()}`)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label={t("close_panel")}
                className="rounded-lg p-1.5 text-navy-300 hover:bg-navy-25"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">
                  {t("animals_label")}
                </p>
                <p className="mt-1 text-2xl font-semibold text-navy-600">{selected.currentHeadCount}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">
                  {t("hectares_label")}
                </p>
                <p className="mt-1 text-2xl font-semibold text-navy-600">{selected.hectares ?? "—"}</p>
              </div>
            </div>

            <div className="border-t border-navy-50 p-4">
              {!selected.ndvi ? (
                <p className="text-sm text-navy-300">{t("no_satellite_data_yet")}</p>
              ) : (
                <>
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: NDVI_COLOR[selected.ndvi.interpretation] }}
                    >
                      <span className="text-lg font-extrabold leading-none">{selected.ndvi.score10}</span>
                      <span className="text-[10px] font-bold opacity-85">/10</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">
                        {t("ndvi_score_label")}
                      </p>
                      <p className="text-navy-600 text-base font-bold">
                        {t(`ndvi_${selected.ndvi.interpretation}`)}
                      </p>
                      {selected.ndvi.trend !== "unknown" && (
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-navy-300">
                          <TrendIcon trend={selected.ndvi.trend} />
                          {t(`trend_${selected.ndvi.trend}`)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-3 rounded-lg bg-navy-25 p-3">
                    <p className="text-sm text-navy-600">
                      {selected.ndvi.aiAdvisory || t(`ndvi_fallback_${selected.ndvi.interpretation}`)}
                    </p>
                    {selected.ndvi.aiAdvisory && (
                      <p
                        className="mt-1.5 text-[10px] font-bold uppercase tracking-wide"
                        style={{ color: "#7B1FA2" }}
                      >
                        {t("ai_advisory_label")}
                      </p>
                    )}
                  </div>

                  <p className="mb-3 text-xs text-navy-300">
                    {t("last_satellite_pass", {
                      date: new Date(selected.ndvi.satellitePassDate).toLocaleDateString("en-ZA"),
                    })}
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => refreshNdvi(selected.id)}
                      disabled={isPending}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-navy-100 px-3 py-2 text-xs font-semibold text-navy-600 hover:bg-navy-25 disabled:opacity-60"
                    >
                      <RefreshCw size={14} className={pendingAction === "refresh" ? "animate-spin" : ""} />
                      {t("refresh_satellite_data")}
                    </button>
                    <button
                      type="button"
                      onClick={() => requestAdvisory(selected.id)}
                      disabled={isPending}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-navy-100 px-3 py-2 text-xs font-semibold text-navy-600 hover:bg-navy-25 disabled:opacity-60"
                    >
                      <Sparkles size={14} />
                      {pendingAction === "advisory" ? t("generating_advisory") : t("get_ai_advisory_button")}
                    </button>
                  </div>
                </>
              )}
            </div>

            {selected.notes && (
              <div className="px-4 pb-2">
                <p className="text-sm text-navy-500">{selected.notes}</p>
              </div>
            )}
            <div className="px-4 pb-4">
              <p className="text-xs text-navy-300">{t("view_full_detail_on_app")}</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
