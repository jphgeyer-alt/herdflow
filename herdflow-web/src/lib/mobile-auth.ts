// herdflow-web/src/lib/mobile-auth.ts
// Bearer-token auth helper for all /api/app/* endpoints.
// The token value is identical to the HMAC-signed session cookie value used
// by the website — reuses existing crypto infrastructure in user-auth.ts.

import { prisma } from "@/lib/prisma";
import { getUserIdFromSession } from "@/lib/user-auth";

export interface MobileUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  isAdmin: boolean;
}

function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  return token || null;
}

export async function getMobileUser(request: Request): Promise<MobileUser | null> {
  const token = extractBearerToken(request);
  if (!token) return null;

  const userId = getUserIdFromSession(token);
  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, phone: true, role: true },
    });
    if (!user) return null;
    return { ...user, isAdmin: user.role === "ADMIN" };
  } catch {
    return null;
  }
}

/** Returns the user, or a 401 Response if unauthenticated. */
export async function requireMobileUser(request: Request): Promise<MobileUser | Response> {
  const user = await getMobileUser(request);
  if (!user) return authError(401, "Unauthorized. Please sign in.");
  return user;
}

/** Returns the user, or 401/403 if not an admin. */
export async function requireAdminToken(request: Request): Promise<MobileUser | Response> {
  const user = await getMobileUser(request);
  if (!user) return authError(401, "Unauthorized. Please sign in.");
  if (!user.isAdmin) return authError(403, "Forbidden. Admin access required.");
  return user;
}

/** Type guard: narrows `MobileUser | Response` to `MobileUser`. */
export function isMobileUser(val: MobileUser | Response): val is MobileUser {
  return !(val instanceof Response);
}

function authError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
