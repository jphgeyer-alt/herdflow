import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getUserIdFromSession, USER_SESSION_COOKIE } from "@/lib/user-auth";
import { withUserContext } from "@/lib/tenant-prisma";
import { initiatePayment } from "@/lib/payfast/initiate";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  const jar = await cookies();
  const sessionValue = jar.get(USER_SESSION_COOKIE)?.value;
  const userId = await getUserIdFromSession(sessionValue);
  if (!userId) {
    return NextResponse.json({ error: "Please sign in to choose a plan." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    planKey?: string;
    billingCycle?: "MONTHLY" | "ANNUAL";
  };
  const planKey = (body.planKey || "").trim();
  const billingCycle = body.billingCycle === "ANNUAL" ? "ANNUAL" : "MONTHLY";

  if (!planKey) return NextResponse.json({ error: "planKey is required." }, { status: 400 });

  const plan = await prisma.subscriptionPlan.findUnique({ where: { key: planKey } });
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  const price = billingCycle === "ANNUAL" ? Number(plan.annualPrice) : Number(plan.monthlyPrice);
  const periodDays = billingCycle === "ANNUAL" ? 365 : 30;
  const currentPeriodEnd = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000);
  // 30-day trial window from selection — reminder cron emails at day 23
  // (see src/lib/reminders.ts). Payment still runs immediately today; a true
  // "don't charge until the trial ends" flow would need deeper changes to
  // PayFast's recurring-billing timing, out of scope here.
  const trialEndsAt = price > 0 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;

  try {
    const subscription = await withUserContext(userId, (tx) =>
      tx.subscription.upsert({
        where: { id: `${userId}-${plan.id}` }, // deterministic-ish; see note below
        update: { planId: plan.id, billingCycle, status: price > 0 ? "TRIAL" : "ACTIVE", trialEndsAt },
        create: {
          id: `${userId}-${plan.id}`,
          userId,
          planId: plan.id,
          billingCycle,
          status: price > 0 ? "TRIAL" : "ACTIVE",
          currentPeriodEnd,
          trialEndsAt,
        },
      }),
    );

    // Free plan (Starter) — no payment needed, activate immediately.
    if (price <= 0) {
      return NextResponse.json({ ok: true, subscription, payment: null });
    }

    const siteUrl = env.NEXT_PUBLIC_SITE_URL || "";
    const payment = await initiatePayment({
      reference: `SUB-${subscription.id}-${Date.now()}`,
      amount: price,
      itemName: `HerdFlow ${plan.displayName} Subscription (${billingCycle === "ANNUAL" ? "Annual" : "Monthly"})`,
      paymentType: "SUBSCRIPTION",
      returnUrl: `${siteUrl}/pricing?payment=success`,
      cancelUrl: `${siteUrl}/pricing?payment=cancelled`,
      userId,
      subscriptionId: subscription.id,
      subscriptionType: 1,
      recurringAmount: price,
      frequency: billingCycle === "ANNUAL" ? 6 : 3,
      cycles: 0,
    });

    return NextResponse.json({ ok: true, subscription, payment });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json({ error: "Failed to start subscription." }, { status: 500 });
  }
}
