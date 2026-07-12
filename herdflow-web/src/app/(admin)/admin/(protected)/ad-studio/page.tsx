"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import { Download, Save } from "lucide-react";
import { PLACEMENTS, TEMPLATES, getPlacement } from "@/lib/ad-studio/placements";
import { AdTemplatePreview } from "@/components/ad-studio/AdTemplatePreview";
import { SingleImageUpload } from "@/components/ui/SingleImageUpload";
import { Card, CardHeader } from "@/components/admin/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { TableEmptyRow } from "@/components/admin/EmptyState";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
import { Input, Select } from "@/components/admin/Field";

type SponsorOption = { id: string; companyName: string; website: string | null; status: string };

type Campaign = {
  id: string;
  sponsorId?: string;
  placement: string;
  template: string;
  status: string;
  imageUrl: string;
  linkUrl: string | null;
  headline: string | null;
  subline: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  bgColor: string;
  textColor: string;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  impressions: number;
  clicks: number;
  sponsor: { companyName: string };
};

const STATUS_OPTIONS = ["DRAFT", "SCHEDULED", "LIVE", "PAUSED", "ENDED"];
const PREVIEW_MAX_WIDTH = 480;

function BuilderTab({ campaigns, sponsors, onSaved }: { campaigns: Campaign[]; sponsors: SponsorOption[]; onSaved: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sponsorId, setSponsorId] = useState("");
  const [placement, setPlacement] = useState(PLACEMENTS[0].value as string);
  const [template, setTemplate] = useState(TEMPLATES[0].value);
  const [status, setStatus] = useState("DRAFT");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [headline, setHeadline] = useState("");
  const [subline, setSubline] = useState("");
  const [ctaText, setCtaText] = useState("Learn More");
  const [ctaUrl, setCtaUrl] = useState("");
  const [bgColor, setBgColor] = useState("#1B3A6B");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const placementConfig = getPlacement(placement);
  const scale = Math.min(1, PREVIEW_MAX_WIDTH / placementConfig.width);
  const sponsorName = sponsors.find((s) => s.id === sponsorId)?.companyName || "Your Brand";

  function loadCampaign(c: Campaign) {
    setEditingId(c.id);
    setSponsorId(c.sponsorId || "");
    setPlacement(c.placement);
    setTemplate(c.template);
    setStatus(c.status);
    setImageUrl(c.imageUrl);
    setHeadline(c.headline || "");
    setSubline(c.subline || "");
    setCtaText(c.ctaText || "");
    setCtaUrl(c.ctaUrl || "");
    setBgColor(c.bgColor);
    setTextColor(c.textColor);
    setStartDate(c.startDate?.slice(0, 10) || "");
    setEndDate(c.endDate?.slice(0, 10) || "");
  }

  function resetForm() {
    setEditingId(null);
    setSponsorId("");
    setHeadline("");
    setSubline("");
    setCtaText("Learn More");
    setCtaUrl("");
    setImageUrl(null);
    setStatus("DRAFT");
    setStartDate("");
    setEndDate("");
  }

  async function downloadPng() {
    if (!previewRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(previewRef.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${sponsorName.replace(/\s+/g, "-").toLowerCase()}-${placement.toLowerCase()}.png`;
      a.click();
    } catch {
      toast.error("Failed to export PNG.");
    } finally {
      setDownloading(false);
    }
  }

  async function saveCampaign() {
    if (!editingId && !sponsorId) {
      toast.error("Please select a sponsor.");
      return;
    }
    if (!previewRef.current) return;
    setSaving(true);
    try {
      const renderedPng = await toPng(previewRef.current, { pixelRatio: 2, cacheBust: true });
      const payload = {
        ...(!editingId && { sponsorId }),
        placement,
        template,
        status,
        imageUrl: renderedPng,
        linkUrl: ctaUrl || undefined,
        headline,
        subline,
        ctaText,
        ctaUrl,
        bgColor,
        textColor,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      const res = await fetch(
        editingId ? `/api/admin/marketing/creatives/${editingId}` : "/api/admin/marketing/creatives",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save campaign.");
        return;
      }
      toast.success(editingId ? "Campaign updated." : "Campaign saved.");
      resetForm();
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <div className="space-y-4">
        <Card className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Sponsor" value={sponsorId} onChange={(e) => setSponsorId(e.target.value)} disabled={!!editingId}>
              <option value="">— Select sponsor —</option>
              {sponsors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.companyName}
                </option>
              ))}
            </Select>
            <Select label="Placement" value={placement} onChange={(e) => setPlacement(e.target.value)}>
              {PLACEMENTS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label} ({p.width}×{p.height})
                </option>
              ))}
            </Select>
            <Select label="Template" value={template} onChange={(e) => setTemplate(e.target.value)}>
              {TEMPLATES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-4">
            <SingleImageUpload
              label={template === "banner-photo" ? "Background Image" : "Logo / Product Image"}
              value={imageUrl}
              onChange={setImageUrl}
              aspectRatio="16/9"
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input label="Headline" value={headline} onChange={(e) => setHeadline(e.target.value)} />
            <Input label="Subline" value={subline} onChange={(e) => setSubline(e.target.value)} />
            <Input label="CTA Text" value={ctaText} onChange={(e) => setCtaText(e.target.value)} />
            <Input label="CTA / Link URL" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-navy-500">Background</span>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-10 w-full rounded-lg border border-navy-100"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-navy-500">Text Color</span>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="h-10 w-full rounded-lg border border-navy-100"
              />
            </label>
            <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" loading={downloading} onClick={downloadPng}>
              <Download size={14} className="mr-1.5" /> Download PNG
            </Button>
            <Button loading={saving} onClick={saveCampaign}>
              <Save size={14} className="mr-1.5" /> {editingId ? "Update Campaign" : "Save Campaign"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm}>
                New Campaign
              </Button>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Campaigns" description="Click a row to load it into the builder for editing." />
          <Table>
            <Thead>
              <Tr>
                <Th>Sponsor</Th>
                <Th>Placement</Th>
                <Th>Template</Th>
                <Th>Status</Th>
                <Th align="right">Impressions</Th>
                <Th align="right">Clicks</Th>
              </Tr>
            </Thead>
            <Tbody>
              {campaigns.length === 0 ? (
                <TableEmptyRow colSpan={6} message="No campaigns yet." />
              ) : (
                campaigns.map((c) => (
                  <Tr key={c.id} className="cursor-pointer hover:bg-navy-25" onClick={() => loadCampaign(c)}>
                    <Td className="font-semibold text-navy-600">{c.sponsor.companyName}</Td>
                    <Td>{getPlacement(c.placement).label}</Td>
                    <Td>{c.template}</Td>
                    <Td>
                      <Badge variant={c.status === "LIVE" ? "success" : c.status === "PAUSED" || c.status === "ENDED" ? "neutral" : "warning"}>
                        {c.status}
                      </Badge>
                    </Td>
                    <Td align="right">{c.impressions}</Td>
                    <Td align="right">{c.clicks}</Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Card>
      </div>

      <div className="lg:sticky lg:top-4 lg:self-start">
        <Card className="p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-navy-300">
            Live Preview — {placementConfig.width}×{placementConfig.height}px
          </p>
          <div style={{ width: placementConfig.width * scale, height: placementConfig.height * scale, overflow: "hidden" }}>
            <div style={{ width: placementConfig.width, height: placementConfig.height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <AdTemplatePreview
                ref={previewRef}
                template={template}
                imageUrl={imageUrl}
                headline={headline || "Your Headline Here"}
                subline={subline}
                ctaText={ctaText}
                bgColor={bgColor}
                textColor={textColor}
                sponsorName={sponsorName}
                width={placementConfig.width}
                height={placementConfig.height}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function PerformanceTab({ campaigns }: { campaigns: Campaign[] }) {
  const bySponsor = useMemo(() => {
    const map = new Map<string, { name: string; impressions: number; clicks: number; count: number; sponsorId: string }>();
    for (const c of campaigns) {
      const key = c.sponsor.companyName;
      const existing = map.get(key);
      map.set(key, {
        name: key,
        sponsorId: c.sponsorId || key,
        impressions: (existing?.impressions ?? 0) + c.impressions,
        clicks: (existing?.clicks ?? 0) + c.clicks,
        count: (existing?.count ?? 0) + 1,
      });
    }
    return [...map.values()].sort((a, b) => b.impressions - a.impressions);
  }, [campaigns]);

  return (
    <Card>
      <CardHeader title="Campaign Performance" description="Impressions, clicks, and CTR per sponsor across all campaigns." />
      <Table>
        <Thead>
          <Tr>
            <Th>Sponsor</Th>
            <Th align="right">Campaigns</Th>
            <Th align="right">Impressions</Th>
            <Th align="right">Clicks</Th>
            <Th align="right">CTR</Th>
            <Th>Report</Th>
          </Tr>
        </Thead>
        <Tbody>
          {bySponsor.length === 0 ? (
            <TableEmptyRow colSpan={6} message="No campaign data yet." />
          ) : (
            bySponsor.map((s) => (
              <Tr key={s.name}>
                <Td className="font-semibold text-navy-600">{s.name}</Td>
                <Td align="right">{s.count}</Td>
                <Td align="right">{s.impressions}</Td>
                <Td align="right">{s.clicks}</Td>
                <Td align="right">{s.impressions > 0 ? `${((s.clicks / s.impressions) * 100).toFixed(2)}%` : "—"}</Td>
                <Td>
                  <Link
                    href={`/admin/ad-studio/report/${encodeURIComponent(s.sponsorId)}`}
                    target="_blank"
                    className="text-xs font-semibold text-navy-600 hover:underline"
                  >
                    Export Report PDF
                  </Link>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </Card>
  );
}

export default function AdStudioPage() {
  const [tab, setTab] = useState<"builder" | "performance">("builder");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sponsors, setSponsors] = useState<SponsorOption[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch("/api/admin/marketing/creatives")
      .then((r) => r.json())
      .then((d) => setCampaigns(d.creatives || []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  useEffect(() => {
    fetch("/api/admin/marketing")
      .then((r) => r.json())
      .then((d) =>
        setSponsors(
          (d.sponsors || []).filter((s: SponsorOption) => s.status === "ACTIVE"),
        ),
      );
  }, []);

  return (
    <main className="space-y-6 pb-10">
      <header>
        <h1 className="text-navy-600 text-3xl font-semibold">Ad Studio</h1>
        <p className="text-sm text-navy-300">
          Build, preview, and export sponsor ad campaigns across web, mobile, and email placements.
        </p>
      </header>

      <div className="flex gap-2 border-b border-navy-50">
        {(["builder", "performance"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold capitalize ${
              tab === t ? "border-b-2 border-navy-600 text-navy-600" : "text-navy-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-navy-300">Loading…</p>
      ) : tab === "builder" ? (
        <BuilderTab campaigns={campaigns} sponsors={sponsors} onSaved={load} />
      ) : (
        <PerformanceTab campaigns={campaigns} />
      )}
    </main>
  );
}
