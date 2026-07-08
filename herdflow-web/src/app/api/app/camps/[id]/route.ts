// WEBSITE — herdflow-web/src/app/api/app/camps/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;
  const { id } = await ctx.params;
  const camp = await prisma.farmerCamp.findFirst({
    where: { id, farmerId: auth.effectiveFarmerId, isDeleted: false },
  });
  if (!camp) return NextResponse.json({ error: "Camp not found" }, { status: 404 });
  return NextResponse.json(camp);
}

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;
  const { id } = await ctx.params;

  const existing = await prisma.farmerCamp.findFirst({ where: { id, farmerId: auth.effectiveFarmerId } });
  if (!existing) return NextResponse.json({ error: "Camp not found" }, { status: 404 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const camp = await prisma.farmerCamp.update({
    where: { id },
    data: {
      ...(b.name         != null && { name:                String(b.name) }),
      ...(b.number       != null && { number:              String(b.number) }),
      ...(b.hectares     != null && { hectares:            Number(b.hectares) }),
      ...(b.forageType   != null && { forageType:          String(b.forageType) }),
      ...(b.status       != null && { currentStatus:       String(b.status) }),
      ...(b.currentStatus!= null && { currentStatus:       String(b.currentStatus) }),
      ...(b.maxCapacity  != null && { maxCarryingCapacity: Number(b.maxCapacity) }),
      ...(b.notes        != null && { notes:               String(b.notes) }),
      ...(b.gpsCoordinates!=null && { gpsCoordinates:      String(b.gpsCoordinates) }),
    },
  });
  return NextResponse.json(camp);
}

export async function DELETE(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;
  const { id } = await ctx.params;

  const existing = await prisma.farmerCamp.findFirst({ where: { id, farmerId: auth.effectiveFarmerId } });
  if (!existing) return NextResponse.json({ error: "Camp not found" }, { status: 404 });

  await prisma.farmerCamp.update({ where: { id }, data: { isDeleted: true } });
  return NextResponse.json({ success: true });
}
