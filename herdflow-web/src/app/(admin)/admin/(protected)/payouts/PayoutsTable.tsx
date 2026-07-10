"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Wallet, CheckCircle2 } from "lucide-react";
import { formatRand } from "@/lib/marketing/format";
import { Card, CardHeader, StatCard } from "@/components/admin/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { StatusBadge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
import { Input } from "@/components/admin/Field";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Pagination } from "@/components/admin/Pagination";
import { TableEmptyRow } from "@/components/admin/EmptyState";
import { TableSkeletonRows } from "@/components/admin/Skeleton";

export type PayoutKind = "seller" | "logistics";

type PendingBalance = { id: string; name: string; amountCents: number };

type PayoutRow = {
  id: string;
  number: string;
  amountCents: number;
  status: string;
  paymentReference: string | null;
  createdAt: string;
  paidAt: string | null;
  counterpartyName: string;
};

// Raw API response shapes — kept distinct per kind (sellerId/farmName vs.
// logisticsPartnerId/companyName) and normalized into the shared
// PendingBalance/PayoutRow shape above via each kind's map* functions.
type RawRecord = Record<string, any>;

type PayoutConfig = {
  counterpartyLabel: string;
  counterpartyLabelPlural: string;
  pendingApi: string;
  payoutsApi: string;
  payoutApi: (id: string) => string;
  createBodyKey: "sellerId" | "logisticsPartnerId";
  mapPending: (raw: RawRecord) => PendingBalance;
  mapPayout: (raw: RawRecord) => PayoutRow;
};

const KIND_CONFIG: Record<PayoutKind, PayoutConfig> = {
  seller: {
    counterpartyLabel: "Seller",
    counterpartyLabelPlural: "sellers",
    pendingApi: "/api/admin/payouts/pending",
    payoutsApi: "/api/admin/payouts",
    payoutApi: (id) => `/api/admin/payouts/${id}`,
    createBodyKey: "sellerId",
    mapPending: (raw) => ({ id: raw.sellerId, name: raw.farmName, amountCents: raw.amountCents }),
    mapPayout: (raw) => ({
      id: raw.id,
      number: raw.number,
      amountCents: raw.amountCents,
      status: raw.status,
      paymentReference: raw.paymentReference,
      createdAt: raw.createdAt,
      paidAt: raw.paidAt,
      counterpartyName: raw.seller?.farmName ?? "Unknown Seller",
    }),
  },
  logistics: {
    counterpartyLabel: "Partner",
    counterpartyLabelPlural: "partners",
    pendingApi: "/api/admin/logistics/payouts/pending",
    payoutsApi: "/api/admin/logistics/payouts",
    payoutApi: (id) => `/api/admin/logistics/payouts/${id}`,
    createBodyKey: "logisticsPartnerId",
    mapPending: (raw) => ({
      id: raw.logisticsPartnerId,
      name: raw.companyName,
      amountCents: raw.amountCents,
    }),
    mapPayout: (raw) => ({
      id: raw.id,
      number: raw.number,
      amountCents: raw.amountCents,
      status: raw.status,
      paymentReference: raw.paymentReference,
      createdAt: raw.createdAt,
      paidAt: raw.paidAt,
      counterpartyName: raw.logisticsPartner?.companyName ?? "Unknown Partner",
    }),
  },
};

const PAGE_SIZE = 10;

/**
 * Shared UI for the Seller Payouts and Logistics Payouts admin pages, which
 * were previously near-line-for-line duplicated (same pending-balance table,
 * same payout-history table, same mark-paid/cancel row) with only the
 * counterparty field name swapped. Parameterized by `kind` via KIND_CONFIG
 * above so both pages can stay thin.
 */
