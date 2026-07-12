"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, Clock, Wallet, ChevronDown, ChevronUp } from "lucide-react";
import { formatRand } from "@/lib/marketing/format";
import { SingleImageUpload } from "@/components/ui/SingleImageUpload";
import { StatCard } from "@/components/admin/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { TableEmptyRow } from "@/components/admin/EmptyState";
import { TableSkeletonRows } from "@/components/admin/Skeleton";
import { StatusBadge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
import { Input, Select, Textarea } from "@/components/admin/Field";
import { Modal } from "@/components/admin/Modal";
import { Pagination } from "@/components/admin/Pagination";

type PackageOption = {
  id: string;
  name: string;
  monthlyFee: string;
  isActive: boolean;
};

type SponsorRow = {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  website: string | null;
  businessType: string;
  package: string;
  packageId: string | null;
  targetProvinces: string[];
  marketingGoal: string;
  brief: string | null;
  logoUrl: string | null;
  status: string;
  createdAt: string;
  monthlyFee: string | null;
  notes: string | null;
};

const PAGE_SIZE = 20;

function EditSponsorModal({
  sponsor,
  packages,
  onClose,
  onSaved,
}: {
  sponsor: SponsorRow;
  packages: PackageOption[];
  onClose: () => void;
  onSaved: (updated: SponsorRow) => void;
}) {
  const [form, setForm] = useState({
    companyName: sponsor.companyName,
    contactPerson: sponsor.contactPerson,
    email: sponsor.email,
    phone: sponsor.phone,
    website: sponsor.website ?? "",
    logoUrl: sponsor.logoUrl,
    businessType: sponsor.businessType,
    packageId: sponsor.packageId ?? "",
    monthlyFee: sponsor.monthlyFee ?? "",
    notes: sponsor.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/marketing/sponsors/${sponsor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          packageId: form.packageId || null,
          monthlyFee: form.monthlyFee === "" ? null : Number(form.monthlyFee),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save.");
        return;
      }
      onSaved(data.sponsor);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit Sponsor"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={save} loading={saving}>
            Save Changes
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Company Name"
          value={form.companyName}
          onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
        />
        <Input
          label="Contact Person"
          value={form.contactPerson}
          onChange={(e) => setForm((p) => ({ ...p, contactPerson: e.target.value }))}
        />
        <Input
          label="Email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
        />
        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
        />
        <Input
          label="Website"
          value={form.website}
          onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
        />
        <Input
          label="Business Type"
          value={form.businessType}
          onChange={(e) => setForm((p) => ({ ...p, businessType: e.target.value }))}
        />

        <div className="sm:col-span-2">
          <SingleImageUpload
            label="Logo"
            value={form.logoUrl}
            onChange={(url) => setForm((p) => ({ ...p, logoUrl: url }))}
            hint="Shown in the sponsor logo strip across the site."
          />
        </div>

        <Select
          label="Package"
          value={form.packageId}
          onChange={(e) => setForm((p) => ({ ...p, packageId: e.target.value }))}
        >
          <option value="">— None —</option>
          {packages.map((p) => (
            <option key={p.id} value={p.id} disabled={!p.isActive}>
              {p.name} ({formatRand(p.monthlyFee)}/mo){!p.isActive ? " — inactive" : ""}
            </option>
          ))}
        </Select>

        <Input
          label="Monthly Fee Override (R)"
          type="number"
          value={form.monthlyFee}
          onChange={(e) => setForm((p) => ({ ...p, monthlyFee: e.target.value }))}
          placeholder="Leave blank to use package price"
        />

        <div className="sm:col-span-2">
          <Textarea
            label="Internal Notes"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          />
        </div>
      </div>
    </Modal>
  );
}

export default function AdminMarketingPage() {
  const router = useRouter();
  const [sponsors, setSponsors] = useState<SponsorRow[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "ACTIVE" | "REJECTED">("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<SponsorRow | null>(null);
  const [creatingQuoteFor, setCreatingQuoteFor] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/marketing").then((r) => r.json()),
      fetch("/api/admin/marketing/packages").then((r) => r.json()),
    ])
      .then(([sponsorData, packageData]) => {
        setSponsors(sponsorData.sponsors || []);
        setPackages(packageData.packages || []);
      })
      .catch(() => setError("Failed to load sponsors."))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    setSaving(id);
    const res = await fetch("/api/admin/marketing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await res.json();
    setSaving(null);
    if (!res.ok) {
      setError(data.error || "Failed to update.");
      return;
    }
    setSponsors((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  }

  async function createQuote(sponsor: SponsorRow) {
    setCreatingQuoteFor(sponsor.id);
    try {
      const res = await fetch("/api/admin/marketing/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sponsorId: sponsor.id, packageId: sponsor.packageId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create quote.");
        return;
      }
      router.push(`/admin/marketing/quotes/${data.quote.id}`);
    } finally {
      setCreatingQuoteFor(null);
    }
  }

  const statusFiltered = filter === "ALL" ? sponsors : sponsors.filter((s) => s.status === filter);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return statusFiltered;
    return statusFiltered.filter(
      (s) =>
        s.companyName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q),
    );
  }, [statusFiltered, search]);

  function selectFilter(tab: "ALL" | "PENDING" | "ACTIVE" | "REJECTED") {
    setFilter(tab);
    setPage(1);
  }

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const packageFeeById = new Map(packages.map((p) => [p.id, Number(p.monthlyFee)]));

  const stats = {
    total: sponsors.length,
    active: sponsors.filter((s) => s.status === "ACTIVE").length,
    pending: sponsors.filter((s) => s.status === "PENDING").length,
    mrr: sponsors
      .filter((s) => s.status === "ACTIVE")
      .reduce((sum, s) => {
        const fee =
          s.monthlyFee !== null
            ? Number(s.monthlyFee)
            : (packageFeeById.get(s.packageId ?? "") ?? 0);
        return sum + fee;
      }, 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Applications" value={stats.total} icon={<Building2 size={18} />} accent="navy" />
        <StatCard label="Active Sponsors" value={stats.active} icon={<CheckCircle2 size={18} />} accent="green" />
        <StatCard label="Pending Review" value={stats.pending} icon={<Clock size={18} />} accent="gold" />
        <StatCard label="Monthly Revenue" value={formatRand(stats.mrr)} icon={<Wallet size={18} />} accent="navy" />
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["ALL", "PENDING", "ACTIVE", "REJECTED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => selectFilter(tab)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                filter === tab
                  ? "bg-navy-600 text-white"
                  : "border border-navy-100 bg-white text-navy-300 hover:border-navy-600"
              }`}
            >
              {tab}{" "}
              {tab === "ALL"
                ? `(${stats.total})`
                : tab === "PENDING"
                  ? `(${stats.pending})`
                  : tab === "ACTIVE"
                    ? `(${stats.active})`
                    : ""}
            </button>
          ))}
        </div>
        <Input
          type="search"
          placeholder="Search company, email, contact…"
          value={search}
          onChange={(e) => updateSearch(e.target.value)}
          className="w-full sm:w-64"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Table */}
      <Table>
        <Thead>
          <Tr>
            <Th>Company</Th>
            <Th>Package</Th>
            <Th>Status</Th>
            <Th>Applied</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {loading ? (
            <TableSkeletonRows rows={5} cols={5} />
          ) : paged.length === 0 ? (
            <TableEmptyRow
              colSpan={5}
              message={`No ${filter !== "ALL" ? filter.toLowerCase() : ""} applications found.`}
            />
          ) : (
            paged.map((s) => (
              <Fragment key={s.id}>
                <Tr>
                  <Td>
                    <button
                      type="button"
                      onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                      className="flex items-center gap-1.5 font-semibold text-navy-600 hover:underline"
                    >
                      {s.companyName}
                      {expanded === s.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <div className="text-xs text-navy-300">{s.email}</div>
                  </Td>
                  <Td>
                    <span className="font-medium text-navy-500 capitalize">{s.package}</span>
                  </Td>
                  <Td>
                    <StatusBadge status={s.status} />
                  </Td>
                  <Td>{new Date(s.createdAt).toLocaleDateString("en-ZA")}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-2">
                      {s.status !== "ACTIVE" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={saving === s.id}
                          onClick={() => updateStatus(s.id, "ACTIVE")}
                        >
                          Approve
                        </Button>
                      )}
                      {s.status !== "REJECTED" && (
                        <Button
                          size="sm"
                          variant="danger"
                          loading={saving === s.id}
                          onClick={() => updateStatus(s.id, "REJECTED")}
                        >
                          Reject
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setEditTarget(s)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        loading={creatingQuoteFor === s.id}
                        onClick={() => createQuote(s)}
                      >
                        New Quote
                      </Button>
                    </div>
                  </Td>
                </Tr>
                {expanded === s.id && (
                  <tr className="bg-navy-25">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                        <div>
                          <span className="text-navy-300">Contact</span>
                          <br />
                          <strong>{s.contactPerson}</strong>
                        </div>
                        <div>
                          <span className="text-navy-300">Phone</span>
                          <br />
                          <strong>{s.phone}</strong>
                        </div>
                        <div>
                          <span className="text-navy-300">Business Type</span>
                          <br />
                          <strong>{s.businessType}</strong>
                        </div>
                        <div>
                          <span className="text-navy-300">Goal</span>
                          <br />
                          <strong>{s.marketingGoal}</strong>
                        </div>
                        <div>
                          <span className="text-navy-300">Provinces</span>
                          <br />
                          <strong>{s.targetProvinces.join(", ") || "—"}</strong>
                        </div>
                        {s.website && (
                          <div>
                            <span className="text-navy-300">Website</span>
                            <br />
                            <a
                              href={s.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-green hover:underline"
                            >
                              {s.website}
                            </a>
                          </div>
                        )}
                        {s.brief && (
                          <div className="col-span-full">
                            <span className="text-navy-300">Brief</span>
                            <br />
                            {s.brief}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))
          )}
        </Tbody>
      </Table>

      {!loading && filtered.length > 0 && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
      )}

      {editTarget && (
        <EditSponsorModal
          sponsor={editTarget}
          packages={packages}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) =>
            setSponsors((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)))
          }
        />
      )}
    </div>
  );
}
