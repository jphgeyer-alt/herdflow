import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createUserSessionValue, SESSION_COOKIE_OPTIONS, USER_SESSION_COOKIE } from "@/lib/user-auth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const fullName = (b.fullName as string | undefined)?.trim();
  const email = (b.email as string | undefined)?.trim().toLowerCase();
  const phone = (b.phone as string | undefined)?.trim();
  const password = b.password as string | undefined;
  const accountType = b.accountType as string | undefined; // "buyer" | "seller" | "logistics"
  // Mobile app sends role: "farmer" | "worker" | "manager"
  const mobileRole = (b.role as string | undefined)?.toLowerCase();
  const isMobileRegistration = !!mobileRole && !accountType;

  if (!fullName || fullName.length < 2)
    return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: "Valid email address is required" }, { status: 400 });
  if (!password || password.length < 8)
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  if (!isMobileRegistration && !["buyer", "seller", "logistics"].includes(accountType || ""))
    return NextResponse.json({ error: "Please select an account type" }, { status: 400 });

  const passwordHash = await hashPassword(password);

  let user;
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

    user = await prisma.user.create({
      data: {
        email,
        fullName,
        phone: phone || null,
        passwordHash,
        role: isMobileRegistration ? "FARMER" : "CUSTOMER",
      },
    });

    // For mobile registrations, create FarmerProfile with farm details
    if (isMobileRegistration) {
      const farmName = (b.farmName as string | undefined)?.trim() ?? "";
      const province = (b.province as string | undefined)?.trim() ?? "";
      const species = Array.isArray(b.species) ? (b.species as string[]) : [];
      await prisma.farmerProfile.create({
        data: { userId: user.id, farmName, province, species },
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique") || msg.includes("already exists")) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Service temporarily unavailable. Please try again later." }, { status: 503 });
  }

  const sessionValue = createUserSessionValue(user.id);

  // Mobile registration: return token + user object
  if (isMobileRegistration) {
    const farmerProfile = await prisma.farmerProfile.findUnique({ where: { userId: user.id } });
    return NextResponse.json({
      token: sessionValue,
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        phone: user.phone ?? null,
        role: user.role,
        isAdmin: false,
        farmName: farmerProfile?.farmName ?? "",
        province: farmerProfile?.province ?? "",
        createdAt: user.createdAt,
      },
    });
  }

  // Web registration: set cookie and redirect
  let redirect = "/dashboard/buyer";
  if (accountType === "seller") redirect = "/register/seller";
  if (accountType === "logistics") redirect = "/register/logistics";

  const res = NextResponse.json({ ok: true, redirect, token: sessionValue, user: { id: user.id, name: user.fullName, email: user.email } });
  res.cookies.set(USER_SESSION_COOKIE, sessionValue, SESSION_COOKIE_OPTIONS);
  return res;
}
