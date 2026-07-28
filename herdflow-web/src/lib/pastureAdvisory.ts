// WEBSITE — herdflow-web/src/lib/pastureAdvisory.ts
// Shared "generate the Claude AI Advisory for a camp's latest NDVI reading"
// logic -- used by both the mobile-facing route
// (api/app/camps/[id]/ndvi/advisory) and the web farm app's server action
// (app/(farmapp)/app/camps/actions.ts), so the prompt/context-gathering
// logic exists exactly once regardless of which client triggered it.
import type { Prisma } from "@prisma/client";
import { withFarmerContext } from "@/lib/tenant-prisma";
import { getCampLivestockSummary } from "@/lib/camps";
import { computeTrend } from "@/lib/ndvi";
import { callClaudeForJson } from "@/lib/anthropic";
import { getWeather } from "@/lib/weather";
import { parseGpsCoordinates } from "@/lib/geo";

const PASTURE_ADVISORY_CAMP_PROMPT = `You are a pasture/grazing advisor helping a South African livestock farmer decide what to do with ONE specific camp (paddock). You will be given, as JSON: the camp's name and size in hectares (if known), the current animal count and livestock type(s) in it (if any), a satellite-derived NDVI vegetation-health score from 1-10 (10 = excellent pasture, 1 = bare/very poor) with a trend of "improving" | "declining" | "stable" | "unknown" versus the previous satellite reading, and a short weather outlook (current conditions plus forecast rain over the next few days -- this is a FORECAST, not historical rainfall, since the weather data source used here has no look-back).

Only use the figures given -- never invent a number, livestock type, or detail that wasn't provided. If something is missing (no animals currently recorded in the camp, no weather available, trend "unknown"), give the best recommendation you can from what you do have and say so briefly.

Return ONLY a JSON object (no other text, no markdown code fences) with this exact shape:
{
  "recommendation": a short, specific, plain-English action in 1-2 sentences, no jargon -- e.g. "Good grazing -- suitable for cattle" or "Overgrazed -- move animals immediately" or "Pasture recovering -- allow about 2 more weeks before returning animals",
  "priority": one of "info" | "consider_soon" | "act_now"
}`;

export const AI_ADVISORY_DISCLAIMER = "AI Advisory — verify with your agronomist";

export interface CampAdvisoryResult {
  aiAdvisory: string;
  aiAdvisoryPriority: "info" | "consider_soon" | "act_now";
  aiAdvisoryAt: Date;
  disclaimer: string;
}

export async function generateCampAdvisory(camp: {
  id: string;
  farmerId: string;
  name: string;
  hectares: Prisma.Decimal | number | null;
  gpsCoordinates: string | null;
}): Promise<CampAdvisoryResult | { error: string }> {
  const { latest, previous } = await withFarmerContext(camp.farmerId, async (tx) => {
    const recent = await tx.farmerCampNdviReading.findMany({
      where: { campId: camp.id, farmerId: camp.farmerId, isDeleted: false },
      orderBy: { satellitePassDate: "desc" },
      take: 2,
    });
    return { latest: recent[0] ?? null, previous: recent[1] ?? null };
  });

  if (!latest) {
    return { error: "No NDVI reading yet for this camp -- fetch NDVI before requesting an advisory." };
  }

  const livestock = await withFarmerContext(camp.farmerId, (tx) =>
    getCampLivestockSummary(tx, camp.id, camp.farmerId),
  );

  const coords = parseGpsCoordinates(camp.gpsCoordinates);
  const weather = coords ? await getWeather(coords.lat, coords.lon).catch(() => null) : null;

  const promptInput = {
    campName: camp.name,
    hectares: camp.hectares != null ? Number(camp.hectares) : null,
    animalCount: livestock.totalCount,
    livestockType: livestock.primaryLivestockType,
    ndviScore10: latest.score10,
    trend: computeTrend(Number(latest.ndvi), previous ? Number(previous.ndvi) : null),
    weatherOutlook: weather
      ? {
          currentConditions: weather.current,
          forecastRainNext5Days: weather.daily.map((d) => ({ date: d.date, rainMm: d.rainMm })),
        }
      : null,
  };

  const { result, error } = await callClaudeForJson<{
    recommendation: string;
    priority: "info" | "consider_soon" | "act_now";
  }>(PASTURE_ADVISORY_CAMP_PROMPT, [{ type: "text", text: JSON.stringify(promptInput) }]);

  if (error || !result) {
    return { error: error ?? "AI advisory failed. Please try again." };
  }

  const updated = await withFarmerContext(camp.farmerId, (tx) =>
    tx.farmerCampNdviReading.update({
      where: { id: latest.id },
      data: {
        aiAdvisory: result.recommendation,
        aiAdvisoryPriority: result.priority,
        aiAdvisoryAt: new Date(),
      },
    }),
  );

  return {
    aiAdvisory: updated.aiAdvisory!,
    aiAdvisoryPriority: updated.aiAdvisoryPriority as "info" | "consider_soon" | "act_now",
    aiAdvisoryAt: updated.aiAdvisoryAt!,
    disclaimer: AI_ADVISORY_DISCLAIMER,
  };
}
