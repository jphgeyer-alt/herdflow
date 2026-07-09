import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// Public, unauthenticated — the cuid id itself is the access token, emailed
// directly to the sponsor. No sensitive data beyond what's on the document.
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { sponsor: true, package: true },
    });
    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    return NextResponse.json({ quote });
  } catch {
    return NextResponse.json({ error: "Failed to load quote" }, { status: 500 });
  }
}
