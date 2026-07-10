import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_SESSION_COOKIE,
  getAdminFromSessionToken,
  hashPassword,
  revokeAllOtherAdminSessions,
} from "@/lib/admin-auth";
import { verifyPassword } from "@/lib/user-auth";
import { logAdminActivity } from "@/lib/admin-activity";

export async function POST(request: Request) {
  const jar = await cookies();
  const sessionValue = jar.get(ADMIN_SESSION_COOKIE)?.value;
  const admin = await getAdminFromSessionToken(sessionValue);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!body.currentPassword || !body.newPassword || body.newPassword.length < 8) {
    return NextResponse.json(
      { error: "Current password and a new password of at least 8 characters are required." },
      { status: 400 },
    );
  }

  const record = await prisma.adminUser.findUnique({ where: { id: admin.id } });
  if (!record) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

  const valid = await verifyPassword(body.currentPassword, record.passwordHash);
  if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });

  const passwordHash = await hashPassword(body.newPassword);
  await prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash } });
  await revokeAllOtherAdminSessions(admin.id, sessionValue);

  logAdminActivity(admin, "admin.change_password", "AdminUser", { entityId: admin.id });

  return NextResponse.json({ ok: true });
}
