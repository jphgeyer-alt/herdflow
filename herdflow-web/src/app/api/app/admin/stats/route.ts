// WEBSITE — herdflow-web/src/app/api/app/admin/stats/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminToken, isMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminToken(request);
  if (!isMobileUser(auth)) return auth;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalFarmers, totalAnimals, contentPublished, newFarmersThisMonth, totalHealthRecords] =
    await Promise.all([
      prisma.user.count({ where: { role: "FARMER" } }),
      prisma.farmerAnimal.count({ where: { isDeleted: false } }),
      prisma.appContent.count({ where: { status: "ACTIVE", isDeleted: false } }),
      prisma.user.count({ where: { role: "FARMER", createdAt: { gte: thisMonthStart } } }),
      prisma.farmerHealthRecord.count(),
    ]);

  return NextResponse.json({
    totalFarmers,
    totalAnimals,
    contentPublished,
    newFarmersThisMonth,
    totalHealthRecords,
    activeUsers7d: await prisma.deviceToken.count({
      where: { isActive: true, updatedAt: { gte: sevenDaysAgo } },
    }),
  });
}
