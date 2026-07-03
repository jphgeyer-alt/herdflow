import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ id: string }> };

function ensureAdmin(req: NextRequest) {
  return isValidAdminSession(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

// ── GET all lots for session ──────────────────────────────────────────────────
export async function GET(request: NextRequest, { params }: Params) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const lots = await prisma.auctionLot.findMany({
      where: { sessionId: id },
      orderBy: { lotNumber: "asc" },
      include: { _count: { select: { bids: true } } },
    });
    return NextResponse.json({ lots });
  } catch (err) {
    console.error("GET lots error:", err);
    return NextResponse.json({ error: "Failed to load lots" }, { status: 500 });
  }
}

// ── POST create new lot ───────────────────────────────────────────────────────
export async function POST(request: NextRequest, { params }: Params) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: sessionId } = await params;
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;

  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const startingPriceCents = Math.round(Number(body.startingPriceCents ?? body.startPrice ?? 0));
  if (!startingPriceCents || startingPriceCents < 0) {
    return NextResponse.json({ error: "Valid start price is required" }, { status: 400 });
  }

  try {
    const existingLots = await prisma.auctionLot.count({ where: { sessionId } });
    const lotNumber = existingLots + 1;

    const lot = await prisma.auctionLot.create({
      data: {
        sessionId,
        lotNumber,
        title,
        description: String(body.description || "").trim(),
        species: String(body.species || "").trim() || null,
        breed: String(body.breed || "").trim() || null,
        quantity: Number(body.quantity ?? 1),
        gender: String(body.gender || "").trim() || null,
        weightKg: body.weightKg ? Number(body.weightKg) : null,
        region: String(body.region || "").trim() || null,
        location: String(body.location || "").trim() || null,
        healthStatus: String(body.healthStatus || "").trim() || null,
        images: Array.isArray(body.images) ? (body.images as string[]).filter(Boolean) : [],
        documents: Array.isArray(body.documents) ? (body.documents as string[]).filter(Boolean) : [],
        startingPriceCents,
        reservePriceCents: body.reservePriceCents ? Math.round(Number(body.reservePriceCents)) : null,
        status: "PENDING",
      },
    });
    return NextResponse.json({ lot }, { status: 201 });
  } catch (err) {
    console.error("POST lot error:", err);
    return NextResponse.json({ error: "Failed to create lot" }, { status: 500 });
  }
}
