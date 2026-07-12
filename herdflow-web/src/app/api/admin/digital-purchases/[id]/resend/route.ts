import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";
import { prisma } from "@/lib/prisma";
import { sendDigitalProductEmail } from "@/lib/email";
import { env } from "@/lib/env";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const purchase = await prisma.digitalPurchase.findUnique({ where: { id }, include: { product: true } });
    if (!purchase) return NextResponse.json({ error: "Purchase not found." }, { status: 404 });

    await sendDigitalProductEmail({
      to: purchase.buyerEmail,
      buyerName: purchase.buyerName || "there",
      productTitle: purchase.product.title,
      downloadUrl: `${env.NEXT_PUBLIC_SITE_URL || ""}/api/downloads/${purchase.downloadToken}`,
      expiresDate: purchase.expiresAt.toLocaleDateString("en-ZA"),
      maxDownloads: purchase.maxDownloads,
    });

    logAdminActivity(admin, "digital_purchase.resend", "DigitalPurchase", {
      entityId: purchase.id,
      entityLabel: purchase.buyerEmail,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Resend digital purchase email error:", err);
    return NextResponse.json({ error: "Failed to resend email." }, { status: 500 });
  }
}
