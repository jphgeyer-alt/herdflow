// WEBSITE — herdflow-web/src/app/api/app/admin/content/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminToken, isMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const auth = await requireAdminToken(request);
  if (!isMobileUser(auth)) return auth;

  const { id } = await ctx.params;
  const [item, viewCount, dismissCount] = await Promise.all([
    prisma.appContent.findUnique({ where: { id } }),
    prisma.contentView.count({ where: { contentId: id } }),
    prisma.contentDismissal.count({ where: { contentId: id } }),
  ]);

  if (!item || item.isDeleted)
    return NextResponse.json({ error: "Content not found" }, { status: 404 });

  return NextResponse.json({ ...item, viewCount, dismissCount });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireAdminToken(request);
  if (!isMobileUser(auth)) return auth;

  const { id } = await ctx.params;
  const existing = await prisma.appContent.findUnique({ where: { id } });
  if (!existing || existing.isDeleted)
    return NextResponse.json({ error: "Content not found" }, { status: 404 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const updated = await prisma.appContent.update({
    where: { id },
    data: {
      ...(b.title      != null && { title:       String(b.title) }),
      ...(b.message    != null && { message:     String(b.message) }),
      ...(b.content    != null && { content:     String(b.content) }),
      ...(b.status     != null && { status:      String(b.status).toUpperCase() }),
      ...(b.priority   != null && { priority:    String(b.priority).toUpperCase() }),
      ...(b.startDate  != null && { startDate:   new Date(b.startDate as string) }),
      ...(b.endDate    != null && { endDate:     new Date(b.endDate   as string) }),
      ...(b.imageUrl   != null && { imageUrl:    String(b.imageUrl) }),
      ...(b.linkUrl    != null && { linkUrl:     String(b.linkUrl) }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: Request, ctx: Ctx) {
  const auth = await requireAdminToken(request);
  if (!isMobileUser(auth)) return auth;

  const { id } = await ctx.params;
  await prisma.appContent.update({ where: { id }, data: { isDeleted: true, status: "ARCHIVED" } });
  return NextResponse.json({ success: true });
}
