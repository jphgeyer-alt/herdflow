"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { formatRand } from "@/lib/marketing/format";
import { Card, CardHeader, StatCard } from "@/components/admin/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { TableEmptyRow } from "@/components/admin/EmptyState";
import { TableSkeletonRows } from "@/components/admin/Skeleton";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
import { Input, Select } from "@/components/admin/Field";
import { Modal } from "@/components/admin/Modal";

type LeadRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  province: string;
  amountSought: string | null;
  livestockValue: string | null;
  status: string;
  commissionEarned: string | null;
  createdAt: string;
  category: { key: string; displayName: string };
};

type CategoryRow = {
  id: string;
  key: string;
  displayName: string;
  partnerName: string;
  partnerEmail: string;
  externalUrl: string | null;
  useExternalRedirect: boolean;
  commissionNote: string | null;
  isActive: boolean;
};

const STATUS_VARIANT: Record<string, "neutral" | "info" | "success" | "danger" | "warning"> = {
  NEW: "info",
  SENT_TO_PARTNER: "warning",
  CONVERTED: "success",
  DECLINED: "danger",
  EXPIRED: "neutral",
};

function ConvertModal({ lead, onClose, onSaved }: { lead: LeadRow; onClose: () => void; onSaved: () => void }) {
  const [commission, setCommission] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONVERTED", commissionEarned: Number(commission || 0) }),
      });
      if (!res.ok) {
        toast.error("Failed to mark converted.");
        return;
      }
      toast.success("Lead marked as converted.");
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Mark Lead Converted"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={save} loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <Input
        label="Commission Earned (R)"
        type="number"
        value={commission}
        onChange={(e) => setCommission(e.target.value)}
        placeholder="0.00"
      />
    </Modal>
  );
}

