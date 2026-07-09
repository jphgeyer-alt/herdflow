import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type OrderActionBody = {
  id?: string;
  action?: "update_status";
  data?: {
    status?: string;
  };
};

const VALID_STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
  "FAILED",
] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(s: string): s is ValidStatus {
  return (VALID_STATUSES as readonly string[]).includes(s);
}

function ensureAdmin(request: NextRequest) {
  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return isValidAdminSession(session);
}

export async function GET(request: NextRequest) {
  if (!ensureAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const statusFilter = searchParams.get("status");
  const pageParam = searchParams.get("page");
  const page = pageParam ? Math.max(1, Number.parseInt(pageParam, 10) || 1) : 1;
  const pageSize = 25;

  try {
    const where =
      statusFilter && isValidStatus(statusFilter) ? { status: statusFilter } : undefined;

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { fullName: true, email: true } },
          items: {
            include: {
              product: { select: { name: true, slug: true } },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({ orders, total, page, pageSize });
  } catch {
    return NextResponse.json({ error: "Failed to load orders." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!ensureAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as OrderActionBody;
  const { id, action, data } = body;

  if (!id || !action) {
    return NextResponse.json({ error: "id and action are required." }, { status: 400 });
  }

  if (action === "update_status") {
    const status = data?.status;
    if (!status || !isValidStatus(status)) {
      return NextResponse.json({ error: "A valid status is required." }, { status: 400 });
    }

    try {
      await prisma.order.update({ where: { id }, data: { status } });
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ error: "Failed to update order status." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
