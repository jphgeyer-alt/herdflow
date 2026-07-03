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

type ListingCreateBody = {
  kind?: "product" | "livestock";
  data?: {
    // Product fields
    name?: string;
    description?: string;
    priceCents?: number;
    stockOnHand?: number;
    region?: string;
    categoryId?: string;
    categoryName?: string;   // find-or-create by name
    sellerId?: string;
    photos?: string[];
    // Livestock-specific fields
    title?: string;
    breed?: string;
    weightKg?: number;
    ageMonths?: number;
    sellerName?: string;   // find-or-create seller by farm name
    sellerPhone?: string;
  };
};

function ensureAdmin(request: NextRequest) {
  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return isValidAdminSession(session);
}

function toSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

/** Find an existing category by name, or create it */
async function findOrCreateCategory(name: string): Promise<string> {
  const slug = toSlug(name);
  const existing = await prisma.category.findFirst({ where: { OR: [{ slug }, { name: { equals: name, mode: "insensitive" } }] } });
  if (existing) return existing.id;
  const created = await prisma.category.create({ data: { name, slug: `${slug}-${Date.now().toString().slice(-4)}`, kind: "BOTH" } });
  return created.id;
}

/** Find an existing seller by farmName, or create one with a system user */
async function findOrCreateSeller(farmName: string, phone?: string, region?: string): Promise<string> {
  const existing = await prisma.seller.findFirst({ where: { farmName: { equals: farmName, mode: "insensitive" } } });
  if (existing) return existing.id;
  const emailSlug = toSlug(farmName);
  const email = `${emailSlug}-${Date.now().toString().slice(-6)}@herdflow-managed.local`;
  const user = await prisma.user.create({ data: { email, fullName: farmName, phone: phone || null, role: "CUSTOMER", passwordHash: null } });
  const seller = await prisma.seller.create({ data: { userId: user.id, farmName, location: region || "South Africa", region: region || "North West", contactPhone: phone || "N/A", nationalIdNumber: "ADMIN_CREATED", idDocumentUrl: "", status: "APPROVED" } });
  return seller.id;
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
        // Livestock listings have no FK dependents that would block deletion
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
        // OrderItem has a hard FK to Product with no onDelete cascade.
        // Delete related OrderItems first inside a transaction, then the product.
        await prisma.$transaction([
          prisma.orderItem.deleteMany({ where: { productId: id } }),
          prisma.product.delete({ where: { id } }),
        ]);
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
  } catch (err) {
    console.error("Listing action error [kind=%s action=%s id=%s]:", kind, action, id, err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to ${action} ${kind}: ${detail}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!ensureAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as ListingCreateBody;

  const photos = Array.isArray(body.data?.photos)
    ? (body.data?.photos as string[]).filter((p) => typeof p === "string" && p.trim().length > 0).map((p) => p.trim())
    : [];

  // ── Create Livestock Listing ─────────────────────────────────────────
  if (body.kind === "livestock") {
    const title = (body.data?.title || "").trim();
    const description = (body.data?.description || "").trim();
    const region = (body.data?.region || "").trim();
    const breed = (body.data?.breed || "").trim();
    const priceCents = Number(body.data?.priceCents ?? 0);
    const weightKg = body.data?.weightKg ? Number(body.data.weightKg) : null;
    const ageMonths = body.data?.ageMonths ? Number(body.data.ageMonths) : null;
    const sellerName = (body.data?.sellerName || "").trim();
    const sellerPhone = (body.data?.sellerPhone || "").trim();
    const categoryName = (body.data?.categoryName || "Cattle").trim();

    if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
    if (!description) return NextResponse.json({ error: "Description is required." }, { status: 400 });
    if (!breed) return NextResponse.json({ error: "Breed is required." }, { status: 400 });
    if (!sellerName) return NextResponse.json({ error: "Seller name is required." }, { status: 400 });
    if (!region) return NextResponse.json({ error: "Region is required." }, { status: 400 });
    if (!Number.isInteger(priceCents) || priceCents < 0) return NextResponse.json({ error: "Price must be a non-negative integer in cents." }, { status: 400 });

    try {
      // Find-or-create category and seller automatically
      const [categoryId, sellerId] = await Promise.all([
        findOrCreateCategory(categoryName),
        findOrCreateSeller(sellerName, sellerPhone || undefined, region),
      ]);

      const baseSlug = toSlug(title);
      const slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

      const listing = await prisma.listing.create({
        data: { title, slug, description, priceCents, region, breed, weightKg, ageMonths, photos, status: "ACTIVE", categoryId, sellerId },
        include: { category: { select: { name: true } }, seller: { select: { farmName: true } } },
      });

      return NextResponse.json({ ok: true, listing });
    } catch (err) {
      console.error("Livestock create error:", err);
      return NextResponse.json({ error: "Unable to create livestock listing. Check database connection." }, { status: 500 });
    }
  }

  // ── Create Shop Product ──────────────────────────────────────────────
  if (body.kind !== "product") {
    return NextResponse.json({ error: "kind must be 'product' or 'livestock'." }, { status: 400 });
  }

  const name = (body.data?.name || "").trim();
  const description = (body.data?.description || "").trim();
  const categoryName = (body.data?.categoryName || "Other").trim();
  const priceCents = Number(body.data?.priceCents ?? 0);
  const stockOnHand = Number(body.data?.stockOnHand ?? 0);

  if (!name || !description) {
    return NextResponse.json({ error: "Name and description are required." }, { status: 400 });
  }

  if (!Number.isInteger(priceCents) || priceCents < 0) {
    return NextResponse.json({ error: "priceCents must be a non-negative integer." }, { status: 400 });
  }

  if (!Number.isInteger(stockOnHand) || stockOnHand < 0) {
    return NextResponse.json({ error: "stockOnHand must be a non-negative integer." }, { status: 400 });
  }

  const sellerId = (body.data?.sellerId || "").trim() || null;
  const productPhotos = photos;

  try {
    // Find-or-create category automatically
    const categoryId = await findOrCreateCategory(categoryName);

    const baseSlug = toSlug(name);
    const slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

    const product = await prisma.product.create({
      data: {
        name, slug, description, priceCents, stockOnHand,
        region: (body.data?.region || "").trim() || null,
        categoryId, sellerId, photos: productPhotos, status: "ACTIVE",
      },
      include: {
        category: { select: { name: true } },
        seller: { select: { farmName: true } },
      },
    });

    return NextResponse.json({ ok: true, product });
  } catch {
    return NextResponse.json({ error: "Unable to create product." }, { status: 500 });
  }
}
