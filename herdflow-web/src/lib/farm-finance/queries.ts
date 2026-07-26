// herdflow-web/src/lib/farm-finance/queries.ts
// Shared data-access for the farm finance section -- used by the desktop
// dashboard pages and (later, F4) the PDF report generators, so the two
// never drift into computing "total income" two different ways.
import { withFarmerContext } from "@/lib/tenant-prisma";
import type { DateRange } from "./periods";

export interface FinanceTotals {
  income: number;
  expenses: number;
  netProfit: number;
  vatCollected: number; // VAT on income (output tax)
  vatPaid: number; // VAT on expenses (input tax)
  vatOwing: number; // vatCollected - vatPaid; negative means SARS owes the farmer
}

function toNumber(d: unknown): number {
  return d == null ? 0 : Number(d);
}

export async function getFinanceTotals(farmerId: string, range: DateRange): Promise<FinanceTotals> {
  const rows = await withFarmerContext(farmerId, (tx) =>
    tx.farmerTransaction.findMany({
      where: {
        farmerId,
        isDeleted: false,
        date: { gte: range.start, lte: range.end },
      },
      select: { type: true, amount: true, vatAmount: true },
    }),
  );

  let income = 0;
  let expenses = 0;
  let vatCollected = 0;
  let vatPaid = 0;

  for (const row of rows) {
    const amount = toNumber(row.amount);
    const vat = toNumber(row.vatAmount);
    if (row.type === "income") {
      income += amount;
      vatCollected += vat;
    } else {
      expenses += amount;
      vatPaid += vat;
    }
  }

  return {
    income,
    expenses,
    netProfit: income - expenses,
    vatCollected,
    vatPaid,
    vatOwing: vatCollected - vatPaid,
  };
}

/**
 * F3: suggests the next sequential invoice number for an income transaction,
 * based on the farmer's most recent invoice-numbered income row. Only
 * numeric-suffix patterns are recognised (e.g. "INV-0007" -> "INV-0008");
 * anything else (blank history, non-numeric formats) falls back to a fresh
 * "INV-0001" sequence rather than guessing. This is a suggestion the farmer
 * can always overwrite -- never silently substituted.
 */
export async function suggestNextInvoiceNumber(farmerId: string): Promise<string> {
  const rows = await withFarmerContext(farmerId, (tx) =>
    tx.farmerTransaction.findMany({
      where: { farmerId, isDeleted: false, type: "income", invoiceNumber: { not: null } },
      select: { invoiceNumber: true },
      orderBy: { date: "desc" },
      take: 25,
    }),
  );

  for (const row of rows) {
    const match = row.invoiceNumber?.match(/^(.*?)(\d+)$/);
    if (!match) continue;
    const [, prefix, digits] = match;
    const next = String(Number(digits) + 1).padStart(digits.length, "0");
    return `${prefix}${next}`;
  }

  return "INV-0001";
}

export interface CashFlowStatement {
  operating: number;
  investing: number;
  financing: number;
  netMovement: number;
}

// F4: categories that represent buying a durable asset (livestock or
// equipment) are classified as investing activity, matching standard
// bookkeeping practice, rather than lumped in with day-to-day operating
// expenses like feed or fuel.
const INVESTING_EXPENSE_CATEGORIES = new Set(["livestock_purchase", "equipment"]);

/**
 * F4: a farmer-facing Cash Flow Statement (Operating/Investing/Financing).
 * FarmerTransaction has no financing-activity categories yet (no loan/
 * equity/owner-drawing transactions are tracked anywhere in this app), so
 * financing always reads 0 here -- an honest gap, not a fabricated figure.
 */
export async function getCashFlowStatement(farmerId: string, range: DateRange): Promise<CashFlowStatement> {
  const rows = await withFarmerContext(farmerId, (tx) =>
    tx.farmerTransaction.findMany({
      where: { farmerId, isDeleted: false, date: { gte: range.start, lte: range.end } },
      select: { type: true, category: true, amount: true },
    }),
  );

  let operating = 0;
  let investing = 0;
  for (const row of rows) {
    const amount = toNumber(row.amount);
    const signed = row.type === "income" ? amount : -amount;
    if (row.type === "expense" && INVESTING_EXPENSE_CATEGORIES.has(row.category)) {
      investing += signed;
    } else {
      operating += signed;
    }
  }

  const financing = 0;
  return { operating, investing, financing, netMovement: operating + investing + financing };
}

export interface MonthlyCashFlow {
  monthLabel: string;
  income: number;
  expense: number;
}

/** Last `months` calendar months (oldest first), independent of the selected reporting period -- matches the mobile dashboard's "always last 6 months" cash flow chart. */
export async function getMonthlyCashFlow(farmerId: string, months = 6): Promise<MonthlyCashFlow[]> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const rows = await withFarmerContext(farmerId, (tx) =>
    tx.farmerTransaction.findMany({
      where: { farmerId, isDeleted: false, date: { gte: start } },
      select: { type: true, amount: true, date: true },
    }),
  );

  const buckets = Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      monthLabel: d.toLocaleDateString("en-ZA", { month: "short" }),
      income: 0,
      expense: 0,
    };
  });

  for (const row of rows) {
    const d = new Date(row.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = buckets.find((b) => b.key === key);
    if (!bucket) continue;
    if (row.type === "income") bucket.income += toNumber(row.amount);
    else bucket.expense += toNumber(row.amount);
  }

  return buckets.map(({ monthLabel, income, expense }) => ({ monthLabel, income, expense }));
}
