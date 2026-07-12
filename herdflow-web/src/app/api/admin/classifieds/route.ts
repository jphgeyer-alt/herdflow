import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  try {
    const classifieds = await prisma.classified.findMany({
      where: {
        ...(category && { category: category as never }),
        ...(status && { status: status as never }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: { poster: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ classifieds });
  } catch (err) {
    console.error("Admin classifieds GET error:", err);
    return NextResponse.json({ error: "Failed to load classifieds." }, { status: 500 });
  }
}
