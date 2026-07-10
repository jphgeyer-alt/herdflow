import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const pageParam = searchParams.get("page");
  const page = pageParam ? Math.max(1, Number.parseInt(pageParam, 10) || 1) : 1;
  const pageSize = 30;
  const actionFilter = searchParams.get("action");

  const where = actionFilter ? { action: { startsWith: actionFilter } } : undefined;

  const [total, entries] = await Promise.all([
    prisma.adminActivityLog.count({ where }),
    prisma.adminActivityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({ entries, total, page, pageSize });
}
