// WEBSITE — herdflow-web/src/app/api/app/nutrition-items/route.ts
// Nutrition/mineral supplementation inventory (phosphate/salt/protein/urea
// licks, loose mineral, creep feed) -- mirrors /api/app/medicines exactly.
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const items = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    tx.farmerNutritionItem.findMany({
      where: { farmerId: auth.effectiveFarmerId, isActive: true },
      orderBy: { name: "asc" },
    }),
  );
  return NextResponse.json(items);
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

  if (!b.name || !b.category)
    return NextResponse.json({ error: "name and category required" }, { status: 400 });

  const localId = (b.localId as string | undefined) ?? null;

  const result = await withFarmerContext(auth.effectiveFarmerId, async (tx) => {
    if (localId) {
      const existing = await tx.farmerNutritionItem.findUnique({ where: { localId } });
      if (existing) return { record: existing, created: false };
    }

    const created = await tx.farmerNutritionItem.create({
      data: {
        localId,
        farmerId: auth.effectiveFarmerId,
        name: String(b.name),
        category: String(b.category),
        unit: (b.unit as string | undefined) ?? null,
        quantityInStock: b.quantityInStock != null ? Number(b.quantityInStock) : 0,
        costPerUnit: b.costPerUnit != null ? Number(b.costPerUnit) : null,
        reorderLevel: b.reorderLevel != null ? Number(b.reorderLevel) : null,
        notes: (b.notes as string | undefined) ?? null,
      },
    });
    return { record: created, created: true };
  });

  return NextResponse.json(result.record, { status: result.created ? 201 : 200 });
}
