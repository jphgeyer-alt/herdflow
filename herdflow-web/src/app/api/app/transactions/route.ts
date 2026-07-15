// WEBSITE — herdflow-web/src/app/api/app/transactions/route.ts
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";
import { getAnimalForFarmer } from "@/lib/tenant-lookups";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const type = searchParams.get("type");

  const transactions = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    tx.farmerTransaction.findMany({
      where: {
        farmerId: auth.effectiveFarmerId,
        isDeleted: false,
        ...(type != null && { type }),
        ...((startDate != null || endDate != null) && {
          date: {
            ...(startDate != null && { gte: new Date(startDate) }),
            ...(endDate != null && { lte: new Date(endDate) }),
          },
        }),
      },
      orderBy: { date: "desc" },
    }),
  );

  return NextResponse.json(transactions);
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

  if (!b.type || !b.category || b.amount == null || !b.date) {
    return NextResponse.json(
      { error: "type, category, amount and date are required" },
      { status: 400 },
    );
  }

  // localId is the mobile app's local SQLite row id — needed so a later
  // DELETE (which the app can only address by its own local id) can find
  // this row, and so a retried queued POST doesn't create a duplicate.
  const localId = (b.localId as string | undefined) ?? null;

  const transaction = await withFarmerContext(auth.effectiveFarmerId, async (tx) => {
    if (b.animalId) {
      const animal = await getAnimalForFarmer(tx, String(b.animalId), auth.effectiveFarmerId);
      if (!animal) return "not-found" as const;
    }

    if (localId) {
      const existing = await tx.farmerTransaction.findUnique({ where: { localId } });
      if (existing) return existing;
    }

    return tx.farmerTransaction.create({
      data: {
        localId,
        farmerId: auth.effectiveFarmerId,
        type: String(b.type),
        category: String(b.category),
        amount: Number(b.amount),
        vatAmount: b.vatAmount != null ? Number(b.vatAmount) : 0,
        description: (b.description as string | undefined) ?? null,
        animalId: (b.animalId as string | undefined) ?? null,
        supplier: (b.supplier as string | undefined) ?? null,
        invoiceNumber: (b.invoiceNumber as string | undefined) ?? null,
        date: new Date(b.date as string),
      },
    });
  });

  if (transaction === "not-found") {
    return NextResponse.json({ error: "Animal not found" }, { status: 404 });
  }
  return NextResponse.json(transaction, { status: 201 });
}
