import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApprovedSeller } from "@/lib/seller-auth";
import { withSellerContext } from "@/lib/tenant-prisma";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET() {
  const seller = await getApprovedSeller();
  if (!seller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const products = await prisma.product.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: "desc" },
      include: { category: { select: { name: true } } },
    });
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ error: "Failed to load products." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const seller = await getApprovedSeller();
  if (!seller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    description?: string;
    priceCents?: number;
    stockOnHand?: number;
    region?: string;
    categoryId?: string;
    photos?: string[];
  };

  const name = (body.name || "").trim();
  const description = (body.description || "").trim();
  const priceCents = Number(body.priceCents ?? 0);
  const stockOnHand = Number(body.stockOnHand ?? 0);
  const categoryId = (body.categoryId || "").trim();

  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!description)
    return NextResponse.json({ error: "Description is required." }, { status: 400 });
  if (!categoryId) return NextResponse.json({ error: "Category is required." }, { status: 400 });
  if (!Number.isInteger(priceCents) || priceCents < 0)
    return NextResponse.json(
      { error: "Price must be a non-negative integer in cents." },
      { status: 400 },
    );
  if (!Number.isInteger(stockOnHand) || stockOnHand < 0)
    return NextResponse.json({ error: "Stock must be a non-negative integer." }, { status: 400 });

  const photos = Array.isArray(body.photos)
    ? body.photos.filter((p) => typeof p === "string" && p.trim().length > 0).map((p) => p.trim())
    : [];

  try {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return NextResponse.json({ error: "Invalid category." }, { status: 400 });

    // BASIC storefronts are capped at 20 active products — Unlimited plans
    // (or an admin override) skip this check entirely.
    if (seller.storefrontPlan === "BASIC") {
      const productCount = await prisma.product.count({
        where: { sellerId: seller.id, isDeleted: false },
      });
      if (productCount >= 20) {
        return NextResponse.json(
          {
            error:
              "You've reached the 20-product limit on the Basic plan. Upgrade to Unlimited in your storefront settings to add more.",
          },
          { status: 403 },
        );
      }
    }

    const baseSlug = toSlug(name);
    const slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

    const product = await withSellerContext(seller.id, (tx) =>
      tx.product.create({
        data: {
          name,
          slug,
          description,
          priceCents,
          stockOnHand,
          region: (body.region || "").trim() || null,
          categoryId,
          sellerId: seller.id,
          photos,
          status: "DRAFT",
        },
        include: { category: { select: { name: true } } },
      }),
    );

    return NextResponse.json({ ok: true, product });
  } catch (err) {
    console.error("Seller product create error:", err);
    return NextResponse.json({ error: "Failed to create product." }, { status: 500 });
  }
}
