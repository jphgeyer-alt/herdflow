// WEBSITE — herdflow-web/src/app/api/app/treatments/route.ts
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";
import { getAnimalForFarmer } from "@/lib/tenant-lookups";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const animalId = searchParams.get("animalId");

  const treatments = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    tx.farmerTreatment.findMany({
      where: {
        farmerId: auth.effectiveFarmerId,
        isDeleted: false,
        ...(animalId && { animalId }),
      },
      orderBy: { treatmentDate: "desc" },
      take: 100,
    }),
  );
  return NextResponse.json(treatments);
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

  if (!b.medicineName || !b.treatmentType) {
    return NextResponse.json({ error: "medicineName and treatmentType required" }, { status: 400 });
  }

  // Idempotent on localId
  const localId = (b.localId as string | undefined) ?? null;

  const result = await withFarmerContext(auth.effectiveFarmerId, async (tx) => {
    if (b.animalId) {
      const animal = await getAnimalForFarmer(tx, String(b.animalId), auth.effectiveFarmerId);
      if (!animal) return { record: null, created: false };
    }

    if (localId) {
      const existing = await tx.farmerTreatment.findUnique({ where: { localId } });
      if (existing) return { record: existing, created: false };
    }

    const created = await tx.farmerTreatment.create({
      data: {
        localId,
        animalId: (b.animalId as string | undefined) ?? "",
        animalTag: (b.animalTag as string | undefined) ?? "",
        farmerId: auth.effectiveFarmerId,
        medicineId: (b.medicineId as string | undefined) ?? null,
        medicineName: String(b.medicineName),
        medicineCategory: (b.medicineCategory as string | undefined) ?? "GENERAL",
        treatmentType: String(b.treatmentType),
        dosage: b.dosage != null ? Number(b.dosage) : null,
        dosageUnit: (b.dosageUnit as string | undefined) ?? null,
        batchNumber: (b.batchNumber as string | undefined) ?? null,
        administeredByUserId: (b.administeredByUserId as string | undefined) ?? auth.id,
        administeredByName: (b.administeredByName as string | undefined) ?? "Unknown",
        administeredByRole: (b.administeredByRole as string | undefined) ?? "FARMER",
        treatmentDate: b.treatmentDate ? new Date(b.treatmentDate as string) : new Date(),
        nextTreatmentDate: b.nextTreatmentDate ? new Date(b.nextTreatmentDate as string) : null,
        withdrawalEndDate: b.withdrawalEndDate ? new Date(b.withdrawalEndDate as string) : null,
        campId: (b.campId as string | undefined) ?? null,
        campName: (b.campName as string | undefined) ?? null,
        diagnosis: (b.diagnosis as string | undefined) ?? null,
        symptoms: (b.symptoms as string | undefined) ?? null,
        vetName: (b.vetName as string | undefined) ?? null,
        prescriptionNumber: (b.prescriptionNumber as string | undefined) ?? null,
        cost: b.cost != null ? Number(b.cost) : null,
        notes: (b.notes as string | undefined) ?? null,
        followUpRequired: Boolean(b.followUpRequired ?? false),
        followUpDate: b.followUpDate ? new Date(b.followUpDate as string) : null,
      },
    });

    // Deduct the dosage actually used from the medicine's running stock —
    // idempotency-safe because this only runs when a *new* treatment row
    // was just created above (a retried/duplicate POST hits the localId
    // short-circuit and never reaches here).
    const dosageUsed = b.dosage != null ? Number(b.dosage) : 0;
    if (b.medicineId && dosageUsed > 0) {
      await tx.farmerMedicine.updateMany({
        where: { id: String(b.medicineId), farmerId: auth.effectiveFarmerId },
        data: { quantityInStock: { decrement: dosageUsed } },
      });
    }

    return { record: created, created: true };
  });

  if (!result.record) return NextResponse.json({ error: "Animal not found" }, { status: 404 });
  return NextResponse.json(result.record, { status: result.created ? 201 : 200 });
}
