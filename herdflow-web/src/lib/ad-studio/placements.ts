export type PlacementKey =
  | "HOMEPAGE"
  | "SHOP"
  | "LISTINGS"
  | "APP_HOME_BANNER"
  | "APP_ANNOUNCEMENT"
  | "WEB_HOMEPAGE"
  | "WEB_MARKETPLACE"
  | "EMAIL_HEADER"
  | "PUSH_NOTIFICATION";

export const PLACEMENTS: { value: PlacementKey; label: string; width: number; height: number }[] = [
  { value: "HOMEPAGE", label: "Website — Below Hero Strip", width: 1200, height: 300 },
  { value: "SHOP", label: "Website — Shop Page Strip", width: 1200, height: 300 },
  { value: "LISTINGS", label: "Website — Marketplace Listings Strip", width: 1200, height: 300 },
  { value: "WEB_HOMEPAGE", label: "Website — Homepage Hero Banner", width: 1600, height: 500 },
  { value: "WEB_MARKETPLACE", label: "Website — Marketplace Hero Banner", width: 1600, height: 500 },
  { value: "APP_HOME_BANNER", label: "Mobile App — Home Banner Card", width: 1080, height: 608 },
  { value: "APP_ANNOUNCEMENT", label: "Mobile App — Announcement Card", width: 1080, height: 1080 },
  { value: "EMAIL_HEADER", label: "Email — Header Banner", width: 600, height: 200 },
  { value: "PUSH_NOTIFICATION", label: "Push Notification — Rich Image", width: 480, height: 240 },
];

export function getPlacement(value: string) {
  return PLACEMENTS.find((p) => p.value === value) ?? PLACEMENTS[0];
}

export const TEMPLATES: { value: string; label: string }[] = [
  { value: "banner-classic", label: "Classic — logo + headline + CTA" },
  { value: "banner-photo", label: "Photo — full-bleed image with overlay" },
  { value: "banner-product", label: "Product — image card with CTA button" },
  { value: "banner-minimal", label: "Minimal — bold headline only" },
];
