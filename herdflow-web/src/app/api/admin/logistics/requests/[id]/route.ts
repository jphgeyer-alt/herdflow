import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { withAdminContext } from "@/lib/tenant-prisma";
import { getLogisticsCommissionRate } from "@/lib/marketplace/commission";
import { sendBookingConfirmedEmail } from "@/lib/email";
import { env } from "@/lib/env";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    logisticsPartnerId?: string;
    status?: string;
    notes?: string;
    priceCents?: number;
  };

  try {
    const existing = await withAdminContext((tx) => tx.deliveryRequest.findUnique({ where: { id } }));
    if (!existing)
      return NextResponse.json({ error: "Delivery request not found" }, { status: 404 });

    // Self-service farmer bookings arrive with no job price (only known once
    // a partner quotes it) — this lets an admin dispatcher quote the price,
    // which also stamps the commission so the job becomes payable/reportable.
    if (body.priceCents !== undefined) {
      if (!body.priceCents || body.priceCents <= 0) {
        return NextResponse.json({ error: "A positive transport price is required." }, { status: 400 });
      }
      const commissionRate = await getLogisticsCommissionRate();
      const deliveryRequest = await withAdminContext((tx) =>
        tx.deliveryRequest.update({
          where: { id },
          data: {
            priceCents: body.priceCents,
            commissionCents: Math.round(body.priceCents! * commissionRate),
          },
        }),
      );
      return NextResponse.json({ ok: true, request: deliveryRequest });
    }

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
        include: { user: { select: { fullName: true, email: true } } },
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

      const route = `${deliveryRequest.pickupRegion} → ${deliveryRequest.dropoffRegion}`;
      const bookingUrl = `${env.NEXT_PUBLIC_SITE_URL || ""}/admin/logistics/requests`;

      if (partner.user.email) {
        await sendBookingConfirmedEmail({
          to: partner.user.email,
          recipientName: partner.user.fullName,
          isPartner: true,
          bookingNumber: deliveryRequest.number,
          route,
          viewUrl: bookingUrl,
        }).catch((err) => console.error("Partner booking email failed:", err));
      }

      if (deliveryRequest.farmerId) {
        const farmer = await prisma.user.findUnique({
          where: { id: deliveryRequest.farmerId },
          select: { fullName: true, email: true },
        });
        if (farmer?.email) {
          await sendBookingConfirmedEmail({
            to: farmer.email,
            recipientName: farmer.fullName,
            isPartner: false,
            bookingNumber: deliveryRequest.number,
            route,
            viewUrl: `${env.NEXT_PUBLIC_SITE_URL || ""}/logistics`,
          }).catch((err) => console.error("Farmer booking email failed:", err));
        }
      }

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
