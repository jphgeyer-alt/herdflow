import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

type Params = { params: Promise<{ id: string }> };

// Public, unauthenticated. The banner links here instead of straight to
// the sponsor's URL so clicks are tracked without needing client-side JS
// on the link itself.
export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const fallbackUrl = env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

  try {
    const creative = await prisma.sponsorCreative.update({
      where: { id },
      data: { clicks: { increment: 1 } },
      select: { linkUrl: true },
    });
    return NextResponse.redirect(creative.linkUrl || fallbackUrl);
  } catch {
    return NextResponse.redirect(fallbackUrl);
  }
}
