import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const companyName = (body.companyName as string | undefined)?.trim() || "";
  const contactPerson = (body.contactPerson as string | undefined)?.trim() || "";
  const email = (body.email as string | undefined)?.trim() || "";
  const phone = (body.phone as string | undefined)?.trim() || "";
  const website = (body.website as string | undefined)?.trim() || undefined;
  const businessType = (body.businessType as string | undefined)?.trim() || "";
  const pkg = (body.package as string | undefined)?.trim() || "";
  const targetProvinces = Array.isArray(body.targetProvinces)
    ? (body.targetProvinces as string[])
    : [];
  const marketingGoal = (body.marketingGoal as string | undefined)?.trim() || "";
  const brief = (body.brief as string | undefined)?.trim() || undefined;
  const logoUrl = (body.logoUrl as string | undefined)?.trim() || undefined;

  // Validation
  if (!companyName)
    return NextResponse.json({ error: "Company name is required." }, { status: 400 });
  if (!contactPerson)
    return NextResponse.json({ error: "Contact person is required." }, { status: 400 });
  if (!email || !/\S+@\S+\.\S+/.test(email))
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "Phone is required." }, { status: 400 });
  if (!businessType)
    return NextResponse.json({ error: "Business type is required." }, { status: 400 });
  if (!pkg) return NextResponse.json({ error: "Package selection is required." }, { status: 400 });
  if (!marketingGoal)
    return NextResponse.json({ error: "Marketing goal is required." }, { status: 400 });

  try {
    const sponsor = await prisma.sponsor.create({
      data: {
        companyName,
        contactPerson,
        email,
        phone,
        website,
        businessType,
        package: pkg,
        targetProvinces,
        marketingGoal,
        brief,
        logoUrl,
        bannerUrls: [],
        status: "PENDING",
      },
    });

    return NextResponse.json({ ok: true, id: sponsor.id });
  } catch (err: unknown) {
    // Unique email violation
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An application with this email already exists." },
        { status: 409 },
      );
    }
    console.error("Sponsor registration error:", err);
    return NextResponse.json(
      { error: "Unable to submit application. Please try again." },
      { status: 500 },
    );
  }
}
