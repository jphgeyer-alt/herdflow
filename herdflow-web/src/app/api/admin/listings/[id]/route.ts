import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

function ensureAdmin(req: NextRequest) {
  return isValidAdminSession(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

// ── GET single listing ────────────────────────────────────────────────────────
export async function GET(request: NextRequest, { params }: Params) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
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
    console.error("GET listing error:", err);
    return NextResponse.json({ error: "Failed to load listing" }, { status: 500 });
  }
}

// ── PATCH update listing ──────────────────────────────────────────────────────
export async function PATCH(request: NextRequest, { params }: Params) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;

  try {
    const listing = await prisma.listing.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: String(body.title) }),
        ...(body.description !== undefined && { description: String(body.description) }),
        ...(body.breed !== undefined && { breed: String(body.breed) }),
        ...(body.region !== undefined && { region: String(body.region) }),
        ...(body.status !== undefined && { status: body.status as "ACTIVE" | "DRAFT" | "SOLD" | "ARCHIVED" }),
        ...(body.priceCents !== undefined && { priceCents: Number(body.priceCents) }),
        ...(body.weightKg !== undefined && { weightKg: body.weightKg !== null ? Number(body.weightKg) : null }),
        ...(body.ageMonths !== undefined && { ageMonths: body.ageMonths !== null ? Number(body.ageMonths) : null }),
        ...(body.isFeatured !== undefined && { isFeatured: Boolean(body.isFeatured) }),
        ...(body.photos !== undefined && { photos: body.photos as string[] }),
      },
      include: {
        category: { select: { name: true } },
        seller: { select: { farmName: true } },
      },
    });

    return NextResponse.json({ ok: true, listing });
  } catch (err) {
    console.error("PATCH listing error:", err);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}

// ── DELETE (soft delete) listing ──────────────────────────────────────────────
export async function DELETE(request: NextRequest, { params }: Params) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({})) as { reason?: string; notes?: string };

  try {
    const listing = await prisma.listing.findUnique({ where: { id }, select: { id: true, isDeleted: true } });

    if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    if (listing.isDeleted) return NextResponse.json({ error: "Listing is already removed" }, { status: 400 });

    // SOFT DELETE — record stays in DB, all history preserved
    await prisma.listing.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: "admin",
        deleteReason: [body.reason, body.notes].filter(Boolean).join(" — ") || "Removed by admin",
        status: "ARCHIVED",
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Listing removed. All order history and statistics are preserved.",
    });
  } catch (err) {
    console.error("Soft-delete listing error:", err);
    const detail = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Failed to remove listing: ${detail}` }, { status: 500 });
  }
}

// ── POST restore a soft-deleted listing ──────────────────────────────────────
export async function POST(request: NextRequest, { params }: Params) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const listing = await prisma.listing.findUnique({ where: { id }, select: { id: true, isDeleted: true } });
    if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    if (!listing.isDeleted) return NextResponse.json({ error: "Listing is not removed" }, { status: 400 });

    await prisma.listing.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        deleteReason: null,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ ok: true, message: "Listing restored and set to Active." });
  } catch (err) {
    console.error("Restore listing error:", err);
    return NextResponse.json({ error: "Failed to restore listing" }, { status: 500 });
  }
}
