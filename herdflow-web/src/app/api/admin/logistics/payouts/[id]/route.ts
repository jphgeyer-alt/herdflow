import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

function ensureAdmin(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function GET(request: NextRequest, { params }: Params) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const payout = await prisma.logisticsPayout.findUnique({
      where: { id },
      include: { logisticsPartner: true, deliveries: true },
    });
    if (!payout) return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    return NextResponse.json({ payout });
  } catch {
    return NextResponse.json({ error: "Failed to load payout" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    status?: string;
    paymentReference?: string;
    notes?: string;
  };

  if (body.status && !["PAID", "CANCELLED"].includes(body.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  try {
    const existing = await prisma.logisticsPayout.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    if (existing.status !== "PENDING") {
      return NextResponse.json(
        { error: `Payout is already ${existing.status.toLowerCase()}.` },
        { status: 400 },
      );
    }

    if (body.status === "CANCELLED") {
      // Mistake-recovery path: release the stamped deliveries back to the
      // pending pool so they can be included in a future payout.
      const payout = await prisma.$transaction(async (tx) => {
        await tx.deliveryRequest.updateMany({ where: { payoutId: id }, data: { payoutId: null } });
        return tx.logisticsPayout.update({
          where: { id },
          data: { status: "CANCELLED", notes: body.notes || existing.notes },
        });
      });
      return NextResponse.json({ ok: true, payout });
    }

    const payout = await prisma.logisticsPayout.update({
      where: { id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentReference: body.paymentReference?.trim() || null,
        notes: body.notes !== undefined ? body.notes : existing.notes,
      },
    });

    return NextResponse.json({ ok: true, payout });
  } catch (err) {
    console.error("PATCH logistics payout error:", err);
    return NextResponse.json({ error: "Failed to update payout" }, { status: 500 });
  }
}
