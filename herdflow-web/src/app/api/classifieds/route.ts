import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getUserIdFromSession, USER_SESSION_COOKIE } from "@/lib/user-auth";
import { withUserContext } from "@/lib/tenant-prisma";
import { initiatePayment } from "@/lib/payfast/initiate";
import { env } from "@/lib/env";

const VALID_CATEGORIES = ["FARM_EQUIPMENT", "FARM_JOBS", "GRAZING_LAND", "WANTED"];

const FEE_KEY_BY_CATEGORY: Record<string, string> = {
  FARM_EQUIPMENT: "classified_equipment",
  FARM_JOBS: "classified_job",
  GRAZING_LAND: "classified_grazing",
  WANTED: "classified_wanted",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const province = searchParams.get("province");

  try {
    const classifieds = await prisma.classified.findMany({
      where: {
        status: "ACTIVE",
        ...(category && VALID_CATEGORIES.includes(category) && { category: category as never }),
        ...(province && { province }),
      },
      orderBy: [{ tier: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ classifieds });
  } catch (err) {
    console.error("Classifieds GET error:", err);
    return NextResponse.json({ error: "Failed to load classifieds." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const jar = await cookies();
  const sessionValue = jar.get(USER_SESSION_COOKIE)?.value;
  const userId = await getUserIdFromSession(sessionValue);
  if (!userId) {
    return NextResponse.json({ error: "Please sign in to post an ad." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    category?: string;
    title?: string;
    description?: string;
    price?: number;
    priceType?: string;
    province?: string;
    town?: string;
    photos?: string[];
    contactPhone?: string;
    contactWhatsApp?: string;
    jobType?: string;
    hectares?: number;
    availableFrom?: string;
    tier?: "BASIC" | "FEATURED";
  };

  if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
    return NextResponse.json({ error: "A valid category is required." }, { status: 400 });
  }
  if (!body.title?.trim() || !body.description?.trim() || !body.province?.trim() || !body.contactPhone?.trim()) {
    return NextResponse.json(
      { error: "Title, description, province, and contact phone are required." },
      { status: 400 },
    );
  }

  const tier = body.category === "FARM_EQUIPMENT" && body.tier === "FEATURED" ? "FEATURED" : "BASIC";
  const feeKey =
    tier === "FEATURED" ? "classified_equipment_featured" : FEE_KEY_BY_CATEGORY[body.category];

  try {
    const fee = await prisma.platformFee.findUnique({ where: { feeKey } });
    const feeAmount = fee ? Number(fee.amount) : 99;

    const classified = await withUserContext(userId, (tx) =>
      tx.classified.create({
        data: {
          posterId: userId,
          category: body.category as never,
          title: body.title!.trim(),
          description: body.description!.trim(),
          price: body.price ?? null,
          priceType: body.priceType || "FIXED",
          province: body.province!.trim(),
          town: body.town?.trim() || null,
          photos: Array.isArray(body.photos) ? body.photos : [],
          contactPhone: body.contactPhone!.trim(),
          contactWhatsApp: body.contactWhatsApp?.trim() || null,
          jobType: body.category === "FARM_JOBS" ? body.jobType || null : null,
          hectares: body.category === "GRAZING_LAND" && body.hectares ? body.hectares : null,
          availableFrom:
            body.category === "GRAZING_LAND" && body.availableFrom ? new Date(body.availableFrom) : null,
          tier,
          status: "DRAFT",
        },
      }),
    );

    const siteUrl = env.NEXT_PUBLIC_SITE_URL || "";
    const payment = await initiatePayment({
      reference: `CLS-${classified.id}`,
      amount: feeAmount,
      itemName: `HerdFlow Classified Ad — ${classified.title}`,
      paymentType: "LISTING_FEE",
      returnUrl: `${siteUrl}/classifieds/${classified.id}?payment=success`,
      cancelUrl: `${siteUrl}/classifieds?payment=cancelled`,
      userId,
      classifiedId: classified.id,
    });

    return NextResponse.json({ ok: true, classified, payment });
  } catch (err) {
    console.error("Classified create error:", err);
    return NextResponse.json({ error: "Failed to create ad." }, { status: 500 });
  }
}
