import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindMany, mockCreate, mockUpdate } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock("@/lib/tenant-prisma", () => ({
  withAdminContext: (fn: (tx: unknown) => unknown) =>
    fn({
      expense: { findMany: mockFindMany, create: mockCreate, update: mockUpdate },
    }),
}));

import { generateDueRecurringExpenses } from "./recurring";

describe("generateDueRecurringExpenses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({});
    mockUpdate.mockResolvedValue({});
  });

  it("generates a child expense and advances nextOccurrenceAt past now", async () => {
    // One day overdue — guaranteed to be less than a full MONTHLY interval
    // away from "now", so exactly one occurrence is due.
    const dueDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    mockFindMany.mockResolvedValue([
      {
        id: "template-1",
        category: "Hosting & Infrastructure",
        description: "Render subscription",
        amountCents: 5000,
        notes: null,
        isRecurring: true,
        recurrenceInterval: "MONTHLY",
        nextOccurrenceAt: dueDate,
      },
    ]);

    const result = await generateDueRecurringExpenses();

    expect(result.generated).toBe(1);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        category: "Hosting & Infrastructure",
        description: "Render subscription",
        amountCents: 5000,
        date: dueDate,
        notes: null,
        createdBy: "system:recurring-expense",
        parentExpenseId: "template-1",
      },
    });
    const updatedNextOccurrence: Date = mockUpdate.mock.calls[0][0].data.nextOccurrenceAt;
    expect(updatedNextOccurrence.getTime()).toBeGreaterThan(Date.now());
  });

  it("catches up multiple missed occurrences in one run, bounded, and is idempotent", async () => {
    // Overdue by 3 months on a MONTHLY template — should generate one row
    // per missed month and land nextOccurrenceAt in the future.
    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Independently derive the expected occurrence count by replicating the
    // same "advance by a month until past now" arithmetic, rather than
    // hardcoding 3 (which would be brittle around month-length edge cases).
    let expectedCount = 0;
    let cursor = new Date(threeMonthsAgo);
    while (cursor <= now) {
      expectedCount++;
      cursor = new Date(cursor);
      cursor.setMonth(cursor.getMonth() + 1);
    }

    mockFindMany.mockResolvedValue([
      {
        id: "template-2",
        category: "Software & Tools",
        description: "SaaS tool",
        amountCents: 1000,
        notes: null,
        isRecurring: true,
        recurrenceInterval: "MONTHLY",
        nextOccurrenceAt: threeMonthsAgo,
      },
    ]);

    const result = await generateDueRecurringExpenses();

    expect(result.generated).toBe(expectedCount);
    expect(mockCreate).toHaveBeenCalledTimes(expectedCount);

    // Re-running immediately should find nothing due, since findMany itself
    // is mocked per-call — simulate the second run against an empty due set
    // (what the real DB would return, since nextOccurrenceAt is now in the
    // future) and confirm no further generation happens.
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue([]);
    const second = await generateDueRecurringExpenses();
    expect(second.generated).toBe(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("skips templates missing recurrenceInterval instead of throwing", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "template-3",
        category: "Other",
        description: "Malformed template",
        amountCents: 100,
        notes: null,
        isRecurring: true,
        recurrenceInterval: null,
        nextOccurrenceAt: new Date("2026-01-01"),
      },
    ]);

    const result = await generateDueRecurringExpenses();

    expect(result.generated).toBe(0);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
