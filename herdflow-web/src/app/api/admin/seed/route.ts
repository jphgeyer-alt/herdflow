import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function ensureAdmin(request: NextRequest) {
  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return isValidAdminSession(session);
}

const DEFAULT_CATEGORIES = [
  { name: "Cattle", slug: "cattle", kind: "LIVESTOCK" },
  { name: "Sheep", slug: "sheep", kind: "LIVESTOCK" },
  { name: "Goats", slug: "goats", kind: "LIVESTOCK" },
  { name: "Pigs", slug: "pigs", kind: "LIVESTOCK" },
  { name: "Horses", slug: "horses", kind: "LIVESTOCK" },
  { name: "Poultry", slug: "poultry", kind: "LIVESTOCK" },
  { name: "Livestock Feed", slug: "livestock-feed", kind: "PRODUCT" },
  { name: "Equipment", slug: "equipment", kind: "PRODUCT" },
  { name: "Supplements", slug: "supplements", kind: "PRODUCT" },
  { name: "Veterinary Supplies", slug: "veterinary-supplies", kind: "PRODUCT" },
  { name: "Other", slug: "other", kind: "BOTH" },
] as const;

export async function POST(request: NextRequest) {
  if (!ensureAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let created = 0;
    for (const cat of DEFAULT_CATEGORIES) {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: { name: cat.name, slug: cat.slug, kind: cat.kind as "LIVESTOCK" | "PRODUCT" | "BOTH" },
      });
      created++;
    }

    const categories = await prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
    return NextResponse.json({ ok: true, created, categories });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json({ error: "Failed to seed categories" }, { status: 500 });
  }
}
