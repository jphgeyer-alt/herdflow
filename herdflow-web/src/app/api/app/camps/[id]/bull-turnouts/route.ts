// WEBSITE — herdflow-web/src/app/api/app/camps/[id]/bull-turnouts/route.ts
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;
  const { id } = await ctx.params;

  const turnouts = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    tx.farmerBullTurnout.findMany({
      where: { campId: id, farmerId: auth.effectiveFarmerId, isDeleted: false },
      orderBy: { dateIn: "desc" },
      take: 50,
    }),
  );
  return NextResponse.json(turnouts);
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

  if (!b.bullIds || !b.dateIn) {
    return NextResponse.json({ error: "bullIds and dateIn required" }, { status: 400 });
  }

  // Idempotent on localId — the mobile app's local UUID, stored here so
  // .../bull-turnouts/[id]/route.ts can resolve later PATCH requests that
  // still target it (the app never learns the server-generated id back).
  const localId = (b.localId as string | undefined) ?? null;

  const result = await withFarmerContext(auth.effectiveFarmerId, async (tx) => {
    if (localId) {
      const existing = await tx.farmerBullTurnout.findUnique({ where: { localId } });
      if (existing) return { record: existing, created: false };
    }

    const created = await tx.farmerBullTurnout.create({
      data: {
        localId,
        farmerId: auth.effectiveFarmerId,
        campId: id,
        campName: (b.campName as string | undefined) ?? "",
        bullIds: Array.isArray(b.bullIds) ? JSON.stringify(b.bullIds) : String(b.bullIds),
        bullTags: Array.isArray(b.bullTags) ? JSON.stringify(b.bullTags) : String(b.bullTags ?? "[]"),
        dateIn: new Date(b.dateIn as string),
        dateOut: b.dateOut ? new Date(b.dateOut as string) : null,
        expectedCalvingStart: b.expectedCalvingStart
          ? new Date(b.expectedCalvingStart as string)
          : null,
        expectedCalvingEnd: b.expectedCalvingEnd ? new Date(b.expectedCalvingEnd as string) : null,
        recordedByUserId: (b.recordedByUserId as string | undefined) ?? auth.id,
        recordedByName: (b.recordedByName as string | undefined) ?? "Unknown",
        recordedByRole: (b.recordedByRole as string | undefined) ?? "FARMER",
        notes: (b.notes as string | undefined) ?? null,
      },
    });
    return { record: created, created: true };
  });
  return NextResponse.json(result.record, { status: result.created ? 201 : 200 });
}
