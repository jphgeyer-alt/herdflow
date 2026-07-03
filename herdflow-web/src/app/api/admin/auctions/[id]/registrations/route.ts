import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function ensureAdmin(req: NextRequest) {
  return isValidAdminSession(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function GET(request: NextRequest, { params }: Params) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const registrations = await prisma.auctionRegistration.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ registrations });
  } catch {
    return NextResponse.json({ error: "Failed to load registrations" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: sessionId } = await params;

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const registrationId = body.id as string;
  const status = body.status as string;
  const adminNotes = body.adminNotes as string | undefined;

  if (!registrationId || !status) return NextResponse.json({ error: "id and status are required" }, { status: 400 });
  const valid = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"];
  if (!valid.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  try {
    const updated = await prisma.auctionRegistration.update({
      where: { id: registrationId },
      data: {
        status,
        adminNotes: adminNotes || undefined,
        approvedBy: status === "APPROVED" ? "admin" : undefined,
        approvedAt: status === "APPROVED" ? new Date() : undefined,
      },
    });
    return NextResponse.json({ ok: true, registration: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update registration" }, { status: 500 });
  }
}
