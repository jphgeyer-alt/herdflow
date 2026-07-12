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
    const existing = await prisma.digitalPurchase.findUnique({ where: { id }, include: { product: true } });
    if (!existing) return NextResponse.json({ error: "Purchase not found." }, { status: 404 });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const purchase = await prisma.digitalPurchase.update({
      where: { id },
      data: {
        downloadToken: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        downloadCount: 0,
        expiresAt,
      },
      include: { product: true },
    });

    await sendDigitalProductEmail({
      to: purchase.buyerEmail,
      buyerName: purchase.buyerName || "there",
      productTitle: purchase.product.title,
      downloadUrl: `${env.NEXT_PUBLIC_SITE_URL || ""}/api/downloads/${purchase.downloadToken}`,
      expiresDate: expiresAt.toLocaleDateString("en-ZA"),
      maxDownloads: purchase.maxDownloads,
    });

    logAdminActivity(admin, "digital_purchase.regenerate_token", "DigitalPurchase", {
      entityId: purchase.id,
      entityLabel: purchase.buyerEmail,
    });

    return NextResponse.json({ ok: true, purchase });
  } catch (err) {
    console.error("Regenerate digital purchase token error:", err);
    return NextResponse.json({ error: "Failed to regenerate token." }, { status: 500 });
  }
}
