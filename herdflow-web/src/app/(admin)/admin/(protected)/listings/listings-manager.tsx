"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Star,
  CheckCircle,
  RotateCcw,
  Edit3,
  Trash2,
  Download,
  Plus,
  Package,
} from "lucide-react";
import { Card, CardHeader, StatCard } from "@/components/admin/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { TableEmptyRow } from "@/components/admin/EmptyState";
import { Pagination } from "@/components/admin/Pagination";
import { Button } from "@/components/admin/Button";
import { StatusBadge, Badge } from "@/components/admin/Badge";
import { Modal } from "@/components/admin/Modal";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Input, Select, Textarea } from "@/components/admin/Field";
import { PhotoUploader } from "./_components/PhotoUploader";
import { REGIONS, REMOVE_REASONS, SORT_OPTIONS, STATIC_CATEGORIES } from "./_lib/constants";
import type { Filters, Item, Kind, ViewMode } from "./_lib/types";
import type { Stats } from "./_lib/query";

function zar(cents: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(cents / 100);
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(new Date(iso));
}

/** kind values differ between the two record APIs the manager talks to:
 * `/api/admin/listings/{id}?kind=` uses "listing"/"product" (matches Item.kind
 * directly); `/api/admin/listings` POST (create) uses "livestock"/"product". */
function createKind(kind: Kind): "livestock" | "product" {
  return kind === "listing" ? "livestock" : "product";
}

