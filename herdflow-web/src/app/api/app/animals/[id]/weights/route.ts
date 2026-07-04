// WEBSITE — herdflow-web/src/app/api/app/animals/[id]/weights/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const { id } = await ctx.params;
  const animal = await prisma.farmerAnimal.findFirst({ where: { id, farmerId: auth.id, isDeleted: false } });
  if (!animal) return NextResponse.json({ error: "Animal not found" }, { status: 404 });

  const records = await prisma.farmerWeightRecord.findMany({
    where: { animalId: id },
    orderBy: { recordedDate: "desc" },
  });

  return NextResponse.json(records);
}

export async function POST(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const { id } = await ctx.params;
  const animal = await prisma.farmerAnimal.findFirst({ where: { id, farmerId: auth.id, isDeleted: false } });
  if (!animal) return NextResponse.json({ error: "Animal not found" }, { status: 404 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  if (b.weight == null) return NextResponse.json({ error: "weight is required" }, { status: 400 });

  const [record] = await Promise.all([
    prisma.farmerWeightRecord.create({
      data: {
        animalId:          id,
        farmerId:          auth.id,
        weight:            Number(b.weight),
        bodyConditionScore:b.bodyConditionScore != null ? Number(b.bodyConditionScore) : null,
        notes:             (b.notes as string | undefined) ?? null,
        recordedDate:      b.recordedDate ? new Date(b.recordedDate as string) : new Date(),
      },
    }),
    // Update the animal's current weight
    prisma.farmerAnimal.update({
      where: { id },
      data: { weight: Number(b.weight) },
    }),
  ]);

  return NextResponse.json(record, { status: 201 });
}
