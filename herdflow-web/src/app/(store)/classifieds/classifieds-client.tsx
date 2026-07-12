"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ClassifiedRow = {
  id: string;
  category: string;
  title: string;
  description: string;
  price: string | null;
  priceType: string;
  province: string;
  town: string | null;
  photos: string[];
  tier: string;
  jobType: string | null;
  hectares: string | null;
  createdAt: string;
};

const TABS: { value: string; label: string }[] = [
  { value: "FARM_EQUIPMENT", label: "Equipment" },
  { value: "FARM_JOBS", label: "Jobs" },
  { value: "GRAZING_LAND", label: "Grazing & Land" },
  { value: "WANTED", label: "Wanted" },
];

function formatPrice(c: ClassifiedRow) {
  if (c.priceType === "POA") return "Price on Application";
  if (c.priceType === "NEGOTIABLE") return c.price ? `R${Number(c.price).toLocaleString("en-ZA")} (Negotiable)` : "Negotiable";
  return c.price ? `R${Number(c.price).toLocaleString("en-ZA")}` : "—";
}

export function ClassifiedsClient() {
  const [tab, setTab] = useState(TABS[0].value);
  const [items, setItems] = useState<ClassifiedRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/classifieds?category=${tab}`)
      .then((r) => r.json())
      .then((d) => setItems(d.classifieds || []))
      .finally(() => setLoading(false));
  }, [tab]);

  function selectTab(value: string) {
    setTab(value);
    setLoading(true);
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => selectTab(t.value)}
            className={`rounded-full px-5 py-2 text-sm font-bold transition ${
              tab === t.value
                ? "bg-[#1B3A6B] text-white"
                : "border border-[#cdd8e7] bg-white text-[#5d7497] hover:border-[#1B3A6B]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-sm text-[#5d7497]">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-[#e4ebf5] bg-white p-12 text-center text-[#5d7497]">
          No ads in this category yet.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Link
              key={c.id}
              href={`/classifieds/${c.id}`}
              className="group overflow-hidden rounded-2xl border border-[#e4ebf5] bg-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className="relative h-44 bg-[#f5f8fd]">
                {c.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.photos[0]} alt={c.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#9aabb9]">No photo</div>
                )}
                {c.tier === "FEATURED" && (
                  <span className="absolute left-3 top-3 rounded-full bg-[#A07C3A] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow">
                    Featured
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="mb-1 font-black text-[#1B3A6B] group-hover:underline">{c.title}</h3>
                <p className="mb-2 line-clamp-2 text-sm text-[#5d7497]">{c.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-[#A07C3A]">{formatPrice(c)}</span>
                  <span className="text-xs text-[#9aabb9]">
                    {c.town ? `${c.town}, ` : ""}
                    {c.province}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
