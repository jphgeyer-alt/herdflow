import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const purchases = await prisma.digitalPurchase.findMany({
      where: { productId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ purchases });
  } catch {
    return NextResponse.json({ error: "Failed to load purchases." }, { status: 500 });
  }
}
