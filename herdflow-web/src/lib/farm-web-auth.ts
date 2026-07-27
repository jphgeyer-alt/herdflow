// herdflow-web/src/lib/farm-web-auth.ts
// Cookie-session equivalent of mobile-auth.ts's getMobileUser() -- same
// underlying session store (getUserIdFromSession), same effectiveFarmerId
// resolution (FARMER: own id, FARM_MANAGER/FARM_WORKER: ownerUserId), just
// read from the browser session cookie instead of a bearer token. Used by
// every page under /app/finance/* so a farmer, manager, or worker signed in
// on the website sees (and writes into) the same farm data pool the mobile
// app already does.
import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getUserIdFromSession, USER_SESSION_COOKIE } from "@/lib/user-auth";

export interface FarmWebUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  mobileRole: string; // FARMER | FARM_MANAGER | FARM_WORKER
  farmName: string;
  country: string; // ISO country code, e.g. "ZA" -- see config/complianceConfig.ts
  effectiveFarmerId: string;
}

// Wrapped in React's cache() so the layout and every page under
// /app/finance/* that each call this once per request only hit the
// database a single time (Next.js request memoization).
export const getFarmWebUser = cache(async (): Promise<FarmWebUser | null> => {
  const jar = await cookies();
  const sessionValue = jar.get(USER_SESSION_COOKIE)?.value;
  const userId = await getUserIdFromSession(sessionValue);
  if (!userId) return null;

  try {
    const [user, profile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, fullName: true, role: true },
      }),
      prisma.farmerProfile.findFirst({
        where: { userId },
        select: { ownerUserId: true, mobileRole: true, farmName: true, country: true },
      }),
    ]);

    // No FarmerProfile at all means this account was never set up as a
    // farmer/manager/worker (e.g. a pure marketplace buyer) -- nothing in
    // the finance section applies to them.
    if (!user || !profile) return null;

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      mobileRole: profile.mobileRole,
      farmName: profile.farmName,
      country: profile.country,
      effectiveFarmerId: profile.ownerUserId ?? userId,
    };
  } catch {
    return null;
  }
});
