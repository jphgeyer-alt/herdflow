import { createHmac, scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

export const USER_SESSION_COOKIE = "hf_user_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || "herdflow-user-session-secret-change-me";
}

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

// ── Session signing ──────────────────────────────────────────────────────────

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createUserSessionValue(userId: string): string {
  const signature = sign(userId);
  return `${userId}.${signature}`;
}

export function getUserIdFromSession(sessionValue?: string): string | null {
  if (!sessionValue) return null;
  const dotIndex = sessionValue.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const userId = sessionValue.slice(0, dotIndex);
  const providedSig = sessionValue.slice(dotIndex + 1);
  if (!userId || !providedSig) return null;
  const expectedSig = sign(userId);
  try {
    const p = Buffer.from(providedSig, "hex");
    const e = Buffer.from(expectedSig, "hex");
    if (p.length !== e.length) return null;
    return timingSafeEqual(p, e) ? userId : null;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: SESSION_MAX_AGE,
  path: "/",
};
