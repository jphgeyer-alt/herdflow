"use client";
// WEBSITE — herdflow-web/src/app/(admin)/admin/app-content/page.tsx

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Badge, StatusBadge, type BadgeVariant } from "@/components/admin/Badge";
import { Input, Textarea } from "@/components/admin/Field";
import { Button } from "@/components/admin/Button";
import { Card } from "@/components/admin/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { TableEmptyRow } from "@/components/admin/EmptyState";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

const TABS = ["Announcements", "Banners", "Tips", "Auction Alerts", "Notifications"] as const;
type Tab = (typeof TABS)[number];

const TYPE_MAP: Record<Tab, string> = {
  Announcements: "ANNOUNCEMENT",
  Banners: "BANNER",
  Tips: "TIP",
  "Auction Alerts": "AUCTION_ALERT",
  Notifications: "NOTIFICATION",
};

const PRIORITIES = ["NORMAL", "IMPORTANT", "URGENT"];
const TIP_CATS = [
  "Cattle",
  "Sheep",
  "Goats",
  "General",
  "Health",
  "Breeding",
  "Feed and Nutrition",
  "Finance",
];
const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];
const SPECIES = ["cattle", "sheep", "goats", "pigs", "game", "poultry", "other"];

function priorityVariant(p: string): BadgeVariant {
  if (p === "URGENT") return "danger";
  if (p === "IMPORTANT") return "warning";
  return "neutral";
}

