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
    const fee = await prisma.platformFee.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: String(body.name) }),
        ...(body.amount !== undefined && { amount: Number(body.amount) }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
      },
    });

    logAdminActivity(admin, "platform_fee.update", "PlatformFee", {
      entityId: fee.id,
      entityLabel: fee.name,
      metadata: body,
    });

    return NextResponse.json({ ok: true, fee });
  } catch (err) {
    console.error("PATCH fee error:", err);
    return NextResponse.json({ error: "Failed to update fee." }, { status: 500 });
  }
}
