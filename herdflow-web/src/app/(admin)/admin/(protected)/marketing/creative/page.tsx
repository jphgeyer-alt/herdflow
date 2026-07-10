"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { SingleImageUpload } from "@/components/ui/SingleImageUpload";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { TableEmptyRow } from "@/components/admin/EmptyState";
import { TableSkeletonRows } from "@/components/admin/Skeleton";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
import { Input, Select } from "@/components/admin/Field";
import { Modal } from "@/components/admin/Modal";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

type SponsorOption = { id: string; companyName: string; website: string | null };
type CreativeRow = {
  id: string;
  placement: string;
  imageUrl: string;
  linkUrl: string | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  impressions: number;
  clicks: number;
  sponsor: { companyName: string };
};

const PLACEMENTS = [
  { value: "HOMEPAGE", label: "Homepage (below hero)" },
  { value: "SHOP", label: "Shop page" },
  { value: "LISTINGS", label: "Livestock Listings page" },
];

function CreativeModal({
  creative,
  sponsors,
  onClose,
  onSaved,
  onCreated,
}: {
  creative: CreativeRow | null;
  sponsors: SponsorOption[];
  onClose: () => void;
  onSaved: (updated: CreativeRow) => void;
  onCreated: (created: CreativeRow) => void;
}) {
  const [sponsorId, setSponsorId] = useState("");
  const [placement, setPlacement] = useState(creative?.placement ?? "HOMEPAGE");
  const [imageUrl, setImageUrl] = useState<string | null>(creative?.imageUrl ?? null);
  const [linkUrl, setLinkUrl] = useState(creative?.linkUrl ?? "");
  const [isActive, setIsActive] = useState(creative?.isActive ?? true);
  const [startDate, setStartDate] = useState(creative?.startDate?.slice(0, 10) ?? "");
  const [endDate, setEndDate] = useState(creative?.endDate?.slice(0, 10) ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setError("");
    if (!creative && !sponsorId) {
      setError("Please select a sponsor.");
      return;
    }
    if (!imageUrl) {
      setError("An image is required.");
      return;
    }
    setSaving(true);
    const payload = {
      ...(!creative && { sponsorId }),
      placement,
      imageUrl,
      linkUrl: linkUrl || undefined,
      isActive,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
    try {
      const res = await fetch(
        creative
          ? `/api/admin/marketing/creatives/${creative.id}`
          : "/api/admin/marketing/creatives",
        {
          method: creative ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save.");
        return;
      }
      if (creative) onSaved(data.creative);
      else onCreated(data.creative);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={creative ? "Edit Creative" : "New Creative"}
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
        {!creative && (
          <Select
            label="Sponsor"
            value={sponsorId}
            onChange={(e) => {
              setSponsorId(e.target.value);
              const s = sponsors.find((x) => x.id === e.target.value);
              if (s?.website && !linkUrl) setLinkUrl(s.website);
            }}
          >
            <option value="">— Select sponsor —</option>
            {sponsors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.companyName}
              </option>
            ))}
          </Select>
        )}
        {creative && (
          <p className="text-sm text-navy-300">
            Sponsor: <span className="font-semibold text-navy-600">{creative.sponsor.companyName}</span>
          </p>
        )}

        <Select label="Placement" value={placement} onChange={(e) => setPlacement(e.target.value)}>
          {PLACEMENTS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>

        <SingleImageUpload
          label="Banner Image"
          value={imageUrl}
          onChange={setImageUrl}
          required
          hint="Shown as a labeled 'Sponsored' banner on the chosen page."
        />

        <Input
          label="Link URL — leave blank to use the sponsor's website"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date (optional)"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="End Date (optional)"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-navy-500">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-navy-100 text-navy-600 focus:ring-2 focus:ring-navy-600/15"
          />
          Active
        </label>
      </div>
    </Modal>
  );
}

export default function AdminCreativePage() {
  const [creatives, setCreatives] = useState<CreativeRow[]>([]);
  const [sponsors, setSponsors] = useState<SponsorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<CreativeRow | null | "new">(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CreativeRow | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/marketing/creatives")
      .then((r) => r.json())
      .then((d) => setCreatives(d.creatives || []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  useEffect(() => {
    fetch("/api/admin/marketing")
      .then((r) => r.json())
      .then((d) =>
        setSponsors(
          (d.sponsors || [])
            .filter((s: { status: string }) => s.status === "ACTIVE")
            .map((s: { id: string; companyName: string; website: string | null }) => ({
              id: s.id,
              companyName: s.companyName,
              website: s.website,
            })),
        ),
      );
  }, []);

  async function toggleActive(c: CreativeRow) {
    const res = await fetch(`/api/admin/marketing/creatives/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    const data = await res.json();
    if (res.ok) setCreatives((prev) => prev.map((x) => (x.id === c.id ? data.creative : x)));
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/marketing/creatives/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCreatives((prev) => prev.filter((c) => c.id !== id));
        toast.success("Creative deleted");
      } else {
        toast.error("Failed to delete creative.");
      }
    } finally {
      setDeleting(null);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setEditTarget("new")}>
          <Plus size={14} /> New Creative
        </Button>
      </div>

      <Table>
        <Thead>
          <Tr>
            <Th>Preview</Th>
            <Th>Sponsor</Th>
            <Th>Placement</Th>
            <Th>Status</Th>
            <Th>Impressions</Th>
            <Th>Clicks</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {loading ? (
            <TableSkeletonRows rows={4} cols={7} />
          ) : creatives.length === 0 ? (
            <TableEmptyRow
              colSpan={7}
              message="No creative yet. Only sponsors with an active status can be assigned a banner."
            />
          ) : (
            creatives.map((c) => (
              <Tr key={c.id}>
                <Td>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.imageUrl}
                    alt=""
                    className="h-10 w-20 rounded border border-navy-50 object-cover"
                  />
                </Td>
                <Td className="font-semibold text-navy-600">{c.sponsor.companyName}</Td>
                <Td>{PLACEMENTS.find((p) => p.value === c.placement)?.label ?? c.placement}</Td>
                <Td>
                  <Badge variant={c.isActive ? "success" : "neutral"}>
                    {c.isActive ? "Active" : "Inactive"}
                  </Badge>
                </Td>
                <Td>{c.impressions}</Td>
                <Td>{c.clicks}</Td>
                <Td>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditTarget(c)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(c)}>
                      {c.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      loading={deleting === c.id}
                      onClick={() => setDeleteTarget(c)}
                      className="hover:border-red-400 hover:text-red-600"
                    >
                      Delete
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>

      {editTarget && (
        <CreativeModal
          creative={editTarget === "new" ? null : editTarget}
          sponsors={sponsors}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) =>
            setCreatives((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
          }
          onCreated={(created) => setCreatives((prev) => [created, ...prev])}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete creative?"
        description={`This will permanently remove the "${deleteTarget?.sponsor.companyName ?? ""}" banner creative. This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
