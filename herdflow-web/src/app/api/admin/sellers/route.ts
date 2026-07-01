import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
type VerificationStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(s: string): s is VerificationStatus {
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

  const where =
    statusFilter && isValidStatus(statusFilter) ? { status: statusFilter } : undefined;

  try {
    const sellers = await prisma.seller.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true, email: true } },
        _count: { select: { livestockListings: true, products: true } },
      },
    });

    // Attach total sales per seller from completed orders
    const sellerIds = sellers.map((s) => s.id);

    const orderAggregates = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        product: { sellerId: { in: sellerIds } },
        order: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] } },
      },
      _sum: { lineTotalCents: true },
    });

    // Map product -> seller
    const products = await prisma.product.findMany({
      where: { sellerId: { in: sellerIds } },
      select: { id: true, sellerId: true },
    });

    const productToSeller = new Map(products.map((p) => [p.id, p.sellerId]));
    const sellerSales = new Map<string, number>();

    for (const agg of orderAggregates) {
      const sellerId = productToSeller.get(agg.productId);
      if (sellerId) {
        sellerSales.set(sellerId, (sellerSales.get(sellerId) ?? 0) + (agg._sum.lineTotalCents ?? 0));
      }
    }

    const enriched = sellers.map((s) => ({
      ...s,
      totalSalesCents: sellerSales.get(s.id) ?? 0,
    }));

    return NextResponse.json({ sellers: enriched });
  } catch {
    return NextResponse.json({ error: "Failed to load sellers." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!ensureAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as { id?: string; status?: string };

  if (!body.id || !body.status || !isValidStatus(body.status)) {
    return NextResponse.json({ error: "id and a valid status are required." }, { status: 400 });
  }

  try {
    await prisma.seller.update({ where: { id: body.id }, data: { status: body.status } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update seller status." }, { status: 500 });
  }
}
