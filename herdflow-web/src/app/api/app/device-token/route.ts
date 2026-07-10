// WEBSITE — herdflow-web/src/app/api/app/device-token/route.ts
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withUserContext } from "@/lib/tenant-prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const token = b.token as string | undefined;
  const platform = b.platform as string | undefined;

  if (!token) return NextResponse.json({ error: "token is required" }, { status: 400 });

  await withUserContext(auth.id, (tx) =>
    tx.deviceToken.upsert({
      where: { token },
      update: { userId: auth.id, platform: platform ?? "unknown", isActive: true },
      create: { userId: auth.id, token, platform: platform ?? "unknown", isActive: true },
    }),
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { token } = body as { token?: string };
  if (!token) return NextResponse.json({ error: "token is required" }, { status: 400 });

  await withUserContext(auth.id, (tx) =>
    tx.deviceToken.updateMany({
      where: { token, userId: auth.id },
      data: { isActive: false },
    }),
  );

  return NextResponse.json({ success: true });
}
