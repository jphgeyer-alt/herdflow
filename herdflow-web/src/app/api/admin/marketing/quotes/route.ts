import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, getAdminUsername, isValidAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getNextDocumentNumber } from "@/lib/marketing/document-number";

function ensureAdmin(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function GET(request: NextRequest) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = request.nextUrl.searchParams.get("status");

  try {
    const quotes = await prisma.quote.findMany({
      where: status && status !== "ALL" ? { status: status as never } : undefined,
      include: { sponsor: { select: { companyName: true, email: true } }, package: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ quotes });
  } catch {
    return NextResponse.json({ error: "Failed to load quotes." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    sponsorId?: string;
    packageId?: string;
    description?: string;
    amount?: number;
    validUntil?: string;
    notes?: string;
  };

  if (!body.sponsorId)
    return NextResponse.json({ error: "sponsorId is required." }, { status: 400 });

  try {
    const sponsor = await prisma.sponsor.findUnique({ where: { id: body.sponsorId } });
    if (!sponsor) return NextResponse.json({ error: "Sponsor not found." }, { status: 404 });

    const pkg = body.packageId
      ? await prisma.marketingPackage.findUnique({ where: { id: body.packageId } })
      : null;

    const description = (body.description || "").trim() || pkg?.name || "Sponsorship Quote";
    const amount = body.amount !== undefined ? Number(body.amount) : Number(pkg?.monthlyFee ?? 0);
    const validUntil = body.validUntil
      ? new Date(body.validUntil)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const createdBy = getAdminUsername(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);

    const quote = await prisma.$transaction(async (tx) => {
      const number = await getNextDocumentNumber(tx, "quote");
      return tx.quote.create({
        data: {
          number,
          sponsorId: body.sponsorId!,
          packageId: pkg?.id ?? null,
          description,
          amount,
          validUntil,
          notes: body.notes?.trim() || null,
          createdBy,
        },
        include: { sponsor: true, package: true },
      });
    });

    return NextResponse.json({ ok: true, quote });
  } catch (err) {
    console.error("Create quote error:", err);
    return NextResponse.json({ error: "Failed to create quote." }, { status: 500 });
  }
}
