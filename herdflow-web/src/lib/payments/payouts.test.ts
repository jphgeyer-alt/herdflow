import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockSellerFindUnique,
  mockSellerFindMany,
  mockSellerUpdate,
  mockOrderItemFindMany,
  mockOrderItemUpdate,
  mockOrderItemUpdateMany,
  mockProductFindUnique,
  mockOrderFindMany,
  mockDocumentCounterUpsert,
  mockSellerPayoutCreate,
  mockSellerPayoutUpdate,
  mockSendPayoutRemittanceEmail,
} = vi.hoisted(() => ({
  mockSellerFindUnique: vi.fn(),
  mockSellerFindMany: vi.fn(),
  mockSellerUpdate: vi.fn(),
  mockOrderItemFindMany: vi.fn(),
  mockOrderItemUpdate: vi.fn(),
  mockOrderItemUpdateMany: vi.fn(),
  mockProductFindUnique: vi.fn(),
  mockOrderFindMany: vi.fn(),
  mockDocumentCounterUpsert: vi.fn(),
  mockSellerPayoutCreate: vi.fn(),
  mockSellerPayoutUpdate: vi.fn(),
  mockSendPayoutRemittanceEmail: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    seller: { findUnique: mockSellerFindUnique, findMany: mockSellerFindMany, update: mockSellerUpdate },
    orderItem: {
      findMany: mockOrderItemFindMany,
      update: mockOrderItemUpdate,
      updateMany: mockOrderItemUpdateMany,
    },
    product: { findUnique: mockProductFindUnique },
  },
}));

vi.mock("@/lib/tenant-prisma", () => ({
  withAdminContext: (fn: (tx: unknown) => unknown) =>
    fn({
      order: { findMany: mockOrderFindMany },
      documentCounter: { upsert: mockDocumentCounterUpsert },
      sellerPayout: { create: mockSellerPayoutCreate, update: mockSellerPayoutUpdate },
      orderItem: { updateMany: mockOrderItemUpdateMany },
      seller: { update: mockSellerUpdate },
    }),
}));

vi.mock("@/lib/email", () => ({
  sendPayoutRemittanceEmail: mockSendPayoutRemittanceEmail,
}));

import { releaseFunds, createSellerPayout, createPayoutBatch } from "./payouts";

describe("createSellerPayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDocumentCounterUpsert.mockResolvedValue({ value: 1 });
    mockSellerPayoutCreate.mockResolvedValue({ id: "po1", number: "PO-2026-0001" });
    mockOrderItemFindMany.mockResolvedValue([]);
    mockSellerUpdate.mockResolvedValue({});
  });

  it("returns null when the seller's balance is under the R100 minimum", async () => {
    mockSellerFindUnique.mockResolvedValue({ id: "s1", balance: 50 });

    const result = await createSellerPayout("s1", "Admin");

    expect(result).toBeNull();
    expect(mockSellerPayoutCreate).not.toHaveBeenCalled();
  });

  it("zeroes Seller.balance and stamps released OrderItems on success", async () => {
    mockSellerFindUnique.mockResolvedValue({ id: "s1", balance: 500 });
    mockOrderItemFindMany.mockResolvedValue([{ id: "oi1" }, { id: "oi2" }]);

    const result = await createSellerPayout("s1", "Admin");

    expect(result).toEqual({ id: "po1", number: "PO-2026-0001", amountCents: 50000 });
    expect(mockSellerUpdate).toHaveBeenCalledWith({
      where: { id: "s1" },
      data: { balance: 0 },
    });
    expect(mockOrderItemUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ["oi1", "oi2"] } },
      data: { payoutId: "po1" },
    });
  });
});

describe("createPayoutBatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDocumentCounterUpsert.mockResolvedValue({ value: 1 });
    mockSellerPayoutCreate.mockResolvedValue({ id: "po1", number: "PO-2026-0001" });
    mockOrderItemFindMany.mockResolvedValue([]);
    mockSellerUpdate.mockResolvedValue({});
  });

  it("includes only sellers above the payout minimum and escapes CSV fields", async () => {
    mockSellerFindMany.mockResolvedValue([
      {
        id: "s1",
        farmName: 'Test "Farm", A',
        bankName: "FNB",
        accountNumber: "123",
        branchCode: "250655",
        accountHolder: "Jane Doe",
      },
      {
        id: "s2",
        farmName: "Below Threshold Farm",
        bankName: "FNB",
        accountNumber: "456",
        branchCode: "250655",
        accountHolder: "John Doe",
      },
    ]);
    mockSellerFindUnique.mockImplementation(({ where }: { where: { id: string } }) =>
      Promise.resolve(
        where.id === "s1" ? { id: "s1", balance: 500 } : { id: "s2", balance: 50 },
      ),
    );

    const result = await createPayoutBatch("Admin");

    expect(result.payouts).toBe(1);
    const rows = result.csv.split("\n");
    expect(rows[0]).toBe(
      "Vendor Name,Account Holder,Bank,Account Number,Branch Code,Amount,Reference",
    );
    expect(rows).toHaveLength(2);
    expect(rows[1]).toContain('"Test ""Farm"", A"');
    expect(rows[1]).toContain("500.00");
    expect(rows[1]).toContain("PO-2026-0001");
  });
});

describe("releaseFunds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrderItemUpdate.mockResolvedValue({});
    mockSellerUpdate.mockResolvedValue({});
  });

  it("nets commission out of each released item and aggregates per seller", async () => {
    mockOrderFindMany.mockResolvedValue([
      {
        items: [
          { id: "oi1", lineTotalCents: 10000, commissionCents: 500, productId: "p1" },
          { id: "oi2", lineTotalCents: 20000, commissionCents: 1000, productId: "p1" },
        ],
      },
    ]);
    mockProductFindUnique.mockResolvedValue({ sellerId: "sA" });

    const result = await releaseFunds();

    expect(result.released).toBe(2);
    expect(result.totalCents).toBe(9500 + 19000);
    expect(mockOrderItemUpdate).toHaveBeenCalledTimes(2);
    expect(mockSellerUpdate).toHaveBeenCalledTimes(1);
    expect(mockSellerUpdate).toHaveBeenCalledWith({
      where: { id: "sA" },
      data: { balance: { increment: 285 } }, // (9500 + 19000) / 100
    });
  });

  it("skips items whose product has no seller", async () => {
    mockOrderFindMany.mockResolvedValue([
      { items: [{ id: "oi1", lineTotalCents: 10000, commissionCents: 500, productId: "p1" }] },
    ]);
    mockProductFindUnique.mockResolvedValue({ sellerId: null });

    const result = await releaseFunds();

    expect(result.released).toBe(0);
    expect(result.totalCents).toBe(0);
    expect(mockOrderItemUpdate).not.toHaveBeenCalled();
    expect(mockSellerUpdate).not.toHaveBeenCalled();
  });
});
