// WEBSITE — herdflow-web/src/app/api/app/animals/[id]/weights/route.ts
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";
import { getAnimalForFarmer } from "@/lib/tenant-lookups";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// NOTE: FarmerWeightRecord.animalId is populated by mobile using the
// animal's local id (mobile has no way to send the real cuid), so the
// create below stores the raw path param `id` for that field — but the
// animal's own weight update at the end must use the resolved `animal.id`
// (its real primary key), since farmerAnimal.update() throws if `where`
// doesn't match a real row.
export async function GET(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const { id } = await ctx.params;
  const records = await withFarmerContext(auth.effectiveFarmerId, async (tx) => {
    const animal = await getAnimalForFarmer(tx, id, auth.effectiveFarmerId);
    if (!animal) return null;

    return tx.farmerWeightRecord.findMany({
      where: { animalId: id },
      orderBy: { recordedDate: "desc" },
    });
  });

  if (!records) return NextResponse.json({ error: "Animal not found" }, { status: 404 });

  return NextResponse.json(records);
}

export async function POST(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const { id } = await ctx.params;
  const animal = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    getAnimalForFarmer(tx, id, auth.effectiveFarmerId),
  );
  if (!animal) return NextResponse.json({ error: "Animal not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  if (b.weight == null) return NextResponse.json({ error: "weight is required" }, { status: 400 });

  const [record] = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    Promise.all([
      tx.farmerWeightRecord.create({
        data: {
          animalId: id,
          farmerId: auth.effectiveFarmerId,
          weight: Number(b.weight),
          bodyConditionScore: b.bodyConditionScore != null ? Number(b.bodyConditionScore) : null,
          notes: (b.notes as string | undefined) ?? null,
          recordedDate: b.recordedDate ? new Date(b.recordedDate as string) : new Date(),
        },
      }),
      // Update the animal's current weight
      tx.farmerAnimal.update({
        where: { id: animal.id },
        data: { weight: Number(b.weight) },
      }),
    ]),
  );

  return NextResponse.json(record, { status: 201 });
}
