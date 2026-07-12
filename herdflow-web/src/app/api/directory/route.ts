import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_CATEGORIES = [
  "VETERINARIAN",
  "SHEARER",
  "FENCING_CONTRACTOR",
  "BOREHOLE_DRILLING",
  "AI_TECHNICIAN",
  "DIP_SUPPLIER",
  "AUCTIONEER",
  "FARM_SECURITY",
  "MECHANIC",
  "OTHER",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  try {
    const listings = await prisma.directoryListing.findMany({
      where: {
        status: "APPROVED",
        subscriptionActive: true,
        ...(category && VALID_CATEGORIES.includes(category) && { category: category as never }),
      },
      orderBy: [{ plan: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ listings });
  } catch (err) {
    console.error("Directory GET error:", err);
    return NextResponse.json({ error: "Failed to load directory." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    businessName?: string;
    category?: string;
    contactName?: string;
    phone?: string;
    email?: string;
    whatsapp?: string;
    provinces?: string[];
    description?: string;
    logoUrl?: string;
    plan?: "STANDARD" | "PREMIUM";
  };

  if (
    !body.businessName?.trim() ||
    !body.category ||
    !VALID_CATEGORIES.includes(body.category) ||
    !body.contactName?.trim() ||
    !body.phone?.trim() ||
    !body.description?.trim()
  ) {
    return NextResponse.json(
      { error: "Business name, category, contact name, phone, and description are required." },
      { status: 400 },
    );
  }

  try {
    const listing = await prisma.directoryListing.create({
      data: {
        businessName: body.businessName.trim(),
        category: body.category as never,
        contactName: body.contactName.trim(),
        phone: body.phone.trim(),
        email: body.email?.trim() || null,
        whatsapp: body.whatsapp?.trim() || null,
        provinces: Array.isArray(body.provinces) ? body.provinces : [],
        description: body.description.trim(),
        logoUrl: body.logoUrl?.trim() || null,
        plan: body.plan === "PREMIUM" ? "PREMIUM" : "STANDARD",
      },
    });

    return NextResponse.json({ ok: true, listing });
  } catch (err) {
    console.error("Directory application error:", err);
    return NextResponse.json({ error: "Failed to submit application." }, { status: 500 });
  }
}
