import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  createUserSession,
  SESSION_COOKIE_OPTIONS,
  USER_SESSION_COOKIE,
} from "@/lib/user-auth";
import {
  checkRateLimit,
  getClientIp,
  isLockedOut,
  recordFailedAttempt,
  clearFailedAttempts,
} from "@/lib/rate-limit";

const LOGIN_LOCKOUT_MSG =
  "Too many failed attempts. Please wait 15 minutes before trying again.";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  // Blanket per-IP throttle against flooding (any outcome counts) — 30
  // attempts/hour is generous for a shared office/farm IP with several
  // legitimate users, while still bounding brute-force volume.
  if (checkRateLimit("login-ip", ip, 30, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const email = (b.email as string | undefined)?.trim().toLowerCase();
  const password = b.password as string | undefined;

  if (!email || !password)
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });

  // Per-account lockout on FAILED attempts only — a correct password never
  // gets throttled, but repeated wrong-password attempts against one email
  // (credential stuffing) get locked out regardless of which IP they come
  // from.
  if (isLockedOut("login-email", email)) {
    return NextResponse.json({ error: LOGIN_LOCKOUT_MSG }, { status: 429 });
  }

  let user;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch {
    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }

  if (!user || !user.passwordHash) {
    recordFailedAttempt("login-email", email, 5, 15 * 60 * 1000, 15 * 60 * 1000);
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const lockedNow = recordFailedAttempt("login-email", email, 5, 15 * 60 * 1000, 15 * 60 * 1000);
    return NextResponse.json(
      { error: lockedNow ? LOGIN_LOCKOUT_MSG : "Invalid email or password" },
      { status: lockedNow ? 429 : 401 },
    );
  }
  clearFailedAttempts("login-email", email);

  const sessionValue = await createUserSession(user.id, request.headers.get("user-agent") ?? undefined);

  // Determine dashboard based on user profile
  let redirect = "/dashboard/buyer";
  try {
    const seller = await prisma.seller.findUnique({ where: { userId: user.id } });
    const logistics = await prisma.logisticsPartner.findUnique({ where: { userId: user.id } });
    if (seller) redirect = "/dashboard/seller";
    else if (logistics) redirect = "/dashboard/logistics";
  } catch {
    // Use default buyer dashboard on DB error
  }

  // Look up FarmerProfile for mobile app users
  let farmerProfile: {
    farmName: string;
    province: string;
    mobileRole: string;
    farmCode: string | null;
    ownerUserId: string | null;
  } | null = null;
  try {
    farmerProfile = await prisma.farmerProfile.findUnique({ where: { userId: user.id } });
  } catch {
    /* not a farmer account */
  }

  const mobileRole = farmerProfile?.mobileRole ?? (user.role === "ADMIN" ? "ADMIN" : "FARMER");

  // Return token for mobile app clients alongside the cookie for web clients
  const mobileUser = {
    id: user.id,
    name: user.fullName,
    email: user.email,
    phone: user.phone ?? null,
    role: mobileRole,
    isAdmin: user.role === "ADMIN",
    farmName: farmerProfile?.farmName ?? "",
    province: farmerProfile?.province ?? "",
    farmCode: farmerProfile?.farmCode ?? null,
    ownerUserId: farmerProfile?.ownerUserId ?? null,
    createdAt: user.createdAt,
  };

  const res = NextResponse.json({ ok: true, redirect, token: sessionValue, user: mobileUser });
  res.cookies.set(USER_SESSION_COOKIE, sessionValue, SESSION_COOKIE_OPTIONS);
  return res;
}
