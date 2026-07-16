// WEBSITE — herdflow-web/src/app/api/app/breeding/[id]/route.ts
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// The mobile app's local breeding record id is a per-device SQLite
// autoincrement integer sent as `localId` on create — the app never learns
// the server's real cuid back, so every later PATCH still targets its own
// local id. Fall back to matching on `localId` so those requests resolve
// instead of 404ing, mirroring FarmerAnimal/FarmerCamp.
async function findByIdOrLocalId(tx: Prisma.TransactionClient, id: string, farmerId: string) {
  const byId = await tx.farmerBreedingRecord.findFirst({
    where: { id, farmerId, isDeleted: false },
  });
  if (byId) return byId;
  return tx.farmerBreedingRecord.findFirst({
    where: { localId: id, farmerId, isDeleted: false },
  });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;
  const { id } = await ctx.params;

  const existing = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    findByIdOrLocalId(tx, id, auth.effectiveFarmerId),
  );
  if (!existing) return NextResponse.json({ error: "Breeding record not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const data = {
    ...(b.outcome != null && { outcome: String(b.outcome) }),
    ...(b.calvingDate != null && { calvingDate: new Date(b.calvingDate as string) }),
    ...(b.offspringCount != null && { offspringCount: Number(b.offspringCount) }),
    ...(b.notes != null && { notes: String(b.notes) }),
  };

  // expectedVersion is optional — omitted by older app builds, in which case
  // this behaves exactly as an unconditional update always has.
  if (b.expectedVersion == null) {
    const updated = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
      tx.farmerBreedingRecord.update({ where: { id: existing.id }, data }),
    );
    return NextResponse.json(updated);
  }

  const result = await withFarmerContext(auth.effectiveFarmerId, async (tx) => {
    const { count } = await tx.farmerBreedingRecord.updateMany({
      where: { id: existing.id, version: Number(b.expectedVersion) },
      data: { ...data, version: { increment: 1 } },
    });
    if (count === 0) {
      const current = await tx.farmerBreedingRecord.findUnique({ where: { id: existing.id } });
      return { conflict: true as const, current };
    }
    return {
      conflict: false as const,
      current: await tx.farmerBreedingRecord.findUnique({ where: { id: existing.id } }),
    };
  });

  if (result.conflict) {
    return NextResponse.json({ conflict: true, current: result.current }, { status: 409 });
  }
  return NextResponse.json(result.current);
}
