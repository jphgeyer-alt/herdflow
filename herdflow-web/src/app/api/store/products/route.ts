import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim() || "";
    const category = url.searchParams.get("category")?.trim() || "";
    const minPrice = Number.parseFloat(url.searchParams.get("minPrice") || "");
    const maxPrice = Number.parseFloat(url.searchParams.get("maxPrice") || "");
    const limitRaw = Number.parseInt(url.searchParams.get("limit") || "24", 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 24;

    const minPriceCents =
      Number.isFinite(minPrice) && minPrice >= 0 ? Math.round(minPrice * 100) : undefined;
    const maxPriceCents =
      Number.isFinite(maxPrice) && maxPrice >= 0 ? Math.round(maxPrice * 100) : undefined;

    const products = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(category ? { categoryId: category } : {}),
        ...(minPriceCents !== undefined || maxPriceCents !== undefined
          ? {
              priceCents: {
                ...(minPriceCents !== undefined ? { gte: minPriceCents } : {}),
                ...(maxPriceCents !== undefined ? { lte: maxPriceCents } : {}),
              },
            }
          : {}),
      },
      include: {
        category: { select: { id: true, name: true } },
        seller: { select: { id: true, farmName: true } },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("[store/products GET]", error);
    return NextResponse.json({ error: "Failed to fetch store products." }, { status: 500 });
  }
}