/* ── Shared helpers (local — no shared-library equivalent) ───────────────── */
function Select({
  label,
  children,
  ...props
}: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-navy-400">{label}</span>
      <select
        className="w-full rounded-lg border border-navy-100 bg-white px-3 py-2 text-sm outline-none focus:border-navy-600"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

function Toggle({
  label,
  sub,
  checked,
  onChange,
}: {
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-navy-100 p-3">
      <div>
        <p className="text-sm font-semibold text-navy-500">{label}</p>
        {sub && <p className="text-xs text-navy-300">{sub}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-navy-600" : "bg-navy-100"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}

function ChipSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (o: string) =>
    onChange(selected.includes(o) ? selected.filter((s) => s !== o) : [...selected, o]);
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-navy-400">
        {label} <span className="font-normal text-navy-300">(empty = all)</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${selected.includes(o) ? "border-navy-600 bg-navy-600 text-white" : "border-navy-100 text-navy-400 hover:border-navy-600"}`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Content list item ────────────────────────────────────────────────────── */
function ContentRow({ item, onDelete }: { item: AppContentItem; onDelete: () => void }) {
  return (
    <Card className="flex items-start gap-3 p-4">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold text-navy-600">{item.title}</p>
          {item.priority && <Badge variant={priorityVariant(item.priority)}>{item.priority}</Badge>}
          <StatusBadge status={item.status} />
        </div>
        {(item.message || item.content) && (
          <p className="line-clamp-2 text-sm text-navy-400">{item.message ?? item.content}</p>
        )}
        <p className="mt-1 text-xs text-navy-300">
          {new Date(item.createdAt).toLocaleDateString("en-ZA")}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-600"
        onClick={onDelete}
      >
        Delete
      </Button>
    </Card>
  );
}

interface AppContentItem {
  id: string;
  type: string;
  title: string;
  message?: string;
  content?: string;
  priority?: string;
  status: string;
  createdAt: string;
}

/* ── Announcement panel ──────────────────────────────────────────────────── */
function AnnouncementsPanel() {
  const [items, setItems] = useState<AppContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppContentItem | null>(null);
  const [form, setForm] = useState({ title: "", message: "", priority: "NORMAL", sendPush: false });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/app/admin/content?type=ANNOUNCEMENT", { credentials: "include" });
      const d = await r.json();
      setItems(d.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!form.title || !form.message) return;
    setSaving(true);
    try {
      await fetch("/api/app/admin/content", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type: "ANNOUNCEMENT" }),
      });
      setForm({ title: "", message: "", priority: "NORMAL", sendPush: false });
      setCreating(false);
      await load();
      toast.success("Announcement published.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/app/admin/content/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setDeleteTarget(null);
      await load();
      toast.success("Announcement deleted.");
    } catch {
      toast.error("Failed to delete announcement.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-navy-300">
          {items.length} announcement{items.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setCreating((v) => !v)}>
          {creating ? "Cancel" : "+ New Announcement"}
        </Button>
      </div>

      {creating && (
        <div className="space-y-3 rounded-xl border border-navy-50 bg-navy-25 p-5">
          <Input
            label="Title *"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Announcement title..."
          />
          <Textarea
            label={`Message * (${form.message.length}/500)`}
            rows={4}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value.slice(0, 500) }))}
          />
          <Select
            label="Priority"
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
          >
            {PRIORITIES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
          <Toggle
            label="Send push notification"
            sub="Notify all farmers immediately"
            checked={form.sendPush}
            onChange={(v) => setForm((f) => ({ ...f, sendPush: v }))}
          />
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={save}
              loading={saving}
              disabled={!form.title || !form.message}
            >
              Publish
            </Button>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Discard
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-navy-300">Loading…</p>
      ) : (
        <div className="space-y-2">
          {items.length === 0 && (
            <p className="rounded-lg border border-dashed border-navy-100 p-8 text-center text-sm text-navy-300">
              No announcements yet
            </p>
          )}
          {items.map((item) => (
            <ContentRow key={item.id} item={item} onDelete={() => setDeleteTarget(item)} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete this announcement?"
        description="This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

/* ── Banners panel ───────────────────────────────────────────────────────── */
function BannersPanel() {
  const [items, setItems] = useState<AppContentItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppContentItem | null>(null);
  const [form, setForm] = useState({
    title: "",
    message: "",
    sponsorName: "",
    imageUrl: "",
    linkUrl: "",
    targetProvinces: [] as string[],
    targetSpecies: [] as string[],
  });

  const load = useCallback(async () => {
    const r = await fetch("/api/app/admin/content?type=BANNER", { credentials: "include" });
    const d = await r.json();
    setItems(d.items ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!form.title || !form.message || !form.sponsorName) return;
    setSaving(true);
    try {
      await fetch("/api/app/admin/content", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type: "BANNER" }),
      });
      setForm({
        title: "",
        message: "",
        sponsorName: "",
        imageUrl: "",
        linkUrl: "",
        targetProvinces: [],
        targetSpecies: [],
      });
      setCreating(false);
      await load();
      toast.success("Banner published.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/app/admin/content/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setDeleteTarget(null);
      await load();
      toast.success("Banner deleted.");
    } catch {
      toast.error("Failed to delete banner.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-navy-300">
          {items.length} banner{items.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setCreating((v) => !v)}>
          {creating ? "Cancel" : "+ New Banner"}
        </Button>
      </div>
      {creating && (
        <div className="space-y-3 rounded-xl border border-navy-50 bg-navy-25 p-5">
          <Input
            label="Sponsor Name *"
            value={form.sponsorName}
            onChange={(e) => setForm((f) => ({ ...f, sponsorName: e.target.value }))}
          />
          <Input
            label="Banner Title *"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Textarea
            label="Message *"
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          />
          <Input
            label="Image URL"
            value={form.imageUrl}
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            placeholder="https://..."
          />
          <Input
            label="Link URL"
            value={form.linkUrl}
            onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
            placeholder="https://..."
          />
          <ChipSelect
            label="Target Provinces"
            options={PROVINCES}
            selected={form.targetProvinces}
            onChange={(v) => setForm((f) => ({ ...f, targetProvinces: v }))}
          />
          <ChipSelect
            label="Target Species"
            options={SPECIES}
            selected={form.targetSpecies}
            onChange={(v) => setForm((f) => ({ ...f, targetSpecies: v }))}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={save} loading={saving}>
              Publish
            </Button>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Discard
            </Button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-navy-100 p-8 text-center text-sm text-navy-300">
            No banners yet
          </p>
        )}
        {items.map((item) => (
          <ContentRow key={item.id} item={item} onDelete={() => setDeleteTarget(item)} />
        ))}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete this banner?"
        description="This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

/* ── Tips panel ──────────────────────────────────────────────────────────── */
function TipsPanel() {
  const [items, setItems] = useState<AppContentItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppContentItem | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "General", source: "" });

  const load = useCallback(async () => {
    const r = await fetch("/api/app/admin/content?type=TIP", { credentials: "include" });
    const d = await r.json();
    setItems(d.items ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);
    try {
      await fetch("/api/app/admin/content", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type: "TIP" }),
      });
      setForm({ title: "", content: "", category: "General", source: "" });
      setCreating(false);
      await load();
      toast.success("Tip saved.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/app/admin/content/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setDeleteTarget(null);
      await load();
      toast.success("Tip deleted.");
    } catch {
      toast.error("Failed to delete tip.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-navy-300">
          {items.length} tip{items.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setCreating((v) => !v)}>
          {creating ? "Cancel" : "+ New Tip"}
        </Button>
      </div>
      {creating && (
        <div className="space-y-3 rounded-xl border border-navy-50 bg-navy-25 p-5">
          <Select
            label="Category *"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {TIP_CATS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Input
            label="Title *"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Textarea
            label="Content *"
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          />
          <Input
            label="Source"
            value={form.source}
            onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
            placeholder="e.g. ARC South Africa"
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={save} loading={saving}>
              Save Tip
            </Button>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Discard
            </Button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-navy-100 p-8 text-center text-sm text-navy-300">
            No tips yet
          </p>
        )}
        {items.map((item) => (
          <ContentRow key={item.id} item={item} onDelete={() => setDeleteTarget(item)} />
        ))}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete this tip?"
        description="This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

/* ── Auction Alerts panel ────────────────────────────────────────────────── */
function AuctionAlertsPanel() {
  const [items, setItems] = useState<AppContentItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppContentItem | null>(null);
  const [form, setForm] = useState({
    title: "",
    message: "",
    linkUrl: "",
    sendPush: false,
    targetProvinces: [] as string[],
  });

  const load = useCallback(async () => {
    const r = await fetch("/api/app/admin/content?type=AUCTION_ALERT", { credentials: "include" });
    const d = await r.json();
    setItems(d.items ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!form.title) return;
    setSaving(true);
    try {
      await fetch("/api/app/admin/content", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type: "AUCTION_ALERT" }),
      });
      setForm({ title: "", message: "", linkUrl: "", sendPush: false, targetProvinces: [] });
      setCreating(false);
      await load();
      toast.success("Auction alert published.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/app/admin/content/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setDeleteTarget(null);
      await load();
      toast.success("Auction alert deleted.");
    } catch {
      toast.error("Failed to delete auction alert.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-navy-300">
          {items.length} auction alert{items.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setCreating((v) => !v)}>
          {creating ? "Cancel" : "+ New Auction Alert"}
        </Button>
      </div>
      {creating && (
        <div className="space-y-3 rounded-xl border border-navy-50 bg-navy-25 p-5">
          <Input
            label="Auction Title *"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Textarea
            label="Description"
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          />
          <Input
            label="Link to Auction"
            value={form.linkUrl}
            onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
            placeholder="https://herdflow.co.za/auctions/..."
          />
          <ChipSelect
            label="Target Provinces"
            options={PROVINCES}
            selected={form.targetProvinces}
            onChange={(v) => setForm((f) => ({ ...f, targetProvinces: v }))}
          />
          <Toggle
            label="Send push notification"
            checked={form.sendPush}
            onChange={(v) => setForm((f) => ({ ...f, sendPush: v }))}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={save} loading={saving}>
              Publish
            </Button>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Discard
            </Button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-navy-100 p-8 text-center text-sm text-navy-300">
            No auction alerts yet
          </p>
        )}
        {items.map((item) => (
          <ContentRow key={item.id} item={item} onDelete={() => setDeleteTarget(item)} />
        ))}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete this auction alert?"
        description="This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

/* ── Notifications panel ─────────────────────────────────────────────────── */
function NotificationsPanel() {
  const [history, setHistory] = useState<
    Array<{
      id: string;
      title: string;
      message: string;
      target: string;
      sentCount: number;
      sentAt?: string;
      createdAt: string;
    }>
  >([]);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", target: "ALL", targetValue: "" });
  const [preview, setPreview] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/app/admin/notifications", { credentials: "include" });
    const d = await r.json();
    setHistory(d.notifications ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const send = async () => {
    if (!form.title || !form.message) return;
    setSending(true);
    try {
      await fetch("/api/app/admin/notifications", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({ title: "", message: "", target: "ALL", targetValue: "" });
      setPreview(false);
      await load();
      toast.success("Notification sent.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="space-y-3 p-5">
        <h3 className="font-semibold text-navy-600">Compose Push Notification</h3>
        <Input
          label={`Title * (${form.title.length}/65)`}
          value={form.title}
          maxLength={65}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        <Textarea
          label={`Message * (${form.message.length}/255)`}
          rows={4}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value.slice(0, 255) }))}
        />
        <Select
          label="Target Audience"
          value={form.target}
          onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
        >
          <option value="ALL">All Farmers</option>
          <option value="PROVINCE">By Province</option>
          <option value="SPECIFIC">Specific Farmer</option>
        </Select>
        {form.target !== "ALL" && (
          <Input
            label={form.target === "PROVINCE" ? "Province" : "Farmer Email"}
            value={form.targetValue}
            onChange={(e) => setForm((f) => ({ ...f, targetValue: e.target.value }))}
          />
        )}
        {preview && form.title && (
          <div className="space-y-1 rounded-lg border border-navy-700 bg-navy-900 p-4">
            <p className="text-xs font-semibold text-navy-200 uppercase">Preview</p>
            <p className="font-semibold text-white">{form.title}</p>
            <p className="text-sm text-navy-100">{form.message}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-3 pt-2">
          <Button variant="outline" onClick={() => setPreview((v) => !v)}>
            {preview ? "Hide Preview" : "Preview"}
          </Button>
          <Button
            variant="secondary"
            onClick={send}
            loading={sending}
            disabled={!form.title || !form.message}
          >
            Send Now
          </Button>
        </div>
      </Card>

      <div>
        <h3 className="mb-3 font-semibold text-navy-600">Sent Notifications</h3>
        {history.length === 0 ? (
          <p className="rounded-lg border border-dashed border-navy-100 p-8 text-center text-sm text-navy-300">
            No notifications sent yet
          </p>
        ) : (
          <Card>
            <Table>
              <Thead>
                <Tr>
                  <Th>Title</Th>
                  <Th>Target</Th>
                  <Th>Sent</Th>
                  <Th>Delivered</Th>
                </Tr>
              </Thead>
              <Tbody>
                {history.length === 0 ? (
                  <TableEmptyRow colSpan={4} message="No notifications sent yet." />
                ) : (
                  history.map((n) => (
                    <Tr key={n.id}>
                      <Td className="font-medium text-navy-600">{n.title}</Td>
                      <Td>{n.target}</Td>
                      <Td>{n.sentAt ? new Date(n.sentAt).toLocaleDateString("en-ZA") : "—"}</Td>
                      <Td>{n.sentCount}</Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function AppContentPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Announcements");

  return (
    <main className="space-y-5 pb-10">
      <header>
        <h1 className="text-3xl font-semibold text-navy-600">Mobile App Content</h1>
        <p className="text-sm text-navy-400">
          Manage content pushed to farmer phones — announcements, banners, tips, auction alerts, and
          push notifications.
        </p>
      </header>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-navy-50 bg-navy-25 p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab
                ? "bg-navy-600 text-white shadow-sm"
                : "text-navy-400 hover:text-navy-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div>
        {activeTab === "Announcements" && <AnnouncementsPanel />}
        {activeTab === "Banners" && <BannersPanel />}
        {activeTab === "Tips" && <TipsPanel />}
        {activeTab === "Auction Alerts" && <AuctionAlertsPanel />}
        {activeTab === "Notifications" && <NotificationsPanel />}
      </div>
    </main>
  );
}
