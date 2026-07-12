import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";
import { prisma } from "@/lib/prisma";
import { initiatePayment } from "@/lib/payfast/initiate";
import { sendDirectoryPaymentEmail } from "@/lib/email";
import { env } from "@/lib/env";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    status?: string;
    verified?: boolean;
    plan?: "STANDARD" | "PREMIUM";
    sendPaymentLink?: boolean;
  };

  try {
    const existing = await prisma.directoryListing.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

    const listing = await prisma.directoryListing.update({
      where: { id },
      data: {
        ...(body.status === "REJECTED" && { status: "REJECTED" }),
        ...(body.status === "PENDING" && { status: "PENDING", subscriptionActive: false }),
        ...(body.verified !== undefined && { verified: Boolean(body.verified) }),
        ...(body.plan && { plan: body.plan }),
      },
    });

    if (body.sendPaymentLink) {
      const feeKey = listing.plan === "PREMIUM" ? "directory_premium" : "directory_standard";
      const fee = await prisma.platformFee.findUnique({ where: { feeKey } });
      const amount = fee ? Number(fee.amount) : listing.plan === "PREMIUM" ? 299 : 149;
      const siteUrl = env.NEXT_PUBLIC_SITE_URL || "";
      const reference = `DIR-${listing.id}-${Date.now()}`;

      await initiatePayment({
        reference,
        amount,
        itemName: `HerdFlow Services Directory — ${listing.businessName} (${listing.plan})`,
        paymentType: "DIRECTORY_SUBSCRIPTION",
        returnUrl: `${siteUrl}/directory?payment=success`,
        cancelUrl: `${siteUrl}/directory?payment=cancelled`,
        directoryListingId: listing.id,
        subscriptionType: 1,
        recurringAmount: amount,
        frequency: 3,
        cycles: 0,
      });

      const payUrl = `${siteUrl}/api/payfast/redirect/${encodeURIComponent(reference)}`;
      if (listing.email) {
        await sendDirectoryPaymentEmail({
          to: listing.email,
          businessName: listing.businessName,
          planLabel: listing.plan === "PREMIUM" ? "Premium" : "Standard",
          amountLabel: `R${amount.toFixed(2)}`,
          payUrl,
        }).catch((err) => console.error("Directory payment email failed:", err));
      }
    }

    logAdminActivity(admin, "directory_listing.update", "DirectoryListing", {
      entityId: listing.id,
      entityLabel: listing.businessName,
      metadata: body,
    });

    return NextResponse.json({ ok: true, listing });
  } catch (err) {
    console.error("Admin directory PATCH error:", err);
    return NextResponse.json({ error: "Failed to update listing." }, { status: 500 });
  }
}
