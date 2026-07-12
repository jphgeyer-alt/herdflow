import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = request.nextUrl.searchParams.get("status");

  try {
    const listings = await prisma.directoryListing.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ listings });
  } catch (err) {
    console.error("Admin directory GET error:", err);
    return NextResponse.json({ error: "Failed to load directory listings." }, { status: 500 });
  }
}
