import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ id: string; lotId: string }> };

function ensureAdmin(req: NextRequest) {
  return isValidAdminSession(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function GET(request: NextRequest, { params }: Params) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { lotId } = await params;
  try {
    const lot = await prisma.auctionLot.findUnique({
      where: { id: lotId },
      include: { _count: { select: { bids: true } } },
    });
    if (!lot) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ lot });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { lotId } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const lot = await prisma.auctionLot.update({
      where: { id: lotId },
      data: {
        ...(body.title !== undefined && { title: String(body.title).trim() }),
        ...(body.description !== undefined && { description: String(body.description).trim() }),
        ...(body.species !== undefined && { species: String(body.species).trim() || null }),
        ...(body.breed !== undefined && { breed: String(body.breed).trim() || null }),
        ...(body.quantity !== undefined && { quantity: Number(body.quantity) }),
        ...(body.gender !== undefined && { gender: String(body.gender).trim() || null }),
        ...(body.weightKg !== undefined && {
          weightKg: body.weightKg ? Number(body.weightKg) : null,
        }),
        ...(body.region !== undefined && { region: String(body.region).trim() || null }),
        ...(body.location !== undefined && { location: String(body.location).trim() || null }),
        ...(body.healthStatus !== undefined && {
          healthStatus: String(body.healthStatus).trim() || null,
        }),
        ...(body.images !== undefined && { images: (body.images as string[]).filter(Boolean) }),
        ...(body.documents !== undefined && {
          documents: (body.documents as string[]).filter(Boolean),
        }),
        ...(body.startingPriceCents !== undefined && {
          startingPriceCents: Math.round(Number(body.startingPriceCents)),
        }),
        ...(body.reservePriceCents !== undefined && {
          reservePriceCents: body.reservePriceCents
            ? Math.round(Number(body.reservePriceCents))
            : null,
        }),
        ...(body.status !== undefined && {
          status: body.status as "PENDING" | "OPEN" | "SOLD" | "PASSED" | "CANCELLED",
        }),
      },
    });
    return NextResponse.json({ lot });
  } catch (err) {
    console.error("PATCH lot error:", err);
    return NextResponse.json({ error: "Failed to update lot" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { lotId } = await params;
  try {
    await prisma.auctionLot.delete({ where: { id: lotId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete lot" }, { status: 500 });
  }
}
