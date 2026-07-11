"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { HerdflowTrusted } from "@/components/ui/HerdflowTrusted";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { TableEmptyRow } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
import { Input, Select } from "@/components/admin/Field";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

type Seller = {
  id: string;
  farmName: string;
  location: string;
  region: string;
  contactPhone: string;
  idDocumentUrl: string;
  status: string;
  createdAt: Date | string;
  totalSalesCents: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  balance: any;
  bankName: string | null;
  accountNumber: string | null;
  branchCode: string | null;
  accountHolder: string | null;
  user: { fullName: string; email: string };
  _count: { livestockListings: number; products: number };
};

type SellersManagerProps = {
  initialSellers: Seller[];
};

const STATUS_OPTIONS = ["PENDING", "APPROVED", "REJECTED"];

function toCurrency(cents: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(v: Date | string) {
  return new Date(v).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function SellersManager({ initialSellers }: SellersManagerProps) {
  const [sellers, setSellers] = useState<Seller[]>(initialSellers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [approveTarget, setApproveTarget] = useState<Seller | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Seller | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sellers.filter((s) => {
      const matchStatus = statusFilter === "ALL" || s.status === statusFilter;
      if (!matchStatus) return false;
      if (!q) return true;
      return (
        s.farmName.toLowerCase().includes(q) ||
        s.user.email.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q)
      );
    });
  }, [sellers, search, statusFilter]);

  async function updateStatus(id: string, status: string, reason?: string) {
    setSavingId(id);
    try {
      const res = await fetch("/api/admin/sellers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, reason }),
      });
      if (!res.ok) {
        const p = await res.json().catch(() => ({}));
        toast.error(typeof p.error === "string" ? p.error : "Failed to update seller.");
        return;
      }
      setSellers((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
      toast.success(status === "APPROVED" ? "Seller approved" : "Seller rejected");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-b border-navy-50 p-4">
        <Input
          type="search"
          placeholder="Search farm, email, or region…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64"
        />
        <Select
          aria-label="Filter sellers by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-auto!"
        >
          <option value="ALL">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <span className="ml-auto self-center text-xs text-navy-300">{filtered.length} sellers</span>
      </div>

      <Table>
        <Thead>
          <Tr>
            <Th>Farm</Th>
            <Th>Owner</Th>
            <Th>Region</Th>
            <Th align="right">Livestock</Th>
            <Th align="right">Products</Th>
            <Th align="right">Total Sales</Th>
            <Th align="right">Balance Owed</Th>
            <Th>Bank Details</Th>
            <Th>Joined</Th>
            <Th>Status</Th>
            <Th>Action</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filtered.length === 0 ? (
            <TableEmptyRow colSpan={11} message="No sellers found." />
          ) : (
            filtered.map((seller) => {
              const isSaving = savingId === seller.id;
              return (
                <Tr key={seller.id}>
                  <Td>
                    <div className="font-semibold text-navy-600">{seller.farmName}</div>
                    {seller.status === "APPROVED" && (
                      <div className="mt-1">
                        <HerdflowTrusted compact />
                      </div>
                    )}
                    <div className="text-xs text-navy-300">{seller.location}</div>
                  </Td>
                  <Td>
                    <div className="text-navy-500">{seller.user.fullName}</div>
                    <div className="text-xs text-navy-300">{seller.user.email}</div>
                  </Td>
                  <Td>{seller.region}</Td>
                  <Td align="right">{seller._count.livestockListings}</Td>
                  <Td align="right">{seller._count.products}</Td>
                  <Td align="right" className="font-semibold text-navy-600">
                    {toCurrency(seller.totalSalesCents)}
                  </Td>
                  <Td align="right" className="font-semibold text-navy-600">
                    {toCurrency(Math.round(Number(seller.balance) * 100))}
                  </Td>
                  <Td>
                    {seller.bankName || seller.accountNumber ? (
                      <div className="text-xs text-navy-400">
                        <div className="font-semibold text-navy-600">{seller.accountHolder || "—"}</div>
                        <div>{seller.bankName || "—"}</div>
                        <div>
                          {seller.accountNumber || "—"}
                          {seller.branchCode ? ` · ${seller.branchCode}` : ""}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-navy-300">Not provided</span>
                    )}
                  </Td>
                  <Td>{formatDate(seller.createdAt)}</Td>
                  <Td>
                    <StatusBadge status={seller.status} />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={isSaving || seller.status === "APPROVED"}
                        onClick={() => setApproveTarget(seller)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={isSaving || seller.status === "REJECTED"}
                        onClick={() => setRejectTarget(seller)}
                      >
                        Reject
                      </Button>
                    </div>
                  </Td>
                </Tr>
              );
            })
          )}
        </Tbody>
      </Table>

      <ConfirmDialog
        open={approveTarget !== null}
        onCancel={() => setApproveTarget(null)}
        onConfirm={async () => {
          if (!approveTarget) return;
          await updateStatus(approveTarget.id, "APPROVED");
          setApproveTarget(null);
        }}
        title="Approve seller"
        description={
          approveTarget
            ? `Approve ${approveTarget.farmName}? They will be able to list livestock and products immediately.`
            : undefined
        }
        confirmLabel="Approve"
        variant="primary"
      />

      <ConfirmDialog
        open={rejectTarget !== null}
        onCancel={() => setRejectTarget(null)}
        onConfirm={async (reason) => {
          if (!rejectTarget) return;
          await updateStatus(rejectTarget.id, "REJECTED", reason);
          setRejectTarget(null);
        }}
        title="Reject seller"
        description={rejectTarget ? `Reject ${rejectTarget.farmName}'s seller application?` : undefined}
        confirmLabel="Reject"
        variant="danger"
        reasonLabel="Rejection reason"
        reasonPlaceholder="Explain why this application is being rejected…"
      />
    </div>
  );
}
