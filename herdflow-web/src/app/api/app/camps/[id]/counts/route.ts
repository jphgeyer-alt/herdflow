// WEBSITE — herdflow-web/src/app/api/app/camps/[id]/counts/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;
  const { id } = await ctx.params;

  const counts = await prisma.farmerCampCount.findMany({
    where: { campId: id, farmerId: auth.effectiveFarmerId, isDeleted: false },
    orderBy: { countDate: "desc" },
    take: 50,
  });
  return NextResponse.json(counts);
}

export async function POST(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  if (b.actualCount == null)
    return NextResponse.json({ error: "actualCount required" }, { status: 400 });

  const count = await prisma.farmerCampCount.create({
    data: {
      localId: (b.localId as string | undefined) ?? null,
      campId: id,
      farmerId: auth.effectiveFarmerId,
      countedByUserId: (b.countedByUserId as string | undefined) ?? auth.id,
      countedByName: (b.countedByName as string | undefined) ?? "Unknown",
      countedByRole: (b.countedByRole as string | undefined) ?? "FARMER",
      countDate: b.countDate ? new Date(b.countDate as string) : new Date(),
      expectedCount: b.expectedCount != null ? Number(b.expectedCount) : null,
      actualCount: Number(b.actualCount),
      variance: b.variance != null ? Number(b.variance) : null,
      varianceNotes: (b.varianceNotes as string | undefined) ?? null,
      countMethod: (b.countMethod as string | undefined) ?? "MANUAL",
    },
  });
  return NextResponse.json(count, { status: 201 });
}
