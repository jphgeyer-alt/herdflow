import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdminContext } from "@/lib/tenant-prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const classified = await prisma.classified.findUnique({
      where: { id },
      include: { poster: { select: { fullName: true } } },
    });
    if (!classified || classified.status !== "ACTIVE") {
      return NextResponse.json({ error: "Ad not found." }, { status: 404 });
    }

    // Best-effort view counter — bypasses RLS since there's no farmer/user
    // session context on this public page (same pattern as the livestock
    // listing detail page).
    await withAdminContext((tx) =>
      tx.classified.update({ where: { id }, data: { views: { increment: 1 } } }),
    ).catch(() => {});

    return NextResponse.json({ classified });
  } catch (err) {
    console.error("Classified GET error:", err);
    return NextResponse.json({ error: "Failed to load ad." }, { status: 500 });
  }
}
