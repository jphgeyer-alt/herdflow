import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApprovedSeller } from "@/lib/seller-auth";

export async function GET() {
  const seller = await getApprovedSeller();
  if (!seller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const categories = await prisma.category.findMany({
      where: { kind: { in: ["PRODUCT", "BOTH"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({ error: "Failed to load categories." }, { status: 500 });
  }
}
