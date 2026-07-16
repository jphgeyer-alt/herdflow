// WEBSITE — herdflow-web/src/app/api/app/bull-turnouts/[id]/route.ts
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Only supports setting/updating dateOut (recording when the bull(s) were
// removed from the camp) — every other field is set once at creation.
export async function PATCH(request: Request, ctx: Ctx) {
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

  // The mobile app's local UUID (used as its own primary key) is never
  // reconciled with the cuid this record's create returned, so PATCH
  // requests still target the local id — fall back to matching on localId.
  const existing = await withFarmerContext(auth.effectiveFarmerId, async (tx) => {
    const byId = await tx.farmerBullTurnout.findFirst({
      where: { id, farmerId: auth.effectiveFarmerId, isDeleted: false },
    });
    if (byId) return byId;
    return tx.farmerBullTurnout.findFirst({
      where: { localId: id, farmerId: auth.effectiveFarmerId, isDeleted: false },
    });
  });
  if (!existing) return NextResponse.json({ error: "Turnout not found" }, { status: 404 });

  const data = {
    ...(b.dateOut != null && { dateOut: new Date(b.dateOut as string) }),
    ...(b.notes != null && { notes: String(b.notes) }),
  };

  // expectedVersion is optional — omitted by older app builds, in which case
  // this behaves exactly as an unconditional update always has.
  if (b.expectedVersion == null) {
    const updated = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
      tx.farmerBullTurnout.update({ where: { id: existing.id }, data }),
    );
    return NextResponse.json(updated);
  }

  const result = await withFarmerContext(auth.effectiveFarmerId, async (tx) => {
    const { count } = await tx.farmerBullTurnout.updateMany({
      where: { id: existing.id, version: Number(b.expectedVersion) },
      data: { ...data, version: { increment: 1 } },
    });
    if (count === 0) {
      const current = await tx.farmerBullTurnout.findUnique({ where: { id: existing.id } });
      return { conflict: true as const, current };
    }
    return {
      conflict: false as const,
      current: await tx.farmerBullTurnout.findUnique({ where: { id: existing.id } }),
    };
  });

  if (result.conflict) {
    return NextResponse.json({ conflict: true, current: result.current }, { status: 409 });
  }
  return NextResponse.json(result.current);
}
