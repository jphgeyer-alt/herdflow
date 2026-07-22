// WEBSITE — herdflow-web/src/app/api/app/nutrition-items/[id]/route.ts
// Stock updates from NutritionStockScreen (mobile) -- mirrors
// /api/app/medicines/[id] exactly.
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";
import { getNutritionItemForFarmer } from "@/lib/tenant-lookups";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const { id } = await ctx.params;
  const existing = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    getNutritionItemForFarmer(tx, id, auth.effectiveFarmerId),
  );
  if (!existing) return NextResponse.json({ error: "Nutrition item not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const data = {
    ...(b.quantityInStock != null && { quantityInStock: Number(b.quantityInStock) }),
    ...(b.costPerUnit !== undefined && {
      costPerUnit: b.costPerUnit != null ? Number(b.costPerUnit) : null,
    }),
    ...(b.reorderLevel !== undefined && {
      reorderLevel: b.reorderLevel != null ? Number(b.reorderLevel) : null,
    }),
  };

  const updated = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    tx.farmerNutritionItem.update({ where: { id: existing.id }, data }),
  );
  return NextResponse.json(updated);
}
