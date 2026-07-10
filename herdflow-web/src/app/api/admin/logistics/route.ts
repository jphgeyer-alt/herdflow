import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
type VerificationStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(s: string): s is VerificationStatus {
  return (VALID_STATUSES as readonly string[]).includes(s);
}

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const statusFilter = searchParams.get("status");
  const pageParam = searchParams.get("page");
  const page = pageParam ? Math.max(1, Number.parseInt(pageParam, 10) || 1) : 1;
  const pageSize = 25;

  const where = statusFilter && isValidStatus(statusFilter) ? { status: statusFilter } : undefined;

  try {
    const [total, partners] = await Promise.all([
      prisma.logisticsPartner.count({ where }),
      prisma.logisticsPartner.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { fullName: true, email: true } },
        },
      }),
    ]);

    return NextResponse.json({ partners, total, page, pageSize });
  } catch {
    return NextResponse.json({ error: "Failed to load logistics partners." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    id?: string;
    status?: string;
    reason?: string;
  };

  if (!body.id || !body.status || !isValidStatus(body.status)) {
    return NextResponse.json({ error: "id and a valid status are required." }, { status: 400 });
  }

  const reason = body.reason?.trim();

  try {
    const updated = await prisma.logisticsPartner.update({
      where: { id: body.id },
      data: { status: body.status },
    });
    logAdminActivity(admin, "logistics_partner.status_update", "LogisticsPartner", {
      entityId: updated.id,
      entityLabel: updated.companyName,
      metadata: reason ? { status: body.status, reason } : { status: body.status },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update partner status." }, { status: 500 });
  }
}
