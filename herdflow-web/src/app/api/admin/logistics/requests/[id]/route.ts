import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { withAdminContext } from "@/lib/tenant-prisma";

type Params = { params: Promise<{ id: string }> };

function ensureAdmin(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function GET(request: NextRequest, { params }: Params) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const deliveryRequest = await withAdminContext((tx) =>
      tx.deliveryRequest.findUnique({
        where: { id },
        include: {
          logisticsPartner: { select: { companyName: true } },
          order: { select: { orderNumber: true } },
        },
      }),
    );
    if (!deliveryRequest)
      return NextResponse.json({ error: "Delivery request not found" }, { status: 404 });
    return NextResponse.json({ request: deliveryRequest });
  } catch {
    return NextResponse.json({ error: "Failed to load delivery request" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    logisticsPartnerId?: string;
    status?: string;
    notes?: string;
  };

  try {
    const existing = await withAdminContext((tx) => tx.deliveryRequest.findUnique({ where: { id } }));
    if (!existing)
      return NextResponse.json({ error: "Delivery request not found" }, { status: 404 });

    if (body.status === "CANCELLED") {
      if (existing.status === "DELIVERED" || existing.status === "CANCELLED") {
        return NextResponse.json(
          { error: `Delivery request is already ${existing.status.toLowerCase()}.` },
          { status: 400 },
        );
      }
      const deliveryRequest = await withAdminContext((tx) =>
        tx.deliveryRequest.update({
          where: { id },
          data: { status: "CANCELLED", notes: body.notes ?? existing.notes },
        }),
      );
      return NextResponse.json({ ok: true, request: deliveryRequest });
    }

    if (body.logisticsPartnerId) {
      if (existing.status !== "OPEN") {
        return NextResponse.json(
          { error: "Only OPEN delivery requests can be assigned." },
          { status: 400 },
        );
      }
      const partner = await prisma.logisticsPartner.findUnique({
        where: { id: body.logisticsPartnerId },
      });
      if (!partner || partner.status !== "APPROVED") {
        return NextResponse.json({ error: "Partner not found or not approved." }, { status: 400 });
      }
      const deliveryRequest = await withAdminContext((tx) =>
        tx.deliveryRequest.update({
          where: { id },
          data: {
            logisticsPartnerId: partner.id,
            status: "ASSIGNED",
            assignedAt: new Date(),
          },
        }),
      );
      return NextResponse.json({ ok: true, request: deliveryRequest });
    }

    if (body.notes !== undefined) {
      const deliveryRequest = await withAdminContext((tx) =>
        tx.deliveryRequest.update({
          where: { id },
          data: { notes: body.notes },
        }),
      );
      return NextResponse.json({ ok: true, request: deliveryRequest });
    }

    return NextResponse.json({ error: "No valid update provided." }, { status: 400 });
  } catch (err) {
    console.error("[admin/logistics/requests/:id PATCH]", err);
    return NextResponse.json({ error: "Failed to update delivery request" }, { status: 500 });
  }
}
