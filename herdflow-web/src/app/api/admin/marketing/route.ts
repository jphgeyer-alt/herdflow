import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const sponsors = await prisma.sponsor.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ sponsors });
  } catch {
    return NextResponse.json({ error: "Failed to load sponsors." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { id?: string; status?: string };
  if (!body.id || !body.status)
    return NextResponse.json({ error: "id and status are required." }, { status: 400 });

  const validStatuses = ["PENDING", "ACTIVE", "REJECTED"];
  if (!validStatuses.includes(body.status))
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });

  try {
    const sponsor = await prisma.sponsor.update({
      where: { id: body.id },
      data: {
        status: body.status,
        approvedBy: body.status === "ACTIVE" ? admin.fullName : undefined,
        approvedAt: body.status === "ACTIVE" ? new Date() : undefined,
      },
    });
    logAdminActivity(admin, "sponsor.status_update", "Sponsor", {
      entityId: sponsor.id,
      entityLabel: sponsor.companyName,
      metadata: { status: body.status },
    });
    return NextResponse.json({ ok: true, sponsor });
  } catch {
    return NextResponse.json({ error: "Failed to update sponsor." }, { status: 500 });
  }
}
