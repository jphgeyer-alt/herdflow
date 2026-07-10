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
    const [total, sellers] = await Promise.all([
      prisma.seller.count({ where }),
      prisma.seller.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { fullName: true, email: true } },
          _count: { select: { livestockListings: true, products: true } },
        },
      }),
    ]);

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
        sellerSales.set(
          sellerId,
          (sellerSales.get(sellerId) ?? 0) + (agg._sum.lineTotalCents ?? 0),
        );
      }
    }

    const enriched = sellers.map((s) => ({
      ...s,
      totalSalesCents: sellerSales.get(s.id) ?? 0,
    }));

    return NextResponse.json({ sellers: enriched, total, page, pageSize });
  } catch {
    return NextResponse.json({ error: "Failed to load sellers." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const farmName = (body.farmName as string | undefined)?.trim();
  const ownerName = (body.ownerName as string | undefined)?.trim();
  const contactPhone = (body.contactPhone as string | undefined)?.trim();
  const location = (body.location as string | undefined)?.trim();
  const region = (body.region as string | undefined)?.trim();

  if (!farmName) return NextResponse.json({ error: "Farm name is required." }, { status: 400 });
  if (!ownerName) return NextResponse.json({ error: "Owner name is required." }, { status: 400 });
  if (!region) return NextResponse.json({ error: "Region is required." }, { status: 400 });

  try {
    // Create a system user for this admin-managed seller
    const baseSlug = farmName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-");
    const uniqueSuffix = Date.now().toString().slice(-5);
    const email = `${baseSlug}-${uniqueSuffix}@herdflow-managed.local`;

    const user = await prisma.user.create({
      data: {
        email,
        fullName: ownerName,
        phone: contactPhone || null,
        role: "CUSTOMER",
        passwordHash: null,
      },
    });

    const seller = await prisma.seller.create({
      data: {
        userId: user.id,
        slug: `${baseSlug}-${uniqueSuffix}`,
        farmName,
        location: location || region,
        region,
        contactPhone: contactPhone || "N/A",
        nationalIdNumber: "ADMIN_CREATED",
        idDocumentUrl: "",
        status: "APPROVED",
      },
      select: { id: true, farmName: true, region: true, status: true },
    });

    return NextResponse.json({ ok: true, seller });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique") || msg.includes("already exists")) {
      return NextResponse.json(
        { error: "A seller with that name already exists." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Failed to create seller." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const id = (body.id as string | undefined)?.trim();
  const status = body.status as string | undefined;
  const reason = (body.reason as string | undefined)?.trim();

  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });
  if (!status || !isValidStatus(status))
    return NextResponse.json({ error: "Valid status is required." }, { status: 400 });

  try {
    const updated = await prisma.seller.update({ where: { id }, data: { status } });
    logAdminActivity(admin, "seller.status_update", "Seller", {
      entityId: updated.id,
      entityLabel: updated.farmName,
      metadata: reason ? { status, reason } : { status },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update seller." }, { status: 500 });
  }
}
