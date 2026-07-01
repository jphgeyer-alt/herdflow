import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type ListingActionBody = {
  kind?: "livestock" | "product";
  id?: string;
  action?: "approve" | "update" | "feature" | "delete";
  data?: {
    title?: string;
    name?: string;
    priceCents?: number;
    region?: string;
    stockOnHand?: number;
    status?: string;
    isFeatured?: boolean;
  };
};

function ensureAdmin(request: NextRequest) {
  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return isValidAdminSession(session);
}

export async function GET(request: NextRequest) {
  if (!ensureAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [livestock, products] = await Promise.all([
      prisma.listing.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { name: true } },
          seller: { select: { farmName: true } },
        },
      }),
      prisma.product.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { name: true } },
          seller: { select: { farmName: true } },
        },
      }),
    ]);

    return NextResponse.json({ livestock, products });
  } catch {
    return NextResponse.json({ error: "Failed to load listings." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!ensureAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as ListingActionBody;
  const kind = body.kind;
  const id = body.id;
  const action = body.action;

  if (!kind || !id || !action) {
    return NextResponse.json({ error: "kind, id, and action are required." }, { status: 400 });
  }

  try {
    if (kind === "livestock") {
      if (action === "delete") {
        await prisma.listing.delete({ where: { id } });
      }

      if (action === "approve") {
        await prisma.listing.update({ where: { id }, data: { status: "ACTIVE" } });
      }

      if (action === "feature") {
        await prisma.listing.update({ where: { id }, data: { isFeatured: Boolean(body.data?.isFeatured) } });
      }

      if (action === "update") {
        await prisma.listing.update({
          where: { id },
          data: {
            title: body.data?.title,
            priceCents: body.data?.priceCents,
            region: body.data?.region,
            status: body.data?.status as "ACTIVE" | "DRAFT" | "SOLD" | "ARCHIVED" | undefined,
          },
        });
      }
    }

    if (kind === "product") {
      if (action === "delete") {
        await prisma.product.delete({ where: { id } });
      }

      if (action === "approve") {
        await prisma.product.update({ where: { id }, data: { status: "ACTIVE" } });
      }

      if (action === "feature") {
        await prisma.product.update({ where: { id }, data: { isFeatured: Boolean(body.data?.isFeatured) } });
      }

      if (action === "update") {
        await prisma.product.update({
          where: { id },
          data: {
            name: body.data?.name,
            priceCents: body.data?.priceCents,
            region: body.data?.region,
            stockOnHand: body.data?.stockOnHand,
            status: body.data?.status as "ACTIVE" | "DRAFT" | "OUT_OF_STOCK" | "ARCHIVED" | undefined,
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to complete listing action." }, { status: 500 });
  }
}
