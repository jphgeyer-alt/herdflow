// WEBSITE — herdflow-web/src/app/api/app/vision/analyze/route.ts
// Shared vision-analysis endpoint for two mobile features: the receipt
// scanner (Finance) and the sick-animal photo triage tool (Health). One
// route, one API key held server-side only, different prompt per caller.
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const RECEIPT_PROMPT = `You are extracting structured data from a photo of a farm-expense receipt or invoice for a South African livestock farmer. Look at the image and return ONLY a JSON object (no other text, no markdown code fences) with these exact keys:
{
  "supplier": string or null,
  "invoiceNumber": string or null,
  "amount": number or null (the total amount paid, in Rand, as a plain number with no currency symbols),
  "vatAmount": number or null (VAT/tax portion if shown separately, otherwise null),
  "date": string or null (ISO 8601 date, YYYY-MM-DD, if a date is visible on the receipt),
  "description": string or null (a short one-line description of what was purchased),
  "suggestedCategory": one of "livestock_purchase","feed","veterinary","medication","breeding","equipment","fuel","labour","transport","maintenance","insurance","levy","other" — pick the closest match, default to "other" if unclear
}
If the image is not a receipt/invoice or is unreadable, return {"error": "not_a_receipt"} instead.`;

// Framing is deliberate, not a formality: this must never present a single
// confident answer. Livestock-health AI has real, unresolved liability and
// "black box" accuracy concerns per veterinary literature — the response
// shape and copy below exist specifically to keep this a discussion aid,
// not something a farmer could mistake for a vet's diagnosis.
const ANIMAL_TRIAGE_PROMPT = `You are a cautious farm-health triage assistant helping a South African livestock farmer think through what might be wrong with a sick or injured animal shown in a photo. You are NOT a veterinarian and this is NOT a diagnosis — never present a single confident answer.

Look at the image (and any symptom description provided) and return ONLY a JSON object (no other text, no markdown code fences) with these exact keys:
{
  "possibleConditions": an array of 1-4 objects, each { "name": string, "reasoning": a short plain-language explanation of what in the photo/description suggests this }, ordered roughly by how well the visible signs match — never just one item presented as certain,
  "generalFirstSteps": an array of 1-4 short, safe, general first-step suggestions (e.g. "isolate the animal from the herd", "ensure access to clean water") — never a specific drug, dosage, or medical procedure,
  "urgency": one of "routine" | "monitor_closely" | "seek_vet_soon" | "seek_vet_immediately" — err toward higher urgency if there is any sign of severe distress, bleeding, inability to stand, or difficulty breathing,
  "disclaimer": always exactly this string: "This is not a diagnosis. Please consult a veterinarian to confirm any suspected condition and before starting treatment."
}
If the image doesn't show a clear enough view of an animal to say anything useful, return {"error": "unclear_image"} instead.`;

// No image involved -- takes HerdFlow's own structured camp/weather data
// (never invents figures it wasn't given) and returns a plain-language
// grazing recommendation. Not a life-safety domain like the triage prompt
// above, so the framing can be directly useful rather than deliberately
// hedged -- but it still must stay grounded in only the data provided.
const PASTURE_ADVISORY_PROMPT = `You are a pasture/grazing advisor helping a South African livestock farmer decide how to rotate their camps (paddocks). You will be given, as JSON, a list of the farmer's camps (each with a name, current status, how many days into its rest period it is versus how many days rest it needs, and its carrying capacity as a percentage) and current weather conditions (temperature, humidity, and a short rainfall/precipitation-chance forecast).

Only use the figures given to you -- never invent a rainfall amount, temperature, or camp detail that wasn't provided. If weather data is missing, base your recommendation on camp data alone and say so.

Return ONLY a JSON object (no other text, no markdown code fences) with this exact shape:
{
  "recommendations": an array with one object per camp given, each { "campName": string (must match a name you were given), "recommendation": a short 1-2 sentence plain-language recommendation, "priority": one of "info" | "consider_soon" | "act_now" },
  "summary": a short 1-2 sentence overall summary across all camps
}`;

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  if (!env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Vision analysis is not configured." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const promptType = b.promptType as string;
  const imageBase64 = b.imageBase64 as string;
  const mediaType = (b.mediaType as string) || "image/jpeg";
  const context = typeof b.context === "string" ? b.context.trim() : "";

  if (!["receipt", "animal_triage", "pasture_advisory"].includes(promptType)) {
    return NextResponse.json(
      { error: "promptType must be 'receipt', 'animal_triage', or 'pasture_advisory'" },
      { status: 400 },
    );
  }
  if (promptType !== "pasture_advisory" && !imageBase64) {
    return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
  }
  if (promptType === "pasture_advisory" && !b.campData) {
    return NextResponse.json({ error: "campData is required" }, { status: 400 });
  }

  const systemPrompt =
    promptType === "receipt"
      ? RECEIPT_PROMPT
      : promptType === "animal_triage"
        ? ANIMAL_TRIAGE_PROMPT
        : PASTURE_ADVISORY_PROMPT;

  const content =
    promptType === "pasture_advisory"
      ? [{ type: "text", text: JSON.stringify({ camps: b.campData, weather: b.weatherData ?? null }) }]
      : [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
          {
            type: "text",
            text: context
              ? `Additional context from the farmer: ${context}`
              : promptType === "receipt"
                ? "Extract the receipt data."
                : "What might be going on with this animal?",
          },
        ];

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("Vision API error:", response.status, errText);
      return NextResponse.json({ error: "Vision analysis failed. Please try again." }, { status: 502 });
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("Vision API returned non-JSON:", text);
      return NextResponse.json({ error: "Could not parse the vision analysis result." }, { status: 502 });
    }

    return NextResponse.json({ result: parsed });
  } catch (err) {
    console.error("Vision analyze error:", err);
    return NextResponse.json({ error: "Vision analysis failed. Please try again." }, { status: 500 });
  }
}
