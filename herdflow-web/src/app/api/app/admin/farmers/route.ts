// WEBSITE — herdflow-web/src/app/api/app/admin/farmers/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminToken, isMobileUser } from "@/lib/mobile-auth";
import { withAdminContext } from "@/lib/tenant-prisma";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminToken(request);
  if (!isMobileUser(auth)) return auth;

  const url = new URL(request.url);
  const search = url.searchParams.get("search") ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "20")));
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = { role: "FARMER" };
  if (search.trim()) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  // Enrich with animal counts and farm profiles
  const enriched = await Promise.all(
    users.map(async (u) => {
      const [animalCount, profile] = await Promise.all([
        withAdminContext((tx) => tx.farmerAnimal.count({ where: { farmerId: u.id, isDeleted: false } })),
        prisma.farmerProfile.findUnique({ where: { userId: u.id } }),
      ]);
      return {
        ...u,
        farmName: profile?.farmName ?? null,
        province: profile?.province ?? null,
        animalCount,
        status: "active",
        lastActive: u.updatedAt,
      };
    }),
  );

  return NextResponse.json({
    farmers: enriched,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
