// WEBSITE — herdflow-web/src/app/api/app/health/[id]/status/route.ts
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const { id } = await ctx.params;
  const existing = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    tx.farmerHealthRecord.findFirst({
      where: { id, farmerId: auth.effectiveFarmerId },
    }),
  );
  if (!existing) return NextResponse.json({ error: "Health record not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  if (!b.status) return NextResponse.json({ error: "status is required" }, { status: 400 });

  // expectedVersion is optional — omitted by older app builds, in which case
  // this behaves exactly as an unconditional update always has.
  if (b.expectedVersion == null) {
    const updated = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
      tx.farmerHealthRecord.update({ where: { id }, data: { status: String(b.status) } }),
    );
    return NextResponse.json(updated);
  }

  const result = await withFarmerContext(auth.effectiveFarmerId, async (tx) => {
    const { count } = await tx.farmerHealthRecord.updateMany({
      where: { id, version: Number(b.expectedVersion) },
      data: { status: String(b.status), version: { increment: 1 } },
    });
    if (count === 0) {
      const current = await tx.farmerHealthRecord.findUnique({ where: { id } });
      return { conflict: true as const, current };
    }
    return {
      conflict: false as const,
      current: await tx.farmerHealthRecord.findUnique({ where: { id } }),
    };
  });

  if (result.conflict) {
    return NextResponse.json({ conflict: true, current: result.current }, { status: 409 });
  }
  return NextResponse.json(result.current);
}