async function patchItem(item: Pick<Item, "id" | "kind">, data: Record<string, unknown>) {
  const res = await fetch(`/api/admin/listings/${item.id}?kind=${item.kind}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

type Props = {
  filters: Filters;
  items: Item[];
  total: number;
  pageSize: number;
  stats: Stats;
  categories: Array<{ id: string; name: string }>;
  sellers: Array<{ id: string; farmName: string; status: string }>;
};

export function AdminListingsManager({ filters, items, total, pageSize, stats, categories, sellers }: Props) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Item | null>(null);
  const [editTarget, setEditTarget] = useState<Item | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const kindLabel = filters.kind === "listing" ? "Listing" : "Product";
  const thirdBucketLabel = filters.kind === "listing" ? "Sold" : "Out of Stock";
  const statuses = filters.kind === "listing" ? ["ACTIVE", "DRAFT", "SOLD", "ARCHIVED"] : ["ACTIVE", "DRAFT", "OUT_OF_STOCK", "ARCHIVED"];

  const basePath = "/admin/listings";

  function updateQuery(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const next = { ...filters, ...patch } as Record<string, unknown>;
    if (next.kind && next.kind !== "listing") params.set("kind", String(next.kind));
    if (next.view && next.view !== "category") params.set("view", String(next.view));
    if (next.q) params.set("q", String(next.q));
    if (next.categoryId) params.set("category", String(next.categoryId));
    if (next.status) params.set("status", String(next.status));
    if (next.region) params.set("region", String(next.region));
    if (next.sellerId) params.set("seller", String(next.sellerId));
    if (next.sort && next.sort !== "newest") params.set("sort", String(next.sort));
    if (next.removed) params.set("removed", "1");
    router.push(`${basePath}?${params.toString()}`);
  }

  const grouped = useMemo(() => {
    if (filters.view === "category") {
      const map = new Map<string, Item[]>();
      for (const item of items) {
        const key = item.category.name;
        map.set(key, [...(map.get(key) ?? []), item]);
      }
      return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    }
    if (filters.view === "seller") {
      const map = new Map<string, Item[]>();
      for (const item of items) {
        const key = item.seller?.farmName ?? "HerdFlow Direct";
        map.set(key, [...(map.get(key) ?? []), item]);
      }
      return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    }
    return null;
  }, [items, filters.view]);

  function toggleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function runAction(item: Item, data: Record<string, unknown>, successMsg: string) {
    setProcessingId(item.id);
    try {
      await patchItem(item, data);
      toast.success(successMsg);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleRestore(item: Item) {
    setProcessingId(item.id);
    try {
      const res = await fetch(`/api/admin/listings/${item.id}?kind=${item.kind}`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Restore failed");
      toast.success(json.message || "Restored");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Restore failed");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleRemoveConfirm(reason?: string) {
    if (!removeTarget) return;
    try {
      const res = await fetch(`/api/admin/listings/${removeTarget.id}?kind=${removeTarget.kind}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Remove failed");
      toast.success(json.message || "Removed");
      setRemoveTarget(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    }
  }

  async function handleBulk(action: "approve" | "feature") {
    setBulkBusy(true);
    const ids = [...selectedIds];
    let ok = 0;
    let fail = 0;
    for (const id of ids) {
      const item = items.find((i) => i.id === id);
      if (!item) continue;
      try {
        await patchItem(item, action === "approve" ? { status: "ACTIVE" } : { isFeatured: true });
        ok += 1;
      } catch {
        fail += 1;
      }
    }
    setBulkBusy(false);
    setSelectedIds(new Set());
    if (fail === 0) toast.success(`${ok} item${ok === 1 ? "" : "s"} updated`);
    else toast.error(`${ok} updated, ${fail} failed`);
    router.refresh();
  }

  function exportHref() {
    const params = new URLSearchParams();
    params.set("kind", filters.kind);
    if (filters.q) params.set("q", filters.q);
    if (filters.categoryId) params.set("category", filters.categoryId);
    if (filters.status) params.set("status", filters.status);
    if (filters.region) params.set("region", filters.region);
    if (filters.sellerId) params.set("seller", filters.sellerId);
    if (filters.removed) params.set("removed", "1");
    return `/api/admin/listings/export?${params.toString()}`;
  }

  function renderRow(item: Item) {
    const processing = processingId === item.id;
    return (
      <Tr key={item.id}>
        <Td>
          <input
            type="checkbox"
            checked={selectedIds.has(item.id)}
            onChange={(e) => toggleSelect(item.id, e.target.checked)}
            className="h-4 w-4 rounded border-navy-100"
          />
        </Td>
        <Td>
          <div className="flex items-center gap-3">
            {item.photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.photos[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-25 text-navy-200">
                <Package size={16} />
              </div>
            )}
            <div>
              <p className="font-semibold text-navy-600">
                {item.title}
                {item.isFeatured && <Star size={12} className="ml-1.5 inline text-brand-gold" fill="currentColor" />}
              </p>
              <p className="text-xs text-navy-300">{item.category.name}</p>
            </div>
          </div>
        </Td>
        <Td>{item.seller?.farmName ?? "HerdFlow Direct"}</Td>
        <Td>{item.region ?? "—"}</Td>
        <Td className="whitespace-nowrap">{zar(item.priceCents)}</Td>
        <Td>{item.kind === "listing" ? (item.breed ?? "—") : `Stock: ${item.stockOnHand ?? 0}`}</Td>
        <Td>
          <StatusBadge status={item.isDeleted ? "ARCHIVED" : item.status} label={item.isDeleted ? "Removed" : undefined} />
        </Td>
        <Td className="whitespace-nowrap text-xs">{fmtDate(item.createdAt)}</Td>
        <Td align="right">
          <div className="flex justify-end gap-1.5">
            {item.isDeleted ? (
              <Button size="sm" variant="outline" loading={processing} onClick={() => handleRestore(item)}>
                <RotateCcw size={12} /> Restore
              </Button>
            ) : (
              <>
                {item.status !== "ACTIVE" && (
                  <Button
                    size="sm"
                    variant="outline"
                    loading={processing}
                    onClick={() => runAction(item, { status: "ACTIVE" }, "Approved")}
                  >
                    <CheckCircle size={12} /> Approve
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  loading={processing}
                  onClick={() => runAction(item, { isFeatured: !item.isFeatured }, item.isFeatured ? "Unfeatured" : "Featured")}
                >
                  <Star size={12} />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditTarget(item)}>
                  <Edit3 size={12} />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRemoveTarget(item)}>
                  <Trash2 size={12} className="text-red-600" />
                </Button>
              </>
            )}
          </div>
        </Td>
      </Tr>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-navy-600 text-3xl font-semibold">Manage {filters.kind === "listing" ? "Listings" : "Products"}</h1>
          <p className="text-sm text-navy-300">
            {filters.kind === "listing"
              ? "Livestock listings across all registered sellers."
              : "Shop products across all registered sellers."}
          </p>
        </div>
        <div className="flex gap-2">
          <a href={exportHref()} className="inline-flex items-center gap-2 rounded-lg border border-navy-100 bg-white px-4 py-2 text-sm font-semibold text-navy-600 hover:bg-navy-25">
            <Download size={14} /> Export CSV
          </a>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={14} /> Add New {kindLabel}
          </Button>
        </div>
      </header>

      <div className="flex gap-2">
        <Link
          href={`${basePath}?${filters.kind === "listing" ? "" : ""}`}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${filters.kind === "listing" ? "bg-navy-600 text-white" : "border border-navy-100 text-navy-500 hover:bg-navy-25"}`}
        >
          Listings
        </Link>
        <Link
          href={`${basePath}?kind=product`}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${filters.kind === "product" ? "bg-navy-600 text-white" : "border border-navy-100 text-navy-500 hover:bg-navy-25"}`}
        >
          Products
        </Link>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active" value={stats.active} accent="green" icon={<CheckCircle size={18} />} />
        <StatCard label="Pending / Draft" value={stats.pending} accent="gold" />
        <StatCard label={thirdBucketLabel} value={stats.thirdBucket} accent="navy" />
        <StatCard label="Removed" value={stats.removed} accent="danger" />
      </section>

      <div className="flex flex-wrap gap-2">
        {(["category", "seller", "all"] as ViewMode[]).map((v) => (
          <button
            key={v}
            onClick={() => updateQuery({ view: v })}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${filters.view === v ? "bg-white text-navy-600 shadow-sm" : "text-navy-300"}`}
          >
            {v === "category" ? "By Category" : v === "seller" ? "By Seller" : "All Listings"}
          </button>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-200" />
            <input
              defaultValue={filters.q}
              onKeyDown={(e) => e.key === "Enter" && updateQuery({ q: e.currentTarget.value })}
              onBlur={(e) => updateQuery({ q: e.currentTarget.value })}
              placeholder="Search by title, breed, seller, location…"
              className="w-full rounded-lg border border-navy-100 py-2 pl-8 pr-3 text-sm focus:border-navy-600 focus:outline-none"
            />
          </div>
          <Select value={filters.categoryId} onChange={(e) => updateQuery({ categoryId: e.target.value })} className="w-auto!">
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select value={filters.status} onChange={(e) => updateQuery({ status: e.target.value })} className="w-auto!">
            <option value="">All Status</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Select value={filters.region} onChange={(e) => updateQuery({ region: e.target.value })} className="w-auto!">
            <option value="">All Provinces</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
          <Select value={filters.sellerId} onChange={(e) => updateQuery({ sellerId: e.target.value })} className="w-auto!">
            <option value="">All Sellers</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>{s.farmName}</option>
            ))}
          </Select>
          <Select value={filters.sort} onChange={(e) => updateQuery({ sort: e.target.value })} className="w-auto!">
            {SORT_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <label className="flex items-center gap-1.5 text-sm text-navy-500">
            <input
              type="checkbox"
              checked={filters.removed}
              onChange={(e) => updateQuery({ removed: e.target.checked ? "1" : undefined })}
              className="h-4 w-4 rounded border-navy-100"
            />
            Removed only
          </label>
        </div>
      </Card>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-navy-100 bg-navy-25 px-4 py-2.5">
          <span className="text-sm font-semibold text-navy-600">{selectedIds.size} selected</span>
          <Button size="sm" variant="outline" loading={bulkBusy} onClick={() => handleBulk("approve")}>
            Approve Selected
          </Button>
          <Button size="sm" variant="outline" loading={bulkBusy} onClick={() => handleBulk("feature")}>
            Feature Selected
          </Button>
          <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-xs font-semibold text-navy-300 hover:text-navy-600">
            Clear
          </button>
        </div>
      )}

      <Card>
        <CardHeader title={`Showing ${total} ${kindLabel.toLowerCase()}${total === 1 ? "" : "s"}`} />
        <Table>
          <Thead>
            <Tr>
              <Th></Th>
              <Th>Item</Th>
              <Th>Seller</Th>
              <Th>Province</Th>
              <Th>Price</Th>
              <Th>{filters.kind === "listing" ? "Breed" : "Stock"}</Th>
              <Th>Status</Th>
              <Th>Listed</Th>
              <Th align="right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {items.length === 0 ? (
              <TableEmptyRow colSpan={9} message={`No ${kindLabel.toLowerCase()}s found.`} />
            ) : grouped ? (
              grouped.map(([label, groupItems]) => (
                <RowGroup key={label} label={label} count={groupItems.length}>
                  {groupItems.map(renderRow)}
                </RowGroup>
              ))
            ) : (
              items.map(renderRow)
            )}
          </Tbody>
        </Table>
        {filters.view === "all" && (
          <Pagination page={filters.page} pageSize={pageSize} total={total} basePath={buildPaginationBase(filters)} />
        )}
      </Card>

      {removeTarget && (
        <ConfirmDialog
          open
          onCancel={() => setRemoveTarget(null)}
          onConfirm={handleRemoveConfirm}
          title={`Remove "${removeTarget.title}"?`}
          description="This soft-deletes the item — order history and statistics are preserved, and it can be restored later."
          confirmLabel="Remove"
          variant="danger"
          reasonLabel="Removal reason"
          reasonPlaceholder={REMOVE_REASONS.join(" / ")}
        />
      )}

      {editTarget && (
        <ItemFormModal
          title={`Edit ${editTarget.kind === "listing" ? "Listing" : "Product"}`}
          kind={editTarget.kind}
          initial={editTarget}
          categories={categories}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            router.refresh();
          }}
        />
      )}

      {createOpen && (
        <ItemFormModal
          title={`Add New ${kindLabel}`}
          kind={filters.kind}
          categories={categories}
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function buildPaginationBase(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.kind !== "listing") params.set("kind", filters.kind);
  params.set("view", "all");
  if (filters.q) params.set("q", filters.q);
  if (filters.categoryId) params.set("category", filters.categoryId);
  if (filters.status) params.set("status", filters.status);
  if (filters.region) params.set("region", filters.region);
  if (filters.sellerId) params.set("seller", filters.sellerId);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.removed) params.set("removed", "1");
  return `/admin/listings?${params.toString()}`;
}

function RowGroup({ label, count, children }: { label: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <tr>
        <td colSpan={9} className="bg-navy-25 px-4 py-2">
          <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 text-sm font-semibold text-navy-600">
            {open ? "▾" : "▸"} {label}
            <Badge variant="neutral">{count}</Badge>
          </button>
        </td>
      </tr>
      {open && children}
    </>
  );
}

function ItemFormModal({
  title,
  kind,
  initial,
  categories,
  onClose,
  onSaved,
}: {
  title: string;
  kind: Kind;
  initial?: Item;
  categories: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.title ?? "");
  const [description, setDescription] = useState("");
  const [priceCents, setPriceCents] = useState(initial ? (initial.priceCents / 100).toString() : "");
  const [region, setRegion] = useState(initial?.region ?? "");
  const [breed, setBreed] = useState(initial?.breed ?? "");
  const [weightKg, setWeightKg] = useState(initial?.weightKg?.toString() ?? "");
  const [ageMonths, setAgeMonths] = useState(initial?.ageMonths?.toString() ?? "");
  const [stockOnHand, setStockOnHand] = useState(initial?.stockOnHand?.toString() ?? "0");
  const [sellerName, setSellerName] = useState(initial?.seller?.farmName ?? "");
  const [sellerPhone, setSellerPhone] = useState("");
  const [categoryName, setCategoryName] = useState(initial?.category.name ?? categories[0]?.name ?? "");
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (isEdit && initial) {
        await patchItem(initial, {
          ...(kind === "listing" ? { title: name, breed, weightKg: weightKg ? Number(weightKg) : null, ageMonths: ageMonths ? Number(ageMonths) : null } : { name, stockOnHand: Number(stockOnHand) }),
          priceCents: Math.round(Number(priceCents) * 100),
          region,
          photos,
        });
        toast.success("Saved");
      } else {
        const res = await fetch("/api/admin/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: createKind(kind),
            data:
              kind === "listing"
                ? { title: name, description, priceCents: Math.round(Number(priceCents) * 100), region, breed, weightKg: weightKg ? Number(weightKg) : undefined, ageMonths: ageMonths ? Number(ageMonths) : undefined, sellerName, sellerPhone, categoryName, photos }
                : { name, description, priceCents: Math.round(Number(priceCents) * 100), stockOnHand: Number(stockOnHand), region, categoryName, photos },
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Failed to create");
        toast.success("Created");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={title} size="lg" footer={
      <>
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="submit" form="item-form" loading={saving}>Save</Button>
      </>
    }>
      <form id="item-form" onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <Input label={kind === "listing" ? "Title" : "Product Name"} value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Price (ZAR)" type="number" min={0} step="0.01" value={priceCents} onChange={(e) => setPriceCents(e.target.value)} required />
        {!isEdit && <Textarea label="Description" className="sm:col-span-2" value={description} onChange={(e) => setDescription(e.target.value)} required rows={2} />}
        <Select label="Category" value={categoryName} onChange={(e) => setCategoryName(e.target.value)}>
          {[...new Set([...categories.map((c) => c.name), ...STATIC_CATEGORIES])].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select label="Province" value={region} onChange={(e) => setRegion(e.target.value)} required>
          <option value="">Select…</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </Select>
        {kind === "listing" ? (
          <>
            <Input label="Breed" value={breed} onChange={(e) => setBreed(e.target.value)} required />
            <Input label="Weight (kg)" type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
            <Input label="Age (months)" type="number" value={ageMonths} onChange={(e) => setAgeMonths(e.target.value)} />
          </>
        ) : (
          <Input label="Stock On Hand" type="number" min={0} value={stockOnHand} onChange={(e) => setStockOnHand(e.target.value)} required />
        )}
        {!isEdit && (
          <>
            <Input label="Seller / Farm Name" value={sellerName} onChange={(e) => setSellerName(e.target.value)} required={kind === "listing"} />
            <Input label="Seller Phone" value={sellerPhone} onChange={(e) => setSellerPhone(e.target.value)} />
          </>
        )}
        <div className="sm:col-span-2">
          <span className="mb-1 block text-sm font-semibold text-navy-500">Photos</span>
          <PhotoUploader photos={photos} onChange={setPhotos} />
        </div>
        {error && <p className="text-sm font-semibold text-red-600 sm:col-span-2">{error}</p>}
      </form>
    </Modal>
  );
}
