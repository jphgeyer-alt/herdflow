import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// Public, unauthenticated — the cuid id itself is the access token, emailed
// directly to the sponsor. No sensitive data beyond what's on the document.
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { sponsor: true, quote: true },
    });
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    return NextResponse.json({ invoice });
  } catch {
    return NextResponse.json({ error: "Failed to load invoice" }, { status: 500 });
  }
}
