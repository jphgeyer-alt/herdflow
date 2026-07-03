"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Sponsor = {
  id: string;
  companyName: string;
  logoUrl: string | null;
  website: string | null;
};

export function SponsorBanner() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/marketing/sponsors")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.sponsors)) setSponsors(data.sponsors);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Render nothing until loaded; if no active sponsors also render nothing
  if (!loaded || sponsors.length === 0) return null;

  return (
    <section className="bg-white border-y border-[#e4ebf5] py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-none">
          <span className="shrink-0 text-xs font-bold uppercase tracking-widest text-[#5d7497] whitespace-nowrap">
            HerdFlow Trusted Sponsors
          </span>
          {sponsors.map((s) => (
            <a
              key={s.id}
              href={s.website || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center justify-center h-10 px-4 rounded-lg border border-[#e4ebf5] hover:border-[#A07C3A] transition"
              title={s.companyName}
            >
              {s.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.logoUrl}
                  alt={s.companyName}
                  className="max-h-8 max-w-28 object-contain"
                />
              ) : (
                <span className="text-xs font-semibold text-[#5d7497] whitespace-nowrap">{s.companyName}</span>
              )}
            </a>
          ))}
          <Link
            href="/marketing"
            className="shrink-0 text-xs font-bold text-[#2E7D32] hover:underline whitespace-nowrap ml-auto"
          >
            Become a Sponsor →
          </Link>
        </div>
      </div>
    </section>
  );
}
