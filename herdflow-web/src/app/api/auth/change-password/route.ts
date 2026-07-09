import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  getUserIdFromSession,
  USER_SESSION_COOKIE,
  verifyPassword,
  hashPassword,
} from "@/lib/user-auth";

export async function POST(request: Request) {
  const jar = await cookies();
  const sessionValue = jar.get(USER_SESSION_COOKIE)?.value;
  const userId = getUserIdFromSession(sessionValue);

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const currentPassword = b.currentPassword as string | undefined;
  const newPassword = b.newPassword as string | undefined;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current and new passwords are required" }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });

  return NextResponse.json({ ok: true });
}
