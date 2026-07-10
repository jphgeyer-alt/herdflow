import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// Keys we allow editing
const ALLOWED_KEYS = [
  "banner_heading",
  "banner_subheading",
  "banner_image_url",
  "banner_cta_label",
  "banner_cta_url",
] as const;
type AllowedKey = (typeof ALLOWED_KEYS)[number];

function isAllowedKey(k: string): k is AllowedKey {
  return (ALLOWED_KEYS as readonly string[]).includes(k);
}

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [configs, categories] = await Promise.all([
      prisma.siteConfig.findMany(),
      prisma.category.findMany({ orderBy: { name: "asc" } }),
    ]);

    const content = Object.fromEntries(configs.map((c) => [c.key, c.value]));
    return NextResponse.json({ content, categories });
  } catch {
    return NextResponse.json({ error: "Failed to load site content." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  // Handle banner content updates
  if (body.type === "banner") {
    const updates = body.updates as Record<string, string> | undefined;
    if (!updates || typeof updates !== "object") {
      return NextResponse.json({ error: "updates object is required." }, { status: 400 });
    }

    const ops = [];
    for (const [key, value] of Object.entries(updates)) {
      if (!isAllowedKey(key) || typeof value !== "string") continue;
      ops.push(
        prisma.siteConfig.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        }),
      );
    }

    try {
      await Promise.all(ops);
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ error: "Failed to save banner content." }, { status: 500 });
    }
  }

  // Handle category rename
  if (body.type === "category") {
    const { id, name } = body as { id?: string; name?: string };
    if (!id || !name?.trim()) {
      return NextResponse.json({ error: "id and name are required." }, { status: 400 });
    }

    try {
      await prisma.category.update({ where: { id }, data: { name: name.trim() } });
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ error: "Failed to update category." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown type." }, { status: 400 });
}
