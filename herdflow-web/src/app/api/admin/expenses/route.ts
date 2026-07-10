import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    const expenses = await prisma.expense.findMany({
      where: {
        ...((from || to) && {
          date: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }),
      },
      orderBy: { date: "desc" },
    });
    return NextResponse.json({ expenses });
  } catch {
    return NextResponse.json({ error: "Failed to load expenses." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    category?: string;
    description?: string;
    amountCents?: number;
    date?: string;
    notes?: string;
  };

  const category = (body.category || "").trim();
  const description = (body.description || "").trim();
  const amountCents = Number(body.amountCents ?? 0);
  const date = body.date ? new Date(body.date) : null;

  if (!category) return NextResponse.json({ error: "Category is required." }, { status: 400 });
  if (!description)
    return NextResponse.json({ error: "Description is required." }, { status: 400 });
  if (!Number.isInteger(amountCents) || amountCents <= 0)
    return NextResponse.json(
      { error: "Amount must be a positive integer in cents." },
      { status: 400 },
    );
  if (!date || Number.isNaN(date.getTime()))
    return NextResponse.json({ error: "A valid date is required." }, { status: 400 });

  try {
    const createdBy = admin.fullName;
    const expense = await prisma.expense.create({
      data: {
        category,
        description,
        amountCents,
        date,
        notes: body.notes?.trim() || null,
        createdBy,
      },
    });
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
