// WEBSITE — /api/app/farm-invites/[code]/revoke/route.ts
// Revoke a specific invite code
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";

export async function POST(request: Request, { params }: { params: { code: string } }) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const invite = await prisma.farmInvite.findUnique({ where: { inviteCode: params.code } }).catch(() => null);
  if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  if (invite.farmOwnerId !== auth.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.farmInvite.update({
    where: { inviteCode: params.code },
    data: { status: "REVOKED" },
  });

  return NextResponse.json({ ok: true });
}
