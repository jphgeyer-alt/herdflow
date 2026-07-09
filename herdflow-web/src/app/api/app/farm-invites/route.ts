// WEBSITE — /api/app/farm-invites/route.ts
// Generate and validate farm invite codes for linking workers/managers to farm owners
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";

/** Generate a readable XXXX-XXXX invite code */
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${part(4)}-${part(4)}`;
}

// POST — generate a new invite code
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
  const role = (b.role as string | undefined)?.toUpperCase();

  if (!role || !["FARM_MANAGER", "FARM_WORKER"].includes(role)) {
    return NextResponse.json(
      { error: "role must be FARM_MANAGER or FARM_WORKER" },
      { status: 400 },
    );
  }

  // Farmer must have a FarmerProfile with farmCode
  const profile = await prisma.farmerProfile.findUnique({ where: { userId: auth.id } });
  if (!profile || !profile.farmCode) {
    return NextResponse.json(
      { error: "Only farm owners can generate invite codes" },
      { status: 403 },
    );
  }

  // Generate unique code
  let inviteCode = "";
  for (let i = 0; i < 10; i++) {
    const candidate = generateInviteCode();
    const exists = await prisma.farmInvite
      .findUnique({ where: { inviteCode: candidate } })
      .catch(() => null);
    if (!exists) {
      inviteCode = candidate;
      break;
    }
  }
  if (!inviteCode)
    return NextResponse.json(
      { error: "Could not generate code, please try again" },
      { status: 500 },
    );

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invite = await prisma.farmInvite.create({
    data: {
      farmOwnerId: auth.id,
      farmName: profile.farmName,
      farmOwnerName: auth.fullName,
      inviteCode,
      role,
      status: "PENDING",
      expiresAt,
    },
  });

  return NextResponse.json(
    {
      inviteCode: invite.inviteCode,
      role: invite.role,
      farmName: invite.farmName,
      farmOwnerName: invite.farmOwnerName,
      expiresAt: invite.expiresAt,
    },
    { status: 201 },
  );
}

// GET — list all invite codes for the farm owner
export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const invites = await prisma.farmInvite.findMany({
    where: { farmOwnerId: auth.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(invites);
}
