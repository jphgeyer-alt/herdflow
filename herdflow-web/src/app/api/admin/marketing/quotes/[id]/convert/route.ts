import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getNextDocumentNumber } from "@/lib/document-number";

type Params = { params: Promise<{ id: string }> };

// Creates an Invoice from an accepted Quote (dueDate = +7 days).
export async function POST(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

    const createdBy = admin.fullName;
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invoice = await prisma.$transaction(async (tx) => {
      const number = await getNextDocumentNumber(tx, "invoice");
      return tx.invoice.create({
        data: {
          number,
          sponsorId: quote.sponsorId,
          quoteId: quote.id,
          description: quote.description,
          amount: quote.amount,
          dueDate,
          createdBy,
        },
        include: { sponsor: true, quote: true },
      });
    });

    return NextResponse.json({ ok: true, invoice });
  } catch (err) {
    console.error("Convert quote to invoice error:", err);
    return NextResponse.json({ error: "Failed to convert quote to invoice" }, { status: 500 });
  }
}
