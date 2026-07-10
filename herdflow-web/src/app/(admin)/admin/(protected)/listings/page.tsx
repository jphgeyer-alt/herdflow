import { prisma } from "@/lib/prisma";
import { AdminListingsManager } from "./listings-manager";
import { fetchItems, fetchStats, parseFilters } from "./_lib/query";
import { GROUPED_VIEW_CAP, PAGE_SIZE } from "./_lib/constants";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

async function getPageData(sp: SearchParams) {
  const filters = parseFilters(sp);

  const isAllView = filters.view === "all";
  const skip = isAllView ? (filters.page - 1) * PAGE_SIZE : undefined;
  const take = isAllView ? PAGE_SIZE : GROUPED_VIEW_CAP;

  const [{ items, total }, stats, categories, sellers] = await Promise.all([
    fetchItems(filters, { skip, take }),
    fetchStats(filters.kind),
    prisma.category.findMany({
      where: { kind: { in: filters.kind === "listing" ? ["LIVESTOCK", "BOTH"] : ["PRODUCT", "BOTH"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.seller.findMany({
      orderBy: { farmName: "asc" },
      select: { id: true, farmName: true, status: true },
    }),
  ]);

  return { filters, items, total, stats, categories, sellers, pageSize: isAllView ? PAGE_SIZE : GROUPED_VIEW_CAP };
}

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const data = await getPageData(sp).catch(() => null);

  if (!data) {
    return (
      <main className="space-y-6 pb-10">
        <p className="text-sm text-red-600">Failed to load listings. Please try again.</p>
      </main>
    );
  }

  return (
    <main className="space-y-6 pb-10">
      <AdminListingsManager
        filters={data.filters}
        items={data.items}
        total={data.total}
        pageSize={data.pageSize}
        stats={data.stats}
        categories={data.categories}
        sellers={data.sellers}
      />
    </main>
  );
}
