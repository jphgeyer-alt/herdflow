import { prisma } from "@/lib/prisma";
import { Card, CardHeader } from "@/components/admin/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { TableEmptyRow } from "@/components/admin/EmptyState";
import { Pagination } from "@/components/admin/Pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function actionLabel(action: string) {
  return action.replace(/[._]/g, " ");
}

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);

  const [total, entries] = await Promise.all([
    prisma.adminActivityLog.count().catch(() => 0),
    prisma.adminActivityLog
      .findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      })
      .catch(() => []),
  ]);

  return (
    <main className="space-y-5 pb-10">
      <header>
        <h1 className="text-navy-600 text-3xl font-semibold">Activity Log</h1>
        <p className="text-sm text-navy-300">Audit trail of every admin action across the platform.</p>
      </header>

      <Card>
        <CardHeader title="Recent Activity" />
        <Table>
          <Thead>
            <Tr>
              <Th>When</Th>
              <Th>Admin</Th>
              <Th>Action</Th>
              <Th>Entity</Th>
            </Tr>
          </Thead>
          <Tbody>
            {entries.length === 0 ? (
              <TableEmptyRow colSpan={4} message="No admin activity recorded yet." />
            ) : (
              entries.map((entry) => (
                <Tr key={entry.id}>
                  <Td className="whitespace-nowrap text-xs">{formatDate(entry.createdAt)}</Td>
                  <Td className="font-semibold text-navy-600">{entry.adminName}</Td>
                  <Td className="capitalize">{actionLabel(entry.action)}</Td>
                  <Td>
                    <span className="text-navy-500">{entry.entityType}</span>
                    {entry.entityLabel && (
                      <span className="text-navy-300"> — {entry.entityLabel}</span>
                    )}
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/activity" />
      </Card>
    </main>
  );
}
