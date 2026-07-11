import { NextResponse } from "next/server";
import { getApprovedSeller } from "@/lib/seller-auth";
import { withSellerContext } from "@/lib/tenant-prisma";

export async function GET() {
  const seller = await getApprovedSeller();
  if (!seller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    seller: {
      farmName: seller.farmName,
      location: seller.location,
      region: seller.region,
      contactPhone: seller.contactPhone,
      storeDescription: seller.storeDescription,
      storeLogoUrl: seller.storeLogoUrl,
      bankName: seller.bankName,
      accountNumber: seller.accountNumber,
      branchCode: seller.branchCode,
      accountHolder: seller.accountHolder,
      storefrontPlan: seller.storefrontPlan,
    },
  });
}

export async function PATCH(request: Request) {
  const seller = await getApprovedSeller();
  if (!seller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    location?: string;
    contactPhone?: string;
    storeDescription?: string;
    storeLogoUrl?: string;
    bankName?: string;
    accountNumber?: string;
    branchCode?: string;
    accountHolder?: string;
  };

  try {
    await withSellerContext(seller.id, (tx) =>
      tx.seller.update({
        where: { id: seller.id },
        data: {
          location: body.location?.trim() || seller.location,
          contactPhone: body.contactPhone?.trim() || seller.contactPhone,
          storeDescription: body.storeDescription?.trim() || null,
          storeLogoUrl: body.storeLogoUrl?.trim() || null,
          bankName: body.bankName?.trim() || null,
          accountNumber: body.accountNumber?.trim() || null,
          branchCode: body.branchCode?.trim() || null,
          accountHolder: body.accountHolder?.trim() || null,
        },
      }),
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Seller settings update error:", err);
    return NextResponse.json({ error: "Failed to save settings." }, { status: 500 });
  }
}
