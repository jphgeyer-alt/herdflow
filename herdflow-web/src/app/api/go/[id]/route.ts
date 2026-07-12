import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const link = await prisma.affiliateLink.findUnique({ where: { id } });
    if (!link || !link.isActive) {
      return NextResponse.redirect(new URL("/", "https://www.herdflow.co.za"), { status: 302 });
    }

    await prisma.affiliateLink.update({ where: { id }, data: { clicks: { increment: 1 } } }).catch(() => {});

    return NextResponse.redirect(link.targetUrl, { status: 302 });
  } catch (err) {
    console.error("Affiliate redirect error:", err);
    return NextResponse.redirect(new URL("/", "https://www.herdflow.co.za"));
  }
}
