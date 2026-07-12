import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const products = await prisma.digitalProduct.findMany({
      include: { _count: { select: { purchases: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ error: "Failed to load products." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    description?: string;
    price?: number;
    coverImage?: string;
    fileKey?: string;
    fileName?: string;
    fileType?: string;
    category?: string;
  };

  if (!body.title?.trim() || !body.description?.trim() || !body.fileKey || !body.fileName || !body.category?.trim()) {
    return NextResponse.json(
      { error: "Title, description, category, and an uploaded file are required." },
      { status: 400 },
    );
  }

  try {
    const slugBase = toSlug(body.title);
    const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

    const product = await prisma.digitalProduct.create({
      data: {
        title: body.title.trim(),
        slug,
        description: body.description.trim(),
        price: body.price ?? 0,
        coverImage: body.coverImage || null,
        fileKey: body.fileKey,
        fileName: body.fileName,
        fileType: body.fileType || "application/octet-stream",
        category: body.category.trim(),
        isActive: false,
      },
    });

    return NextResponse.json({ ok: true, product });
  } catch (err) {
    console.error("Digital product create error:", err);
    return NextResponse.json({ error: "Failed to create product." }, { status: 500 });
  }
}
