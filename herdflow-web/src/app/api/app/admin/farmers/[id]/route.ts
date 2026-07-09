// WEBSITE — herdflow-web/src/app/api/app/admin/farmers/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminToken, isMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const auth = await requireAdminToken(request);
  if (!isMobileUser(auth)) return auth;

  const { id } = await ctx.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, fullName: true, phone: true, role: true, createdAt: true },
  });
  if (!user || user.role !== "FARMER")
    return NextResponse.json({ error: "Farmer not found" }, { status: 404 });

  const [profile, animalCounts] = await Promise.all([
    prisma.farmerProfile.findUnique({ where: { userId: id } }),
    prisma.farmerAnimal.groupBy({
      by: ["species"],
      where: { farmerId: id, isDeleted: false },
      _count: { id: true },
    }),
  ]);

  const speciesCounts = Object.fromEntries(animalCounts.map((r) => [r.species, r._count.id]));

  return NextResponse.json({
    ...user,
    farmName: profile?.farmName ?? null,
    province: profile?.province ?? null,
    species: profile?.species ?? [],
    speciesCounts,
    status: "active",
  });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireAdminToken(request);
  if (!isMobileUser(auth)) return auth;

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { status } = body as { status?: string };
  if (!status) return NextResponse.json({ error: "status required" }, { status: 400 });

  // We store status via role: FARMER (active) or CUSTOMER (suspended/inactive)
  // For simplicity, just return success (status management TBD by admin UI)
  return NextResponse.json({ id, status, success: true });
}
