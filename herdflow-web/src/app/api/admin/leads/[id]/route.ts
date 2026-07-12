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
    outcome?: string;
    commissionEarned?: number;
  };

  try {
    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(body.status === "SENT_TO_PARTNER" && { status: "SENT_TO_PARTNER", sentToPartnerAt: new Date() }),
        ...(body.status === "CONVERTED" && {
          status: "CONVERTED",
          commissionEarned: body.commissionEarned ?? undefined,
        }),
        ...(body.status === "DECLINED" && { status: "DECLINED" }),
        ...(body.outcome !== undefined && { outcome: body.outcome }),
      },
    });

    logAdminActivity(admin, "lead.update", "Lead", {
      entityId: lead.id,
      entityLabel: lead.name,
      metadata: body,
    });

    return NextResponse.json({ ok: true, lead });
  } catch (err) {
    console.error("Admin lead PATCH error:", err);
    return NextResponse.json({ error: "Failed to update lead." }, { status: 500 });
  }
}
