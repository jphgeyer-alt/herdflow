// herdflow-web/src/lib/farm-finance/format.ts
// G5: Currencies whose ISO code Intl.NumberFormat would otherwise render as
// a bare code prefix ("KES 1,234.56") under a generic locale -- mapped to a
// real-country locale so the native symbol renders instead ("KSh 1,234.56").
// Add an entry here whenever a new country's currency is onboarded (G7-G10).
const CURRENCY_LOCALES: Record<string, string> = {
  KES: "en-KE",
  NGN: "en-NG",
};

// G5: shared currency formatter (kept byte-for-byte identical to the mobile
// app's formatCurrency in herdflow-app/src/utils/formatters.ts so a figure
// looks the same whether the farmer is on their phone or the website).
// ZAR is special-cased to South Africa's bookkeeping convention -- "R 1
// 234.56", a space thousands separator and a period decimal point --
// instead of real Intl.NumberFormat("en-ZA") output, which uses a COMMA
// decimal point ("R 1 234,56") and would read as wrong to a farmer or
// bookkeeper already used to the convention above. Every other currency
// (for farmers in countries G7-G10 onboard) goes through real
// Intl.NumberFormat so it follows that currency's actual conventions.
export function formatCurrency(amount: number | string | null | undefined, currency = "ZAR"): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (n == null || Number.isNaN(n)) return "-";

  if (currency === "ZAR") {
    const isNegative = n < 0;
    const [intPart, decPart] = Math.abs(n).toFixed(2).split(".");
    const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${isNegative ? "-" : ""}R ${withThousands}.${decPart}`;
  }

  return new Intl.NumberFormat(CURRENCY_LOCALES[currency] ?? "en", {
    style: "currency",
    currency,
  }).format(n);
}

// G6: South African date convention: "23 Jul 2026" -- verified to produce
// byte-identical output to the mobile app's date-fns-based formatDate
// (herdflow-app/src/utils/formatters.ts, pattern "dd MMM yyyy") for the
// same input, so no reconciliation was needed the way formatCurrency's
// comma-vs-period decimal point required above.
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

// G6: shared weight formatter, kept identical to the mobile app's
// formatWeight (herdflow-app/src/utils/formatters.ts) for platform parity --
// no web farm-app page displays animal weight yet, but this exists so one
// is ready when it does, rather than a page inventing its own "${kg} kg".
export function formatWeight(kg: number | null | undefined): string {
  if (kg == null || kg === 0) return "-";
  return `${kg} kg`;
}
