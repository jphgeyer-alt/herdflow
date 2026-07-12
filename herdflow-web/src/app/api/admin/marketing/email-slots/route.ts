import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const slots = await prisma.emailSponsorship.findMany({
      include: {
        sponsor: { select: { companyName: true } },
        creative: { select: { headline: true, imageUrl: true } },
        invoice: { select: { number: true, status: true } },
      },
      orderBy: { weekStart: "asc" },
    });
    return NextResponse.json({ slots });
  } catch (err) {
    console.error("Email slots GET error:", err);
    return NextResponse.json({ error: "Failed to load slots." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    sponsorId?: string;
    slotType?: string;
    weekStart?: string;
    creativeId?: string;
    fee?: number;
  };

  if (!body.sponsorId || !body.slotType || !body.weekStart) {
    return NextResponse.json({ error: "sponsorId, slotType, and weekStart are required." }, { status: 400 });
  }

  try {
    const feeRow = await prisma.platformFee.findUnique({ where: { feeKey: "email_sponsor_slot" } });
    const fee = body.fee ?? (feeRow ? Number(feeRow.amount) : 4500);

    const slot = await prisma.emailSponsorship.upsert({
      where: {
        slotType_weekStart: {
          slotType: body.slotType as never,
          weekStart: new Date(body.weekStart),
        },
      },
      update: {
        sponsorId: body.sponsorId,
        creativeId: body.creativeId || null,
        fee,
      },
      create: {
        sponsorId: body.sponsorId,
        slotType: body.slotType as never,
        weekStart: new Date(body.weekStart),
        creativeId: body.creativeId || null,
        fee,
      },
      include: { sponsor: { select: { companyName: true } } },
    });

    logAdminActivity(admin, "email_sponsorship.assign", "EmailSponsorship", {
      entityId: slot.id,
      entityLabel: `${slot.slotType} — ${slot.sponsor.companyName}`,
    });

    return NextResponse.json({ ok: true, slot });
  } catch (err) {
    console.error("Email slot assign error:", err);
    return NextResponse.json({ error: "Failed to assign slot." }, { status: 500 });
  }
}
