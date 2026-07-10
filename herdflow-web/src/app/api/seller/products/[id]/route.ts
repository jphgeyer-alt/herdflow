import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApprovedSeller } from "@/lib/seller-auth";
import { withSellerContext } from "@/lib/tenant-prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const seller = await getApprovedSeller();
  if (!seller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true } } },
    });
    if (!product || product.sellerId !== seller.id)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });

    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "Failed to load product" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const seller = await getApprovedSeller();
  if (!seller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const product = await withSellerContext(seller.id, async (tx) => {
      const existing = await tx.product.findUnique({ where: { id }, select: { sellerId: true } });
      if (!existing || existing.sellerId !== seller.id) return null;

      return tx.product.update({
        where: { id },
        data: {
          ...(body.name !== undefined && { name: String(body.name) }),
          ...(body.description !== undefined && { description: String(body.description) }),
          ...(body.priceCents !== undefined && { priceCents: Number(body.priceCents) }),
          ...(body.stockOnHand !== undefined && { stockOnHand: Number(body.stockOnHand) }),
          ...(body.region !== undefined && { region: body.region ? String(body.region) : null }),
          ...(body.categoryId !== undefined && { categoryId: String(body.categoryId) }),
          ...(body.photos !== undefined && { photos: body.photos as string[] }),
        },
        include: { category: { select: { name: true } } },
      });
    });

    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    return NextResponse.json({ ok: true, product });
  } catch (err) {
    console.error("Seller product update error:", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// Soft delete — keeps order history intact, matches api/admin/listings/[id]/route.ts.
export async function DELETE(_request: Request, { params }: Params) {
  const seller = await getApprovedSeller();
  if (!seller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const result = await withSellerContext(seller.id, async (tx) => {
      const existing = await tx.product.findUnique({
        where: { id },
        select: { sellerId: true, isDeleted: true },
      });
      if (!existing || existing.sellerId !== seller.id) return { code: "not_found" as const };
      if (existing.isDeleted) return { code: "already_removed" as const };

      await tx.product.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: "seller",
          deleteReason: "Removed by seller",
          status: "ARCHIVED",
        },
      });

      return { code: "ok" as const };
    });

    if (result.code === "not_found")
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    if (result.code === "already_removed")
      return NextResponse.json({ error: "Product is already removed" }, { status: 400 });

    return NextResponse.json({ ok: true, message: "Product removed." });
  } catch (err) {
    console.error("Seller product delete error:", err);
    return NextResponse.json({ error: "Failed to remove product" }, { status: 500 });
  }
}
