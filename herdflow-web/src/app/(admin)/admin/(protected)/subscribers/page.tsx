import { prisma } from "@/lib/prisma";
import { Card, CardHeader, StatCard } from "@/components/admin/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { TableEmptyRow } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/Badge";
import { Pagination } from "@/components/admin/Pagination";
import { Users, TrendingUp, Clock, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(date);
}

export default async function AdminSubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);

  const [total, subscriptions, statusCounts] = await Promise.all([
    prisma.subscription.count(),
    prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: { select: { fullName: true, email: true } },
        plan: { select: { displayName: true } },
      },
    }),
    prisma.subscription.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countByStatus = Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all]));
  const activeCount = countByStatus.ACTIVE ?? 0;
  const trialCount = countByStatus.TRIAL ?? 0;
  const cancelledCount = (countByStatus.CANCELLED ?? 0) + (countByStatus.EXPIRED ?? 0);

  return (
    <main className="space-y-6 pb-10">
      <header>
        <h1 className="text-navy-600 text-3xl font-semibold">Subscribers</h1>
        <p className="text-sm text-navy-300">
          Everyone with a HerdFlow subscription, trial, or plan history.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active" value={activeCount} icon={<TrendingUp size={18} />} accent="green" />
        <StatCard label="On Trial" value={trialCount} icon={<Clock size={18} />} accent="gold" />
        <StatCard label="Cancelled / Expired" value={cancelledCount} icon={<XCircle size={18} />} accent="danger" />
      </div>

      <Card>
        <CardHeader title="All Subscriptions" description={`${total} total`} />
        <Table>
          <Thead>
            <Tr>
              <Th>User</Th>
              <Th>Plan</Th>
              <Th>Status</Th>
              <Th>Cycle</Th>
              <Th>Period End</Th>
              <Th>Trial Ends</Th>
            </Tr>
          </Thead>
          <Tbody>
            {subscriptions.length === 0 ? (
              <TableEmptyRow colSpan={6} message="No subscriptions yet." />
            ) : (
              subscriptions.map((s) => (
                <Tr key={s.id}>
                  <Td>
                    <p className="font-semibold text-navy-600">{s.user.fullName}</p>
                    <p className="text-xs text-navy-300">{s.user.email}</p>
                  </Td>
                  <Td>{s.plan.displayName}</Td>
                  <Td>
                    <StatusBadge status={s.status} />
                  </Td>
                  <Td>{s.billingCycle}</Td>
                  <Td>{formatDate(s.currentPeriodEnd)}</Td>
                  <Td>{formatDate(s.trialEndsAt)}</Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/subscribers" />
      </Card>
    </main>
  );
}