export function PayoutsTable({ kind }: { kind: PayoutKind }) {
  const config = KIND_CONFIG[kind];
  const [pending, setPending] = useState<PendingBalance[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  function load() {
    setLoading(true);
    Promise.all([
      fetch(config.pendingApi).then((r) => r.json()),
      fetch(config.payoutsApi).then((r) => r.json()),
    ])
      .then(([pendingData, payoutsData]) => {
        setPending((pendingData.pending || []).map(config.mapPending));
        setPayouts((payoutsData.payouts || []).map(config.mapPayout));
      })
      .catch(() => toast.error("Failed to load payouts."))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [kind]);

  async function createPayout(id: string) {
    setCreatingId(id);
    try {
      const res = await fetch(config.payoutsApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [config.createBodyKey]: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to create payout.");
        return;
      }
      toast.success("Payout created.");
      load();
    } catch {
      toast.error("Failed to create payout.");
    } finally {
      setCreatingId(null);
    }
  }

  const pendingTotalCents = pending.reduce((sum, p) => sum + p.amountCents, 0);
  const paidTotalCents = payouts
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amountCents, 0);

  const totalPages = Math.max(1, Math.ceil(payouts.length / PAGE_SIZE));
  const pagedPayouts = payouts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Pending Balance"
          value={formatRand(pendingTotalCents / 100)}
          icon={<Wallet size={18} />}
          accent="gold"
          hint={`Owed across ${pending.length} ${config.counterpartyLabelPlural}`}
        />
        <StatCard
          label="Paid Out (all time)"
          value={formatRand(paidTotalCents / 100)}
          icon={<CheckCircle2 size={18} />}
          accent="green"
        />
      </div>

      <Card>
        <CardHeader
          title="Pending Balances"
          description={`What HerdFlow currently owes each ${config.counterpartyLabel.toLowerCase()}.`}
        />
        <Table>
          <Thead>
            <Tr>
              <Th>{config.counterpartyLabel}</Th>
              <Th>Owed</Th>
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <TableSkeletonRows rows={3} cols={3} />
            ) : pending.length === 0 ? (
              <TableEmptyRow
                colSpan={3}
                message={`No ${config.counterpartyLabelPlural} currently owed a payout.`}
              />
            ) : (
              pending.map((p) => (
                <Tr key={p.id}>
                  <Td className="font-semibold text-navy-600">{p.name}</Td>
                  <Td className="font-bold text-navy-600">{formatRand(p.amountCents / 100)}</Td>
                  <Td>
                    <Button
                      size="sm"
                      loading={creatingId === p.id}
                      onClick={() => createPayout(p.id)}
                    >
                      Create Payout
                    </Button>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>

      <Card>
        <CardHeader title="Payout History" />
        <Table>
          <Thead>
            <Tr>
              <Th>Number</Th>
              <Th>{config.counterpartyLabel}</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Reference</Th>
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <TableSkeletonRows rows={5} cols={6} />
            ) : payouts.length === 0 ? (
              <TableEmptyRow colSpan={6} message="No payouts yet." />
            ) : (
              pagedPayouts.map((p) => (
                <Tr key={p.id}>
                  <Td className="font-semibold text-navy-600">{p.number}</Td>
                  <Td>{p.counterpartyName}</Td>
                  <Td className="font-bold text-navy-600">{formatRand(p.amountCents / 100)}</Td>
                  <Td>
                    <StatusBadge status={p.status} />
                  </Td>
                  <Td>{p.paymentReference || "—"}</Td>
                  <Td>
                    {p.status === "PENDING" && (
                      <PayoutActions
                        payout={p}
                        payoutApiPath={config.payoutApi(p.id)}
                        onDone={load}
                      />
                    )}
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
        {!loading && totalPages > 1 && (
          <Pagination page={page} pageSize={PAGE_SIZE} total={payouts.length} onPageChange={setPage} />
        )}
      </Card>
    </div>
  );
}

function PayoutActions({
  payout,
  payoutApiPath,
  onDone,
}: {
  payout: PayoutRow;
  payoutApiPath: string;
  onDone: () => void;
}) {
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [showReferenceInput, setShowReferenceInput] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  async function markPaid() {
    setBusy(true);
    try {
      const res = await fetch(payoutApiPath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID", paymentReference: reference || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to mark payout as paid.");
        return;
      }
      toast.success(`Payout ${payout.number} marked as paid.`);
      onDone();
    } catch {
      toast.error("Failed to mark payout as paid.");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    try {
      const res = await fetch(payoutApiPath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to cancel payout.");
        return;
      }
      toast.success(`Payout ${payout.number} cancelled.`);
      onDone();
    } catch {
      toast.error("Failed to cancel payout.");
    } finally {
      setBusy(false);
      setConfirmCancelOpen(false);
    }
  }

  if (showReferenceInput) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Payment ref (optional)"
          className="w-36"
        />
        <Button size="sm" variant="secondary" loading={busy} onClick={markPaid}>
          Confirm
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => setShowReferenceInput(true)}>
          Mark Paid
        </Button>
        <Button size="sm" variant="outline" onClick={() => setConfirmCancelOpen(true)}>
          Cancel
        </Button>
      </div>
      <ConfirmDialog
        open={confirmCancelOpen}
        onCancel={() => setConfirmCancelOpen(false)}
        onConfirm={cancel}
        title="Cancel this payout?"
        description={`This releases the ${formatRand(payout.amountCents / 100)} for payout ${payout.number} back into the pending balance so it can be included in a future payout. This cannot be undone.`}
        confirmLabel="Cancel Payout"
        variant="danger"
      />
    </>
  );
}
