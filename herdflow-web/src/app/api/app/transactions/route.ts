// WEBSITE — herdflow-web/src/app/api/app/transactions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate   = searchParams.get("endDate");
  const type      = searchParams.get("type");

  const transactions = await prisma.farmerTransaction.findMany({
    where: {
      farmerId: auth.effectiveFarmerId,
      ...(type != null && { type }),
      ...((startDate != null || endDate != null) && {
        date: {
          ...(startDate != null && { gte: new Date(startDate) }),
          ...(endDate   != null && { lte: new Date(endDate) }),
        },
      }),
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(transactions);
}

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  if (!b.type || !b.category || b.amount == null || !b.date) {
    return NextResponse.json({ error: "type, category, amount and date are required" }, { status: 400 });
  }

  const transaction = await prisma.farmerTransaction.create({
    data: {
      farmerId:      auth.effectiveFarmerId,
      type:          String(b.type),
      category:      String(b.category),
      amount:        Number(b.amount),
      vatAmount:      b.vatAmount != null ? Number(b.vatAmount) : 0,
      description:   (b.description   as string | undefined) ?? null,
      animalId:      (b.animalId      as string | undefined) ?? null,
      supplier:      (b.supplier      as string | undefined) ?? null,
      invoiceNumber: (b.invoiceNumber as string | undefined) ?? null,
      date:          new Date(b.date as string),
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}
