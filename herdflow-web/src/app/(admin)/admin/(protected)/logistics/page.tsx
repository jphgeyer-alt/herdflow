import { prisma } from "@/lib/prisma";
import { Card, CardHeader } from "@/components/admin/Card";
import { Pagination } from "@/components/admin/Pagination";
import { LogisticsManager } from "./logistics-manager";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

async function getPartners(page: number) {
  try {
    const [total, partners] = await Promise.all([
      prisma.logisticsPartner.count(),
      prisma.logisticsPartner.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { user: { select: { fullName: true, email: true } } },
      }),
    ]);
    return { partners, total };
  } catch {
    return { partners: [], total: 0 };
  }
}

export default async function AdminLogisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  const { partners, total } = await getPartners(page);

  return (
    <main className="space-y-4 pb-10">
      <header>
        <h1 className="text-navy-600 text-3xl font-semibold">Logistics Partners</h1>
        <p className="text-sm text-navy-300">
          Review and approve transport companies. Only approved partners are eligible for delivery
          coordination.
        </p>
      </header>

      <Card>
        <CardHeader title="All Partners" description={`${total} registered partners`} />
        <LogisticsManager initialPartners={partners} />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/logistics" />
      </Card>
    </main>
  );
}
