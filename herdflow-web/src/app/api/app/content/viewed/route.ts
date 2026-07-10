// WEBSITE — herdflow-web/src/app/api/app/content/viewed/route.ts
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";

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
  const { contentId, contentType } = body as Record<string, string>;
  if (!contentId) return NextResponse.json({ error: "contentId required" }, { status: 400 });

  try {
    await withFarmerContext(auth.id, (tx) =>
      tx.contentView.create({ data: { contentId, farmerId: auth.id } }),
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true }); // non-critical, swallow duplicates
  }
}
