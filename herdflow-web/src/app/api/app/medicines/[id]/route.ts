// WEBSITE — herdflow-web/src/app/api/app/medicines/[id]/route.ts
// Stock updates from MedicineStockScreen (mobile): restocking (adds to
// quantityInStock, may update costPerUnit) and stock counts (corrects
// quantityInStock directly to a physically-counted value).
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";
import { getMedicineForFarmer } from "@/lib/tenant-lookups";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const { id } = await ctx.params;
  const existing = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    getMedicineForFarmer(tx, id, auth.effectiveFarmerId),
  );
  if (!existing) return NextResponse.json({ error: "Medicine not found" }, { status: 404 });

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
    tx.farmerMedicine.update({ where: { id: existing.id }, data }),
  );
  return NextResponse.json(updated);
}
