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

export async function PATCH(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const validStatuses = ["UNPAID", "PAID", "OVERDUE", "CANCELLED"];
  if (body.status !== undefined && !validStatuses.includes(String(body.status))) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  try {
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...(body.description !== undefined && { description: String(body.description) }),
        ...(body.amount !== undefined && { amount: Number(body.amount) }),
        ...(body.dueDate !== undefined && { dueDate: new Date(String(body.dueDate)) }),
        ...(body.notes !== undefined && { notes: body.notes ? String(body.notes) : null }),
        ...(body.paymentReference !== undefined && {
          paymentReference: body.paymentReference ? String(body.paymentReference) : null,
        }),
        ...(body.status !== undefined && {
          status: body.status as "UNPAID" | "PAID" | "OVERDUE" | "CANCELLED",
          ...(body.status === "PAID" && { paidAt: new Date() }),
        }),
      },
      include: { sponsor: true, quote: true },
    });

    return NextResponse.json({ ok: true, invoice });
  } catch (err) {
    console.error("PATCH invoice error:", err);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}
