import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const roleFilter = searchParams.get("role");
  const pageParam = searchParams.get("page");
  const page = pageParam ? Math.max(1, Number.parseInt(pageParam, 10) || 1) : 1;
  const pageSize = 25;

  const where =
    roleFilter === "ADMIN" || roleFilter === "CUSTOMER"
      ? { role: roleFilter as "ADMIN" | "CUSTOMER" }
      : undefined;

  try {
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          marketingConsent: true,
          createdAt: true,
          _count: { select: { orders: true } },
          sellerProfile: { select: { farmName: true, status: true } },
        },
      }),
    ]);

    return NextResponse.json({ users, total, page, pageSize });
  } catch {
    return NextResponse.json({ error: "Failed to load customers." }, { status: 500 });
  }
}
