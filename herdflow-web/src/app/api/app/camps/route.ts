// WEBSITE — herdflow-web/src/app/api/app/camps/route.ts
// Multi-tenant: every query filters by farmerId extracted from the Bearer token.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const camps = await prisma.farmerCamp.findMany({
    where: { farmerId: auth.effectiveFarmerId, isDeleted: false },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(camps);
}

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  if (!b.name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  // Idempotent: if the localId already exists, return the existing record
  const localId = (b.localId as string | undefined) ?? null;
  if (localId) {
    const existing = await prisma.farmerCamp.findUnique({ where: { localId } });
    if (existing) return NextResponse.json(existing);
  }

  const camp = await prisma.farmerCamp.create({
    data: {
      localId,
      farmerId:            auth.id,
      name:                String(b.name),
      number:              (b.number as string | undefined) ?? null,
      hectares:            b.hectares != null ? Number(b.hectares) : null,
      forageType:          (b.forageType as string | undefined) ?? null,
      currentStatus:       (b.status as string | undefined) ?? (b.currentStatus as string | undefined) ?? "RESTING",
      maxCarryingCapacity: b.maxCapacity != null ? Number(b.maxCapacity) : null,
      restingDaysRequired: b.restingDaysRequired != null ? Number(b.restingDaysRequired) : 42,
      gpsCoordinates:      (b.gpsCoordinates as string | undefined) ?? null,
      notes:               (b.notes as string | undefined) ?? null,
    },
  });
  return NextResponse.json(camp, { status: 201 });
}
