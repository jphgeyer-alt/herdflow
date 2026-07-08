// WEBSITE — herdflow-web/src/app/api/app/health/[id]/status/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const { id } = await ctx.params;
  const existing = await prisma.farmerHealthRecord.findFirst({ where: { id, farmerId: auth.effectiveFarmerId } });
  if (!existing) return NextResponse.json({ error: "Health record not found" }, { status: 404 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  if (!b.status) return NextResponse.json({ error: "status is required" }, { status: 400 });

  const updated = await prisma.farmerHealthRecord.update({
    where: { id },
    data: { status: String(b.status) },
  });

  return NextResponse.json(updated);
}
