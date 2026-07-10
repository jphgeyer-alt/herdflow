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

type Partner = {
  id: string;
  companyName: string;
  fleetSize: number;
  routesCovered: string;
  vehicleDocumentsUrl: string;
  status: string;
  createdAt: Date | string;
  user: { fullName: string; email: string };
};

type LogisticsManagerProps = {
  initialPartners: Partner[];
};

const STATUS_OPTIONS = ["PENDING", "APPROVED", "REJECTED"];

function formatDate(v: Date | string) {
  return new Date(v).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function LogisticsManager({ initialPartners }: LogisticsManagerProps) {
  const [partners, setPartners] = useState<Partner[]>(initialPartners);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [approveTarget, setApproveTarget] = useState<Partner | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Partner | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return partners.filter((p) => {
      const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
      if (!matchStatus) return false;
      if (!q) return true;
      return (
        p.companyName.toLowerCase().includes(q) ||
        p.user.email.toLowerCase().includes(q) ||
        p.routesCovered.toLowerCase().includes(q)
      );
    });
  }, [partners, search, statusFilter]);

  async function updateStatus(id: string, status: string, reason?: string) {
    setSavingId(id);
    try {
      const res = await fetch("/api/admin/logistics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, reason }),
      });
      if (!res.ok) {
        const p = await res.json().catch(() => ({}));
        toast.error(typeof p.error === "string" ? p.error : "Failed to update partner.");
        return;
      }
      setPartners((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
      toast.success(status === "APPROVED" ? "Partner approved" : "Partner rejected");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-b border-navy-50 p-4">
        <Input
          type="search"
          placeholder="Search company, email, or routes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64"
        />
        <Select
          aria-label="Filter logistics partners by status"
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
        <span className="ml-auto self-center text-xs text-navy-300">{filtered.length} partners</span>
      </div>

      <Table>
        <Thead>
          <Tr>
            <Th>Company</Th>
            <Th>Contact</Th>
            <Th align="right">Fleet Size</Th>
            <Th>Routes Covered</Th>
            <Th>Documents</Th>
            <Th>Registered</Th>
            <Th>Status</Th>
            <Th>Action</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filtered.length === 0 ? (
            <TableEmptyRow colSpan={8} message="No logistics partners found." />
          ) : (
            filtered.map((partner) => {
              const isSaving = savingId === partner.id;
              return (
                <Tr key={partner.id}>
                  <Td className="font-semibold text-navy-600">
                    <div className="space-y-1">
                      <div>{partner.companyName}</div>
                      {partner.status === "APPROVED" && <HerdflowTrusted compact />}
                    </div>
                  </Td>
                  <Td>
                    <div className="text-navy-500">{partner.user.fullName}</div>
                    <div className="text-xs text-navy-300">{partner.user.email}</div>
                  </Td>
                  <Td align="right">{partner.fleetSize}</Td>
                  <Td className="max-w-xs truncate">{partner.routesCovered}</Td>
                  <Td>
                    {partner.vehicleDocumentsUrl ? (
                      <a
                        href={partner.vehicleDocumentsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-navy-600 underline"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-xs text-navy-200">—</span>
                    )}
                  </Td>
                  <Td>{formatDate(partner.createdAt)}</Td>
                  <Td>
                    <StatusBadge status={partner.status} />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={isSaving || partner.status === "APPROVED"}
                        onClick={() => setApproveTarget(partner)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={isSaving || partner.status === "REJECTED"}
                        onClick={() => setRejectTarget(partner)}
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
        title="Approve logistics partner"
        description={
          approveTarget
            ? `Approve ${approveTarget.companyName}? They will be eligible for delivery coordination immediately.`
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
        title="Reject logistics partner"
        description={
          rejectTarget ? `Reject ${rejectTarget.companyName}'s partner application?` : undefined
        }
        confirmLabel="Reject"
        variant="danger"
        reasonLabel="Rejection reason"
        reasonPlaceholder="Explain why this application is being rejected…"
      />
    </div>
  );
}
