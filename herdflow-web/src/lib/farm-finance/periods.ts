// herdflow-web/src/lib/farm-finance/periods.ts
// Calendar-aligned reporting periods for the farm finance dashboard --
// deliberately NOT the mobile app's old rolling windows (today-7d,
// today-1mo, etc.), which don't line up with how a bookkeeper actually
// thinks about "this month" or "this financial year". South Africa's tax
// year runs 1 March to end of February, not January-December.
export type Period = "this_month" | "last_month" | "this_quarter" | "this_financial_year" | "custom";

export const PERIOD_LABELS: Record<Exclude<Period, "custom">, string> = {
  this_month: "This Month",
  last_month: "Last Month",
  this_quarter: "This Quarter",
  this_financial_year: "This Financial Year",
};

export interface DateRange {
  start: Date;
  end: Date;
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

/** 1 March of the financial year containing `d` -- e.g. 15 Feb 2026 belongs to the FY that started 1 Mar 2025. */
function financialYearStart(d: Date): Date {
  const year = d.getMonth() >= 2 /* March */ ? d.getFullYear() : d.getFullYear() - 1;
  return new Date(year, 2, 1);
}

export function periodRange(period: Exclude<Period, "custom">, now = new Date()): DateRange {
  switch (period) {
    case "this_month": {
      return {
        start: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
        end: endOfDay(now),
      };
    }
    case "last_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: startOfDay(start), end: endOfDay(end) };
    }
    case "this_quarter": {
      const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
      return {
        start: startOfDay(new Date(now.getFullYear(), qStartMonth, 1)),
        end: endOfDay(now),
      };
    }
    case "this_financial_year": {
      return { start: startOfDay(financialYearStart(now)), end: endOfDay(now) };
    }
  }
}

/** The immediately preceding period of the same span, for trend comparisons. */
export function previousPeriodRange(period: Exclude<Period, "custom">, now = new Date()): DateRange {
  if (period === "this_month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start: startOfDay(start), end: endOfDay(end) };
  }
  if (period === "last_month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - 1, 0);
    return { start: startOfDay(start), end: endOfDay(end) };
  }
  if (period === "this_quarter") {
    const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
    const start = new Date(now.getFullYear(), qStartMonth - 3, 1);
    const end = new Date(now.getFullYear(), qStartMonth, 0);
    return { start: startOfDay(start), end: endOfDay(end) };
  }
  // this_financial_year
  const thisFyStart = financialYearStart(now);
  const prevFyStart = new Date(thisFyStart.getFullYear() - 1, 2, 1);
  const prevFyEnd = new Date(thisFyStart.getTime() - 24 * 60 * 60 * 1000);
  return { start: startOfDay(prevFyStart), end: endOfDay(prevFyEnd) };
}

/** Resolves a Next.js searchParams object (?period=&from=&to=) into a current + comparable previous range. */
export function resolvePeriod(searchParams: {
  period?: string;
  from?: string;
  to?: string;
}): { period: Period; range: DateRange; previousRange: DateRange } {
  const period = (searchParams.period as Period) || "this_month";

  if (period === "custom" && searchParams.from && searchParams.to) {
    const start = startOfDay(new Date(searchParams.from));
    const end = endOfDay(new Date(searchParams.to));
    const spanMs = end.getTime() - start.getTime();
    const previousRange: DateRange = {
      start: new Date(start.getTime() - spanMs - 24 * 60 * 60 * 1000),
      end: new Date(start.getTime() - 24 * 60 * 60 * 1000),
    };
    return { period, range: { start, end }, previousRange };
  }

  const resolved: Exclude<Period, "custom"> =
    period === "custom" ? "this_month" : (period as Exclude<Period, "custom">);
  return {
    period: resolved,
    range: periodRange(resolved),
    previousRange: previousPeriodRange(resolved),
  };
}

export function trendLabel(current: number, previous: number): { text: string; isUp: boolean } {
  if (previous <= 0) {
    return current > 0 ? { text: "▲ New", isUp: true } : { text: "— 0%", isUp: false };
  }
  const change = ((current - previous) / previous) * 100;
  return { text: `${change >= 0 ? "▲" : "▼"} ${Math.abs(change).toFixed(0)}%`, isUp: change >= 0 };
}
