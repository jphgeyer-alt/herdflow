import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, getAdminUsername, isValidAdminSession } from "@/lib/admin-auth";
import { withAdminContext } from "@/lib/tenant-prisma";
import { getNextDocumentNumber } from "@/lib/document-number";
import { getLogisticsCommissionRate } from "@/lib/marketplace/commission";

function ensureAdmin(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

const VALID_STATUSES = ["OPEN", "ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED"];

export async function GET(request: NextRequest) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = request.nextUrl.searchParams.get("status");

  try {
    const requests = await withAdminContext((tx) =>
      tx.deliveryRequest.findMany({
        where: status && VALID_STATUSES.includes(status) ? { status: status as never } : undefined,
        include: {
          logisticsPartner: { select: { companyName: true } },
          order: { select: { orderNumber: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    );
    return NextResponse.json({ requests });
  } catch (err) {
    console.error("[admin/logistics/requests GET]", err);
    return NextResponse.json({ error: "Failed to load delivery requests." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    pickupAddress?: string;
    pickupRegion?: string;
    dropoffAddress?: string;
    dropoffRegion?: string;
    cargoDescription?: string;
    neededBy?: string;
    priceCents?: number;
    orderId?: string;
    notes?: string;
  };

  const {
    pickupAddress,
    pickupRegion,
    dropoffAddress,
    dropoffRegion,
    cargoDescription,
    priceCents,
  } = body;

  if (
    !pickupAddress?.trim() ||
    !pickupRegion?.trim() ||
    !dropoffAddress?.trim() ||
    !dropoffRegion?.trim() ||
    !cargoDescription?.trim()
  ) {
    return NextResponse.json(
      { error: "Pickup/dropoff address, region, and cargo description are required." },
      { status: 400 },
    );
  }

  if (!priceCents || priceCents <= 0) {
    return NextResponse.json({ error: "A positive transport price is required." }, { status: 400 });
  }

  try {
    if (body.orderId) {
      const { order, existing } = await withAdminContext(async (tx) => {
        const order = await tx.order.findUnique({ where: { id: body.orderId } });
        const existing = order
          ? await tx.deliveryRequest.findUnique({ where: { orderId: body.orderId } })
          : null;
        return { order, existing };
      });
      if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
      if (existing) {
        return NextResponse.json(
          { error: "This order already has a delivery request." },
          { status: 400 },
        );
      }
    }

    const commissionRate = await getLogisticsCommissionRate();
    const commissionCents = Math.round(priceCents * commissionRate);
    const createdBy = getAdminUsername(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);

    const deliveryRequest = await withAdminContext(async (tx) => {
      const number = await getNextDocumentNumber(tx, "delivery");
      return tx.deliveryRequest.create({
        data: {
          number,
          orderId: body.orderId || null,
          pickupAddress: pickupAddress.trim(),
          pickupRegion: pickupRegion.trim(),
          dropoffAddress: dropoffAddress.trim(),
          dropoffRegion: dropoffRegion.trim(),
          cargoDescription: cargoDescription.trim(),
          neededBy: body.neededBy ? new Date(body.neededBy) : null,
          priceCents,
          commissionCents,
          notes: body.notes?.trim() || null,
          createdBy,
        },
      });
    });

    return NextResponse.json({ ok: true, request: deliveryRequest });
  } catch (err) {
    console.error("[admin/logistics/requests POST]", err);
    return NextResponse.json({ error: "Failed to create delivery request." }, { status: 500 });
  }
}
