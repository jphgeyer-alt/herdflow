// WEBSITE — /api/app/activity/route.ts
// Activity feed endpoint — farm owners see all team activity
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withAdminContext } from "@/lib/tenant-prisma";

export const dynamic = "force-dynamic";

// GET — fetch activity feed for the farm
export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  // Get farmer profile to determine farmId
  const profile = await prisma.farmerProfile.findUnique({ where: { userId: auth.id } });
  if (!profile) return NextResponse.json([]);

  // Farm owner sees own + all staff activity
  const farmOwnerId = profile.ownerUserId ?? auth.id;

  // Get all user IDs on this farm (owner + staff)
  const staffProfiles = await prisma.farmerProfile.findMany({
    where: { ownerUserId: farmOwnerId },
    select: { userId: true },
  });
  const userIds = [farmOwnerId, ...staffProfiles.map((s) => s.userId)];

  // Fetch activity logs from FarmerActivityLog table. FarmerActivityLog has
  // FORCE ROW LEVEL SECURITY and this route reads across every staff
  // member's rows (not just the caller's own), so it must bypass RLS
  // explicitly rather than scope to a single user/farmer context.
  try {
    const logs = await withAdminContext((tx) =>
      tx.farmerActivityLog.findMany({
        where: { userId: { in: userIds } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    );
    return NextResponse.json(logs);
  } catch {
    // Table may not exist yet — return empty
    return NextResponse.json([]);
  }
}

// POST — log an activity from the mobile app
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

  const profile = await prisma.farmerProfile.findUnique({ where: { userId: auth.id } });
  const farmId = profile?.ownerUserId ?? auth.id;

  try {
    const log = await withAdminContext((tx) =>
      tx.farmerActivityLog.create({
        data: {
          userId: auth.id,
          userName: auth.fullName,
          userRole: profile?.mobileRole ?? "FARMER",
          farmId,
          activityType: String(b.activityType ?? "UNKNOWN"),
          description: String(b.description ?? ""),
          entityId: (b.entityId as string | undefined) ?? null,
          entityType: (b.entityType as string | undefined) ?? null,
          entityName: (b.entityName as string | undefined) ?? null,
          metadata: b.metadata ? JSON.stringify(b.metadata) : null,
        },
      }),
    );
    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    // Silently fail — activity logging should never block main operations
    console.error("Activity log error:", err);
    return NextResponse.json({ ok: true });
  }
}
