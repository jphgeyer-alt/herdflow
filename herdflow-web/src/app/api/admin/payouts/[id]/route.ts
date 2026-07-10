import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";
import { withAdminContext } from "@/lib/tenant-prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const payout = await withAdminContext((tx) =>
      tx.sellerPayout.findUnique({
        where: { id },
        include: { seller: true, items: { include: { product: { select: { name: true } } } } },
      }),
    );
    if (!payout) return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    return NextResponse.json({ payout });
  } catch {
    return NextResponse.json({ error: "Failed to load payout" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    const existing = await withAdminContext((tx) => tx.sellerPayout.findUnique({ where: { id } }));
    if (!existing) return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    if (existing.status !== "PENDING") {
      return NextResponse.json(
        { error: `Payout is already ${existing.status.toLowerCase()}.` },
        { status: 400 },
      );
    }

    if (body.status === "CANCELLED") {
      // Mistake-recovery path: release the stamped items back to the
      // pending pool so they can be included in a future payout.
      const payout = await withAdminContext(async (tx) => {
        await tx.orderItem.updateMany({ where: { payoutId: id }, data: { payoutId: null } });
        return tx.sellerPayout.update({
          where: { id },
          data: { status: "CANCELLED", notes: body.notes || existing.notes },
        });
      });
      logAdminActivity(admin, "seller_payout.cancel", "SellerPayout", {
        entityId: payout.id,
        entityLabel: payout.number,
      });
      return NextResponse.json({ ok: true, payout });
    }

    const payout = await withAdminContext((tx) =>
      tx.sellerPayout.update({
        where: { id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          paymentReference: body.paymentReference?.trim() || null,
          notes: body.notes !== undefined ? body.notes : existing.notes,
        },
      }),
    );

    logAdminActivity(admin, "seller_payout.mark_paid", "SellerPayout", {
      entityId: payout.id,
      entityLabel: payout.number,
    });

    return NextResponse.json({ ok: true, payout });
  } catch (err) {
    console.error("PATCH payout error:", err);
    return NextResponse.json({ error: "Failed to update payout" }, { status: 500 });
  }
}
