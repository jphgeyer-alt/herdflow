import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";
import { withAdminContext } from "@/lib/tenant-prisma";
import { expenseUpdateSchema } from "@/lib/validation/finance";
import { advance } from "@/lib/expenses/recurring";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = expenseUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { category, description, amountCents, date, notes, isRecurring, recurrenceInterval } =
    parsed.data;

  try {
    const expense = await withAdminContext(async (tx) => {
      // Any edit to a recurring template resets nextOccurrenceAt to one
      // interval past its (possibly just-updated) date — a simplification,
      // but always correct, and edits to an already-recurring template are
      // a rare admin action.
      const existing = await tx.expense.findUniqueOrThrow({ where: { id } });
      const willBeRecurring = isRecurring ?? existing.isRecurring;
      const effectiveInterval = recurrenceInterval ?? existing.recurrenceInterval;
      const effectiveDate = date ? new Date(date) : existing.date;

      return tx.expense.update({
        where: { id },
        data: {
          ...(category !== undefined && { category }),
          ...(description !== undefined && { description }),
          ...(amountCents !== undefined && { amountCents }),
          ...(date !== undefined && { date: effectiveDate }),
          ...(notes !== undefined && { notes: notes || null }),
          ...(isRecurring !== undefined && { isRecurring }),
          ...(recurrenceInterval !== undefined && { recurrenceInterval }),
          nextOccurrenceAt:
            willBeRecurring && effectiveInterval ? advance(effectiveDate, effectiveInterval) : null,
        },
      });
    });
    logAdminActivity(admin, "expense.update", "Expense", {
      entityId: expense.id,
      entityLabel: expense.description,
      metadata: { amountCents: expense.amountCents, category: expense.category },
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
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const deleted = await withAdminContext((tx) => tx.expense.delete({ where: { id } }));
    logAdminActivity(admin, "expense.delete", "Expense", {
      entityId: deleted.id,
      entityLabel: deleted.description,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete expense error:", err);
    return NextResponse.json({ error: "Failed to delete expense." }, { status: 500 });
  }
}
