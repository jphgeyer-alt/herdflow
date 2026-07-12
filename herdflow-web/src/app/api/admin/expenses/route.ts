import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";
import { withAdminContext } from "@/lib/tenant-prisma";
import { expenseCreateSchema } from "@/lib/validation/finance";
import { advance } from "@/lib/expenses/recurring";

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    const expenses = await withAdminContext((tx) =>
      tx.expense.findMany({
        where: {
          ...((from || to) && {
            date: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }),
        },
        orderBy: { date: "desc" },
      }),
    );
    return NextResponse.json({ expenses });
  } catch (err) {
    console.error("List expenses error:", err);
    return NextResponse.json({ error: "Failed to load expenses." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = expenseCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { category, description, amountCents, date, notes, isRecurring, recurrenceInterval } =
    parsed.data;

  try {
    const createdBy = admin.fullName;
    const parsedDate = new Date(date);
    const expense = await withAdminContext((tx) =>
      tx.expense.create({
        data: {
          category,
          description,
          amountCents,
          date: parsedDate,
          notes: notes || null,
          createdBy,
          isRecurring: isRecurring ?? false,
          recurrenceInterval: isRecurring ? recurrenceInterval : null,
          nextOccurrenceAt:
            isRecurring && recurrenceInterval ? advance(parsedDate, recurrenceInterval) : null,
        },
      }),
    );
    logAdminActivity(admin, "expense.create", "Expense", {
      entityId: expense.id,
      entityLabel: expense.description,
      metadata: { amountCents, category },
    });
    return NextResponse.json({ ok: true, expense });
  } catch (err) {
    console.error("Create expense error:", err);
    return NextResponse.json({ error: "Failed to create expense." }, { status: 500 });
  }
}
