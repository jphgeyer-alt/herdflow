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
    const pkg = await prisma.marketingPackage.findUnique({ where: { id } });
    if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });
    return NextResponse.json({ package: pkg });
  } catch {
    return NextResponse.json({ error: "Failed to load package" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const pkg = await prisma.marketingPackage.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: String(body.name) }),
        ...(body.monthlyFee !== undefined && { monthlyFee: Number(body.monthlyFee) }),
        ...(body.badge !== undefined && { badge: body.badge ? String(body.badge) : null }),
        ...(body.isCustom !== undefined && { isCustom: Boolean(body.isCustom) }),
        ...(body.features !== undefined && { features: body.features as string[] }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
        ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) }),
      },
    });

    return NextResponse.json({ ok: true, package: pkg });
  } catch (err) {
    console.error("PATCH package error:", err);
    return NextResponse.json({ error: "Failed to update package" }, { status: 500 });
  }
}

// Soft delete — deactivate rather than remove, so historical quotes/invoices
// and sponsors already assigned to this package keep a valid reference.
export async function DELETE(request: NextRequest, { params }: Params) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await prisma.marketingPackage.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true, message: "Package deactivated." });
  } catch (err) {
    console.error("Deactivate package error:", err);
    return NextResponse.json({ error: "Failed to deactivate package" }, { status: 500 });
  }
}
