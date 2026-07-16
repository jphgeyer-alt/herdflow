// WEBSITE — herdflow-web/src/app/api/app/breeding/route.ts
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const records = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    tx.farmerBreedingRecord.findMany({
      where: { farmerId: auth.effectiveFarmerId, isDeleted: false },
      orderBy: { breedingDate: "desc" },
    }),
  );
  return NextResponse.json(records);
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

  if (!b.femaleAnimalId || !b.breedingDate || !b.species) {
    return NextResponse.json(
      { error: "femaleAnimalId, breedingDate and species are required" },
      { status: 400 },
    );
  }

  // Idempotent on localId (mirrors camps/animals/medicines/treatments) — a
  // queued sync item retried after a timeout or flaky response would
  // otherwise create a duplicate breeding record rather than being deduped.
  const localId = (b.localId as string | undefined) ?? null;

  const record = await withFarmerContext(auth.effectiveFarmerId, async (tx) => {
    if (localId) {
      const existing = await tx.farmerBreedingRecord.findUnique({ where: { localId } });
      if (existing) return existing;
    }
    return tx.farmerBreedingRecord.create({
      data: {
        localId,
        farmerId: auth.effectiveFarmerId,
        femaleAnimalId: String(b.femaleAnimalId),
        femaleAnimalTag: (b.femaleAnimalTag as string | undefined) ?? "",
        maleAnimalId: (b.maleAnimalId as string | undefined) ?? null,
        maleAnimalTag: (b.maleAnimalTag as string | undefined) ?? null,
        species: String(b.species),
        breedingDate: new Date(b.breedingDate as string),
        expectedDueDate: b.expectedDueDate ? new Date(b.expectedDueDate as string) : null,
        outcome: (b.outcome as string | undefined) ?? "PENDING",
        notes: (b.notes as string | undefined) ?? null,
      },
    });
  });

  return NextResponse.json(record, { status: 201 });
}
