import type { Prisma } from "@prisma/client";

const PREFIXES = {
  quote: "Q",
  invoice: "INV",
  payout: "PO",
  delivery: "DL",
  "logistics-payout": "LPO",
} as const;

/**
 * Atomically reserves the next sequential number for a quote, invoice,
 * payout, delivery request, or logistics payout. Must be called inside the
 * same prisma.$transaction() as the record create — the row-level lock on
 * the counter UPDATE is what makes this race-free under concurrent admin
 * requests.
 */
export async function getNextDocumentNumber(
  tx: Prisma.TransactionClient,
  type: "quote" | "invoice" | "payout" | "delivery" | "logistics-payout",
): Promise<string> {
  const counter = await tx.documentCounter.upsert({
    where: { id: type },
    create: { id: type, value: 1 },
    update: { value: { increment: 1 } },
  });
  const year = new Date().getFullYear();
  return `${PREFIXES[type]}-${year}-${String(counter.value).padStart(4, "0")}`;
}
