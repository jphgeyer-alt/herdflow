import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

async function assertAdmin() {
  const jar = await cookies();
  return isValidAdminSession(jar.get(ADMIN_SESSION_COOKIE)?.value);
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isString(v: unknown, min = 1): v is string {
  return typeof v === "string" && v.trim().length >= min;
}

// ─── GET: list all auction sessions ─────────────────────────────────────────
export async function GET() {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const sessions = await prisma.auctionSession.findMany({
      orderBy: { scheduledAt: "desc" },
      include: {
        _count: { select: { lots: true } },
      },
    });
    return NextResponse.json({ sessions });
  } catch (err) {
    console.error("[admin/auctions GET]", err);
    return NextResponse.json({ error: "Failed to fetch auctions" }, { status: 500 });
  }
}

// ─── POST: create a new auction session ─────────────────────────────────────
export async function POST(request: Request) {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const b = body as Record<string, unknown>;

  if (!isString(b.title)) return NextResponse.json({ error: "title required" }, { status: 400 });
  if (!isString(b.scheduledAt)) return NextResponse.json({ error: "scheduledAt required" }, { status: 400 });

  const scheduledAt = new Date(b.scheduledAt as string);
  if (Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: "Invalid scheduledAt date" }, { status: 400 });
  }

  const baseSlug = slugify(b.title as string) || "auction";
  const slug = `${baseSlug}-${Date.now()}`;

  try {
    const session = await prisma.auctionSession.create({
      data: {
        slug,
        title: (b.title as string).trim(),
        description: isString(b.description) ? (b.description as string).trim() : "",
        scheduledAt,
        status: "UPCOMING",
      },
    });
    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    console.error("[admin/auctions POST]", err);
    return NextResponse.json({ error: "Failed to create auction" }, { status: 500 });
  }
}

// ─── PATCH: update session status or add/update a lot ───────────────────────
export async function PATCH(request: Request) {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const b = body as Record<string, unknown>;

  // Update session status
  if (isString(b.sessionId) && isString(b.status)) {
    const validStatuses = ["UPCOMING", "LIVE", "CLOSED", "CANCELLED"] as const;
    if (!validStatuses.includes(b.status as (typeof validStatuses)[number])) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    try {
      const session = await prisma.auctionSession.update({
        where: { id: b.sessionId as string },
        data: {
          status: b.status as (typeof validStatuses)[number],
          closedAt: b.status === "CLOSED" ? new Date() : undefined,
        },
      });

      // When going LIVE, open all PENDING lots; when CLOSED, close all OPEN lots
      if (b.status === "LIVE") {
        await prisma.auctionLot.updateMany({
          where: { sessionId: b.sessionId as string, status: "PENDING" },
          data: { status: "OPEN" },
        });
      }
      if (b.status === "CLOSED") {
        await prisma.auctionLot.updateMany({
          where: { sessionId: b.sessionId as string, status: "OPEN" },
          data: { status: "PASSED" },
        });
      }

      return NextResponse.json({ session });
    } catch (err) {
      console.error("[admin/auctions PATCH session]", err);
      return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
    }
  }

  // Add a lot to a session
  if (isString(b.addLotToSession)) {
    if (!isString(b.title)) return NextResponse.json({ error: "title required" }, { status: 400 });
    if (typeof b.startingPriceCents !== "number" || b.startingPriceCents < 1)
      return NextResponse.json({ error: "startingPriceCents required" }, { status: 400 });

    try {
      const existing = await prisma.auctionLot.findMany({
        where: { sessionId: b.addLotToSession as string },
        select: { lotNumber: true },
        orderBy: { lotNumber: "desc" },
        take: 1,
      });
      const nextLot = (existing[0]?.lotNumber ?? 0) + 1;

      const lot = await prisma.auctionLot.create({
        data: {
          sessionId: b.addLotToSession as string,
          lotNumber: nextLot,
          title: (b.title as string).trim(),
          description: isString(b.description) ? (b.description as string).trim() : "",
          breed: isString(b.breed) ? (b.breed as string).trim() : null,
          weightKg: typeof b.weightKg === "number" ? b.weightKg : null,
          region: isString(b.region) ? (b.region as string).trim() : null,
          startingPriceCents: b.startingPriceCents as number,
          reservePriceCents: typeof b.reservePriceCents === "number" ? b.reservePriceCents : null,
          status: "PENDING",
        },
      });
      return NextResponse.json({ lot }, { status: 201 });
    } catch (err) {
      console.error("[admin/auctions PATCH addLot]", err);
      return NextResponse.json({ error: "Failed to add lot" }, { status: 500 });
    }
  }

  // Update lot status
  if (isString(b.lotId) && isString(b.lotStatus)) {
    const validLotStatuses = ["PENDING", "OPEN", "SOLD", "PASSED", "CANCELLED"] as const;
    if (!validLotStatuses.includes(b.lotStatus as (typeof validLotStatuses)[number])) {
      return NextResponse.json({ error: "Invalid lot status" }, { status: 400 });
    }
    try {
      const lot = await prisma.auctionLot.update({
        where: { id: b.lotId as string },
        data: { status: b.lotStatus as (typeof validLotStatuses)[number] },
      });
      return NextResponse.json({ lot });
    } catch (err) {
      console.error("[admin/auctions PATCH lotStatus]", err);
      return NextResponse.json({ error: "Failed to update lot" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "No valid operation in body" }, { status: 400 });
}

// ─── DELETE: remove a session or a lot ──────────────────────────────────────
export async function DELETE(request: Request) {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const lotId = searchParams.get("lotId");

  try {
    if (lotId) {
      await prisma.auctionLot.delete({ where: { id: lotId } });
      return NextResponse.json({ ok: true });
    }
    if (sessionId) {
      await prisma.auctionSession.delete({ where: { id: sessionId } });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "sessionId or lotId required" }, { status: 400 });
  } catch (err) {
    console.error("[admin/auctions DELETE]", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
