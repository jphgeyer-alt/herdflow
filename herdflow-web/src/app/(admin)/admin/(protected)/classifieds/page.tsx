"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/admin/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { TableEmptyRow } from "@/components/admin/EmptyState";
import { TableSkeletonRows } from "@/components/admin/Skeleton";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
import { Input, Select } from "@/components/admin/Field";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

type ClassifiedRow = {
  id: string;
  category: string;
  title: string;
  price: string | null;
  province: string;
  tier: string;
  status: string;
  feePaid: boolean;
  views: number;
  createdAt: string;
  poster: { fullName: string; email: string };
};

const CATEGORY_LABELS: Record<string, string> = {
  FARM_EQUIPMENT: "Equipment",
  FARM_JOBS: "Jobs",
  GRAZING_LAND: "Grazing & Land",
  WANTED: "Wanted",
};

export default function AdminClassifiedsPage() {
  const [items, setItems] = useState<ClassifiedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [removeTarget, setRemoveTarget] = useState<ClassifiedRow | null>(null);

  function load() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category !== "ALL") params.set("category", category);
    if (status !== "ALL") params.set("status", status);
    fetch(`/api/admin/classifieds?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setItems(d.classifieds || []))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [category, status]);

  function selectCategory(value: string) {
    setCategory(value);
    setLoading(true);
  }

  function selectStatus(value: string) {
    setStatus(value);
    setLoading(true);
  }

  async function updateStatus(item: ClassifiedRow, newStatus: string, reason?: string) {
    const res = await fetch(`/api/admin/classifieds/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, reason }),
    });
    if (res.ok) {
      toast.success(`Ad marked ${newStatus.toLowerCase()}.`);
      setLoading(true);
      load();
    } else {
      toast.error("Failed to update ad.");
    }
  }

  const filtered = items.filter((i) =>
    search ? i.title.toLowerCase().includes(search.toLowerCase()) : true,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-navy-600">Classifieds</h1>
        <p className="mt-1 text-sm text-navy-400">Moderate equipment, jobs, grazing, and wanted ads.</p>
      </div>

      <Card>
        <CardHeader
          title="All Ads"
          action={
            <div className="flex gap-2">
              <Input
                type="search"
                placeholder="Search title…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48"
              />
              <Select value={category} onChange={(e) => selectCategory(e.target.value)} className="w-auto!">
                <option value="ALL">All categories</option>
                <option value="FARM_EQUIPMENT">Equipment</option>
                <option value="FARM_JOBS">Jobs</option>
                <option value="GRAZING_LAND">Grazing & Land</option>
                <option value="WANTED">Wanted</option>
              </Select>
              <Select value={status} onChange={(e) => selectStatus(e.target.value)} className="w-auto!">
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft (unpaid)</option>
                <option value="SOLD">Sold</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </div>
          }
        />
        <Table>
          <Thead>
            <Tr>
              <Th>Title</Th>
              <Th>Category</Th>
              <Th>Poster</Th>
              <Th>Province</Th>
              <Th align="right">Views</Th>
              <Th>Tier</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <TableSkeletonRows rows={6} cols={8} />
            ) : filtered.length === 0 ? (
              <TableEmptyRow colSpan={8} message="No ads found." />
            ) : (
              filtered.map((item) => (
                <Tr key={item.id}>
                  <Td className="font-semibold text-navy-600">{item.title}</Td>
                  <Td>{CATEGORY_LABELS[item.category] ?? item.category}</Td>
                  <Td>
                    <div>{item.poster.fullName}</div>
                    <div className="text-xs text-navy-300">{item.poster.email}</div>
                  </Td>
                  <Td>{item.province}</Td>
                  <Td align="right">{item.views}</Td>
                  <Td>
                    {item.tier === "FEATURED" && <Badge variant="warning">Featured</Badge>}
                    {item.tier === "BASIC" && <span className="text-xs text-navy-300">Basic</span>}
                  </Td>
                  <Td>
                    <Badge
                      variant={
                        item.status === "ACTIVE"
                          ? "success"
                          : item.status === "SOLD"
                            ? "info"
                            : item.status === "ARCHIVED"
                              ? "neutral"
                              : "warning"
                      }
                    >
                      {item.status}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      {item.status === "ACTIVE" && (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => updateStatus(item, "SOLD")}>
                            Mark Sold
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRemoveTarget(item)}
                            className="hover:border-red-400 hover:text-red-600"
                          >
                            Remove
                          </Button>
                        </>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>

      <ConfirmDialog
        open={removeTarget !== null}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={async (reason) => {
          if (!removeTarget) return;
          await updateStatus(removeTarget, "ARCHIVED", reason);
          setRemoveTarget(null);
        }}
        title="Remove this ad?"
        description={`This will remove "${removeTarget?.title ?? ""}" from public view.`}
        confirmLabel="Remove"
        variant="danger"
        reasonLabel="Reason (internal)"
        reasonPlaceholder="Why is this ad being removed?"
      />
    </div>
  );
}
