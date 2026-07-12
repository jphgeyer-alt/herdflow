import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const link = await prisma.affiliateLink.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: String(body.name) }),
        ...(body.network !== undefined && { network: body.network ? String(body.network) : null }),
        ...(body.targetUrl !== undefined && { targetUrl: String(body.targetUrl) }),
        ...(body.placement !== undefined && { placement: String(body.placement) }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl ? String(body.imageUrl) : null }),
        ...(body.notes !== undefined && { notes: body.notes ? String(body.notes) : null }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
      },
    });
    return NextResponse.json({ ok: true, link });
  } catch (err) {
    console.error("Affiliate link update error:", err);
    return NextResponse.json({ error: "Failed to update affiliate link." }, { status: 500 });
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
    await prisma.affiliateLink.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Affiliate link delete error:", err);
    return NextResponse.json({ error: "Failed to delete affiliate link." }, { status: 500 });
  }
}
