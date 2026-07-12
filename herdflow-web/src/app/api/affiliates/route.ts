import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placement = searchParams.get("placement");
  if (!placement) return NextResponse.json({ links: [] });

  try {
    const links = await prisma.affiliateLink.findMany({
      where: { placement, isActive: true },
      select: { id: true, name: true, imageUrl: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ links });
  } catch {
    return NextResponse.json({ links: [] });
  }
}
