import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ sessionId: string }> };

async function generateBiddingNumber(sessionId: string): Promise<string> {
  const count = await prisma.auctionRegistration.count({ where: { sessionId } });
  const num = String(count + 1).padStart(3, "0");
  return `HF-${num}`;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { sessionId } = await params;
  try {
    const session = await prisma.auctionSession.findUnique({
      where: { id: sessionId },
      select: { id: true, title: true, scheduledAt: true, status: true, description: true, maxBidders: true },
    });
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const regCount = await prisma.auctionRegistration.count({ where: { sessionId } });
    const lotCount = await prisma.auctionLot.count({ where: { sessionId } });

    return NextResponse.json({ session: { ...session, regCount, lotCount } });
  } catch {
    return NextResponse.json({ error: "Failed to load session" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const { sessionId } = await params;

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;

  const fullName = String(body.fullName || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").trim();
  const idNumber = String(body.idNumber || "").trim();
  const physicalAddress = String(body.physicalAddress || "").trim();
  const city = String(body.city || "").trim();
  const province = String(body.province || "").trim();
  const postalCode = String(body.postalCode || "").trim();

  if (!fullName) return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  if (!email || !/\S+@\S+\.\S+/.test(email)) return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  if (!idNumber) return NextResponse.json({ error: "SA ID number is required" }, { status: 400 });
  if (!physicalAddress || !city || !province || !postalCode) return NextResponse.json({ error: "Full address is required" }, { status: 400 });

  try {
    const session = await prisma.auctionSession.findUnique({ where: { id: sessionId }, select: { id: true, status: true } });
    if (!session) return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    if (session.status === "CLOSED" || session.status === "CANCELLED") {
      return NextResponse.json({ error: "Registration is closed for this auction" }, { status: 400 });
    }

    // Check duplicate
    const existing = await prisma.auctionRegistration.findFirst({ where: { sessionId, email } });
    if (existing) {
      return NextResponse.json({ error: "You are already registered for this auction", registration: existing }, { status: 409 });
    }

    const biddingNumber = await generateBiddingNumber(sessionId);

    const registration = await prisma.auctionRegistration.create({
      data: {
        sessionId,
        fullName,
        email,
        phone,
        idNumber,
        physicalAddress,
        city,
        province,
        postalCode,
        bankName: String(body.bankName || "").trim() || null,
        accountNumber: String(body.accountNumber || "").trim() || null,
        biddingNumber,
        termsAccepted: Boolean(body.termsAccepted),
        status: "PENDING",
      },
    });

    return NextResponse.json({ ok: true, registration });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
