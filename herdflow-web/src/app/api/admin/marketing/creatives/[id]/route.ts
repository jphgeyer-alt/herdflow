import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const VALID_PLACEMENTS = ["HOMEPAGE", "SHOP", "LISTINGS"];

export async function PATCH(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  if (body.placement !== undefined && !VALID_PLACEMENTS.includes(String(body.placement))) {
    return NextResponse.json({ error: "Invalid placement." }, { status: 400 });
  }

  try {
    const creative = await prisma.sponsorCreative.update({
      where: { id },
      data: {
        ...(body.placement !== undefined && {
          placement: body.placement as "HOMEPAGE" | "SHOP" | "LISTINGS",
        }),
        ...(body.imageUrl !== undefined && { imageUrl: String(body.imageUrl) }),
        ...(body.linkUrl !== undefined && { linkUrl: body.linkUrl ? String(body.linkUrl) : null }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
        ...(body.startDate !== undefined && {
          startDate: body.startDate ? new Date(String(body.startDate)) : null,
        }),
        ...(body.endDate !== undefined && {
          endDate: body.endDate ? new Date(String(body.endDate)) : null,
        }),
      },
      include: { sponsor: { select: { companyName: true, website: true } } },
    });
    return NextResponse.json({ ok: true, creative });
  } catch (err) {
    console.error("Update creative error:", err);
    return NextResponse.json({ error: "Failed to update creative." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await prisma.sponsorCreative.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete creative error:", err);
    return NextResponse.json({ error: "Failed to delete creative." }, { status: 500 });
  }
}
