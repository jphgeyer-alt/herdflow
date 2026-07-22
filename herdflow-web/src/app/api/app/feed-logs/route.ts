// WEBSITE — herdflow-web/src/app/api/app/feed-logs/route.ts
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const campId = searchParams.get("campId");

  const logs = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    tx.farmerFeedLog.findMany({
      where: {
        farmerId: auth.effectiveFarmerId,
        isDeleted: false,
        ...(campId ? { campId } : {}),
      },
      orderBy: { feedDate: "desc" },
    }),
  );
  return NextResponse.json(logs);
}

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  if (!b.campId || !b.feedType || b.quantityKg == null || !b.feedDate) {
    return NextResponse.json(
      { error: "campId, feedType, quantityKg and feedDate are required" },
      { status: 400 },
    );
  }

  // Idempotent on localId (mirrors camps/animals/medicines/treatments) — a
  // queued sync item retried after a timeout or flaky response would
  // otherwise create a duplicate feed log rather than being deduped.
  const localId = (b.localId as string | undefined) ?? null;

  const log = await withFarmerContext(auth.effectiveFarmerId, async (tx) => {
    if (localId) {
      const existing = await tx.farmerFeedLog.findUnique({ where: { localId } });
      if (existing) return existing;
    }
    const created = await tx.farmerFeedLog.create({
      data: {
        localId,
        farmerId: auth.effectiveFarmerId,
        campId: String(b.campId),
        campName: (b.campName as string | undefined) ?? "",
        feedType: String(b.feedType),
        quantityKg: Number(b.quantityKg),
        costTotal: b.costTotal != null ? Number(b.costTotal) : null,
        feedDate: new Date(b.feedDate as string),
        notes: (b.notes as string | undefined) ?? null,
        nutritionItemId: (b.nutritionItemId as string | undefined) ?? null,
        recordedByUserId: (b.recordedByUserId as string | undefined) ?? null,
        recordedByName: (b.recordedByName as string | undefined) ?? null,
        recordedByRole: (b.recordedByRole as string | undefined) ?? null,
      },
    });

    // Deduct the amount used from the linked nutrition item's stock -- only
    // runs on a genuine new row (a retried/duplicate POST hits the localId
    // short-circuit above and never reaches here), same idempotency
    // guarantee as the treatments route's medicine-stock deduction. Reads
    // current stock and clamps at 0 rather than an uncapped decrement.
    if (b.nutritionItemId) {
      const item = await tx.farmerNutritionItem.findFirst({
        where: { id: String(b.nutritionItemId), farmerId: auth.effectiveFarmerId },
      });
      if (item) {
        const remaining = Math.max(0, Number(item.quantityInStock) - Number(b.quantityKg));
        await tx.farmerNutritionItem.update({
          where: { id: item.id },
          data: { quantityInStock: remaining },
        });
      }
    }

    return created;
  });

  return NextResponse.json(log, { status: 201 });
}
