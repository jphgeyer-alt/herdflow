import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createUserSessionValue, SESSION_COOKIE_OPTIONS, USER_SESSION_COOKIE } from "@/lib/user-auth";

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

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash)
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid)
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  const sessionValue = createUserSessionValue(user.id);

  // Determine dashboard based on user profile
  let redirect = "/dashboard/buyer";
  const seller = await prisma.seller.findUnique({ where: { userId: user.id } });
  const logistics = await prisma.logisticsPartner.findUnique({ where: { userId: user.id } });

  if (seller) redirect = "/dashboard/seller";
  else if (logistics) redirect = "/dashboard/logistics";

  const res = NextResponse.json({ ok: true, redirect });
  res.cookies.set(USER_SESSION_COOKIE, sessionValue, SESSION_COOKIE_OPTIONS);
  return res;
}
