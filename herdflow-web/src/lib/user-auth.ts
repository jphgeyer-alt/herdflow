import { createHash, scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { prisma } from "@/lib/prisma";

const scryptAsync = promisify(scrypt);

export const USER_SESSION_COOKIE = "hf_user_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

// ── Password hashing ─────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const hashBuffer = Buffer.from(hash, "hex");
    const derivedHash = (await scryptAsync(password, salt, 64)) as Buffer;
    if (hashBuffer.length !== derivedHash.length) return false;
    return timingSafeEqual(hashBuffer, derivedHash);
  } catch {
    return false;
  }
}

// ── DB-backed, expiring, revocable sessions ──────────────────────────────────
// Session tokens are opaque random strings (same pattern as PasswordResetToken):
// the raw token is only ever handed to the client (cookie / mobile JSON body);
// the database stores only a SHA-256 hash of it, plus expiry/revocation state.

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/** Creates a new session for `userId` and returns the raw token to send to the client. */
export async function createUserSession(userId: string, userAgent?: string): Promise<string> {
  const rawToken = randomBytes(32).toString("hex");
  await prisma.userSession.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE_MS),
      userAgent: userAgent || null,
    },
  });
  return rawToken;
}

/** Validates a raw session token and returns the associated userId, or null if invalid/expired/revoked. */
export async function getUserIdFromSession(rawToken?: string): Promise<string | null> {
  if (!rawToken) return null;

  const session = await prisma.userSession
    .findUnique({ where: { tokenHash: hashToken(rawToken) } })
    .catch(() => null);

  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt < new Date()) return null;

  // Sliding expiry: touch lastUsedAt without blocking the response.
  prisma.userSession
    .update({ where: { id: session.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return session.userId;
}

/** Revokes a single session (e.g. on logout). */
export async function revokeSession(rawToken?: string): Promise<void> {
  if (!rawToken) return;
  await prisma.userSession
    .updateMany({
      where: { tokenHash: hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    })
    .catch(() => {});
}

/** Revokes every other active session for a user (e.g. on password change), keeping the current one alive. */
export async function revokeAllOtherSessions(userId: string, currentRawToken?: string): Promise<void> {
  await prisma.userSession
    .updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(currentRawToken ? { tokenHash: { not: hashToken(currentRawToken) } } : {}),
      },
      data: { revokedAt: new Date() },
    })
    .catch(() => {});
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: SESSION_MAX_AGE_SECONDS,
  path: "/",
};
