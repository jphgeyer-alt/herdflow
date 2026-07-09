import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  createUserSessionValue,
  SESSION_COOKIE_OPTIONS,
  USER_SESSION_COOKIE,
} from "@/lib/user-auth";

export async function POST(request: Request) {
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

  let user;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch {
    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }

  if (!user || !user.passwordHash)
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  const sessionValue = createUserSessionValue(user.id);

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
