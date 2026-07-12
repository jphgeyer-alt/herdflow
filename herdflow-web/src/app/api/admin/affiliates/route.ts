import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const links = await prisma.affiliateLink.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ links });
  } catch {
    return NextResponse.json({ error: "Failed to load affiliate links." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    network?: string;
    targetUrl?: string;
    placement?: string;
    imageUrl?: string;
    notes?: string;
  };

  if (!body.name?.trim() || !body.targetUrl?.trim() || !body.placement?.trim()) {
    return NextResponse.json({ error: "Name, target URL, and placement are required." }, { status: 400 });
  }

  try {
    const link = await prisma.affiliateLink.create({
      data: {
        name: body.name.trim(),
        network: body.network?.trim() || null,
        targetUrl: body.targetUrl.trim(),
        placement: body.placement.trim(),
        imageUrl: body.imageUrl?.trim() || null,
        notes: body.notes?.trim() || null,
      },
    });
    return NextResponse.json({ ok: true, link });
  } catch (err) {
    console.error("Affiliate link create error:", err);
    return NextResponse.json({ error: "Failed to create affiliate link." }, { status: 500 });
  }
}
