"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { formatRand } from "@/lib/marketing/format";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { TableEmptyRow } from "@/components/admin/EmptyState";
import { TableSkeletonRows } from "@/components/admin/Skeleton";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
import { Input, Textarea } from "@/components/admin/Field";
import { Modal } from "@/components/admin/Modal";

type PackageRow = {
  id: string;
  slug: string;
  name: string;
  monthlyFee: string;
  badge: string | null;
  isCustom: boolean;
  features: string[];
  isActive: boolean;
  sortOrder: number;
};

function PackageModal({
  pkg,
  onClose,
  onSaved,
  onCreated,
}: {
  pkg: PackageRow | null;
  onClose: () => void;
  onSaved: (updated: PackageRow) => void;
  onCreated: (created: PackageRow) => void;
}) {
  const [form, setForm] = useState({
    name: pkg?.name ?? "",
    monthlyFee: pkg?.monthlyFee ?? "0",
    badge: pkg?.badge ?? "",
    isCustom: pkg?.isCustom ?? false,
    isActive: pkg?.isActive ?? true,
    sortOrder: pkg?.sortOrder ?? 0,
    featuresText: pkg?.features.join("\n") ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    const payload = {
      name: form.name,
      monthlyFee: Number(form.monthlyFee),
      badge: form.badge || null,
      isCustom: form.isCustom,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder),
      features: form.featuresText
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
    };
    try {
      const res = await fetch(
        pkg ? `/api/admin/marketing/packages/${pkg.id}` : "/api/admin/marketing/packages",
        {
          method: pkg ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save.");
        return;
      }
      if (pkg) onSaved(data.package);
      else onCreated(data.package);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={pkg ? "Edit Package" : "New Package"}
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
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <Input
          label="Name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Monthly Fee (R)"
            type="number"
            value={form.monthlyFee}
            onChange={(e) => setForm((p) => ({ ...p, monthlyFee: e.target.value }))}
          />
          <Input
            label="Badge (optional)"
            value={form.badge}
            onChange={(e) => setForm((p) => ({ ...p, badge: e.target.value }))}
            placeholder="e.g. MOST POPULAR"
          />
        </div>

        <Textarea
          label="Features (one per line)"
          rows={6}
          value={form.featuresText}
          onChange={(e) => setForm((p) => ({ ...p, featuresText: e.target.value }))}
        />

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-navy-500">
            <input
              type="checkbox"
              checked={form.isCustom}
              onChange={(e) => setForm((p) => ({ ...p, isCustom: e.target.checked }))}
              className="h-4 w-4 rounded border-navy-100 text-navy-600 focus:ring-2 focus:ring-navy-600/15"
            />
            Custom pricing (hide price on public page)
          </label>
          <label className="flex items-center gap-2 text-sm text-navy-500">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-navy-100 text-navy-600 focus:ring-2 focus:ring-navy-600/15"
            />
            Active
          </label>
        </div>

        <Input
          label="Sort Order"
          type="number"
          className="w-32"
          value={form.sortOrder}
          onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
        />
      </div>
    </Modal>
  );
}

export default function PackagesAdminPage() {
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<PackageRow | null | "new">(null);

  function load() {
    fetch("/api/admin/marketing/packages")
      .then((r) => r.json())
      .then((d) => setPackages(d.packages || []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function toggleActive(pkg: PackageRow) {
    const res = await fetch(`/api/admin/marketing/packages/${pkg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !pkg.isActive }),
    });
    const data = await res.json();
    if (res.ok) {
      setPackages((prev) => prev.map((p) => (p.id === pkg.id ? data.package : p)));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setEditTarget("new")}>
          <Plus size={14} /> New Package
        </Button>
      </div>

      <Table>
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Price</Th>
            <Th>Badge</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {loading ? (
            <TableSkeletonRows rows={3} cols={5} />
          ) : packages.length === 0 ? (
            <TableEmptyRow colSpan={5} message="No packages yet." />
          ) : (
            packages.map((p) => (
              <Tr key={p.id}>
                <Td className="font-semibold text-navy-600">{p.name}</Td>
                <Td>{p.isCustom ? "Custom" : `${formatRand(p.monthlyFee)}/mo`}</Td>
                <Td>{p.badge || "—"}</Td>
                <Td>
                  <Badge variant={p.isActive ? "success" : "neutral"}>
                    {p.isActive ? "Active" : "Inactive"}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditTarget(p)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(p)}>
                      {p.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>

      {editTarget && (
        <PackageModal
          pkg={editTarget === "new" ? null : editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) =>
            setPackages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
          }
          onCreated={(created) => setPackages((prev) => [...prev, created])}
        />
      )}
    </div>
  );
}
