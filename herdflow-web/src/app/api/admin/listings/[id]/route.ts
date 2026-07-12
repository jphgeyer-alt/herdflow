import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";
import { prisma } from "@/lib/prisma";
import { withAdminContext } from "@/lib/tenant-prisma";

type Params = { params: Promise<{ id: string }> };

/**
 * Single-record CRUD for both livestock Listings and shop Products.
 * `?kind=product` opts into the Product model; anything else (including
 * omitted) defaults to Listing, preserving the original contract this route
 * had before Listings + Products were consolidated onto one admin manager.
 * Both models carry the same soft-delete columns (isDeleted/deletedAt/
 * deletedBy/deleteReason), so DELETE/POST-restore are genuinely symmetric.
 */
function kindFrom(request: NextRequest): "listing" | "product" {
  return request.nextUrl.searchParams.get("kind") === "product" ? "product" : "listing";
}

// ── GET single record ─────────────────────────────────────────────────────────
export async function GET(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const kind = kindFrom(request);

  try {
    if (kind === "product") {
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          seller: { include: { user: { select: { email: true, fullName: true, phone: true } } } },
          category: true,
        },
      });
      if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      return NextResponse.json({ product });
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        seller: { include: { user: { select: { email: true, fullName: true, phone: true } } } },
        category: true,
      },
    });

    if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    return NextResponse.json({ listing });
  } catch (err) {
    console.error(`GET ${kind} error:`, err);
    return NextResponse.json({ error: `Failed to load ${kind}` }, { status: 500 });
  }
}

// ── PATCH update record ───────────────────────────────────────────────────────
export async function PATCH(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const kind = kindFrom(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    if (kind === "product") {
      const product = await withAdminContext((tx) =>
        tx.product.update({
          where: { id },
          data: {
            ...(body.name !== undefined && { name: String(body.name) }),
            ...(body.description !== undefined && { description: String(body.description) }),
            ...(body.region !== undefined && { region: body.region ? String(body.region) : null }),
            ...(body.status !== undefined && {
              status: body.status as "ACTIVE" | "DRAFT" | "OUT_OF_STOCK" | "ARCHIVED",
            }),
            ...(body.priceCents !== undefined && { priceCents: Number(body.priceCents) }),
            ...(body.stockOnHand !== undefined && { stockOnHand: Number(body.stockOnHand) }),
            ...(body.isFeatured !== undefined && { isFeatured: Boolean(body.isFeatured) }),
            ...(body.photos !== undefined && { photos: body.photos as string[] }),
          },
          include: {
            category: { select: { name: true } },
            seller: { select: { farmName: true } },
          },
        }),
      );

      logAdminActivity(admin, "product.update", "Product", {
        entityId: product.id,
        entityLabel: product.name,
        metadata: { status: product.status, isFeatured: product.isFeatured },
      });

      return NextResponse.json({ ok: true, product });
    }

    const listing = await withAdminContext((tx) =>
      tx.listing.update({
        where: { id },
        data: {
          ...(body.title !== undefined && { title: String(body.title) }),
          ...(body.description !== undefined && { description: String(body.description) }),
          ...(body.breed !== undefined && { breed: String(body.breed) }),
          ...(body.region !== undefined && { region: String(body.region) }),
          ...(body.status !== undefined && {
            status: body.status as "ACTIVE" | "DRAFT" | "SOLD" | "ARCHIVED",
          }),
          ...(body.priceCents !== undefined && { priceCents: Number(body.priceCents) }),
          ...(body.weightKg !== undefined && {
            weightKg: body.weightKg !== null ? Number(body.weightKg) : null,
          }),
          ...(body.ageMonths !== undefined && {
            ageMonths: body.ageMonths !== null ? Number(body.ageMonths) : null,
          }),
          ...(body.isFeatured !== undefined && { isFeatured: Boolean(body.isFeatured) }),
          ...(body.photos !== undefined && { photos: body.photos as string[] }),
        },
        include: {
          category: { select: { name: true } },
          seller: { select: { farmName: true } },
        },
      }),
    );

    logAdminActivity(admin, "listing.update", "Listing", {
      entityId: listing.id,
      entityLabel: listing.title,
      metadata: { status: listing.status, isFeatured: listing.isFeatured },
    });

    return NextResponse.json({ ok: true, listing });
  } catch (err) {
    console.error(`PATCH ${kind} error:`, err);
    return NextResponse.json({ error: `Failed to update ${kind}` }, { status: 500 });
  }
}

