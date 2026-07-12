import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";
import { expenseCategoryCreateSchema } from "@/lib/validation/finance";

// Any admin can read the list (needed to populate the category picker on
// the Expenses page); only SUPER_ADMIN can add to it — see POST below.
export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const categories = await prisma.expenseCategory.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ categories });
  } catch (err) {
    console.error("List expense categories error:", err);
    return NextResponse.json({ error: "Failed to load categories." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Only super admins can add expense categories." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = expenseCategoryCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const category = await prisma.expenseCategory.create({
      data: { name: parsed.data.name, createdBy: admin.fullName },
    });
    logAdminActivity(admin, "expense_category.create", "ExpenseCategory", {
      entityId: category.id,
      entityLabel: category.name,
    });
    return NextResponse.json({ ok: true, category });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return NextResponse.json({ error: "This category already exists." }, { status: 409 });
    }
    console.error("Create expense category error:", err);
    return NextResponse.json({ error: "Failed to create category." }, { status: 500 });
  }
}
