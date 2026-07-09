import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sendInvoiceEmail } from "@/lib/email";
import { formatRand } from "@/lib/marketing/format";
import { getBaseUrl } from "@/lib/marketing/base-url";

type Params = { params: Promise<{ id: string }> };

function ensureAdmin(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function POST(request: NextRequest, { params }: Params) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const invoice = await prisma.invoice.findUnique({ where: { id }, include: { sponsor: true } });
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const viewUrl = `${getBaseUrl(request)}/invoice/${invoice.id}`;

    await sendInvoiceEmail({
      to: invoice.sponsor.email,
      sponsorName: invoice.sponsor.contactPerson,
      invoiceNumber: invoice.number,
      amountLabel: formatRand(invoice.amount.toString()),
      viewUrl,
      dueDate: invoice.dueDate.toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    });

    const updated = await prisma.invoice.update({
      where: { id },
      data: { sentAt: new Date() },
      include: { sponsor: true, quote: true },
    });

    return NextResponse.json({ ok: true, invoice: updated });
  } catch (err) {
    console.error("Send invoice error:", err);
    return NextResponse.json({ error: "Failed to send invoice" }, { status: 500 });
  }
}
