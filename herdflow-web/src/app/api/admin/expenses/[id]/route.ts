import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

function ensureAdmin(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...(body.category !== undefined && { category: String(body.category) }),
        ...(body.description !== undefined && { description: String(body.description) }),
        ...(body.amountCents !== undefined && { amountCents: Number(body.amountCents) }),
        ...(body.date !== undefined && { date: new Date(String(body.date)) }),
        ...(body.notes !== undefined && { notes: body.notes ? String(body.notes) : null }),
      },
    });
    return NextResponse.json({ ok: true, expense });
  } catch (err) {
    console.error("Update expense error:", err);
    return NextResponse.json({ error: "Failed to update expense." }, { status: 500 });
  }
}

// Hard delete — nothing else references an Expense row, so a simple
// correction path is enough (no soft-delete audit trail needed).
export async function DELETE(request: NextRequest, { params }: Params) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete expense error:", err);
    return NextResponse.json({ error: "Failed to delete expense." }, { status: 500 });
  }
}
