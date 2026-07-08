// WEBSITE — herdflow-web/src/app/api/app/medicines/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const medicines = await prisma.farmerMedicine.findMany({
    where: { farmerId: auth.id, isActive: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(medicines);
}

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  if (!b.name || !b.category) return NextResponse.json({ error: "name and category required" }, { status: 400 });

  // Idempotent on localId
  const localId = (b.localId as string | undefined) ?? null;
  if (localId) {
    const existing = await prisma.farmerMedicine.findUnique({ where: { localId } });
    if (existing) return NextResponse.json(existing);
  }

  const medicine = await prisma.farmerMedicine.create({
    data: {
      localId,
      farmerId:             auth.id,
      name:                 String(b.name),
      category:             String(b.category),
      manufacturer:         (b.manufacturer as string | undefined) ?? null,
      withdrawalPeriodDays: b.withdrawalPeriodDays != null ? Number(b.withdrawalPeriodDays) : null,
      dosageUnit:           (b.dosageUnit as string | undefined) ?? null,
      standardDosage:       b.standardDosage != null ? Number(b.standardDosage) : null,
      storageInstructions:  (b.storageInstructions as string | undefined) ?? null,
      notes:                (b.notes as string | undefined) ?? null,
    },
  });
  return NextResponse.json(medicine, { status: 201 });
}
