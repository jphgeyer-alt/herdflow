import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest, hashPassword } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admins = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ admins, me: admin });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only super admins can add staff accounts." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    fullName?: string;
    password?: string;
    role?: "SUPER_ADMIN" | "ADMIN";
  };

  const email = (body.email || "").trim().toLowerCase();
  const fullName = (body.fullName || "").trim();
  const password = body.password || "";
  const role = body.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN";

  if (!email || !fullName || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Email, full name, and a password of at least 8 characters are required." },
      { status: 400 },
    );
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An admin with this email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const created = await prisma.adminUser.create({
    data: { email, fullName, passwordHash, role },
    select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
  });

  logAdminActivity(admin, "admin.create", "AdminUser", {
    entityId: created.id,
    entityLabel: created.email,
    metadata: { role },
  });

  return NextResponse.json({ ok: true, admin: created });
}
