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
import { Input, Select, Textarea } from "@/components/admin/Field";
import { Modal } from "@/components/admin/Modal";
import { Pagination } from "@/components/admin/Pagination";

type QuoteRow = {
  id: string;
  number: string;
  description: string;
  amount: string;
  status: string;
  validUntil: string;
  createdAt: string;
  sponsor: { companyName: string; email: string };
};

type SponsorOption = { id: string; companyName: string; packageId: string | null };
type PackageOption = { id: string; name: string; monthlyFee: string };

const TABS = ["ALL", "DRAFT", "SENT", "ACCEPTED", "DECLINED", "EXPIRED"] as const;
const PAGE_SIZE = 20;

function NewQuoteModal({
  sponsors,
  packages,
  onClose,
  onCreated,
}: {
  sponsors: SponsorOption[];
  packages: PackageOption[];
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [sponsorId, setSponsorId] = useState("");
  const [packageId, setPackageId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
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
      const res = await fetch("/api/admin/marketing/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sponsorId,
          packageId: packageId || undefined,
          amount: amount === "" ? undefined : Number(amount),
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create quote.");
        return;
      }
      onCreated(data.quote.id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="New Quote"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={create} loading={saving}>
            Create Quote
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

        <Select
          label="Package (optional)"
          value={packageId}
          onChange={(e) => setPackageId(e.target.value)}
        >
          <option value="">— Custom / no package —</option>
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({formatRand(p.monthlyFee)}/mo)
            </option>
          ))}
        </Select>

        <Input
          label="Amount (R) — leave blank to use package price"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <Textarea
          label="Notes (optional)"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
    </Modal>
  );
}

export default function QuotesAdminPage() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [sponsors, setSponsors] = useState<SponsorOption[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [filter, setFilter] = useState<(typeof TABS)[number]>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  function load(status: string) {
    setLoading(true);
    const qs = status === "ALL" ? "" : `?status=${status}`;
    fetch(`/api/admin/marketing/quotes${qs}`)
      .then((r) => r.json())
      .then((d) => setQuotes(d.quotes || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(filter);
  }, [filter]);

  useEffect(() => {
    fetch("/api/admin/marketing")
      .then((r) => r.json())
      .then((d) => setSponsors(d.sponsors || []));
    fetch("/api/admin/marketing/packages")
      .then((r) => r.json())
      .then((d) =>
        setPackages(
          (d.packages || []).filter((p: PackageOption & { isActive: boolean }) => p.isActive),
        ),
      );
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return quotes;
    return quotes.filter(
      (quo) =>
        quo.number.toLowerCase().includes(q) ||
        quo.sponsor.companyName.toLowerCase().includes(q) ||
        quo.sponsor.email.toLowerCase().includes(q),
    );
  }, [quotes, search]);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (createdId) {
    return (
      <div className="rounded-xl border border-navy-50 bg-white p-8 text-center">
        <p className="mb-4 text-sm text-navy-300">Quote created.</p>
        <Link href={`/admin/marketing/quotes/${createdId}`} className={buttonClass("primary", "md")}>
          View Quote →
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
              onClick={() => setFilter(tab)}
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
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
          <Button onClick={() => setShowNew(true)}>
            <Plus size={14} /> New Quote
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
            <Th>Valid Until</Th>
          </Tr>
        </Thead>
        <Tbody>
          {loading ? (
            <TableSkeletonRows rows={5} cols={5} />
          ) : paged.length === 0 ? (
            <TableEmptyRow colSpan={5} message="No quotes found." />
          ) : (
            paged.map((q) => (
              <Tr key={q.id}>
                <Td>
                  <Link
                    href={`/admin/marketing/quotes/${q.id}`}
                    className="font-semibold text-navy-600 hover:underline"
                  >
                    {q.number}
                  </Link>
                </Td>
                <Td>
                  <div className="font-medium text-navy-500">{q.sponsor.companyName}</div>
                  <div className="text-xs text-navy-300">{q.sponsor.email}</div>
                </Td>
                <Td>{formatRand(q.amount)}</Td>
                <Td>
                  <StatusBadge status={q.status} />
                </Td>
                <Td>{new Date(q.validUntil).toLocaleDateString("en-ZA")}</Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>

      {!loading && filtered.length > 0 && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
      )}

      {showNew && (
        <NewQuoteModal
          sponsors={sponsors}
          packages={packages}
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
