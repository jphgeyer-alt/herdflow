import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  createAdminSession,
  validateAdminCredentials,
} from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LoginBody;

  const email = (body.email || "").trim();
  const password = body.password || "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const admin = await validateAdminCredentials(email, password);
  if (!admin) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const sessionValue = await createAdminSession(admin.id, request.headers.get("user-agent") ?? undefined);
  logAdminActivity(admin, "admin.login", "AdminUser", { entityId: admin.id, entityLabel: admin.email });

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: sessionValue,
    ...SESSION_COOKIE_OPTIONS,
  });

  return response;
}
