// WEBSITE — herdflow-web/src/app/api/app/camps/[id]/route.ts
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";
import { getCampForFarmer as findCampByIdOrLocalId } from "@/lib/tenant-lookups";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;
  const { id } = await ctx.params;
  const camp = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    findCampByIdOrLocalId(tx, id, auth.effectiveFarmerId),
  );
  if (!camp) return NextResponse.json({ error: "Camp not found" }, { status: 404 });
  return NextResponse.json(camp);
}

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;
  const { id } = await ctx.params;

  const existing = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    findCampByIdOrLocalId(tx, id, auth.effectiveFarmerId),
  );
  if (!existing) return NextResponse.json({ error: "Camp not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const data = {
    ...(b.name != null && { name: String(b.name) }),
    ...(b.number != null && { number: String(b.number) }),
    ...(b.hectares != null && { hectares: Number(b.hectares) }),
    ...(b.forageType != null && { forageType: String(b.forageType) }),
    ...(b.status != null && { currentStatus: String(b.status) }),
    ...(b.currentStatus != null && { currentStatus: String(b.currentStatus) }),
    ...(b.maxCapacity != null && { maxCarryingCapacity: Number(b.maxCapacity) }),
    ...(b.restingDaysRequired != null && { restingDaysRequired: Number(b.restingDaysRequired) }),
    ...(b.notes != null && { notes: String(b.notes) }),
    ...(b.gpsCoordinates != null && { gpsCoordinates: String(b.gpsCoordinates) }),
  };

  // expectedVersion is optional — omitted by older app builds or any entity
  // type not yet migrated to conflict detection, in which case this behaves
  // exactly as an unconditional update always has.
  if (b.expectedVersion == null) {
    const camp = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
      tx.farmerCamp.update({ where: { id: existing.id }, data }),
    );
    return NextResponse.json(camp);
  }

  const result = await withFarmerContext(auth.effectiveFarmerId, async (tx) => {
    const { count } = await tx.farmerCamp.updateMany({
      where: { id: existing.id, version: Number(b.expectedVersion) },
      data: { ...data, version: { increment: 1 } },
    });
    if (count === 0) {
      const current = await tx.farmerCamp.findUnique({ where: { id: existing.id } });
      return { conflict: true as const, current };
    }
    return { conflict: false as const, current: await tx.farmerCamp.findUnique({ where: { id: existing.id } }) };
  });

  if (result.conflict) {
    return NextResponse.json({ conflict: true, current: result.current }, { status: 409 });
  }
  return NextResponse.json(result.current);
}

export async function DELETE(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;
  const { id } = await ctx.params;

  const deleted = await withFarmerContext(auth.effectiveFarmerId, async (tx) => {
    const existing = await findCampByIdOrLocalId(tx, id, auth.effectiveFarmerId);
    if (!existing) return false;

    await tx.farmerCamp.update({ where: { id: existing.id }, data: { isDeleted: true } });
    return true;
  });
  if (!deleted) return NextResponse.json({ error: "Camp not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
