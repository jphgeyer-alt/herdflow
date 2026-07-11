import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getUserIdFromSession, USER_SESSION_COOKIE } from "@/lib/user-auth";
import { withUserContext } from "@/lib/tenant-prisma";
import { getNextDocumentNumber } from "@/lib/document-number";
import { initiatePayment } from "@/lib/payfast/initiate";
import { env } from "@/lib/env";

// Self-service transport booking — a farmer/seller requests a delivery and
// pays a flat booking fee up front (separate from the eventual job price,
// which is only known once a partner quotes it). This is distinct from
// /api/admin/logistics/requests, which is the admin-created path with a
// known price set immediately.
export async function POST(request: Request) {
  const jar = await cookies();
  const sessionValue = jar.get(USER_SESSION_COOKIE)?.value;
  const userId = await getUserIdFromSession(sessionValue);
  if (!userId) {
    return NextResponse.json({ error: "Please sign in to request transport." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    pickupAddress?: string;
    pickupRegion?: string;
    dropoffAddress?: string;
    dropoffRegion?: string;
    livestockType?: string;
    headCount?: number;
    neededBy?: string;
    notes?: string;
    customerFirstName?: string;
    customerLastName?: string;
    customerEmail?: string;
  };

  const pickupAddress = (body.pickupAddress || "").trim();
  const pickupRegion = (body.pickupRegion || "").trim();
  const dropoffAddress = (body.dropoffAddress || "").trim();
  const dropoffRegion = (body.dropoffRegion || "").trim();
  const livestockType = (body.livestockType || "").trim();
  const headCount = body.headCount != null ? Number(body.headCount) : null;

  if (!pickupRegion || !dropoffRegion) {
    return NextResponse.json(
      { error: "Pickup and drop-off regions are required." },
      { status: 400 },
    );
  }
  if (!livestockType) {
    return NextResponse.json({ error: "Livestock type is required." }, { status: 400 });
  }
  if (!headCount || headCount < 1) {
    return NextResponse.json({ error: "Head count must be at least 1." }, { status: 400 });
  }

  try {
    const fee = await prisma.platformFee.findUnique({ where: { feeKey: "transport_booking" } });
    const feeAmount = fee ? Number(fee.amount) : 195;

    const deliveryRequest = await withUserContext(userId, async (tx) => {
      const number = await getNextDocumentNumber(tx, "delivery");
      return tx.deliveryRequest.create({
        data: {
          number,
          pickupAddress: pickupAddress || pickupRegion,
          pickupRegion,
          dropoffAddress: dropoffAddress || dropoffRegion,
          dropoffRegion,
          cargoDescription: `${livestockType} (${headCount} head)`,
          neededBy: body.neededBy ? new Date(body.neededBy) : null,
          priceCents: null,
          farmerId: userId,
          headCount,
          livestockType,
          notes: body.notes?.trim() || null,
          createdBy: userId,
        },
      });
    });

    const siteUrl = env.NEXT_PUBLIC_SITE_URL || "";
    const payment = await initiatePayment({
      reference: `TB-${deliveryRequest.id}`,
      amount: feeAmount,
      itemName: `HerdFlow Transport Booking Fee — ${deliveryRequest.number}`,
      paymentType: "TRANSPORT_BOOKING",
      returnUrl: `${siteUrl}/logistics?payment=success&ref=${deliveryRequest.number}`,
      cancelUrl: `${siteUrl}/logistics?payment=cancelled`,
      userId,
      deliveryRequestId: deliveryRequest.id,
      customerFirstName: body.customerFirstName,
      customerLastName: body.customerLastName,
      customerEmail: body.customerEmail,
    });

    return NextResponse.json({ ok: true, request: deliveryRequest, payment });
  } catch (err) {
    console.error("Transport booking create error:", err);
    return NextResponse.json({ error: "Failed to create booking request." }, { status: 500 });
  }
}
