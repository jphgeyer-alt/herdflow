// herdflow-web/src/i18n/request.test.ts
// G2: unit-tests the Accept-Language parsing this module uses to
// auto-detect a farmer's browser language on first visit -- easy to get
// subtly wrong (q-value ordering, region-vs-language-only matches).
import { describe, it, expect } from "vitest";
import { resolveFromAcceptLanguage, SUPPORTED_LOCALES, DEFAULT_LOCALE } from "./request";

describe("resolveFromAcceptLanguage", () => {
  it("matches an exact supported locale tag", () => {
    expect(resolveFromAcceptLanguage("en-ZA,en;q=0.9")).toBe("en-ZA");
  });

  it("matches case-insensitively", () => {
    expect(resolveFromAcceptLanguage("EN-za,en;q=0.9")).toBe("en-ZA");
  });

  it("falls back to a bare-language match when only a region-specific tag is supported", () => {
    // "en" alone isn't in SUPPORTED_LOCALES, but "en-ZA" shares its language
    expect(resolveFromAcceptLanguage("en;q=0.9")).toBe("en-ZA");
  });

  it("returns undefined for a language HerdFlow doesn't support yet", () => {
    expect(resolveFromAcceptLanguage("fr-FR,fr;q=0.9,de;q=0.8")).toBeUndefined();
  });

  it("returns undefined for a missing header", () => {
    expect(resolveFromAcceptLanguage(null)).toBeUndefined();
  });

  it("picks the first supported match honouring the header's priority order", () => {
    expect(resolveFromAcceptLanguage("de-DE,en-ZA;q=0.5")).toBe("en-ZA");
  });
});

describe("locale constants", () => {
  it("only exposes en-ZA for now (G11 adds af/sw/fr/pt as placeholders later)", () => {
    expect(SUPPORTED_LOCALES).toEqual(["en-ZA"]);
    expect(DEFAULT_LOCALE).toBe("en-ZA");
  });
});
