import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const VALID_PLACEMENTS = ["HOMEPAGE", "SHOP", "LISTINGS"];

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const creatives = await prisma.sponsorCreative.findMany({
      include: { sponsor: { select: { companyName: true, website: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ creatives });
  } catch {
    return NextResponse.json({ error: "Failed to load creatives." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    sponsorId?: string;
    placement?: string;
    imageUrl?: string;
    linkUrl?: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
  };

  if (!body.sponsorId)
    return NextResponse.json({ error: "sponsorId is required." }, { status: 400 });
  if (!body.placement || !VALID_PLACEMENTS.includes(body.placement))
    return NextResponse.json({ error: "A valid placement is required." }, { status: 400 });
  if (!body.imageUrl) return NextResponse.json({ error: "An image is required." }, { status: 400 });

  try {
    const sponsor = await prisma.sponsor.findUnique({ where: { id: body.sponsorId } });
    if (!sponsor) return NextResponse.json({ error: "Sponsor not found." }, { status: 404 });

    const createdBy = admin.fullName;

    const creative = await prisma.sponsorCreative.create({
      data: {
        sponsorId: body.sponsorId,
        placement: body.placement as "HOMEPAGE" | "SHOP" | "LISTINGS",
        imageUrl: body.imageUrl,
        linkUrl: body.linkUrl?.trim() || sponsor.website || null,
        isActive: body.isActive ?? true,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        createdBy,
      },
      include: { sponsor: { select: { companyName: true, website: true } } },
    });

    return NextResponse.json({ ok: true, creative });
  } catch (err) {
    console.error("Create creative error:", err);
    return NextResponse.json({ error: "Failed to create creative." }, { status: 500 });
  }
}
