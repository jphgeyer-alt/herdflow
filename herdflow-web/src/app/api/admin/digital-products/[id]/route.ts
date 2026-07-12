import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";
import { prisma } from "@/lib/prisma";
import { isStorageConfigured } from "@/lib/storage/s3";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  if (body.isActive === true && !isStorageConfigured()) {
    return NextResponse.json(
      { error: "Cannot activate — object storage is not configured yet (S3_BUCKET/keys missing)." },
      { status: 400 },
    );
  }

  try {
    const product = await prisma.digitalProduct.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: String(body.title) }),
        ...(body.description !== undefined && { description: String(body.description) }),
        ...(body.price !== undefined && { price: Number(body.price) }),
        ...(body.coverImage !== undefined && { coverImage: body.coverImage ? String(body.coverImage) : null }),
        ...(body.category !== undefined && { category: String(body.category) }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
        ...(body.fileKey !== undefined && { fileKey: String(body.fileKey) }),
        ...(body.fileName !== undefined && { fileName: String(body.fileName) }),
        ...(body.fileType !== undefined && { fileType: String(body.fileType) }),
      },
    });

    logAdminActivity(admin, "digital_product.update", "DigitalProduct", {
      entityId: product.id,
      entityLabel: product.title,
      metadata: body,
    });

    return NextResponse.json({ ok: true, product });
  } catch (err) {
    console.error("Digital product update error:", err);
    return NextResponse.json({ error: "Failed to update product." }, { status: 500 });
  }
}
