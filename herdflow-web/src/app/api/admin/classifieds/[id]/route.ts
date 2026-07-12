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
  const body = (await request.json().catch(() => ({}))) as {
    status?: string;
    reason?: string;
  };

  if (body.status && !["ACTIVE", "ARCHIVED", "SOLD"].includes(body.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  try {
    const classified = await prisma.classified.update({
      where: { id },
      data: { ...(body.status && { status: body.status as never }) },
    });

    logAdminActivity(admin, "classified.update", "Classified", {
      entityId: classified.id,
      entityLabel: classified.title,
      metadata: body,
    });

    return NextResponse.json({ ok: true, classified });
  } catch (err) {
    console.error("Admin classified PATCH error:", err);
    return NextResponse.json({ error: "Failed to update ad." }, { status: 500 });
  }
}
