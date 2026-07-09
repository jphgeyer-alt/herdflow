import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// Public, unauthenticated, fire-and-forget from the client after a
// creative is actually rendered — counts only what was shown, not every
// candidate the placement query returned.
export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;

  try {
    await prisma.sponsorCreative.update({
      where: { id },
      data: { impressions: { increment: 1 } },
    });
  } catch {
    // Best-effort — a missing/deleted creative shouldn't error the page.
  }

  return NextResponse.json({ ok: true });
}
