import { withAdminContext } from "@/lib/tenant-prisma";

/**
 * Shared by the Revenue page and the Finance overview page so this
 * calculation only lives in one place. Returns a Rand amount (not cents,
 * despite Payment.amount/SubscriptionPlan.*Price being Decimal Rand
 * columns) — pass straight to formatRand().
 */
export async function getMrr(): Promise<{ mrr: number; activeSubscriptions: number }> {
  const activeSubs = await withAdminContext((tx) =>
    tx.subscription.findMany({
      where: { status: "ACTIVE" },
      select: { billingCycle: true, plan: { select: { monthlyPrice: true, annualPrice: true } } },
    }),
  );

  const mrr = activeSubs.reduce((sum, s) => {
    const monthly =
      s.billingCycle === "ANNUAL" ? Number(s.plan.annualPrice) / 12 : Number(s.plan.monthlyPrice);
    return sum + monthly;
  }, 0);

  return { mrr, activeSubscriptions: activeSubs.length };
}
