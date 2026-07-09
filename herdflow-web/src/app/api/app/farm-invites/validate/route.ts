// WEBSITE — /api/app/farm-invites/validate/route.ts
// Validate an invite code (before user registers)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const code = (b.inviteCode as string | undefined)?.trim().toUpperCase();

  if (!code) return NextResponse.json({ error: "inviteCode is required" }, { status: 400 });

  const invite = await prisma.farmInvite
    .findUnique({ where: { inviteCode: code } })
    .catch(() => null);

  if (!invite || invite.status !== "PENDING") {
    return NextResponse.json(
      {
        valid: false,
        error: "Invite code not found or already used. Ask your farm owner to generate a new code.",
        code: "INVITE_INVALID",
      },
      { status: 404 },
    );
  }

  if (new Date(invite.expiresAt) < new Date()) {
    return NextResponse.json(
      {
        valid: false,
        error: "This invite code has expired. Ask your farm owner to generate a new one.",
        code: "INVITE_EXPIRED",
      },
      { status: 410 },
    );
  }

  return NextResponse.json({
    valid: true,
    farmName: invite.farmName,
    farmOwnerName: invite.farmOwnerName,
    role: invite.role,
    expiresAt: invite.expiresAt,
  });
}
