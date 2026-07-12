// Validated against src/app/globals.css's admin card surface (white) with
// the dataviz skill's validator — the app's own navy/green/gold brand hues
// failed the categorical lightness/chroma checks as chart mark fills, so
// marks use this validated set instead. Chart chrome (grid, axis, ink)
// stays on the app's existing navy scale, since that's already the
// established, accessible UI language here.
export const CHART_COLORS = {
  revenue: "#2a78d6", // blue — single-hue sequential for revenue-family bars/lines
  cost: "#eda100", // yellow — single-hue sequential for expense-family bars
  commission: "#1baf7a", // aqua
  marketing: "#eda100", // yellow
  expense: "#e34948", // red
  netProfit: "#2a78d6", // blue
} as const;

export const CHART_GRID = "#e4ebf5"; // navy-50
export const CHART_AXIS = "#9aabb9"; // navy-200
export const CHART_TICK_FONT_SIZE = 11;
