import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, revokeAdminSession } from "@/lib/admin-auth";

export async function POST() {
  const jar = await cookies();
  const sessionValue = jar.get(ADMIN_SESSION_COOKIE)?.value;
  await revokeAdminSession(sessionValue);

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
