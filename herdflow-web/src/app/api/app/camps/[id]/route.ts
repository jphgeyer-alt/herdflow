// WEBSITE — herdflow-web/src/app/api/app/camps/[id]/route.ts
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// The mobile app generates its own local UUID as a camp's primary key, then
// the backend generates a DIFFERENT id (cuid) when the create syncs. The
// mobile app has no way to learn that server id back — every PATCH/DELETE
// it later sends still targets its own local id. So: look up by the real
// `id` first, and if nothing matches, fall back to matching on `localId`
// (which POST already stores) — this is what actually makes edits/deletes
// from the app reach the backend at all instead of silently 404ing.
async function findCampByIdOrLocalId(tx: Prisma.TransactionClient, id: string, farmerId: string) {
  const byId = await tx.farmerCamp.findFirst({ where: { id, farmerId, isDeleted: false } });
  if (byId) return byId;
  return tx.farmerCamp.findFirst({ where: { localId: id, farmerId, isDeleted: false } });
}

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

  const camp = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    tx.farmerCamp.update({
      where: { id: existing.id },
      data: {
        ...(b.name != null && { name: String(b.name) }),
        ...(b.number != null && { number: String(b.number) }),
        ...(b.hectares != null && { hectares: Number(b.hectares) }),
        ...(b.forageType != null && { forageType: String(b.forageType) }),
        ...(b.status != null && { currentStatus: String(b.status) }),
        ...(b.currentStatus != null && { currentStatus: String(b.currentStatus) }),
        ...(b.maxCapacity != null && { maxCarryingCapacity: Number(b.maxCapacity) }),
        ...(b.notes != null && { notes: String(b.notes) }),
        ...(b.gpsCoordinates != null && { gpsCoordinates: String(b.gpsCoordinates) }),
      },
    }),
  );
  return NextResponse.json(camp);
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
