// Vendor payout automation — extends the existing SellerPayout/OrderItem
// models (see Seller.balance, OrderItem.releasedAt added this change)
// rather than a new parallel payout system.
import { prisma } from "@/lib/prisma";
import { withAdminContext } from "@/lib/tenant-prisma";
import { getNextDocumentNumber } from "@/lib/document-number";
import { sendPayoutRemittanceEmail } from "@/lib/email";
import { centsToRand, randToCents, formatCents } from "@/lib/money";

const MIN_PAYOUT_CENTS = 10000; // R100

/**
 * Cron-callable: finds OrderItems eligible for payout (their order is
 * DELIVERED/COMPLETED, or has been PAID for more than 7 days) that haven't
 * been released yet, marks them released, and credits the seller's earning
 * (lineTotalCents - commissionCents) to Seller.balance. Commission stays
 * with HerdFlow — only the seller's net share is credited.
 */
export async function releaseFunds(): Promise<{ released: number; totalCents: number }> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Order has FORCE ROW LEVEL SECURITY — this cron job has no session
  // context, so reads/writes on it must go through withAdminContext.
  const eligibleOrders = await withAdminContext((tx) =>
    tx.order.findMany({
      where: {
        OR: [
          { status: { in: ["SHIPPED", "COMPLETED"] } },
          { status: "PAID", updatedAt: { lte: sevenDaysAgo } },
        ],
      },
      select: {
        items: {
          where: { releasedAt: null },
          select: { id: true, lineTotalCents: true, commissionCents: true, productId: true },
        },
      },
    }),
  );

  let released = 0;
  let totalCents = 0;
  const bySeller = new Map<string, number>();

  for (const order of eligibleOrders) {
    for (const item of order.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { sellerId: true },
      });
      if (!product?.sellerId) continue;

      const netCents = item.lineTotalCents - item.commissionCents;
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { releasedAt: new Date() },
      });
      bySeller.set(product.sellerId, (bySeller.get(product.sellerId) ?? 0) + netCents);
      released++;
      totalCents += netCents;
    }
  }

  for (const [sellerId, cents] of bySeller.entries()) {
    await prisma.seller.update({
      where: { id: sellerId },
      data: { balance: { increment: centsToRand(cents) } },
    });
  }

  return { released, totalCents };
}

/**
 * Buyer-triggered: called when a buyer clicks "Confirm Received" on a
 * SHIPPED order. Marks the order COMPLETED and immediately releases its
 * items' earnings to the seller's balance, rather than waiting for the
 * cron's 7-day PAID window.
 */
export async function confirmOrderReceived(orderId: string): Promise<void> {
  // Order has FORCE ROW LEVEL SECURITY — see releaseFunds() above.
  const order = await withAdminContext((tx) =>
    tx.order.findUnique({
      where: { id: orderId },
      select: {
        status: true,
        items: {
          where: { releasedAt: null },
          select: { id: true, lineTotalCents: true, commissionCents: true, productId: true },
        },
      },
    }),
  );

  if (!order || order.status !== "SHIPPED") {
    throw new Error("Order is not eligible to be confirmed as received.");
  }

  await withAdminContext((tx) => tx.order.update({ where: { id: orderId }, data: { status: "COMPLETED" } }));

  const bySeller = new Map<string, number>();
  for (const item of order.items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      select: { sellerId: true },
    });
    if (!product?.sellerId) continue;

    const netCents = item.lineTotalCents - item.commissionCents;
    await prisma.orderItem.update({ where: { id: item.id }, data: { releasedAt: new Date() } });
    bySeller.set(product.sellerId, (bySeller.get(product.sellerId) ?? 0) + netCents);
  }

  for (const [sellerId, cents] of bySeller.entries()) {
    await prisma.seller.update({
      where: { id: sellerId },
      data: { balance: { increment: centsToRand(cents) } },
    });
  }
}

/**
 * Snapshots a single seller's current released balance into a new PENDING
 * SellerPayout, stamps every released-but-unpaid OrderItem with the new
 * payoutId, and zeroes Seller.balance — the one place balance is debited,
 * so the escrow-respecting Seller.balance/releasedAt bookkeeping never
 * drifts from what payout batches actually pay out.
 */
export async function createSellerPayout(
  sellerId: string,
  createdBy: string,
): Promise<{ id: string; number: string; amountCents: number } | null> {
  const seller = await prisma.seller.findUnique({
    where: { id: sellerId },
    select: { id: true, balance: true },
  });
  if (!seller) return null;

  const amountCents = randToCents(Number(seller.balance));
  if (amountCents < MIN_PAYOUT_CENTS) return null;

  const releasedItems = await prisma.orderItem.findMany({
    where: { payoutId: null, releasedAt: { not: null }, product: { sellerId } },
    select: { id: true },
  });

  // SellerPayout has FORCE ROW LEVEL SECURITY — see releaseFunds() above.
  const payout = await withAdminContext(async (tx) => {
    const number = await getNextDocumentNumber(tx, "payout");
    const created = await tx.sellerPayout.create({
      data: { number, sellerId, amountCents, createdBy },
    });
    if (releasedItems.length > 0) {
      await tx.orderItem.updateMany({
        where: { id: { in: releasedItems.map((i) => i.id) } },
        data: { payoutId: created.id },
      });
    }
    await tx.seller.update({ where: { id: sellerId }, data: { balance: 0 } });
    return created;
  });

  return { id: payout.id, number: payout.number, amountCents };
}

/**
 * Admin-triggered: for every seller with a balance over R100, creates a
 * SellerPayout via createSellerPayout() and returns a bank CSV for upload
 * to internet banking.
 */
export async function createPayoutBatch(
  createdBy: string,
): Promise<{ payouts: number; csv: string }> {
  const sellers = await prisma.seller.findMany({
    where: { balance: { gte: centsToRand(MIN_PAYOUT_CENTS) } },
    select: {
      id: true,
      farmName: true,
      bankName: true,
      accountNumber: true,
      branchCode: true,
      accountHolder: true,
    },
  });

  const rows: string[] = ["Vendor Name,Account Holder,Bank,Account Number,Branch Code,Amount,Reference"];
  let count = 0;

  for (const seller of sellers) {
    const payout = await createSellerPayout(seller.id, createdBy);
    if (!payout) continue;

    rows.push(
      [
        seller.farmName,
        seller.accountHolder || "",
        seller.bankName || "",
        seller.accountNumber || "",
        seller.branchCode || "",
        centsToRand(payout.amountCents).toFixed(2),
        payout.number,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    count++;
  }

  return { payouts: count, csv: rows.join("\n") };
}

/** Admin confirms an EFT was done — marks the payout PAID and emails the vendor a remittance summary. */
export async function markPayoutPaid(payoutId: string, paymentReference?: string): Promise<void> {
  // SellerPayout has FORCE ROW LEVEL SECURITY — see releaseFunds() above.
  const payout = await withAdminContext((tx) =>
    tx.sellerPayout.update({
      where: { id: payoutId },
      data: { status: "PAID", paidAt: new Date(), paymentReference },
      include: { seller: { include: { user: { select: { email: true } } } } },
    }),
  );

  if (payout.seller.user.email) {
    await sendPayoutRemittanceEmail({
      to: payout.seller.user.email,
      sellerName: payout.seller.farmName,
      payoutNumber: payout.number,
      amountLabel: formatCents(payout.amountCents),
      paidDate: new Date().toLocaleDateString("en-ZA"),
    }).catch((err) => console.error("Payout remittance email failed:", err));
  }
}
