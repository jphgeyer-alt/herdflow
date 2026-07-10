// WEBSITE — herdflow-web/src/app/api/app/animals/route.ts
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  try {
    const animals = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
      tx.farmerAnimal.findMany({
        where: { farmerId: auth.effectiveFarmerId, isDeleted: false },
        orderBy: { createdAt: "desc" },
      }),
    );
    return NextResponse.json(animals);
  } catch (err) {
    console.error("[GET /api/app/animals]", err);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
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

  if (!b.species) return NextResponse.json({ error: "species is required" }, { status: 400 });

  try {
    const animal = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
      tx.farmerAnimal.create({
        data: {
          farmerId: auth.effectiveFarmerId,
          tagNumber: (b.tag as string | undefined) ?? (b.tagNumber as string | undefined) ?? null,
          name: (b.name as string | undefined) ?? null,
          species: b.species as string,
          breed: (b.breed as string | undefined) ?? null,
          gender: (b.gender as string | undefined) ?? null,
          dateOfBirth: b.birthDate ? new Date(b.birthDate as string) : null,
          weight: b.weight != null ? Number(b.weight) : null,
          camp: (b.campId as string | undefined) ?? null,
          notes: (b.note as string | undefined) ?? null,
          status: (b.status as string | undefined) ?? "ACTIVE",
          healthStatus: (b.healthStatus as string | undefined) ?? "HEALTHY",
          photos: Array.isArray(b.photos) ? (b.photos as string[]) : [],
        },
      }),
    );
    return NextResponse.json(animal, { status: 201 });
  } catch (err) {
    console.error("[POST /api/app/animals]", err);
    return NextResponse.json({ error: "Failed to create animal" }, { status: 500 });
  }
}
