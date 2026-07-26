// herdflow-web/src/components/farm/charts/theme.ts
// Validated with the dataviz skill's CVD/contrast checker
// (node scripts/validate_palette.js "#1baf7a,#e34948" --mode light):
// the app's own pure green/red brand hues (#2E7D32 / #C62828) fail deutan
// CVD separation outright (ΔE 4.2, below the 6-8 floor). This aqua-green /
// red pair passes (ΔE 6.9, in the floor band -- legal WITH secondary
// encoding), and matches the same validated set already in production use
// for the admin dashboard's income/expense charts (components/admin/charts/
// theme.ts) for cross-dashboard consistency. Because it's in the WARN-band,
// every chart using these MUST also carry a visible legend + direct labels
// + tooltip values -- color is never the only encoding.
export const CHART_COLORS = {
  income: "#1baf7a",
  expense: "#e34948",
} as const;

export const CHART_GRID = "#e4ebf5"; // navy-50
export const CHART_AXIS = "#9aabb9"; // navy-200
export const CHART_TICK_FONT_SIZE = 11;
