// WEBSITE — herdflow-web/src/app/api/app/transactions/[id]/route.ts
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Mirrors FarmerAnimal/FarmerCamp: the mobile app's local SQLite id is never
// learned back as the real cuid, so DELETE must resolve by id OR localId.
async function getTransactionForFarmer(tx: Prisma.TransactionClient, id: string, farmerId: string) {
  const byId = await tx.farmerTransaction.findFirst({ where: { id, farmerId, isDeleted: false } });
  if (byId) return byId;
  return tx.farmerTransaction.findFirst({ where: { localId: id, farmerId, isDeleted: false } });
}

export async function DELETE(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const { id } = await ctx.params;
  const deleted = await withFarmerContext(auth.effectiveFarmerId, async (tx) => {
    const existing = await getTransactionForFarmer(tx, id, auth.effectiveFarmerId);
    if (!existing) return false;

    await tx.farmerTransaction.update({ where: { id: existing.id }, data: { isDeleted: true } });
    return true;
  });
  if (!deleted) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
