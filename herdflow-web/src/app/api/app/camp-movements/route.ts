// WEBSITE — herdflow-web/src/app/api/app/camp-movements/route.ts
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";
import { getCampForFarmer } from "@/lib/tenant-lookups";

export const dynamic = "force-dynamic";

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

  if (!b.toCampId || !b.headCount || !b.reason) {
    return NextResponse.json({ error: "toCampId, headCount and reason required" }, { status: 400 });
  }

  // Idempotent on localId (mirrors camps/animals/medicines/treatments) — a
  // queued sync item retried after a timeout or flaky response would
  // otherwise create a duplicate movement record rather than being deduped.
  const localId = (b.localId as string | undefined) ?? null;

  const movement = await withFarmerContext(auth.effectiveFarmerId, async (tx) => {
    const toCamp = await getCampForFarmer(tx, String(b.toCampId), auth.effectiveFarmerId);
    if (!toCamp) return "not-found" as const;
    if (b.fromCampId) {
      const fromCamp = await getCampForFarmer(tx, String(b.fromCampId), auth.effectiveFarmerId);
      if (!fromCamp) return "not-found" as const;
    }

    if (localId) {
      const existing = await tx.farmerCampMovement.findFirst({
        where: { localId, farmerId: auth.effectiveFarmerId },
      });
      if (existing) return existing;
    }
    return tx.farmerCampMovement.create({
      data: {
        localId,
        farmerId: auth.effectiveFarmerId,
        fromCampId: (b.fromCampId as string | undefined) ?? null,
        fromCampName: (b.fromCampName as string | undefined) ?? null,
        toCampId: String(b.toCampId),
        toCampName: (b.toCampName as string | undefined) ?? "",
        animalIds: Array.isArray(b.animalIds)
          ? JSON.stringify(b.animalIds)
          : ((b.animalIds as string) ?? "[]"),
        headCount: Number(b.headCount),
        movedByUserId: (b.movedByUserId as string | undefined) ?? auth.id,
        movedByName: (b.movedByName as string | undefined) ?? "Unknown",
        movedByRole: (b.movedByRole as string | undefined) ?? "FARMER",
        movementDate: b.movementDate ? new Date(b.movementDate as string) : new Date(),
        reason: String(b.reason),
        notes: (b.notes as string | undefined) ?? null,
      },
    });
  });
  if (movement === "not-found") {
    return NextResponse.json({ error: "Camp not found" }, { status: 404 });
  }
  return NextResponse.json(movement, { status: 201 });
}
