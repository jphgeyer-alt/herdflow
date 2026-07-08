// WEBSITE — herdflow-web/src/app/api/app/camp-movements/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  if (!b.toCampId || !b.headCount || !b.reason) {
    return NextResponse.json({ error: "toCampId, headCount and reason required" }, { status: 400 });
  }

  const movement = await prisma.farmerCampMovement.create({
    data: {
      localId:        (b.localId      as string | undefined) ?? null,
      farmerId:       auth.id,
      fromCampId:     (b.fromCampId   as string | undefined) ?? null,
      fromCampName:   (b.fromCampName as string | undefined) ?? null,
      toCampId:       String(b.toCampId),
      toCampName:     (b.toCampName   as string | undefined) ?? "",
      animalIds:      Array.isArray(b.animalIds) ? JSON.stringify(b.animalIds) : (b.animalIds as string ?? "[]"),
      headCount:      Number(b.headCount),
      movedByUserId:  (b.movedByUserId as string | undefined) ?? auth.id,
      movedByName:    (b.movedByName   as string | undefined) ?? "Unknown",
      movedByRole:    (b.movedByRole   as string | undefined) ?? "FARMER",
      movementDate:   b.movementDate ? new Date(b.movementDate as string) : new Date(),
      reason:         String(b.reason),
      notes:          (b.notes as string | undefined) ?? null,
    },
  });
  return NextResponse.json(movement, { status: 201 });
}
