import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { sponsor: true, package: true, invoices: true },
    });
    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    return NextResponse.json({ quote });
  } catch {
    return NextResponse.json({ error: "Failed to load quote" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const validStatuses = ["DRAFT", "SENT", "ACCEPTED", "DECLINED", "EXPIRED"];
  if (body.status !== undefined && !validStatuses.includes(String(body.status))) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  try {
    const quote = await prisma.quote.update({
      where: { id },
      data: {
        ...(body.description !== undefined && { description: String(body.description) }),
        ...(body.amount !== undefined && { amount: Number(body.amount) }),
        ...(body.validUntil !== undefined && { validUntil: new Date(String(body.validUntil)) }),
        ...(body.notes !== undefined && { notes: body.notes ? String(body.notes) : null }),
        ...(body.status !== undefined && {
          status: body.status as "DRAFT" | "SENT" | "ACCEPTED" | "DECLINED" | "EXPIRED",
          ...(["ACCEPTED", "DECLINED"].includes(String(body.status)) && {
            respondedAt: new Date(),
          }),
        }),
      },
      include: { sponsor: true, package: true },
    });

    return NextResponse.json({ ok: true, quote });
  } catch (err) {
    console.error("PATCH quote error:", err);
    return NextResponse.json({ error: "Failed to update quote" }, { status: 500 });
  }
}
