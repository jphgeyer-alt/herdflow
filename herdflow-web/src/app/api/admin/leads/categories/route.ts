import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const categories = await prisma.leadCategory.findMany({ orderBy: { displayName: "asc" } });
    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({ error: "Failed to load categories." }, { status: 500 });
  }
}
