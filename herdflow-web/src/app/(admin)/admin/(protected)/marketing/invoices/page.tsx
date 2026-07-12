"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { formatRand } from "@/lib/marketing/format";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { TableEmptyRow } from "@/components/admin/EmptyState";
import { TableSkeletonRows } from "@/components/admin/Skeleton";
import { StatusBadge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
import { buttonClass } from "@/components/admin/button-styles";
import { Input, Select } from "@/components/admin/Field";
import { Modal } from "@/components/admin/Modal";
import { Pagination } from "@/components/admin/Pagination";

type InvoiceRow = {
  id: string;
  number: string;
  description: string;
  amount: string;
  status: string;
  dueDate: string;
  sponsor: { companyName: string; email: string };
};

type SponsorOption = { id: string; companyName: string; packageId: string | null };

const TABS = ["ALL", "UNPAID", "PAID", "OVERDUE", "CANCELLED"] as const;
const PAGE_SIZE = 20;

function isOverdue(inv: InvoiceRow) {
  return inv.status === "UNPAID" && new Date(inv.dueDate) < new Date();
}

function NewInvoiceModal({
  sponsors,
  onClose,
  onCreated,
}: {
  sponsors: SponsorOption[];
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [sponsorId, setSponsorId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [periodLabel, setPeriodLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    if (!sponsorId) {
      setError("Please select a sponsor.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/marketing/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sponsorId,
          description: description || undefined,
          amount: amount === "" ? undefined : Number(amount),
          periodLabel: periodLabel || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create invoice.");
        return;
      }
      onCreated(data.invoice.id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="New Invoice"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={create} loading={saving}>
            Create Invoice
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <Select label="Sponsor" value={sponsorId} onChange={(e) => setSponsorId(e.target.value)}>
          <option value="">— Select sponsor —</option>
          {sponsors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.companyName}
            </option>
          ))}
        </Select>

        <Input
          label="Description — leave blank to use their package name"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Input
          label="Amount (R) — leave blank to use sponsor's fee"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <Input
          label="Billing Period (optional)"
          value={periodLabel}
          onChange={(e) => setPeriodLabel(e.target.value)}
          placeholder="e.g. July 2026"
        />
      </div>
    </Modal>
  );
}

export default function InvoicesAdminPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [sponsors, setSponsors] = useState<SponsorOption[]>([]);
  const [filter, setFilter] = useState<(typeof TABS)[number]>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  function load(status: string) {
    const qs = status === "ALL" ? "" : `?status=${status}`;
    fetch(`/api/admin/marketing/invoices${qs}`)
      .then((r) => r.json())
      .then((d) => setInvoices(d.invoices || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(filter);
  }, [filter]);

  useEffect(() => {
    fetch("/api/admin/marketing")
      .then((r) => r.json())
      .then((d) => setSponsors(d.sponsors || []));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter(
      (inv) =>
        inv.number.toLowerCase().includes(q) ||
        inv.sponsor.companyName.toLowerCase().includes(q) ||
        inv.sponsor.email.toLowerCase().includes(q),
    );
  }, [invoices, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function selectFilter(tab: (typeof TABS)[number]) {
    setFilter(tab);
    setLoading(true);
    setPage(1);
  }

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  if (createdId) {
    return (
      <div className="rounded-xl border border-navy-50 bg-white p-8 text-center">
        <p className="mb-4 text-sm text-navy-300">Invoice created.</p>
        <Link
          href={`/admin/marketing/invoices/${createdId}`}
          className={buttonClass("primary", "md")}
        >
          View Invoice →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => selectFilter(tab)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                filter === tab
                  ? "bg-navy-600 text-white"
                  : "border border-navy-100 bg-white text-navy-300 hover:border-navy-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="search"
            placeholder="Search number, sponsor…"
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
            className="w-56"
          />
          <Button onClick={() => setShowNew(true)}>
            <Plus size={14} /> New Invoice
          </Button>
        </div>
      </div>

      <Table>
        <Thead>
          <Tr>
            <Th>Number</Th>
            <Th>Sponsor</Th>
            <Th>Amount</Th>
            <Th>Status</Th>
            <Th>Due Date</Th>
          </Tr>
        </Thead>
        <Tbody>
          {loading ? (
            <TableSkeletonRows rows={5} cols={5} />
          ) : paged.length === 0 ? (
            <TableEmptyRow colSpan={5} message="No invoices found." />
          ) : (
            paged.map((inv) => (
              <Tr key={inv.id}>
                <Td>
                  <Link
                    href={`/admin/marketing/invoices/${inv.id}`}
                    className="font-semibold text-navy-600 hover:underline"
                  >
                    {inv.number}
                  </Link>
                </Td>
                <Td>
                  <div className="font-medium text-navy-500">{inv.sponsor.companyName}</div>
                  <div className="text-xs text-navy-300">{inv.sponsor.email}</div>
                </Td>
                <Td>{formatRand(inv.amount)}</Td>
                <Td>
                  <StatusBadge status={isOverdue(inv) ? "OVERDUE" : inv.status} />
                </Td>
                <Td>{new Date(inv.dueDate).toLocaleDateString("en-ZA")}</Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>

      {!loading && filtered.length > 0 && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
      )}

      {showNew && (
        <NewInvoiceModal
          sponsors={sponsors}
          onClose={() => setShowNew(false)}
          onCreated={(id) => {
            setShowNew(false);
            setCreatedId(id);
          }}
        />
      )}
    </div>
  );
}
