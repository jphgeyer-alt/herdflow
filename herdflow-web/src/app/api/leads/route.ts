import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendLeadToPartnerEmail, sendLeadConfirmationEmail } from "@/lib/email";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryKey = searchParams.get("category");

  try {
    if (categoryKey) {
      const category = await prisma.leadCategory.findUnique({ where: { key: categoryKey } });
      return NextResponse.json({ category });
    }
    const categories = await prisma.leadCategory.findMany({
      where: { isActive: true },
      orderBy: { displayName: "asc" },
    });
    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({ error: "Failed to load categories." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    categoryKey?: string;
    name?: string;
    phone?: string;
    email?: string;
    province?: string;
    farmName?: string;
    message?: string;
    amountSought?: number;
    livestockValue?: number;
  };

  if (!body.categoryKey || !body.name?.trim() || !body.phone?.trim() || !body.province?.trim()) {
    return NextResponse.json(
      { error: "Category, name, phone, and province are required." },
      { status: 400 },
    );
  }

  try {
    const category = await prisma.leadCategory.findUnique({ where: { key: body.categoryKey } });
    if (!category || !category.isActive) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        categoryId: category.id,
        name: body.name.trim(),
        phone: body.phone.trim(),
        email: body.email?.trim() || null,
        province: body.province.trim(),
        farmName: body.farmName?.trim() || null,
        message: body.message?.trim() || null,
        amountSought: body.amountSought ?? null,
        livestockValue: body.livestockValue ?? null,
      },
    });

    await sendLeadToPartnerEmail({
      to: category.partnerEmail,
      partnerName: category.partnerName,
      categoryName: category.displayName,
      leadName: lead.name,
      leadPhone: lead.phone,
      leadEmail: lead.email || undefined,
      province: lead.province,
      farmName: lead.farmName || undefined,
      amountLabel: lead.amountSought
        ? `Amount sought: R${Number(lead.amountSought).toLocaleString("en-ZA")}`
        : lead.livestockValue
          ? `Livestock value: R${Number(lead.livestockValue).toLocaleString("en-ZA")}`
          : undefined,
      message: lead.message || undefined,
    }).catch((err) => console.error("Lead-to-partner email failed:", err));

    if (lead.email) {
      await sendLeadConfirmationEmail({
        to: lead.email,
        leadName: lead.name,
        categoryName: category.displayName,
        partnerName: category.partnerName,
      }).catch((err) => console.error("Lead confirmation email failed:", err));
    }

    return NextResponse.json({
      ok: true,
      lead: { id: lead.id },
      useExternalRedirect: category.useExternalRedirect,
      externalUrl: category.externalUrl,
    });
  } catch (err) {
    console.error("Lead create error:", err);
    return NextResponse.json({ error: "Failed to submit your request. Please try again." }, { status: 500 });
  }
}
