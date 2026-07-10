"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/admin/Button";
import { Card, StatCard } from "@/components/admin/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { StatusBadge } from "@/components/admin/Badge";
import { Modal } from "@/components/admin/Modal";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { EmptyState } from "@/components/admin/EmptyState";
import { TableSkeletonRows } from "@/components/admin/Skeleton";

type Reg = {
  id: string;
  biddingNumber: string;
  fullName: string;
  email: string;
  phone: string;
  idNumber: string;
  province: string;
  status: string;
  depositPaid: boolean;
  termsAccepted: boolean;
  createdAt: string;
  adminNotes: string | null;
  approvedAt: string | null;
  bankName: string | null;
  accountNumber: string | null;
};

export default function AdminRegistrationsPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [registrations, setRegistrations] = useState<Reg[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [selected, setSelected] = useState<Reg | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Reg | null>(null);

  useEffect(() => {
    fetch(`/api/admin/auctions/${sessionId}/registrations`)
      .then((r) => r.json())
      .then((d) => setRegistrations(d.registrations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  async function updateStatus(id: string, status: string, notes?: string) {
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/auctions/${sessionId}/registrations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, adminNotes: notes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error("Failed to update");
        return;
      }
      setRegistrations((prev) => prev.map((r) => (r.id === id ? { ...r, ...data.registration } : r)));
      setSelected((prev) => (prev?.id === id ? { ...prev, ...data.registration } : prev));
      toast.success(`${status === "APPROVED" ? "Approved" : "Updated"} — ${data.registration?.fullName}`);
    } finally {
      setSaving(null);
    }
  }

  async function handleReject(reason?: string) {
    if (!rejectTarget) return;
    await updateStatus(rejectTarget.id, "REJECTED", reason);
    setRejectTarget(null);
    setSelected(null);
  }

  function exportCSV() {
    const rows = filtered.map((r) => [
      r.biddingNumber,
      r.fullName,
      r.email,
      r.phone,
      r.idNumber,
      r.province,
      r.status,
      new Date(r.createdAt).toLocaleDateString("en-ZA"),
    ]);
    const header = [
      "Bidding #",
      "Name",
      "Email",
      "Phone",
      "ID Number",
      "Province",
      "Status",
      "Registered",
    ];
    const csv = [header, ...rows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `registrations-${sessionId}.csv`;
    a.click();
  }

  const filtered =
    filter === "ALL" ? registrations : registrations.filter((r) => r.status === filter);
  const stats = {
    total: registrations.length,
    pending: registrations.filter((r) => r.status === "PENDING").length,
    approved: registrations.filter((r) => r.status === "APPROVED").length,
    rejected: registrations.filter((r) => r.status === "REJECTED").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/auctions" className="mb-1 flex items-center gap-1 text-sm text-green hover:underline">
            <ArrowLeft size={14} />
            Back to Auctions
          </Link>
          <h1 className="text-2xl font-black text-navy-600">Buyer Registrations</h1>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download size={16} /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Registered" value={stats.total} accent="navy" />
        <StatCard label="Pending Approval" value={stats.pending} accent="gold" />
        <StatCard label="Approved Bidders" value={stats.approved} accent="green" />
        <StatCard label="Rejected" value={stats.rejected} accent="danger" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${filter === tab ? "bg-navy-600 text-white" : "border border-navy-100 bg-white text-navy-300 hover:border-navy-600"}`}
          >
            {tab}{" "}
            {tab === "ALL"
              ? `(${stats.total})`
              : tab === "PENDING"
                ? `(${stats.pending})`
                : tab === "APPROVED"
                  ? `(${stats.approved})`
                  : `(${stats.rejected})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <Table>
            <Thead>
              <Tr>
                <Th>Bidding #</Th>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Province</Th>
                <Th>Status</Th>
                <Th>Registered</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              <TableSkeletonRows rows={5} cols={7} />
            </Tbody>
          </Table>
        ) : filtered.length === 0 ? (
          <EmptyState title="No registrations found." />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Bidding #</Th>
                <Th>Name</Th>
                <Th className="hidden md:table-cell">Email</Th>
                <Th className="hidden lg:table-cell">Province</Th>
                <Th>Status</Th>
                <Th className="hidden sm:table-cell">Registered</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((reg) => (
                <Tr key={reg.id}>
                  <Td className="font-mono font-bold text-navy-600">{reg.biddingNumber}</Td>
                  <Td>
                    <button
                      onClick={() => setSelected(reg)}
                      className="text-left font-semibold text-navy-600 hover:underline"
                    >
                      {reg.fullName}
                    </button>
                  </Td>
                  <Td className="hidden md:table-cell">{reg.email}</Td>
                  <Td className="hidden lg:table-cell">{reg.province}</Td>
                  <Td>
                    <StatusBadge status={reg.status} />
                  </Td>
                  <Td className="hidden text-xs text-navy-200 sm:table-cell">
                    {new Date(reg.createdAt).toLocaleDateString("en-ZA")}
                  </Td>
                  <Td>
                    <div className="flex gap-1.5">
                      {reg.status !== "APPROVED" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={saving === reg.id}
                          onClick={() => updateStatus(reg.id, "APPROVED")}
                        >
                          Approve
                        </Button>
                      )}
                      {reg.status !== "REJECTED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          disabled={saving === reg.id}
                          onClick={() => setRejectTarget(reg)}
                        >
                          Reject
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setSelected(reg)} title="Details">
                        Details
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {/* Detail modal */}
      {selected && (
        <Modal open onClose={() => setSelected(null)} title={selected.fullName} size="md">
          <div className="space-y-2 text-sm">
            {[
              ["Bidding Number", selected.biddingNumber],
              ["Email", selected.email],
              ["Phone", selected.phone],
              ["ID Number", selected.idNumber],
              ["Province", selected.province],
              ["Bank", selected.bankName || "—"],
              ["Account", selected.accountNumber || "—"],
              ["Registered", new Date(selected.createdAt).toLocaleDateString("en-ZA")],
              ["Terms Accepted", selected.termsAccepted ? "Yes" : "No"],
              ["Deposit Paid", selected.depositPaid ? "Yes" : "No"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-navy-50 py-1">
                <span className="text-navy-300">{label}</span>
                <span className="font-semibold text-navy-500">{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-b border-navy-50 py-1">
              <span className="text-navy-300">Status</span>
              <StatusBadge status={selected.status} />
            </div>
            {selected.adminNotes && (
              <div className="mt-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                <strong>Admin notes:</strong> {selected.adminNotes}
              </div>
            )}
          </div>
          <div className="mt-5 flex gap-3">
            {selected.status !== "APPROVED" && (
              <Button
                variant="secondary"
                className="flex-1"
                loading={saving === selected.id}
                onClick={() => updateStatus(selected.id, "APPROVED")}
              >
                Approve
              </Button>
            )}
            {selected.status !== "REJECTED" && (
              <Button
                variant="danger"
                className="flex-1"
                disabled={saving === selected.id}
                onClick={() => setRejectTarget(selected)}
              >
                Reject
              </Button>
            )}
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={rejectTarget !== null}
        onCancel={() => setRejectTarget(null)}
        onConfirm={handleReject}
        title={`Reject ${rejectTarget?.fullName ?? "this bidder"}?`}
        description="They will no longer be able to bid in this auction."
        confirmLabel="Reject"
        variant="danger"
      />
    </div>
  );
}
