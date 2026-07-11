import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { initiatePayment } from "@/lib/payfast/initiate";
import { env } from "@/lib/env";

type Ctx = { params: Promise<{ id: string }> };

// Public — a sponsor invoice's shareable link doesn't require a login, so
// this route is intentionally unauthenticated (matches /invoice/[id] itself,
// which is already a public page). It only ever charges the amount already
// on the invoice record, so there's no way to manipulate the amount paid.
export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  const invoice = await prisma.invoice.findUnique({ where: { id }, include: { sponsor: true } });
  if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  if (invoice.status === "PAID") {
    return NextResponse.json({ error: "This invoice is already paid." }, { status: 400 });
  }

  const siteUrl = env.NEXT_PUBLIC_SITE_URL || "";
  const [firstName, ...rest] = invoice.sponsor.contactPerson.trim().split(" ");

  try {
    const payment = await initiatePayment({
      reference: `INV-${invoice.id}`,
      amount: Number(invoice.amount),
      itemName: `HerdFlow Invoice ${invoice.number} — ${invoice.sponsor.companyName}`,
      paymentType: "SPONSORSHIP",
      returnUrl: `${siteUrl}/invoice/${invoice.id}?payment=success`,
      cancelUrl: `${siteUrl}/invoice/${invoice.id}?payment=cancelled`,
      invoiceId: invoice.id,
      customerFirstName: firstName,
      customerLastName: rest.join(" "),
      customerEmail: invoice.sponsor.email,
    });

    return NextResponse.json({ ok: true, payment });
  } catch (err) {
    console.error("Invoice pay error:", err);
    return NextResponse.json({ error: "Failed to start payment." }, { status: 500 });
  }
}
