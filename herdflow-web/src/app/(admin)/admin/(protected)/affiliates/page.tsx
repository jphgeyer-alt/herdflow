"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/admin/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { TableEmptyRow } from "@/components/admin/EmptyState";
import { TableSkeletonRows } from "@/components/admin/Skeleton";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
import { Input, Select, Textarea } from "@/components/admin/Field";
import { Modal } from "@/components/admin/Modal";
import { SingleImageUpload } from "@/components/ui/SingleImageUpload";

type LinkRow = {
  id: string;
  name: string;
  network: string | null;
  targetUrl: string;
  placement: string;
  imageUrl: string | null;
  clicks: number;
  isActive: boolean;
  notes: string | null;
};

const PLACEMENTS = ["RESOURCES_PAGE", "FINANCE_PAGE", "FOOTER", "EMPTY_AD_SLOT", "BLOG"];

function LinkModal({
  link,
  onClose,
  onSaved,
  onCreated,
}: {
  link: LinkRow | null;
  onClose: () => void;
  onSaved: (updated: LinkRow) => void;
  onCreated: (created: LinkRow) => void;
}) {
  const [name, setName] = useState(link?.name ?? "");
  const [network, setNetwork] = useState(link?.network ?? "");
  const [targetUrl, setTargetUrl] = useState(link?.targetUrl ?? "");
  const [placement, setPlacement] = useState(link?.placement ?? PLACEMENTS[0]);
  const [imageUrl, setImageUrl] = useState<string | null>(link?.imageUrl ?? null);
  const [notes, setNotes] = useState(link?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setError("");
    if (!name.trim() || !targetUrl.trim()) {
      setError("Name and target URL are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = { name, network, targetUrl, placement, imageUrl, notes };
      const res = await fetch(link ? `/api/admin/affiliates/${link.id}` : "/api/admin/affiliates", {
        method: link ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save.");
        return;
      }
      if (link) onSaved(data.link);
      else onCreated(data.link);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={link ? "Edit Affiliate Link" : "New Affiliate Link"}
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
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      <div className="space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. FundingHub" />
        <Input label="Network (optional)" value={network} onChange={(e) => setNetwork(e.target.value)} placeholder="e.g. OfferForge" />
        <Input label="Target URL" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} />
        <Select label="Placement" value={placement} onChange={(e) => setPlacement(e.target.value)}>
          {PLACEMENTS.map((p) => (
            <option key={p} value={p}>
              {p.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
        <SingleImageUpload label="Banner Image (optional)" value={imageUrl} onChange={setImageUrl} aspectRatio="16/9" />
        <Textarea
          label="Notes (internal — commission terms)"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
    </Modal>
  );
}

export default function AdminAffiliatesPage() {
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<LinkRow | null | "new">(null);

  function load() {
    fetch("/api/admin/affiliates")
      .then((r) => r.json())
      .then((d) => setLinks(d.links || []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function toggleActive(l: LinkRow) {
    const res = await fetch(`/api/admin/affiliates/${l.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !l.isActive }),
    });
    const data = await res.json();
    if (res.ok) setLinks((prev) => prev.map((x) => (x.id === l.id ? data.link : x)));
    else toast.error("Failed to update link.");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-navy-600">Affiliate Manager</h1>
          <p className="mt-1 text-sm text-navy-400">
            Affiliate links, placements, and click tracking. All links route through /api/go/[id].
          </p>
        </div>
        <Button onClick={() => setEditTarget("new")}>+ New Link</Button>
      </div>

      <Card>
        <CardHeader title="All Affiliate Links" />
        <Table>
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Network</Th>
              <Th>Placement</Th>
              <Th align="right">Clicks</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <TableSkeletonRows rows={4} cols={6} />
            ) : links.length === 0 ? (
              <TableEmptyRow colSpan={6} message="No affiliate links yet." />
            ) : (
              links.map((l) => (
                <Tr key={l.id}>
                  <Td className="font-semibold text-navy-600">{l.name}</Td>
                  <Td>{l.network || "Direct"}</Td>
                  <Td>{l.placement.replace(/_/g, " ")}</Td>
                  <Td align="right">{l.clicks}</Td>
                  <Td>
                    <Badge variant={l.isActive ? "success" : "neutral"}>{l.isActive ? "Active" : "Inactive"}</Badge>
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditTarget(l)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toggleActive(l)}>
                        {l.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>

      {editTarget && (
        <LinkModal
          link={editTarget === "new" ? null : editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => setLinks((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))}
          onCreated={(created) => setLinks((prev) => [created, ...prev])}
        />
      )}
    </div>
  );
}