// ── DELETE (soft delete) record ───────────────────────────────────────────────
export async function DELETE(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only super admins can delete records." }, { status: 403 });
  }

  const { id } = await params;
  const kind = kindFrom(request);
  const body = (await request.json().catch(() => ({}))) as { reason?: string; notes?: string };
  const deleteReason = [body.reason, body.notes].filter(Boolean).join(" — ") || "Removed by admin";

  try {
    if (kind === "product") {
      const existing = await prisma.product.findUnique({
        where: { id },
        select: { id: true, isDeleted: true },
      });
      if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      if (existing.isDeleted)
        return NextResponse.json({ error: "Product is already removed" }, { status: 400 });

      const removed = await withAdminContext((tx) =>
        tx.product.update({
          where: { id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: admin.fullName,
            deleteReason,
            status: "ARCHIVED",
          },
        }),
      );

      logAdminActivity(admin, "product.remove", "Product", {
        entityId: removed.id,
        entityLabel: removed.name,
        metadata: { reason: deleteReason },
      });

      return NextResponse.json({
        ok: true,
        message: "Product removed. All order history and statistics are preserved.",
      });
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, isDeleted: true },
    });

    if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    if (listing.isDeleted)
      return NextResponse.json({ error: "Listing is already removed" }, { status: 400 });

    // SOFT DELETE — record stays in DB, all history preserved
    const removed = await withAdminContext((tx) =>
      tx.listing.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: admin.fullName,
          deleteReason,
          status: "ARCHIVED",
        },
      }),
    );

    logAdminActivity(admin, "listing.remove", "Listing", {
      entityId: removed.id,
      entityLabel: removed.title,
      metadata: { reason: deleteReason },
    });

    return NextResponse.json({
      ok: true,
      message: "Listing removed. All order history and statistics are preserved.",
    });
  } catch (err) {
    console.error(`Soft-delete ${kind} error:`, err);
    const detail = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Failed to remove ${kind}: ${detail}` }, { status: 500 });
  }
}

// ── POST restore a soft-deleted record ────────────────────────────────────────
export async function POST(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const kind = kindFrom(request);

  try {
    if (kind === "product") {
      const existing = await prisma.product.findUnique({
        where: { id },
        select: { id: true, isDeleted: true },
      });
      if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      if (!existing.isDeleted)
        return NextResponse.json({ error: "Product is not removed" }, { status: 400 });

      const restored = await withAdminContext((tx) =>
        tx.product.update({
          where: { id },
          data: {
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
            deleteReason: null,
            status: "ACTIVE",
          },
        }),
      );

      logAdminActivity(admin, "product.restore", "Product", {
        entityId: restored.id,
        entityLabel: restored.name,
      });

      return NextResponse.json({ ok: true, message: "Product restored and set to Active." });
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, isDeleted: true },
    });
    if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    if (!listing.isDeleted)
      return NextResponse.json({ error: "Listing is not removed" }, { status: 400 });

    const restored = await withAdminContext((tx) =>
      tx.listing.update({
        where: { id },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          deleteReason: null,
          status: "ACTIVE",
        },
      }),
    );

    logAdminActivity(admin, "listing.restore", "Listing", {
      entityId: restored.id,
      entityLabel: restored.title,
    });

    return NextResponse.json({ ok: true, message: "Listing restored and set to Active." });
  } catch (err) {
    console.error(`Restore ${kind} error:`, err);
    return NextResponse.json({ error: `Failed to restore ${kind}` }, { status: 500 });
  }
}
