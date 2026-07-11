import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...(body.displayName !== undefined && { displayName: String(body.displayName) }),
        ...(body.monthlyPrice !== undefined && { monthlyPrice: Number(body.monthlyPrice) }),
        ...(body.annualPrice !== undefined && { annualPrice: Number(body.annualPrice) }),
        ...(body.maxAnimals !== undefined && {
          maxAnimals: body.maxAnimals === null ? null : Number(body.maxAnimals),
        }),
        ...(body.maxUsers !== undefined && {
          maxUsers: body.maxUsers === null ? null : Number(body.maxUsers),
        }),
        ...(body.maxFarms !== undefined && { maxFarms: Number(body.maxFarms) }),
        ...(body.isPopular !== undefined && { isPopular: Boolean(body.isPopular) }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
        ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) }),
      },
    });

    logAdminActivity(admin, "subscription_plan.update", "SubscriptionPlan", {
      entityId: plan.id,
      entityLabel: plan.displayName,
      metadata: body,
    });

    return NextResponse.json({ ok: true, plan });
  } catch (err) {
    console.error("PATCH plan error:", err);
    return NextResponse.json({ error: "Failed to update plan." }, { status: 500 });
  }
}
