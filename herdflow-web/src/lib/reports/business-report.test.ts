import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockListingFindMany,
  mockInvoiceFindMany,
  mockExpenseFindMany,
  mockProductFindMany,
  mockPaymentFindMany,
  mockOrderFindMany,
  mockOrderItemGroupBy,
  mockGetCommissionRate,
  mockGetVatConfig,
} = vi.hoisted(() => ({
  mockListingFindMany: vi.fn(),
  mockInvoiceFindMany: vi.fn(),
  mockExpenseFindMany: vi.fn(),
  mockProductFindMany: vi.fn(),
  mockPaymentFindMany: vi.fn(),
  mockOrderFindMany: vi.fn(),
  mockOrderItemGroupBy: vi.fn(),
  mockGetCommissionRate: vi.fn(),
  mockGetVatConfig: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    listing: { findMany: mockListingFindMany },
    invoice: { findMany: mockInvoiceFindMany },
    product: { findMany: mockProductFindMany },
    payment: { findMany: mockPaymentFindMany },
  },
}));

vi.mock("@/lib/tenant-prisma", () => ({
  withAdminContext: (fn: (tx: unknown) => unknown) =>
    fn({
      order: { findMany: mockOrderFindMany },
      orderItem: { groupBy: mockOrderItemGroupBy },
      expense: { findMany: mockExpenseFindMany },
    }),
}));

vi.mock("@/lib/marketplace/commission", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/marketplace/commission")>();
  return {
    ...actual,
    getCommissionRate: mockGetCommissionRate,
    getVatConfig: mockGetVatConfig,
  };
});

import { getBusinessReportData, monthKey } from "./business-report";

describe("getBusinessReportData", () => {
  const now = new Date();
  const currentMonth = monthKey(now);

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCommissionRate.mockResolvedValue(0.05);
    mockGetVatConfig.mockResolvedValue({ enabled: false, rateBps: 1500 });
    mockPaymentFindMany.mockResolvedValue([]);
    mockOrderFindMany.mockResolvedValue([
      { totalCents: 10000, createdAt: now },
      { totalCents: 20000, createdAt: now },
    ]);
    mockOrderItemGroupBy.mockResolvedValue([
      { productId: "p1", _sum: { lineTotalCents: 30000 } },
    ]);
    mockProductFindMany.mockResolvedValue([
      { id: "p1", sellerId: "s1", seller: { farmName: "Seller One" } },
    ]);
    mockListingFindMany.mockResolvedValue([
      { id: "l1", priceCents: 100000, seller: { farmName: "Test Farm" } },
    ]);
    mockInvoiceFindMany.mockResolvedValue([{ amount: 5000, paidAt: now }]);
    mockExpenseFindMany.mockResolvedValue([
      { category: "Hosting", amountCents: 2000, date: now },
    ]);
  });

  it("computes commission, revenue, and net profit correctly", async () => {
    const data = await getBusinessReportData();

    expect(data.totalRevenueCents).toBe(30000);
    expect(data.productCommissionCents).toBe(1500); // 30000 * 0.05
    expect(data.livestockCommissionCents).toBe(5000); // 100000 * 0.05
    expect(data.totalCommissionCents).toBe(6500);
    // Invoice.amount is Decimal Rand (R5000), converted to cents.
    expect(data.marketingRevenueCents).toBe(500000);
    expect(data.expensesCents).toBe(2000);
    // netProfitCents = commission + marketing - expenses
    expect(data.netProfitCents).toBe(6500 + 500000 - 2000);
    expect(data.livestockSold).toBe(1);
  });

  it("attributes top-seller revenue by seller, not product", async () => {
    const data = await getBusinessReportData();

    expect(data.topSellers).toEqual([{ name: "Seller One", totalCents: 30000 }]);
  });

  it("groups expenses by category with correct totals", async () => {
    mockExpenseFindMany.mockResolvedValue([
      { category: "Hosting", amountCents: 2000, date: now },
      { category: "Hosting", amountCents: 500, date: now },
      { category: "Marketing", amountCents: 1000, date: now },
    ]);

    const data = await getBusinessReportData();

    expect(data.expensesByCategory).toEqual(
      expect.arrayContaining([
        { category: "Hosting", totalCents: 2500 },
        { category: "Marketing", totalCents: 1000 },
      ]),
    );
  });

  it("buckets monthlyPnl into the correct month", async () => {
    const data = await getBusinessReportData();
    const row = data.monthlyPnl.find((r) => r.month === currentMonth);

    expect(row).toBeDefined();
    expect(row!.commissionCents).toBe(1500); // salesBuckets(30000) * 0.05
    expect(row!.marketingCents).toBe(500000); // R5000 invoice converted to cents
    expect(row!.expenseCents).toBe(2000);
    expect(row!.netProfitCents).toBe(1500 + 500000 - 2000);
  });

  it("reports vatEnabled false and zero VAT collected while the toggle is off, even with vatRateBps payments in the DB", async () => {
    // vat_enabled is off, so the payment query should never even run.
    const data = await getBusinessReportData();

    expect(data.vatEnabled).toBe(false);
    expect(data.vatCollectedCents).toBe(0);
    expect(mockPaymentFindMany).not.toHaveBeenCalled();
  });

  it("computes VAT-inclusive and VAT-exclusive amounts correctly once enabled", async () => {
    mockGetVatConfig.mockResolvedValue({ enabled: true, rateBps: 1500 }); // 15%
    mockPaymentFindMany.mockResolvedValue([
      // R115 inclusive of 15% VAT -> R15 VAT (1500 cents)
      { amount: 115, vatRateBps: 1500, vatInclusive: true },
      // R100 exclusive of 15% VAT -> R15 VAT (1500 cents)
      { amount: 100, vatRateBps: 1500, vatInclusive: false },
    ]);

    const data = await getBusinessReportData();

    expect(data.vatEnabled).toBe(true);
    expect(data.vatCollectedCents).toBe(1500 + 1500);
  });

  it("converts Invoice.amount (Decimal Rand) to cents, not a 1:1 pass-through", async () => {
    // Regression guard: Invoice.amount is Rand (the admin form is labeled
    // "Amount (R)"), while totalCommissionCents/expensesCents are true
    // cents — summing them without converting silently undercounts
    // sponsorship revenue by 100x in netProfitCents.
    mockOrderFindMany.mockResolvedValue([]);
    mockOrderItemGroupBy.mockResolvedValue([]);
    mockListingFindMany.mockResolvedValue([]);
    mockExpenseFindMany.mockResolvedValue([]);
    mockInvoiceFindMany.mockResolvedValue([{ amount: 100, paidAt: now }]); // R100

    const data = await getBusinessReportData();

    expect(data.marketingRevenueCents).toBe(10000); // R100 -> 10000 cents
    expect(data.netProfitCents).toBe(10000);
  });

  it("falls back to an empty report if a query throws, without crashing the caller", async () => {
    mockOrderFindMany.mockRejectedValue(new Error("db down"));

    const data = await getBusinessReportData();

    expect(data.totalRevenueCents).toBe(0);
    expect(data.netProfitCents).toBe(0);
    expect(data.monthlySales).toEqual([]);
    expect(data.commissionRate).toBe(0.05);
  });
});
