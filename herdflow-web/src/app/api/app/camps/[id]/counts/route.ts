// WEBSITE — herdflow-web/src/app/api/app/camps/[id]/counts/route.ts
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";
import { getCampForFarmer } from "@/lib/tenant-lookups";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;
  const { id } = await ctx.params;

  const counts = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    tx.farmerCampCount.findMany({
      where: { campId: id, farmerId: auth.effectiveFarmerId, isDeleted: false },
      orderBy: { countDate: "desc" },
      take: 50,
    }),
  );
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

  // Idempotent on localId (mirrors camps/animals/medicines/treatments) — a
  // queued sync item retried after a timeout or flaky response would
  // otherwise create a duplicate count session rather than being deduped.
  const localId = (b.localId as string | undefined) ?? null;

  const count = await withFarmerContext(auth.effectiveFarmerId, async (tx) => {
    const camp = await getCampForFarmer(tx, id, auth.effectiveFarmerId);
    if (!camp) return "not-found" as const;

    if (localId) {
      const existing = await tx.farmerCampCount.findFirst({
        where: { localId, farmerId: auth.effectiveFarmerId },
      });
      if (existing) return existing;
    }
    return tx.farmerCampCount.create({
      data: {
        localId,
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
        bullsCount: b.bullsCount != null ? Number(b.bullsCount) : null,
        cowsCount: b.cowsCount != null ? Number(b.cowsCount) : null,
        heifersCount: b.heifersCount != null ? Number(b.heifersCount) : null,
        calvesCount: b.calvesCount != null ? Number(b.calvesCount) : null,
      },
    });
  });
  if (count === "not-found") return NextResponse.json({ error: "Camp not found" }, { status: 404 });
  return NextResponse.json(count, { status: 201 });
}
