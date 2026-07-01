import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";

async function assertAdmin() {
  const jar = await cookies();
  const session = jar.get(ADMIN_SESSION_COOKIE)?.value;
  return isValidAdminSession(session);
}

const KEYS = ["payfast_merchant_id", "payfast_merchant_key", "payfast_passphrase"] as const;

export async function GET() {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await prisma.siteConfig.findMany({ where: { key: { in: [...KEYS] } } });
    const config: Record<string, string> = {};
    for (const row of rows) {
      config[row.key] = row.value;
    }
    return NextResponse.json({ config });
  } catch (err) {
    console.error("[admin/settings/payments GET]", err);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const updates: { key: string; value: string }[] = [];
  for (const key of KEYS) {
    const raw = (body as Record<string, unknown>)[key];
    if (raw !== undefined) {
      const value = String(raw).trim();
      updates.push({ key, value });
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  try {
    await prisma.$transaction(
      updates.map(({ key, value }) =>
        prisma.siteConfig.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        }),
      ),
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/settings/payments PATCH]", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
