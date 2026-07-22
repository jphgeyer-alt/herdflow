// WEBSITE — herdflow-web/src/app/api/app/farm-profile/route.ts
// Small farm-level profile fields not tied to any single animal/record — for
// now just the RMIS traceability GLN (Global Location Number), which a
// farmer enters once after registering their farm with RMIS separately, so
// it can be shown on HerdFlow's exported compliance report.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const profile = await prisma.farmerProfile.findUnique({ where: { userId: auth.id } });
  if (!profile) return NextResponse.json({ error: "Farmer profile not found" }, { status: 404 });

  return NextResponse.json({
    farmName: profile.farmName,
    traceabilityGln: profile.traceabilityGln,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const updated = await prisma.farmerProfile.update({
    where: { userId: auth.id },
    data: {
      ...(b.traceabilityGln !== undefined && {
        traceabilityGln: b.traceabilityGln ? String(b.traceabilityGln) : null,
      }),
    },
  });

  return NextResponse.json({ traceabilityGln: updated.traceabilityGln });
}
