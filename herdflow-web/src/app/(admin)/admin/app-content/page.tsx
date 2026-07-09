"use client";
// WEBSITE — herdflow-web/src/app/(admin)/admin/app-content/page.tsx

import { useState, useEffect, useCallback } from "react";

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

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${color}`}
    >
      {label}
    </span>
  );
}

function priorityColor(p: string) {
  if (p === "URGENT") return "bg-red-100 text-red-700";
  if (p === "IMPORTANT") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function statusColor(s: string) {
  if (s === "ACTIVE") return "bg-green-100 text-green-700";
  if (s === "ARCHIVED") return "bg-slate-100 text-slate-500";
  return "bg-slate-100 text-slate-600";
}

/* ── Shared helpers ───────────────────────────────────────────────────────── */
function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      <input
        className="focus:border-brand-navy w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
        {...props}
      />
    </label>
  );
}

function Textarea({
  label,
  maxChars,
  ...props
}: { label: string; maxChars?: number } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const len = String(props.value ?? "").length;
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
        {label}
        {maxChars && (
          <span className={len > maxChars * 0.9 ? "text-amber-600" : "text-slate-400"}>
            {len}/{maxChars}
          </span>
        )}
      </span>
      <textarea
        className="focus:border-brand-navy w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
        rows={4}
        {...props}
      />
    </label>
  );
}

function Select({
  label,
  children,
  ...props
}: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      <select
        className="focus:border-brand-navy w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
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
    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
      <div>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-brand-navy" : "bg-slate-300"}`}
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
      <p className="mb-1 text-xs font-semibold text-slate-600">
        {label} <span className="font-normal text-slate-400">(empty = all)</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${selected.includes(o) ? "border-brand-navy bg-brand-navy text-white" : "hover:border-brand-navy border-slate-200 text-slate-600"}`}
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
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <p className="text-brand-navy truncate font-semibold">{item.title}</p>
          {item.priority && <Badge label={item.priority} color={priorityColor(item.priority)} />}
          <Badge label={item.status} color={statusColor(item.status)} />
        </div>
        {(item.message || item.content) && (
          <p className="line-clamp-2 text-sm text-slate-600">{item.message ?? item.content}</p>
        )}
        <p className="mt-1 text-xs text-slate-400">
          {new Date(item.createdAt).toLocaleDateString("en-ZA")}
        </p>
      </div>
      <button
        onClick={onDelete}
        className="shrink-0 rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
      >
        Delete
      </button>
    </div>
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
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    await fetch(`/api/app/admin/content/${id}`, { method: "DELETE", credentials: "include" });
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {items.length} announcement{items.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setCreating((v) => !v)}
          className="bg-brand-navy rounded-lg px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-90"
        >
          {creating ? "Cancel" : "+ New Announcement"}
        </button>
      </div>

      {creating && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <Input
            label="Title *"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Announcement title..."
          />
          <Textarea
            label="Message *"
            maxChars={500}
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
            <button
              onClick={save}
              disabled={saving || !form.title || !form.message}
              className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {saving ? "Publishing…" : "PUBLISH"}
            </button>
            <button
              onClick={() => setCreating(false)}
              className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (
        <div className="space-y-2">
          {items.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
              No announcements yet
            </p>
          )}
          {items.map((item) => (
            <ContentRow key={item.id} item={item} onDelete={() => del(item.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Banners panel ───────────────────────────────────────────────────────── */
function BannersPanel() {
  const [items, setItems] = useState<AppContentItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
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
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    await fetch(`/api/app/admin/content/${id}`, { method: "DELETE", credentials: "include" });
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {items.length} banner{items.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setCreating((v) => !v)}
          className="bg-brand-navy rounded-lg px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-90"
        >
          {creating ? "Cancel" : "+ New Banner"}
        </button>
      </div>
      {creating && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-5">
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
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {saving ? "Publishing…" : "PUBLISH"}
            </button>
            <button
              onClick={() => setCreating(false)}
              className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600"
            >
              Discard
            </button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
            No banners yet
          </p>
        )}
        {items.map((item) => (
          <ContentRow key={item.id} item={item} onDelete={() => del(item.id)} />
        ))}
      </div>
    </div>
  );
}

/* ── Tips panel ──────────────────────────────────────────────────────────── */
function TipsPanel() {
  const [items, setItems] = useState<AppContentItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
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
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this tip?")) return;
    await fetch(`/api/app/admin/content/${id}`, { method: "DELETE", credentials: "include" });
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {items.length} tip{items.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setCreating((v) => !v)}
          className="bg-brand-navy rounded-lg px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-90"
        >
          {creating ? "Cancel" : "+ New Tip"}
        </button>
      </div>
      {creating && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-5">
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
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {saving ? "Saving…" : "SAVE TIP"}
            </button>
            <button
              onClick={() => setCreating(false)}
              className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600"
            >
              Discard
            </button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
            No tips yet
          </p>
        )}
        {items.map((item) => (
          <ContentRow key={item.id} item={item} onDelete={() => del(item.id)} />
        ))}
      </div>
    </div>
  );
}

/* ── Auction Alerts panel ────────────────────────────────────────────────── */
function AuctionAlertsPanel() {
  const [items, setItems] = useState<AppContentItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
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
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this auction alert?")) return;
    await fetch(`/api/app/admin/content/${id}`, { method: "DELETE", credentials: "include" });
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {items.length} auction alert{items.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setCreating((v) => !v)}
          className="bg-brand-navy rounded-lg px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-90"
        >
          {creating ? "Cancel" : "+ New Auction Alert"}
        </button>
      </div>
      {creating && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-5">
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
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {saving ? "Publishing…" : "PUBLISH"}
            </button>
            <button
              onClick={() => setCreating(false)}
              className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600"
            >
              Discard
            </button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
            No auction alerts yet
          </p>
        )}
        {items.map((item) => (
          <ContentRow key={item.id} item={item} onDelete={() => del(item.id)} />
        ))}
      </div>
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
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-brand-navy font-semibold">Compose Push Notification</h3>
        <Input
          label={`Title * (${form.title.length}/65)`}
          value={form.title}
          maxLength={65}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        <Textarea
          label={`Message * (${form.message.length}/255)`}
          maxChars={255}
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
          <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-900 p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">Preview</p>
            <p className="font-semibold text-white">{form.title}</p>
            <p className="text-sm text-slate-300">{form.message}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => setPreview((v) => !v)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
          >
            {preview ? "Hide Preview" : "Preview"}
          </button>
          <button
            onClick={send}
            disabled={sending || !form.title || !form.message}
            className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            {sending ? "Sending…" : "SEND NOW"}
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-brand-navy mb-3 font-semibold">Sent Notifications</h3>
        {history.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
            No notifications sent yet
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  {["Title", "Target", "Sent", "Delivered"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((n) => (
                  <tr key={n.id}>
                    <td className="text-brand-navy px-4 py-3 font-medium">{n.title}</td>
                    <td className="px-4 py-3 text-slate-600">{n.target}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {n.sentAt ? new Date(n.sentAt).toLocaleDateString("en-ZA") : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{n.sentCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        <h1 className="text-brand-navy text-3xl font-semibold">Mobile App Content</h1>
        <p className="text-sm text-[#38537a]">
          Manage content pushed to farmer phones — announcements, banners, tips, auction alerts, and
          push notifications.
        </p>
      </header>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab
                ? "bg-brand-navy text-white shadow-sm"
                : "hover:text-brand-navy text-slate-600"
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
