// WEBSITE — herdflow-web/src/app/api/app/sync/route.ts
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";

export const dynamic = "force-dynamic";

interface SyncChange {
  type: string;
  data: Record<string, unknown>;
  localId: string;
  timestamp: string;
}

interface SyncResult {
  localId: string;
  serverId?: string;
  success: boolean;
  error?: string;
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

  const { changes } = body as { changes: SyncChange[] };
  if (!Array.isArray(changes))
    return NextResponse.json({ error: "changes array required" }, { status: 400 });

  const results: SyncResult[] = [];

  for (const change of changes) {
    try {
      switch (change.type) {
        case "CREATE_ANIMAL": {
          const d = change.data;
          const animal = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
            tx.farmerAnimal.create({
              data: {
                farmerId: auth.effectiveFarmerId,
                tagNumber:
                  (d.tag as string | undefined) ?? (d.tagNumber as string | undefined) ?? null,
                name: (d.name as string | undefined) ?? null,
                species: (d.species as string) || "cattle",
                breed: (d.breed as string | undefined) ?? null,
                gender: (d.gender as string | undefined) ?? null,
                dateOfBirth: d.birthDate ? new Date(d.birthDate as string) : null,
                weight: d.weight != null ? Number(d.weight) : null,
                notes: (d.note as string | undefined) ?? null,
                status: (d.status as string | undefined) ?? "ACTIVE",
                healthStatus: (d.healthStatus as string | undefined) ?? "HEALTHY",
              },
            }),
          );
          results.push({ localId: change.localId, serverId: animal.id, success: true });
          break;
        }

        case "UPDATE_ANIMAL": {
          const d = change.data;
          await withFarmerContext(auth.effectiveFarmerId, (tx) =>
            tx.farmerAnimal.updateMany({
              where: { id: d.id as string, farmerId: auth.effectiveFarmerId },
              data: {
                ...(d.tag != null && { tagNumber: String(d.tag) }),
                ...(d.name != null && { name: String(d.name) }),
                ...(d.species != null && { species: String(d.species) }),
                ...(d.breed != null && { breed: String(d.breed) }),
                ...(d.gender != null && { gender: String(d.gender) }),
                ...(d.weight != null && { weight: Number(d.weight) }),
                ...(d.status != null && { status: String(d.status) }),
                ...(d.healthStatus != null && { healthStatus: String(d.healthStatus) }),
                ...(d.isDeleted != null && { isDeleted: Boolean(d.isDeleted) }),
              },
            }),
          );
          results.push({ localId: change.localId, serverId: d.id as string, success: true });
          break;
        }

        case "CREATE_HEALTH": {
          const d = change.data;
          const record = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
            tx.farmerHealthRecord.create({
              data: {
                animalId: d.animalId as string,
                farmerId: auth.effectiveFarmerId,
                eventType: (d.type as string) || (d.eventType as string) || "Check-up",
                description: (d.description as string | undefined) ?? null,
                treatment: (d.treatment as string | undefined) ?? null,
                vetName: (d.vetName as string | undefined) ?? null,
                cost: d.cost != null ? Number(d.cost) : null,
                documents: [],
                eventDate: d.eventDate ? new Date(d.eventDate as string) : new Date(),
              },
            }),
          );
          results.push({ localId: change.localId, serverId: record.id, success: true });
          break;
        }

        case "CREATE_WEIGHT": {
          const d = change.data;
          const record = await withFarmerContext(auth.effectiveFarmerId, async (tx) => {
            const created = await tx.farmerWeightRecord.create({
              data: {
                animalId: d.animalId as string,
                farmerId: auth.effectiveFarmerId,
                weight: Number(d.weight),
                notes: (d.notes as string | undefined) ?? null,
                recordedDate: d.recordedDate ? new Date(d.recordedDate as string) : new Date(),
              },
            });
            if (d.animalId) {
              await tx.farmerAnimal.updateMany({
                where: { id: d.animalId as string, farmerId: auth.effectiveFarmerId },
                data: { weight: Number(d.weight) },
              });
            }
            return created;
          });
          results.push({ localId: change.localId, serverId: record.id, success: true });
          break;
        }

        case "CREATE_VACCINATION": {
          const d = change.data;
          const vacc = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
            tx.farmerVaccination.create({
              data: {
                animalId: d.animalId as string,
                farmerId: auth.effectiveFarmerId,
                vaccineName: (d.vaccineName as string) || (d.name as string) || "Unknown",
                nextDueDate: d.nextDueDate ? new Date(d.nextDueDate as string) : null,
                status: (d.status as string | undefined) ?? "SCHEDULED",
                notes: (d.note as string | undefined) ?? null,
              },
            }),
          );
          results.push({ localId: change.localId, serverId: vacc.id, success: true });
          break;
        }

        case "UPDATE_VACCINATION": {
          const d = change.data;
          await withFarmerContext(auth.effectiveFarmerId, (tx) =>
            tx.farmerVaccination.updateMany({
              where: { id: d.id as string, farmerId: auth.effectiveFarmerId },
              data: {
                ...(d.status != null && { status: String(d.status) }),
                ...(d.vaccinatedDate != null && {
                  vaccinatedDate: new Date(d.vaccinatedDate as string),
                }),
                ...(d.notes != null && { notes: String(d.notes) }),
              },
            }),
          );
          results.push({ localId: change.localId, serverId: d.id as string, success: true });
          break;
        }

        default:
          results.push({
            localId: change.localId,
            success: false,
            error: `Unknown change type: ${change.type}`,
          });
      }
    } catch (err) {
      results.push({
        localId: change.localId,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const failed = results.filter((r) => !r.success).length;
  return NextResponse.json({ processed: changes.length, failed, results });
}
