import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const packages = await prisma.marketingPackage.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ packages });
  } catch {
    return NextResponse.json({ error: "Failed to load packages." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    monthlyFee?: number;
    badge?: string;
    isCustom?: boolean;
    features?: string[];
    sortOrder?: number;
  };

  const name = (body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  try {
    const slugBase = toSlug(name);
    const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

    const created = await prisma.marketingPackage.create({
      data: {
        slug,
        name,
        monthlyFee: Number(body.monthlyFee ?? 0),
        badge: body.badge?.trim() || null,
        isCustom: Boolean(body.isCustom),
        features: Array.isArray(body.features) ? body.features.filter(Boolean) : [],
        sortOrder: Number(body.sortOrder ?? 0),
      },
    });

    return NextResponse.json({ ok: true, package: created });
  } catch (err) {
    console.error("Create package error:", err);
    return NextResponse.json({ error: "Failed to create package." }, { status: 500 });
  }
}
