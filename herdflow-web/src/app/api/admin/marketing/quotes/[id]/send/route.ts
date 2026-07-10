import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sendQuoteEmail } from "@/lib/email";
import { formatRand } from "@/lib/marketing/format";
import { getBaseUrl } from "@/lib/marketing/base-url";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const quote = await prisma.quote.findUnique({ where: { id }, include: { sponsor: true } });
    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

    const viewUrl = `${getBaseUrl(request)}/quote/${quote.id}`;

    await sendQuoteEmail({
      to: quote.sponsor.email,
      sponsorName: quote.sponsor.contactPerson,
      quoteNumber: quote.number,
      amountLabel: `${formatRand(quote.amount.toString())} / month`,
      viewUrl,
      validUntil: quote.validUntil.toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    });

    const updated = await prisma.quote.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date() },
      include: { sponsor: true, package: true },
    });

    return NextResponse.json({ ok: true, quote: updated });
  } catch (err) {
    console.error("Send quote error:", err);
    return NextResponse.json({ error: "Failed to send quote" }, { status: 500 });
  }
}
