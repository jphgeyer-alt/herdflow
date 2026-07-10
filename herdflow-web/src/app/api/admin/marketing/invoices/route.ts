import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getNextDocumentNumber } from "@/lib/document-number";

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = request.nextUrl.searchParams.get("status");

  try {
    const invoices = await prisma.invoice.findMany({
      where: status && status !== "ALL" ? { status: status as never } : undefined,
      include: { sponsor: { select: { companyName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ invoices });
  } catch {
    return NextResponse.json({ error: "Failed to load invoices." }, { status: 500 });
  }
}

// Standalone invoice creation — for recurring monthly billing where a
// sponsor is invoiced again without re-issuing a quote each time.
export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    sponsorId?: string;
    description?: string;
    amount?: number;
    dueDate?: string;
    periodLabel?: string;
    notes?: string;
  };

  if (!body.sponsorId)
    return NextResponse.json({ error: "sponsorId is required." }, { status: 400 });

  try {
    const sponsor = await prisma.sponsor.findUnique({
      where: { id: body.sponsorId },
      include: { marketingPackage: true },
    });
    if (!sponsor) return NextResponse.json({ error: "Sponsor not found." }, { status: 404 });

    const description =
      (body.description || "").trim() || sponsor.marketingPackage?.name || "Sponsorship Invoice";
    const amount =
      body.amount !== undefined
        ? Number(body.amount)
        : Number(sponsor.monthlyFee ?? sponsor.marketingPackage?.monthlyFee ?? 0);
    const dueDate = body.dueDate
      ? new Date(body.dueDate)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const createdBy = admin.fullName;

    const invoice = await prisma.$transaction(async (tx) => {
      const number = await getNextDocumentNumber(tx, "invoice");
      return tx.invoice.create({
        data: {
          number,
          sponsorId: body.sponsorId!,
          description,
          amount,
          dueDate,
          periodLabel: body.periodLabel?.trim() || null,
          notes: body.notes?.trim() || null,
          createdBy,
        },
        include: { sponsor: true },
      });
    });

    return NextResponse.json({ ok: true, invoice });
  } catch (err) {
    console.error("Create invoice error:", err);
    return NextResponse.json({ error: "Failed to create invoice." }, { status: 500 });
  }
}
