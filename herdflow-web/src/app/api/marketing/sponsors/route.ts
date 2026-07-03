import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sponsors = await prisma.sponsor.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, companyName: true, logoUrl: true, website: true },
      orderBy: { approvedAt: "desc" },
    });
    return NextResponse.json({ sponsors });
  } catch {
    return NextResponse.json({ sponsors: [] });
  }
}
