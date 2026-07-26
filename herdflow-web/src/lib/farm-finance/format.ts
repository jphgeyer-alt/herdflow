// herdflow-web/src/lib/farm-finance/format.ts
// South African bookkeeping convention: "R 1 234.56" -- a space as the
// thousands separator, a period as the decimal point, always 2 decimals.
// Deliberately NOT delegated to Intl.NumberFormat("en-ZA", {style:"currency"})
// -- the real en-ZA ICU locale formats with a COMMA decimal point
// ("R 1 234,56"), which reads as wrong to a farmer or bookkeeper expecting
// the convention above. Kept byte-for-byte identical to the mobile app's
// formatCurrency (herdflow-app/src/utils/formatters.ts) so a figure looks
// the same whether the farmer is looking at their phone or the website.
export function formatCurrency(amount: number | string | null | undefined, currency = "R"): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (n == null || Number.isNaN(n)) return "-";
  const isNegative = n < 0;
  const [intPart, decPart] = Math.abs(n).toFixed(2).split(".");
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${isNegative ? "-" : ""}${currency} ${withThousands}.${decPart}`;
}

// South African date convention: "23 Jul 2026".
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "-";
  return `${formatDate(d)}, ${d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
}
