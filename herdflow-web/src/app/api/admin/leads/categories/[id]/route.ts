import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const category = await prisma.leadCategory.update({
      where: { id },
      data: {
        ...(body.partnerName !== undefined && { partnerName: String(body.partnerName) }),
        ...(body.partnerEmail !== undefined && { partnerEmail: String(body.partnerEmail) }),
        ...(body.externalUrl !== undefined && {
          externalUrl: body.externalUrl ? String(body.externalUrl) : null,
        }),
        ...(body.useExternalRedirect !== undefined && {
          useExternalRedirect: Boolean(body.useExternalRedirect),
        }),
        ...(body.commissionNote !== undefined && {
          commissionNote: body.commissionNote ? String(body.commissionNote) : null,
        }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
      },
    });

    logAdminActivity(admin, "lead_category.update", "LeadCategory", {
      entityId: category.id,
      entityLabel: category.displayName,
      metadata: body,
    });

    return NextResponse.json({ ok: true, category });
  } catch (err) {
    console.error("Lead category PATCH error:", err);
    return NextResponse.json({ error: "Failed to update category." }, { status: 500 });
  }
}
