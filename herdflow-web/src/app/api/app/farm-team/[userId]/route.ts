// WEBSITE — herdflow-web/src/app/api/app/farm-team/[userId]/route.ts
// Removes a staff member (farm manager/worker) from the calling farmer's
// team. This does NOT delete their user account — it just detaches them
// from this farm (clears FarmerProfile.ownerUserId, resets mobileRole to
// the "FARMER" default), the same fields /api/auth/register sets when
// someone *joins* a farm via an invite code, reversed.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";

type Ctx = { params: Promise<{ userId: string }> };

export async function DELETE(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;
  const { userId } = await ctx.params;

  try {
    const staffProfile = await prisma.farmerProfile.findUnique({ where: { userId } });
    if (!staffProfile || staffProfile.ownerUserId !== auth.id) {
      // Either this user isn't staff at all, or they belong to a different
      // farm — either way, the caller has no authority to remove them.
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    await prisma.farmerProfile.update({
      where: { userId },
      data: { ownerUserId: null, mobileRole: "FARMER" },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/app/farm-team/[userId] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
