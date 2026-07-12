// WEBSITE — herdflow-web/src/app/api/app/admin/content/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminToken, isMobileUser } from "@/lib/mobile-auth";
import { withAdminContext } from "@/lib/tenant-prisma";
import type { Prisma } from "@prisma/client";
import Expo from "expo-server-sdk";

export const dynamic = "force-dynamic";

const expo = new Expo();

export async function GET(request: Request) {
  const auth = await requireAdminToken(request);
  if (!isMobileUser(auth)) return auth;

  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "";
  const status = url.searchParams.get("status") ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "20")));

  const where: Prisma.AppContentWhereInput = { isDeleted: false };
  if (type) where.type = type.toUpperCase();
  if (status) where.status = status.toUpperCase();

  const [items, total] = await Promise.all([
    prisma.appContent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.appContent.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const auth = await requireAdminToken(request);
  if (!isMobileUser(auth)) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  // Validate required fields by type
  const type = (b.type as string | undefined)?.toUpperCase() ?? "";
  if (!type) return NextResponse.json({ error: "type is required" }, { status: 400 });
  if (!b.title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  if (type === "ANNOUNCEMENT" && !b.message)
    return NextResponse.json({ error: "message required for ANNOUNCEMENT" }, { status: 400 });
  if (type === "BANNER" && (!b.message || !b.sponsorName))
    return NextResponse.json(
      { error: "message and sponsorName required for BANNER" },
      { status: 400 },
    );
  if (type === "TIP" && (!b.content || !b.category))
    return NextResponse.json({ error: "content and category required for TIP" }, { status: 400 });

  const content = await prisma.appContent.create({
    data: {
      type,
      title: b.title as string,
      message: (b.message as string | undefined) ?? null,
      content: (b.content as string | undefined) ?? null,
      category: (b.category as string | undefined) ?? null,
      priority: (b.priority as string | undefined)?.toUpperCase() ?? "NORMAL",
      imageUrl: (b.imageUrl as string | undefined) ?? null,
      linkUrl: (b.linkUrl as string | undefined) ?? null,
      sponsorName: (b.sponsorName as string | undefined) ?? null,
      targetProvinces: Array.isArray(b.targetProvinces) ? (b.targetProvinces as string[]) : [],
      targetSpecies: Array.isArray(b.targetSpecies) ? (b.targetSpecies as string[]) : [],
      sendPush: Boolean(b.sendPush),
      startDate: b.startDate ? new Date(b.startDate as string) : null,
      endDate: b.endDate ? new Date(b.endDate as string) : null,
      scheduledDate: b.scheduledDate ? new Date(b.scheduledDate as string) : null,
      status: "ACTIVE",
      createdBy: auth.id,
    },
  });

  // Send push notification if requested
  if (b.sendPush) {
    try {
      const tokens = await withAdminContext((tx) =>
        tx.deviceToken.findMany({ where: { isActive: true } }),
      );
      const messages = tokens
        .filter((t) => Expo.isExpoPushToken(t.token))
        .map((t) => ({
          to: t.token,
          sound: "default" as const,
          title: b.title as string,
          body: (b.message ?? b.content ?? b.title) as string,
          badge: 1,
        }));
      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk);
      }
    } catch (pushErr) {
      console.error("[push notification]", pushErr);
      // Non-fatal — content was still created
    }
  }

  return NextResponse.json({ id: content.id, success: true }, { status: 201 });
}