function CategoryModal({
  category,
  onClose,
  onSaved,
}: {
  category: CategoryRow;
  onClose: () => void;
  onSaved: (updated: CategoryRow) => void;
}) {
  const [form, setForm] = useState({
    partnerName: category.partnerName,
    partnerEmail: category.partnerEmail,
    externalUrl: category.externalUrl ?? "",
    useExternalRedirect: category.useExternalRedirect,
    commissionNote: category.commissionNote ?? "",
    isActive: category.isActive,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/leads/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save.");
        return;
      }
      onSaved(data.category);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit ${category.displayName}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={save} loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Partner Name"
          value={form.partnerName}
          onChange={(e) => setForm((p) => ({ ...p, partnerName: e.target.value }))}
        />
        <Input
          label="Partner Email"
          type="email"
          value={form.partnerEmail}
          onChange={(e) => setForm((p) => ({ ...p, partnerEmail: e.target.value }))}
        />
        <Input
          label="External URL (optional)"
          value={form.externalUrl}
          onChange={(e) => setForm((p) => ({ ...p, externalUrl: e.target.value }))}
        />
        <Input
          label="Commission Note (internal)"
          value={form.commissionNote}
          onChange={(e) => setForm((p) => ({ ...p, commissionNote: e.target.value }))}
        />
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-navy-500">
            <input
              type="checkbox"
              checked={form.useExternalRedirect}
              onChange={(e) => setForm((p) => ({ ...p, useExternalRedirect: e.target.checked }))}
              className="h-4 w-4 rounded border-navy-100"
            />
            Use external redirect
          </label>
          <label className="flex items-center gap-2 text-sm text-navy-500">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-navy-100"
            />
            Active
          </label>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [stats, setStats] = useState({ leadsThisMonth: 0, conversionRate: 0, commissionThisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [convertTarget, setConvertTarget] = useState<LeadRow | null>(null);
  const [editCategory, setEditCategory] = useState<CategoryRow | null>(null);

  function load() {
    const qs = statusFilter === "ALL" ? "" : `?status=${statusFilter}`;
    Promise.all([
      fetch(`/api/admin/leads${qs}`).then((r) => r.json()),
      fetch("/api/admin/leads/categories").then((r) => r.json()),
    ])
      .then(([leadsData, catData]) => {
        setLeads(leadsData.leads || []);
        setStats(leadsData.stats || { leadsThisMonth: 0, conversionRate: 0, commissionThisMonth: 0 });
        setCategories(catData.categories || []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [statusFilter]);

  function selectStatusFilter(value: string) {
    setStatusFilter(value);
    setLoading(true);
  }

  async function markStatus(lead: LeadRow, status: string) {
    const res = await fetch(`/api/admin/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success(`Lead marked ${status.replace(/_/g, " ").toLowerCase()}.`);
      setLoading(true);
      load();
    } else {
      toast.error("Failed to update lead.");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-navy-600">Farm Finance &amp; Insurance Leads</h1>
          <p className="mt-1 text-sm text-navy-400">
            Referral leads sent to finance and insurance partners.
          </p>
        </div>
        <Link
          href="/api/admin/leads/export"
          className="inline-flex items-center gap-1.5 rounded-lg border border-navy-100 px-4 py-2 text-sm font-semibold text-navy-600 hover:bg-navy-25"
        >
          <Download size={14} /> Export CSV
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Leads This Month" value={stats.leadsThisMonth} accent="navy" />
        <StatCard label="Conversion Rate" value={`${stats.conversionRate.toFixed(1)}%`} accent="green" />
        <StatCard label="Commission This Month" value={formatRand(stats.commissionThisMonth)} accent="gold" />
      </div>

      <Card>
        <CardHeader
          title="Leads"
          action={
            <Select value={statusFilter} onChange={(e) => selectStatusFilter(e.target.value)} className="w-auto!">
              <option value="ALL">All statuses</option>
              <option value="NEW">New</option>
              <option value="SENT_TO_PARTNER">Sent to Partner</option>
              <option value="CONVERTED">Converted</option>
              <option value="DECLINED">Declined</option>
              <option value="EXPIRED">Expired</option>
            </Select>
          }
        />
        <Table>
          <Thead>
            <Tr>
              <Th>Date</Th>
              <Th>Category</Th>
              <Th>Name</Th>
              <Th>Phone</Th>
              <Th>Province</Th>
              <Th align="right">Amount</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <TableSkeletonRows rows={5} cols={8} />
            ) : leads.length === 0 ? (
              <TableEmptyRow colSpan={8} message="No leads yet." />
            ) : (
              leads.map((l) => (
                <Tr key={l.id}>
                  <Td>{new Date(l.createdAt).toLocaleDateString("en-ZA")}</Td>
                  <Td>{l.category.displayName}</Td>
                  <Td className="font-semibold text-navy-600">{l.name}</Td>
                  <Td>{l.phone}</Td>
                  <Td>{l.province}</Td>
                  <Td align="right">
                    {l.amountSought
                      ? formatRand(Number(l.amountSought))
                      : l.livestockValue
                        ? formatRand(Number(l.livestockValue))
                        : "—"}
                  </Td>
                  <Td>
                    <Badge variant={STATUS_VARIANT[l.status] ?? "neutral"}>{l.status.replace(/_/g, " ")}</Badge>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-2">
                      {l.status === "NEW" && (
                        <Button size="sm" variant="outline" onClick={() => markStatus(l, "SENT_TO_PARTNER")}>
                          Mark Sent
                        </Button>
                      )}
                      {l.status !== "CONVERTED" && (
                        <Button size="sm" variant="secondary" onClick={() => setConvertTarget(l)}>
                          Converted
                        </Button>
                      )}
                      {l.status !== "DECLINED" && (
                        <Button size="sm" variant="outline" onClick={() => markStatus(l, "DECLINED")}>
                          Declined
                        </Button>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>

      <Card>
        <CardHeader title="Lead Categories" description="Partner details for each finance/insurance category." />
        <Table>
          <Thead>
            <Tr>
              <Th>Category</Th>
              <Th>Partner</Th>
              <Th>Partner Email</Th>
              <Th>Redirect</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {categories.map((c) => (
              <Tr key={c.id}>
                <Td className="font-semibold text-navy-600">{c.displayName}</Td>
                <Td>{c.partnerName}</Td>
                <Td>{c.partnerEmail}</Td>
                <Td>
                  <Badge variant={c.useExternalRedirect ? "info" : "neutral"}>
                    {c.useExternalRedirect ? "External" : "None"}
                  </Badge>
                </Td>
                <Td>
                  <Badge variant={c.isActive ? "success" : "neutral"}>{c.isActive ? "Active" : "Inactive"}</Badge>
                </Td>
                <Td>
                  <Button size="sm" variant="outline" onClick={() => setEditCategory(c)}>
                    Edit
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>

      {convertTarget && (
        <ConvertModal lead={convertTarget} onClose={() => setConvertTarget(null)} onSaved={load} />
      )}
      {editCategory && (
        <CategoryModal
          category={editCategory}
          onClose={() => setEditCategory(null)}
          onSaved={(updated) => setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))}
        />
      )}
    </div>
  );
}
