// WEBSITE — herdflow-web/src/app/api/app/animals/[id]/health/route.ts
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";
import { getAnimalForFarmer } from "@/lib/tenant-lookups";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// NOTE: FarmerHealthRecord.animalId is populated by mobile using the
// animal's local id (mobile has no way to send the real cuid), so the
// create below stores the raw path param `id`, not the resolved animal's
// real id — mirrors animals/[id]/route.ts's GET handler. Only the
// ownership check needs the id-or-localId fallback.
export async function GET(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const { id } = await ctx.params;
  const records = await withFarmerContext(auth.effectiveFarmerId, async (tx) => {
    const animal = await getAnimalForFarmer(tx, id, auth.effectiveFarmerId);
    if (!animal) return null;

    return tx.farmerHealthRecord.findMany({
      where: { animalId: id },
      orderBy: { eventDate: "desc" },
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

  if (!b.eventType) return NextResponse.json({ error: "eventType is required" }, { status: 400 });

  const record = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    tx.farmerHealthRecord.create({
      data: {
        animalId: id,
        farmerId: auth.effectiveFarmerId,
        eventType: b.eventType as string,
        description: (b.description as string | undefined) ?? null,
        diagnosis: (b.diagnosis as string | undefined) ?? null,
        treatment: (b.treatment as string | undefined) ?? null,
        vetName: (b.vetName as string | undefined) ?? null,
        severity: (b.severity as string | undefined) ?? null,
        cost: b.cost != null ? Number(b.cost) : null,
        followUpDate: b.followUpDate ? new Date(b.followUpDate as string) : null,
        documents: Array.isArray(b.documents) ? (b.documents as string[]) : [],
        eventDate: b.eventDate ? new Date(b.eventDate as string) : new Date(),
      },
    }),
  );

  return NextResponse.json(record, { status: 201 });
}
