import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getUserIdFromSession, USER_SESSION_COOKIE } from "@/lib/user-auth";

export async function PATCH(request: Request) {
  const jar = await cookies();
  const sessionValue = jar.get(USER_SESSION_COOKIE)?.value;
  const userId = getUserIdFromSession(sessionValue);

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const fullName = (b.fullName as string | undefined)?.trim();
  const phone = (b.phone as string | undefined)?.trim() || null;

  if (!fullName || fullName.length < 2) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { fullName, phone },
  });

  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";

export async function GET() {
  const jar = await cookies();
  const sessionValue = jar.get(USER_SESSION_COOKIE)?.value;
  const userId = getUserIdFromSession(sessionValue);

  if (!userId) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      sellerProfile: {
        select: { id: true, farmName: true, status: true },
      },
      logisticsProfile: {
        select: { id: true, companyName: true, status: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user });
}
