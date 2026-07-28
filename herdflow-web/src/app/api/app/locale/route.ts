// WEBSITE — herdflow-web/src/app/api/app/locale/route.ts
// Farm-wide language preference (see LocaleConfig in schema.prisma) -- one
// row per farm/tenant (effectiveFarmerId), shared by the owner and any
// invited managers/workers so everyone sees the app in the same language.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "../../../../../i18n/request";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const config = await prisma.localeConfig.findUnique({
    where: { farmerId: auth.effectiveFarmerId },
    select: { locale: true },
  });

  return NextResponse.json({ locale: config?.locale ?? DEFAULT_LOCALE });
}

export async function PATCH(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const locale = String((body as Record<string, unknown>).locale ?? "");
  if (!(SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
    return NextResponse.json({ error: "Unsupported locale" }, { status: 400 });
  }

  const updated = await prisma.localeConfig.upsert({
    where: { farmerId: auth.effectiveFarmerId },
    create: { farmerId: auth.effectiveFarmerId, locale },
    update: { locale },
  });

  return NextResponse.json({ locale: updated.locale });
}
