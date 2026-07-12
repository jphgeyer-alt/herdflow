import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";
import { prisma } from "@/lib/prisma";
import { getNextDocumentNumber } from "@/lib/document-number";

type Params = { params: Promise<{ id: string }> };

const SLOT_LABEL: Record<string, string> = {
  THURSDAY_PRICE_EMAIL: "Thursday Price Email Sponsorship",
  PRICE_PUSH_NOTIFICATION: "Price Push Notification Sponsorship",
};

export async function POST(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const slot = await prisma.emailSponsorship.findUnique({ where: { id }, include: { sponsor: true } });
    if (!slot) return NextResponse.json({ error: "Slot not found." }, { status: 404 });
    if (slot.invoiceId) {
      return NextResponse.json({ error: "An invoice has already been generated for this slot." }, { status: 400 });
    }

    const weekLabel = slot.weekStart.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });

    const invoice = await prisma.$transaction(async (tx) => {
      const number = await getNextDocumentNumber(tx, "invoice");
      return tx.invoice.create({
        data: {
          number,
          sponsorId: slot.sponsorId,
          description: `${SLOT_LABEL[slot.slotType] ?? slot.slotType} — week of ${weekLabel}`,
          amount: slot.fee,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdBy: admin.fullName,
        },
      });
    });

    await prisma.emailSponsorship.update({ where: { id: slot.id }, data: { invoiceId: invoice.id } });

    logAdminActivity(admin, "email_sponsorship.generate_invoice", "EmailSponsorship", {
      entityId: slot.id,
      entityLabel: `Invoice ${invoice.number}`,
    });

    return NextResponse.json({ ok: true, invoice });
  } catch (err) {
    console.error("Generate email-slot invoice error:", err);
    return NextResponse.json({ error: "Failed to generate invoice." }, { status: 500 });
  }
}
