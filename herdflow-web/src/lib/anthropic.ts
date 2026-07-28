// WEBSITE — herdflow-web/src/lib/anthropic.ts
// Shared Claude Messages API caller -- extracted from
// api/app/vision/analyze/route.ts so the NDVI per-camp advisory prompt
// (added alongside this file) doesn't duplicate the fetch + markdown-fence-
// stripping + JSON-parse logic a second time.
import { env } from "@/lib/env";

export interface ClaudeJsonResult<T = unknown> {
  result?: T;
  error?: string;
}

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";

// `content` mirrors the Anthropic Messages API's per-message content-block
// array (text blocks, image blocks, etc.) -- callers build whatever blocks
// their prompt needs (an image+text pair for vision, a single text block for
// a data-only prompt like pasture advisory).
export async function callClaudeForJson<T = unknown>(
  systemPrompt: string,
  content: unknown[],
  options: { maxTokens?: number } = {},
): Promise<ClaudeJsonResult<T>> {
  if (!env.ANTHROPIC_API_KEY) {
    return { error: "AI analysis is not configured." };
  }

  try {
    const response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: options.maxTokens ?? 1024,
        system: systemPrompt,
        messages: [{ role: "user", content }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("Claude API error:", response.status, errText);
      return { error: "AI analysis failed. Please try again." };
    }

    const data = await response.json();
    const rawText = data?.content?.[0]?.text ?? "";
    // Prompts explicitly say "no markdown code fences", but Claude wraps its
    // JSON in ```json ... ``` fairly often regardless -- stripping
    // defensively is the standard, robust fix rather than relying on the
    // model to always comply.
    const text = rawText
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    try {
      return { result: JSON.parse(text) as T };
    } catch {
      console.error("Claude API returned non-JSON:", rawText);
      return { error: "Could not parse the AI analysis result." };
    }
  } catch (err) {
    console.error("Claude API call error:", err);
    return { error: "AI analysis failed. Please try again." };
  }
}
