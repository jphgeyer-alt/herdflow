// WEBSITE — herdflow-web/src/app/api/app/vaccinations/[id]/route.ts
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const { id } = await ctx.params;
  const existing = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    tx.farmerVaccination.findFirst({
      where: { id, farmerId: auth.effectiveFarmerId },
    }),
  );
  if (!existing)
    return NextResponse.json({ error: "Vaccination record not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const updated = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    tx.farmerVaccination.update({
      where: { id },
      data: {
        ...(b.status != null && { status: String(b.status) }),
        ...(b.status === "COMPLETED" && { vaccinatedDate: new Date() }),
        ...(b.vaccinatedDate != null && { vaccinatedDate: new Date(b.vaccinatedDate as string) }),
        ...(b.notes != null && { notes: String(b.notes) }),
        ...(b.nextDueDate != null && { nextDueDate: new Date(b.nextDueDate as string) }),
      },
    }),
  );

  return NextResponse.json(updated);
}
