// WEBSITE — herdflow-web/src/lib/geo.ts
// Single parser for FarmerCamp.gpsCoordinates -- a free-text "lat, lon"
// string (set by the mobile app's LocationField.tsx via toFixed(6)), not a
// structured lat/lng column or PostGIS geometry. Previously duplicated
// inline in reminders.ts; the CAMPS-MAP page needs the same parsing so it
// lives here once. Mirrors herdflow-app/src/utils/geo.ts.

export interface Coordinates {
  lat: number;
  lon: number;
}

export function parseGpsCoordinates(value: string | null | undefined): Coordinates | null {
  if (!value) return null;
  const parts = String(value)
    .split(",")
    .map((s) => parseFloat(s.trim()));
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return null;
  const [lat, lon] = parts;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}
