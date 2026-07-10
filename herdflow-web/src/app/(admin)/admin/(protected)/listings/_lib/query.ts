// Shared Prisma query building for the consolidated Listings + Products
// admin views. Used by both the page (grouped views + paginated "All" view)
// and the CSV export route, so filtering/sorting logic lives in one place
// instead of being re-implemented per caller.

import { prisma } from "@/lib/prisma";
import type { Prisma, ListingStatus, ProductStatus } from "@prisma/client";
import type { Filters, Item, Kind, SortKey, ViewMode } from "./types";

export const LISTING_SELECT = {
  id: true,
  title: true,
  slug: true,
  breed: true,
  region: true,
  priceCents: true,
  weightKg: true,
  ageMonths: true,
  photos: true,
  status: true,
  isFeatured: true,
  isDeleted: true,
  deletedAt: true,
  deleteReason: true,
  createdAt: true,
  category: { select: { id: true, name: true } },
  seller: {
    select: {
      id: true,
      farmName: true,
      location: true,
      status: true,
      user: { select: { email: true, phone: true } },
    },
  },
} satisfies Prisma.ListingSelect;

export const PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  region: true,
  priceCents: true,
  stockOnHand: true,
  photos: true,
  status: true,
  isFeatured: true,
  isDeleted: true,
  deletedAt: true,
  deleteReason: true,
  createdAt: true,
  category: { select: { id: true, name: true } },
  seller: {
    select: {
      id: true,
      farmName: true,
      location: true,
      status: true,
      user: { select: { email: true, phone: true } },
    },
  },
} satisfies Prisma.ProductSelect;

type ListingRow = Prisma.ListingGetPayload<{ select: typeof LISTING_SELECT }>;
type ProductRow = Prisma.ProductGetPayload<{ select: typeof PRODUCT_SELECT }>;

function toListingItem(l: ListingRow): Item {
  return {
    id: l.id,
    kind: "listing",
    title: l.title,
    slug: l.slug,
    breed: l.breed,
    weightKg: l.weightKg,
    ageMonths: l.ageMonths,
    region: l.region,
    priceCents: l.priceCents,
    photos: l.photos,
    status: l.status,
    isFeatured: l.isFeatured,
    isDeleted: l.isDeleted,
    deletedAt: l.deletedAt ? l.deletedAt.toISOString() : null,
    deleteReason: l.deleteReason,
    createdAt: l.createdAt.toISOString(),
    category: l.category,
    seller: l.seller,
  };
}

function toProductItem(p: ProductRow): Item {
  return {
    id: p.id,
    kind: "product",
    title: p.name,
    slug: p.slug,
    stockOnHand: p.stockOnHand,
    region: p.region,
    priceCents: p.priceCents,
    photos: p.photos,
    status: p.status,
    isFeatured: p.isFeatured,
    isDeleted: p.isDeleted,
    deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
    deleteReason: p.deleteReason,
    createdAt: p.createdAt.toISOString(),
    category: p.category,
    seller: p.seller,
  };
}

