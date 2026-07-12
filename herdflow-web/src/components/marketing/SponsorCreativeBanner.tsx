"use client";

import { useEffect, useState } from "react";

type Creative = {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  sponsor: { companyName: string };
};

type AffiliateFallback = { id: string; name: string; imageUrl: string | null };

export function SponsorCreativeBanner({
  placement,
}: {
  placement: "HOMEPAGE" | "SHOP" | "LISTINGS";
}) {
  const [creative, setCreative] = useState<Creative | null>(null);
  const [affiliate, setAffiliate] = useState<AffiliateFallback | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/marketing/creatives?placement=${placement}`)
      .then((r) => r.json())
      .then(async (data) => {
        const candidates: Creative[] = Array.isArray(data.creatives) ? data.creatives : [];
        if (candidates.length > 0) {
          const chosen = candidates[Math.floor(Math.random() * candidates.length)];
          setCreative(chosen);
          fetch(`/api/marketing/creatives/${chosen.id}/impression`, { method: "POST" }).catch(
            () => {},
          );
          return;
        }

        // No live sponsor creative for this slot — fall back to an active
        // affiliate banner rather than leaving the slot empty.
        const affData = await fetch("/api/affiliates?placement=EMPTY_AD_SLOT").then((r) => r.json());
        const affCandidates: AffiliateFallback[] = Array.isArray(affData.links) ? affData.links : [];
        if (affCandidates.length > 0) {
          setAffiliate(affCandidates[Math.floor(Math.random() * affCandidates.length)]);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [placement]);

  if (!loaded || (!creative && !affiliate)) return null;

  if (!creative && affiliate) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-xl border border-[#e4ebf5] bg-white">
          <p className="border-b border-[#e4ebf5] bg-[#f5f8fd] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#9aabb9]">
            Sponsored
          </p>
          <a href={`/api/go/${affiliate.id}`} target="_blank" rel="sponsored nofollow" title={affiliate.name}>
            {affiliate.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={affiliate.imageUrl} alt={affiliate.name} className="max-h-40 w-full object-cover" />
            ) : (
              <div className="p-6 text-center font-semibold text-[#1B3A6B]">{affiliate.name}</div>
            )}
          </a>
        </div>
      </section>
    );
  }

  if (!creative) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-[#e4ebf5] bg-white">
        <p className="border-b border-[#e4ebf5] bg-[#f5f8fd] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#9aabb9]">
          Sponsored
        </p>
        <a
          href={`/api/marketing/creatives/${creative.id}/click`}
          target="_blank"
          rel="noopener noreferrer"
          title={creative.sponsor.companyName}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={creative.imageUrl}
            alt={creative.sponsor.companyName}
            className="max-h-40 w-full object-cover"
          />
        </a>
      </div>
    </section>
  );
}
