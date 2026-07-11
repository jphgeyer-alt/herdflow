import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const VALID_PLACEMENTS = [
  "HOMEPAGE",
  "SHOP",
  "LISTINGS",
  "APP_HOME_BANNER",
  "APP_ANNOUNCEMENT",
  "WEB_HOMEPAGE",
  "WEB_MARKETPLACE",
  "EMAIL_HEADER",
  "PUSH_NOTIFICATION",
];

export const VALID_STATUSES = ["DRAFT", "SCHEDULED", "LIVE", "PAUSED", "ENDED"];
export const VALID_TEMPLATES = ["banner-classic", "banner-photo", "banner-product", "banner-minimal"];

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
    headline?: string;
    subline?: string;
    ctaText?: string;
    ctaUrl?: string;
    bgColor?: string;
    textColor?: string;
    template?: string;
    status?: string;
  };

  if (!body.sponsorId)
    return NextResponse.json({ error: "sponsorId is required." }, { status: 400 });
  if (!body.placement || !VALID_PLACEMENTS.includes(body.placement))
    return NextResponse.json({ error: "A valid placement is required." }, { status: 400 });
  if (!body.imageUrl) return NextResponse.json({ error: "An image is required." }, { status: 400 });
  if (body.status !== undefined && !VALID_STATUSES.includes(body.status))
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  if (body.template !== undefined && !VALID_TEMPLATES.includes(body.template))
    return NextResponse.json({ error: "Invalid template." }, { status: 400 });

  try {
    const sponsor = await prisma.sponsor.findUnique({ where: { id: body.sponsorId } });
    if (!sponsor) return NextResponse.json({ error: "Sponsor not found." }, { status: 404 });

    const createdBy = admin.fullName;

    const creative = await prisma.sponsorCreative.create({
      data: {
        sponsorId: body.sponsorId,
        placement: body.placement as never,
        imageUrl: body.imageUrl,
        linkUrl: body.linkUrl?.trim() || sponsor.website || null,
        isActive: body.isActive ?? true,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        headline: body.headline?.trim() || null,
        subline: body.subline?.trim() || null,
        ctaText: body.ctaText?.trim() || null,
        ctaUrl: body.ctaUrl?.trim() || null,
        bgColor: body.bgColor || "#1B3A6B",
        textColor: body.textColor || "#FFFFFF",
        template: body.template || "banner-classic",
        // Defaults LIVE (not DRAFT) so the pre-existing simple image-upload
        // creative manager — which never sends `status` — keeps creating
        // immediately-active banners exactly as it did before Ad Studio.
        status: (body.status as never) || "LIVE",
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
