import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";
import { fetchItems, parseFilters } from "@/app/(admin)/admin/(protected)/listings/_lib/query";
import { EXPORT_CAP } from "@/app/(admin)/admin/(protected)/listings/_lib/constants";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

// Streams a CSV of every item matching the current filters (not just the
// current page) — used by the "Export CSV" button on the Listings/Products
// manager. Read-only, but still admin-gated and audit-logged like every
// other admin action on this entity.
export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const filters = parseFilters(searchParams);

  const { items, total } = await fetchItems(filters, { take: EXPORT_CAP });

  const header = [
    "Title",
    "Breed / Stock",
    "Category",
    "Seller",
    "Province",
    "Price",
    "Status",
    "Visibility",
    "Listed Date",
  ];
  const rows = items.map((item) => [
    item.title,
    item.kind === "listing" ? (item.breed ?? "") : `Stock: ${item.stockOnHand ?? 0}`,
    item.category.name,
    item.seller?.farmName ?? "HerdFlow Direct",
    item.region ?? "",
    (item.priceCents / 100).toFixed(2),
    item.status,
    item.isDeleted ? "Removed" : "Active",
    fmtDate(item.createdAt),
  ]);
  const csv = [header, ...rows].map((r) => r.map((v) => csvCell(String(v))).join(",")).join("\n");

  logAdminActivity(admin, `${filters.kind}.export`, filters.kind === "listing" ? "Listing" : "Product", {
    metadata: { count: items.length, total, filters },
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="herdflow-${filters.kind}s-${Date.now()}.csv"`,
    },
  });
}
