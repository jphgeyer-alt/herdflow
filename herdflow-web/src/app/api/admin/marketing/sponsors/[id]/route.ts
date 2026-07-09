import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

function ensureAdmin(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function GET(request: NextRequest, { params }: Params) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const sponsor = await prisma.sponsor.findUnique({
      where: { id },
      include: { marketingPackage: true, quotes: true, invoices: true },
    });
    if (!sponsor) return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    return NextResponse.json({ sponsor });
  } catch {
    return NextResponse.json({ error: "Failed to load sponsor" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const sponsor = await prisma.sponsor.update({
      where: { id },
      data: {
        ...(body.companyName !== undefined && { companyName: String(body.companyName) }),
        ...(body.contactPerson !== undefined && { contactPerson: String(body.contactPerson) }),
        ...(body.email !== undefined && { email: String(body.email) }),
        ...(body.phone !== undefined && { phone: String(body.phone) }),
        ...(body.website !== undefined && { website: body.website ? String(body.website) : null }),
        ...(body.businessType !== undefined && { businessType: String(body.businessType) }),
        ...(body.packageId !== undefined && {
          packageId: body.packageId ? String(body.packageId) : null,
        }),
        ...(body.monthlyFee !== undefined && {
          monthlyFee: body.monthlyFee !== null ? Number(body.monthlyFee) : null,
        }),
        ...(body.targetProvinces !== undefined && {
          targetProvinces: body.targetProvinces as string[],
        }),
        ...(body.notes !== undefined && { notes: body.notes ? String(body.notes) : null }),
      },
      include: { marketingPackage: true },
    });

    return NextResponse.json({ ok: true, sponsor });
  } catch (err) {
    console.error("PATCH sponsor error:", err);
    return NextResponse.json({ error: "Failed to update sponsor" }, { status: 500 });
  }
}
