// WEBSITE — /api/app/farm-code/route.ts
// Returns the farm code for the authenticated farmer, and their staff list
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";

export async function GET(request: Request) {
  const userOrError = await requireMobileUser(request);
  if (!isMobileUser(userOrError)) return userOrError;
  const userId = userOrError.id;

  try {
    const profile = await prisma.farmerProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ error: "Farmer profile not found" }, { status: 404 });

    // Get all staff linked to this farmer (separate user lookups since no relation defined)
    const staffProfiles = await prisma.farmerProfile.findMany({
      where: { ownerUserId: userId },
    });
    const staffWithUsers = await Promise.all(
      staffProfiles.map(async (s) => {
        const u = await prisma.user.findUnique({
          where: { id: s.userId },
          select: { fullName: true, email: true, createdAt: true },
        });
        return {
          id: s.userId,
          name: u?.fullName ?? "",
          email: u?.email ?? "",
          role: s.mobileRole,
          joinedAt: u?.createdAt ?? "",
        };
      }),
    );

    return NextResponse.json({
      farmCode: profile.farmCode,
      farmName: profile.farmName,
      mobileRole: profile.mobileRole,
      staff: staffWithUsers,
    });
  } catch (err) {
    console.error("GET /api/app/farm-code error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
