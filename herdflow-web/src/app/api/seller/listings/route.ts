import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApprovedSeller } from "@/lib/seller-auth";
import { withSellerContext } from "@/lib/tenant-prisma";
import { initiatePayment } from "@/lib/payfast/initiate";
import { env } from "@/lib/env";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET() {
  const seller = await getApprovedSeller();
  if (!seller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const listings = await prisma.listing.findMany({
    where: { sellerId: seller.id, isDeleted: false },
    orderBy: { createdAt: "desc" },
    include: { category: { select: { name: true } } },
  });
  return NextResponse.json({ listings });
}

export async function POST(request: Request) {
  const seller = await getApprovedSeller();
  if (!seller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    description?: string;
    priceCents?: number;
    region?: string;
    breed?: string;
    weightKg?: number;
    ageMonths?: number;
    photos?: string[];
    categoryId?: string;
    contactWhatsApp?: string;
    tier?: "BASIC" | "FEATURED";
  };

  const title = (body.title || "").trim();
  const description = (body.description || "").trim();
  const region = (body.region || "").trim();
  const breed = (body.breed || "").trim();
  const categoryId = (body.categoryId || "").trim();
  const priceCents = body.priceCents != null ? Number(body.priceCents) : null;
  const tier = body.tier === "FEATURED" ? "FEATURED" : "BASIC";

  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  if (!description)
    return NextResponse.json({ error: "Description is required." }, { status: 400 });
  if (!breed) return NextResponse.json({ error: "Breed is required." }, { status: 400 });
  if (!region) return NextResponse.json({ error: "Region is required." }, { status: 400 });
  if (!categoryId) return NextResponse.json({ error: "Category is required." }, { status: 400 });
  if (priceCents != null && (!Number.isInteger(priceCents) || priceCents < 0)) {
    return NextResponse.json(
      { error: "Price must be a non-negative integer in cents." },
      { status: 400 },
    );
  }

  const photos = Array.isArray(body.photos)
    ? body.photos.filter((p) => typeof p === "string" && p.trim().length > 0).map((p) => p.trim())
    : [];

  try {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return NextResponse.json({ error: "Invalid category." }, { status: 400 });

    const feeKey = tier === "FEATURED" ? "listing_featured" : "listing_basic";
    const fee = await prisma.platformFee.findUnique({ where: { feeKey } });
    const feeAmount = fee ? Number(fee.amount) : tier === "FEATURED" ? 149 : 49;

    const baseSlug = toSlug(title);
    const slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

    // DRAFT until the listing fee is paid — the PayFast ITN handler flips
    // this to ACTIVE (see completeListingFee in /api/payfast/notify).
    const listing = await withSellerContext(seller.id, (tx) =>
      tx.listing.create({
        data: {
          title,
          slug,
          description,
          priceCents: priceCents ?? 0,
          region,
          breed,
          weightKg: body.weightKg != null ? Number(body.weightKg) : null,
          ageMonths: body.ageMonths != null ? Number(body.ageMonths) : null,
          photos,
          contactWhatsApp: (body.contactWhatsApp || "").trim() || null,
          status: "DRAFT",
          tier,
          feePaid: false,
          categoryId,
          sellerId: seller.id,
        },
      }),
    );

    const siteUrl = env.NEXT_PUBLIC_SITE_URL || "";
    const payment = await initiatePayment({
      reference: `LST-${listing.id}`,
      amount: feeAmount,
      itemName: `HerdFlow ${tier === "FEATURED" ? "Featured" : "Basic"} Listing Fee — ${title}`,
      paymentType: "LISTING_FEE",
      returnUrl: `${siteUrl}/listings/${slug}?payment=success`,
      cancelUrl: `${siteUrl}/seller/listings/new-listing?payment=cancelled`,
      listingId: listing.id,
      customerEmail: undefined,
    });

    return NextResponse.json({ ok: true, listing, payment });
  } catch (err) {
    console.error("Seller listing create error:", err);
    return NextResponse.json({ error: "Failed to create listing." }, { status: 500 });
  }
}
