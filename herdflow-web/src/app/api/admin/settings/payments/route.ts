import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";

const KEYS = [
  "payfast_merchant_id",
  "payfast_merchant_key",
  "payfast_passphrase",
  "commission_rate",
  "logistics_commission_rate",
  "vat_enabled",
  "vat_rate",
] as const;

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
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

export async function PATCH(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
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
    logAdminActivity(admin, "settings.update", "SiteConfig", {
      entityLabel: "Payment Settings",
      metadata: { keys: updates.map((u) => u.key) },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/settings/payments PATCH]", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
