import { createHash, randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/user-auth";
import type { AdminRole } from "@prisma/client";

export const ADMIN_SESSION_COOKIE = "hf_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours, matches the previous cookie maxAge
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: SESSION_MAX_AGE_SECONDS,
  path: "/",
};

export type AdminIdentity = {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
};

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export { hashPassword };

/** Validates email+password against AdminUser. Returns the admin or null. */
export async function validateAdminCredentials(
  email: string,
  password: string,
): Promise<AdminIdentity | null> {
  const admin = await prisma.adminUser
    .findUnique({ where: { email: email.trim().toLowerCase() } })
    .catch(() => null);
  if (!admin || !admin.isActive) return null;
  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) return null;
  return { id: admin.id, email: admin.email, fullName: admin.fullName, role: admin.role };
}

/** Creates a new admin session and returns the raw token to store in the cookie. */
export async function createAdminSession(adminUserId: string, userAgent?: string): Promise<string> {
  const rawToken = randomBytes(32).toString("hex");
  await prisma.adminUserSession.create({
    data: {
      adminUserId,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE_MS),
      userAgent: userAgent || null,
    },
  });
  await prisma.adminUser
    .update({ where: { id: adminUserId }, data: { lastLoginAt: new Date() } })
    .catch(() => {});
  return rawToken;
}

/** Validates a raw session token and returns the admin identity, or null. */
export async function getAdminFromSessionToken(rawToken?: string): Promise<AdminIdentity | null> {
  if (!rawToken) return null;

  const session = await prisma.adminUserSession
    .findUnique({ where: { tokenHash: hashToken(rawToken) } })
    .catch(() => null);
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;

  const admin = await prisma.adminUser.findUnique({ where: { id: session.adminUserId } });
  if (!admin || !admin.isActive) return null;

  prisma.adminUserSession
    .update({ where: { id: session.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return { id: admin.id, email: admin.email, fullName: admin.fullName, role: admin.role };
}

/** Convenience wrapper for API routes: reads the cookie off a NextRequest. */
export async function getAdminFromRequest(request: NextRequest): Promise<AdminIdentity | null> {
  return getAdminFromSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

/** Convenience wrapper for Server Components: reads the cookie off next/headers cookies(). */
export async function getAdminFromCookieStore(cookieJar: {
  get: (name: string) => { value: string } | undefined;
}): Promise<AdminIdentity | null> {
  return getAdminFromSessionToken(cookieJar.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function isValidAdminSession(rawToken?: string): Promise<boolean> {
  return (await getAdminFromSessionToken(rawToken)) !== null;
}

export async function revokeAdminSession(rawToken?: string): Promise<void> {
  if (!rawToken) return;
  await prisma.adminUserSession
    .updateMany({
      where: { tokenHash: hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    })
    .catch(() => {});
}

export async function revokeAllOtherAdminSessions(
  adminUserId: string,
  currentRawToken?: string,
): Promise<void> {
  await prisma.adminUserSession
    .updateMany({
      where: {
        adminUserId,
        revokedAt: null,
        ...(currentRawToken ? { tokenHash: { not: hashToken(currentRawToken) } } : {}),
      },
      data: { revokedAt: new Date() },
    })
    .catch(() => {});
}
