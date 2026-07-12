import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { VALID_PLACEMENTS, VALID_STATUSES, VALID_TEMPLATES } from "../route";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  if (body.placement !== undefined && !VALID_PLACEMENTS.includes(String(body.placement))) {
    return NextResponse.json({ error: "Invalid placement." }, { status: 400 });
  }
  if (body.status !== undefined && !VALID_STATUSES.includes(String(body.status))) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  if (body.template !== undefined && !VALID_TEMPLATES.includes(String(body.template))) {
    return NextResponse.json({ error: "Invalid template." }, { status: 400 });
  }

  try {
    const creative = await prisma.sponsorCreative.update({
      where: { id },
      data: {
        ...(body.placement !== undefined && { placement: body.placement as never }),
        ...(body.imageUrl !== undefined && { imageUrl: String(body.imageUrl) }),
        ...(body.linkUrl !== undefined && { linkUrl: body.linkUrl ? String(body.linkUrl) : null }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
        ...(body.startDate !== undefined && {
          startDate: body.startDate ? new Date(String(body.startDate)) : null,
        }),
        ...(body.endDate !== undefined && {
          endDate: body.endDate ? new Date(String(body.endDate)) : null,
        }),
        ...(body.headline !== undefined && { headline: body.headline ? String(body.headline) : null }),
        ...(body.subline !== undefined && { subline: body.subline ? String(body.subline) : null }),
        ...(body.ctaText !== undefined && { ctaText: body.ctaText ? String(body.ctaText) : null }),
        ...(body.ctaUrl !== undefined && { ctaUrl: body.ctaUrl ? String(body.ctaUrl) : null }),
        ...(body.bgColor !== undefined && { bgColor: String(body.bgColor) }),
        ...(body.textColor !== undefined && { textColor: String(body.textColor) }),
        ...(body.template !== undefined && { template: String(body.template) }),
        ...(body.status !== undefined && { status: body.status as never }),
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
  if (admin.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only super admins can delete records." }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.sponsorCreative.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete creative error:", err);
    return NextResponse.json({ error: "Failed to delete creative." }, { status: 500 });
  }
}
