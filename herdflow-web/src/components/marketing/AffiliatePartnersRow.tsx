"use client";

import { useEffect, useState } from "react";

type AffiliateLink = { id: string; name: string; imageUrl: string | null };

// Renders active AffiliateLinks for a given placement, always labelled
// "Sponsored" per ASA guidelines. Every anchor routes through /api/go/[id]
// (click tracking + redirect) with rel="sponsored nofollow".
export function AffiliatePartnersRow({
  placement,
  title = "Partner Offers",
}: {
  placement: string;
  title?: string;
}) {
  const [links, setLinks] = useState<AffiliateLink[]>([]);

  useEffect(() => {
    fetch(`/api/affiliates?placement=${placement}`)
      .then((r) => r.json())
      .then((d) => setLinks(d.links || []))
      .catch(() => {});
  }, [placement]);

  if (links.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#e4ebf5] bg-white p-5 shadow-sm">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#9aabb9]">{title}</p>
      <div className="space-y-3">
        {links.map((link) => (
          <a
            key={link.id}
            href={`/api/go/${link.id}`}
            target="_blank"
            rel="sponsored nofollow"
            className="block overflow-hidden rounded-lg border border-[#e4ebf5] transition hover:opacity-90"
          >
            {link.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={link.imageUrl} alt={link.name} className="w-full object-cover" />
            ) : (
              <div className="p-4 text-center text-sm font-semibold text-[#1B3A6B]">{link.name}</div>
            )}
            <p className="border-t border-[#e4ebf5] bg-[#f5f8fd] px-2 py-1 text-center text-[9px] font-bold uppercase tracking-wide text-[#9aabb9]">
              Sponsored
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
