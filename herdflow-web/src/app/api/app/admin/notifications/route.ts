// WEBSITE — herdflow-web/src/app/api/app/admin/notifications/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminToken, isMobileUser } from "@/lib/mobile-auth";
import { withAdminContext } from "@/lib/tenant-prisma";
import Expo from "expo-server-sdk";

export const dynamic = "force-dynamic";

const expo = new Expo();

export async function GET(request: Request) {
  const auth = await requireAdminToken(request);
  if (!isMobileUser(auth)) return auth;

  const notifications = await prisma.pushNotificationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ notifications });
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

  if (!b.title || String(b.title).trim().length === 0)
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!b.message || String(b.message).trim().length === 0)
    return NextResponse.json({ error: "message is required" }, { status: 400 });

  const target = (b.target as string | undefined) ?? "ALL";
  const targetValue = (b.targetValue as string | undefined) ?? null;

  // Get device tokens based on target
  let tokens: string[] = [];
  if (target === "ALL") {
    const records = await withAdminContext((tx) =>
      tx.deviceToken.findMany({ where: { isActive: true } }),
    );
    tokens = records.map((r) => r.token);
  } else if (target === "SPECIFIC" && targetValue) {
    // Find user by email, then get their tokens
    const user = await prisma.user.findFirst({
      where: { email: { equals: targetValue, mode: "insensitive" } },
    });
    if (user) {
      const records = await withAdminContext((tx) =>
        tx.deviceToken.findMany({
          where: { userId: user.id, isActive: true },
        }),
      );
      tokens = records.map((r) => r.token);
    }
  } else if (target === "PROVINCE" && targetValue) {
    // Get all farmers in this province via FarmerProfile
    const profiles = await prisma.farmerProfile.findMany({
      where: { province: { contains: targetValue, mode: "insensitive" } },
    });
    const userIds = profiles.map((p) => p.userId);
    const records = await withAdminContext((tx) =>
      tx.deviceToken.findMany({
        where: { userId: { in: userIds }, isActive: true },
      }),
    );
    tokens = records.map((r) => r.token);
  }

  let sentCount = 0;
  const validTokens = tokens.filter((t) => Expo.isExpoPushToken(t));

  if (validTokens.length > 0) {
    const messages = validTokens.map((token) => ({
      to: token,
      sound: "default" as const,
      title: String(b.title),
      body: String(b.message),
      badge: 1,
    }));

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      sentCount += receipts.filter((r) => r.status === "ok").length;
    }
  }

  // Log the notification
  await prisma.pushNotificationLog.create({
    data: {
      title: String(b.title),
      message: String(b.message),
      target,
      targetValue,
      sentCount,
      sentBy: auth.id,
      sentAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, sent: sentCount });
}
