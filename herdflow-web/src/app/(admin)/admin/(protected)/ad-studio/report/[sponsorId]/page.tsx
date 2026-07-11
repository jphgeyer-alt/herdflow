"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/admin/Button";
import { getPlacement } from "@/lib/ad-studio/placements";

type Campaign = {
  id: string;
  sponsorId?: string;
  placement: string;
  template: string;
  status: string;
  impressions: number;
  clicks: number;
  createdAt: string;
  sponsor: { companyName: string };
};

export default function AdStudioSponsorReportPage() {
  const params = useParams<{ sponsorId: string }>();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/marketing/creatives")
      .then((r) => r.json())
      .then((d) => {
        const all: Campaign[] = d.creatives || [];
        setCampaigns(all.filter((c) => c.sponsorId === params.sponsorId));
      })
      .finally(() => setLoading(false));
  }, [params.sponsorId]);

  if (loading) return <p className="p-8 text-center text-sm text-navy-300">Loading…</p>;

  const sponsorName = campaigns[0]?.sponsor.companyName || "Sponsor";
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/admin/ad-studio" className="text-green text-sm hover:underline">
          ← Ad Studio
        </Link>
        <Button variant="outline" onClick={() => window.print()}>
          Print / Save as PDF
        </Button>
      </div>

      <div className="mx-auto max-w-3xl rounded-xl border border-navy-50 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        <div className="mb-8 flex items-start justify-between border-b border-navy-50 pb-6">
          <div>
            <h1 className="text-2xl font-black text-[#1B3A6B]">HerdFlow</h1>
            <p className="text-sm text-navy-400">Sponsor Ad Performance Report</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-navy-600">{sponsorName}</p>
            <p className="text-xs text-navy-300">
              Generated {new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(new Date())}
            </p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-3 gap-4 text-center">
          <div className="rounded-lg border border-navy-50 p-4">
            <p className="text-2xl font-black text-[#1B3A6B]">{totalImpressions}</p>
            <p className="text-xs uppercase tracking-wide text-navy-300">Impressions</p>
          </div>
          <div className="rounded-lg border border-navy-50 p-4">
            <p className="text-2xl font-black text-[#1B3A6B]">{totalClicks}</p>
            <p className="text-xs uppercase tracking-wide text-navy-300">Clicks</p>
          </div>
          <div className="rounded-lg border border-navy-50 p-4">
            <p className="text-2xl font-black text-[#1B3A6B]">{ctr}%</p>
            <p className="text-xs uppercase tracking-wide text-navy-300">CTR</p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-50 text-left text-xs font-semibold uppercase tracking-wide text-navy-300">
              <th className="py-2">Placement</th>
              <th className="py-2">Template</th>
              <th className="py-2">Status</th>
              <th className="py-2 text-right">Impressions</th>
              <th className="py-2 text-right">Clicks</th>
              <th className="py-2 text-right">CTR</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-b border-navy-25">
                <td className="py-2 text-navy-500">{getPlacement(c.placement).label}</td>
                <td className="py-2 text-navy-500">{c.template}</td>
                <td className="py-2 text-navy-500">{c.status}</td>
                <td className="py-2 text-right">{c.impressions}</td>
                <td className="py-2 text-right">{c.clicks}</td>
                <td className="py-2 text-right">
                  {c.impressions > 0 ? `${((c.clicks / c.impressions) * 100).toFixed(2)}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