function listingWhere(f: Pick<Filters, "q" | "categoryId" | "status" | "region" | "sellerId" | "removed">) {
  const where: Prisma.ListingWhereInput = { isDeleted: f.removed };
  if (f.q.trim()) {
    const q = f.q.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { breed: { contains: q, mode: "insensitive" } },
      { region: { contains: q, mode: "insensitive" } },
      { seller: { farmName: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (f.categoryId) where.categoryId = f.categoryId;
  if (f.status) where.status = f.status as ListingStatus;
  if (f.region) where.region = f.region;
  if (f.sellerId) where.sellerId = f.sellerId;
  return where;
}

function productWhere(f: Pick<Filters, "q" | "categoryId" | "status" | "region" | "sellerId" | "removed">) {
  const where: Prisma.ProductWhereInput = { isDeleted: f.removed };
  if (f.q.trim()) {
    const q = f.q.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { region: { contains: q, mode: "insensitive" } },
      { seller: { farmName: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (f.categoryId) where.categoryId = f.categoryId;
  if (f.status) where.status = f.status as ProductStatus;
  if (f.region) where.region = f.region;
  if (f.sellerId) where.sellerId = f.sellerId;
  return where;
}

function listingOrderBy(sort: SortKey): Prisma.ListingOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "priceHigh":
      return { priceCents: "desc" };
    case "priceLow":
      return { priceCents: "asc" };
    case "seller":
      return { seller: { farmName: "asc" } };
    default:
      return { createdAt: "desc" };
  }
}

function productOrderBy(sort: SortKey): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "priceHigh":
      return { priceCents: "desc" };
    case "priceLow":
      return { priceCents: "asc" };
    case "seller":
      return { seller: { farmName: "asc" } };
    default:
      return { createdAt: "desc" };
  }
}

/** Fetch items for a given kind + filter set. `take`/`skip` are optional —
 * omit `take` for an unbounded (but still filtered) fetch, e.g. for the
 * grouped views or CSV export, each of which applies its own cap. */
export async function fetchItems(
  f: Pick<Filters, "kind" | "q" | "categoryId" | "status" | "region" | "sellerId" | "sort" | "removed">,
  opts: { skip?: number; take?: number } = {},
): Promise<{ items: Item[]; total: number }> {
  if (f.kind === "listing") {
    const where = listingWhere(f);
    const [rows, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy: listingOrderBy(f.sort),
        skip: opts.skip,
        take: opts.take,
        select: LISTING_SELECT,
      }),
      prisma.listing.count({ where }),
    ]);
    return { items: rows.map(toListingItem), total };
  }

  const where = productWhere(f);
  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: productOrderBy(f.sort),
      skip: opts.skip,
      take: opts.take,
      select: PRODUCT_SELECT,
    }),
    prisma.product.count({ where }),
  ]);
  return { items: rows.map(toProductItem), total };
}

export type Stats = { active: number; pending: number; thirdBucket: number; removed: number };

/** Four cheap counts for the stat cards — independent of the current page's
 * filters/pagination so the cards always reflect the whole kind, not just
 * what's currently on screen. `thirdBucket` is "Sold" for listings and
 * "Out of Stock" for products (the two models don't share that status). */
export async function fetchStats(kind: Kind): Promise<Stats> {
  if (kind === "listing") {
    const [active, pending, sold, removed] = await Promise.all([
      prisma.listing.count({ where: { isDeleted: false, status: "ACTIVE" } }),
      prisma.listing.count({ where: { isDeleted: false, status: "DRAFT" } }),
      prisma.listing.count({ where: { isDeleted: false, status: "SOLD" } }),
      prisma.listing.count({ where: { isDeleted: true } }),
    ]);
    return { active, pending, thirdBucket: sold, removed };
  }
  const [active, pending, outOfStock, removed] = await Promise.all([
    prisma.product.count({ where: { isDeleted: false, status: "ACTIVE" } }),
    prisma.product.count({ where: { isDeleted: false, status: "DRAFT" } }),
    prisma.product.count({ where: { isDeleted: false, status: "OUT_OF_STOCK" } }),
    prisma.product.count({ where: { isDeleted: true } }),
  ]);
  return { active, pending, thirdBucket: outOfStock, removed };
}

export function parseKind(value: string | string[] | undefined): Kind {
  return value === "product" ? "product" : "listing";
}

export function parseView(value: string | string[] | undefined): ViewMode {
  return value === "seller" || value === "all" ? value : "category";
}

export function parseSort(value: string | string[] | undefined): SortKey {
  const v = Array.isArray(value) ? value[0] : value;
  if (v === "oldest" || v === "priceHigh" || v === "priceLow" || v === "seller") return v;
  return "newest";
}

function str(value: string | string[] | undefined): string {
  const v = Array.isArray(value) ? value[0] : value;
  return v ?? "";
}

export function parseFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const page = Math.max(1, parseInt(str(sp.page), 10) || 1);
  return {
    kind: parseKind(sp.kind),
    view: parseView(sp.view),
    q: str(sp.q),
    categoryId: str(sp.category),
    status: str(sp.status),
    region: str(sp.region),
    sellerId: str(sp.seller),
    sort: parseSort(sp.sort),
    removed: str(sp.removed) === "1",
    page,
  };
}
