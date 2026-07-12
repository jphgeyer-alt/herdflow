import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const categoryKey = searchParams.get("category");

  try {
    const leads = await prisma.lead.findMany({
      where: {
        ...(status && { status: status as never }),
        ...(categoryKey && { category: { key: categoryKey } }),
      },
      include: { category: { select: { key: true, displayName: true } } },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [leadsThisMonth, convertedThisMonth, totalThisMonth, commissionAgg] = await Promise.all([
      prisma.lead.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.lead.count({ where: { createdAt: { gte: monthStart }, status: "CONVERTED" } }),
      prisma.lead.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.lead.aggregate({
        where: { createdAt: { gte: monthStart }, status: "CONVERTED" },
        _sum: { commissionEarned: true },
      }),
    ]);

    const conversionRate = totalThisMonth > 0 ? (convertedThisMonth / totalThisMonth) * 100 : 0;

    return NextResponse.json({
      leads,
      stats: {
        leadsThisMonth,
        conversionRate,
        commissionThisMonth: Number(commissionAgg._sum.commissionEarned ?? 0),
      },
    });
  } catch (err) {
    console.error("Admin leads GET error:", err);
    return NextResponse.json({ error: "Failed to load leads." }, { status: 500 });
  }
}
