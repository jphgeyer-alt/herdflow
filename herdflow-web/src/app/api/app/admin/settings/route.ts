// WEBSITE — herdflow-web/src/app/api/app/admin/settings/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminToken, isMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

async function getOrCreateSettings() {
  const existing = await prisma.appSettings.findFirst();
  if (existing) return existing;
  return prisma.appSettings.create({ data: {} });
}

export async function GET(request: Request) {
  const auth = await requireAdminToken(request);
  if (!isMobileUser(auth)) return auth;

  const settings = await getOrCreateSettings();
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const auth = await requireAdminToken(request);
  if (!isMobileUser(auth)) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const settings = await getOrCreateSettings();

  const updated = await prisma.appSettings.update({
    where: { id: settings.id },
    data: {
      ...(b.maintenanceMode != null && { maintenanceMode: Boolean(b.maintenanceMode) }),
      ...(b.maintenanceMessage != null && { maintenanceMessage: String(b.maintenanceMessage) }),
      ...(b.minimumAppVersion != null && { minimumAppVersion: String(b.minimumAppVersion) }),
      ...(b.supportWhatsApp != null && { supportWhatsApp: String(b.supportWhatsApp) }),
      ...(b.supportEmail != null && { supportEmail: String(b.supportEmail) }),
      ...(b.maxAnnouncements != null && { maxAnnouncements: Number(b.maxAnnouncements) }),
      ...(b.maxBanners != null && { maxBanners: Number(b.maxBanners) }),
      ...(b.sessionTimeout != null && { sessionTimeout: Number(b.sessionTimeout) }),
    },
  });

  return NextResponse.json(updated);
}
