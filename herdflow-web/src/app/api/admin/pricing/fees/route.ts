import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const fees = await prisma.platformFee.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ fees });
  } catch {
    return NextResponse.json({ error: "Failed to load fees." }, { status: 500 });
  }
}
