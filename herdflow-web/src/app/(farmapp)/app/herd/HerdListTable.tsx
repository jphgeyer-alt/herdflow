"use client";
// WEBSITE — herdflow-web/src/app/(farmapp)/app/herd/HerdListTable.tsx
// Species filter + name/tag/breed search, all client-side since the full
// herd is already loaded (mirrors mobile HerdScreen), paginated 20/page.
import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/farm/Card";
import { Pagination } from "@/components/farm/Pagination";
import { formatWeight } from "@/lib/farm-finance/format";

const PAGE_SIZE = 20;

export interface AnimalRow {
  id: string;
  name: string | null;
  tagNumber: string | null;
  species: string;
  breed: string | null;
  gender: string | null;
  status: string;
  healthStatus: string;
  weight: number | null;
}

function speciesLabelKey(species: string): string {
  return `species_${species.toLowerCase()}`;
}

export function HerdListTable({ animals }: { animals: AnimalRow[] }) {
  const t = useTranslations("herd");
  const [search, setSearch] = useState("");
  const [species, setSpecies] = useState("all");
  const [page, setPage] = useState(1);

  const speciesOptions = useMemo(
    () => Array.from(new Set(animals.map((a) => a.species))).sort(),
    [animals],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return animals.filter((a) => {
      if (species !== "all" && a.species !== species) return false;
      if (!q) return true;
      return (
        (a.name?.toLowerCase().includes(q) ?? false) ||
        (a.tagNumber?.toLowerCase().includes(q) ?? false) ||
        (a.breed?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [animals, search, species]);

  // Reset to page 1 whenever the filters produce a new result set --
  // adjusting state during render (React's documented escape hatch for
  // this exact case) instead of a useEffect, which would cause an extra
  // commit and trip the react-hooks/set-state-in-effect rule.
  const [prevFilterKey, setPrevFilterKey] = useState(`${search}|${species}`);
  const filterKey = `${search}|${species}`;
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-navy-100 bg-white p-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search_placeholder")}
          className="min-w-[220px] flex-1 rounded-lg border border-navy-100 px-3 py-1.5 text-sm text-navy-600"
        />
        <select
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          className="rounded-lg border border-navy-100 px-3 py-1.5 text-sm text-navy-500"
        >
          <option value="all">{t("all_species")}</option>
          {speciesOptions.map((s) => (
            <option key={s} value={s}>
              {t(speciesLabelKey(s))}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-navy-100 bg-white p-6 text-center text-sm text-navy-300">
          {animals.length === 0 ? t("no_animals_yet") : t("no_animals_filtered")}
        </p>
      ) : (
        <div className="rounded-lg border border-navy-100 bg-white">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-50 text-xs font-semibold tracking-wide text-navy-300 uppercase">
                <th className="px-4 py-2 text-left">{t("name")}</th>
                <th className="px-4 py-2 text-left">{t("tag")}</th>
                <th className="px-4 py-2 text-left">{t("species")}</th>
                <th className="px-4 py-2 text-left">{t("breed")}</th>
                <th className="px-4 py-2 text-left">{t("weight")}</th>
                <th className="px-4 py-2 text-left">{t("health_status")}</th>
                <th className="px-4 py-2 text-left">{t("status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {pageItems.map((a) => (
                <tr key={a.id} className="hover:bg-navy-25">
                  <td className="px-4 py-2.5">
                    <Link href={`/app/herd/${a.id}`} className="font-medium text-navy-600 hover:underline">
                      {a.name || "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-navy-500">{a.tagNumber || "—"}</td>
                  <td className="px-4 py-2.5 text-navy-500">{t(speciesLabelKey(a.species))}</td>
                  <td className="px-4 py-2.5 text-navy-500">{a.breed || "—"}</td>
                  <td className="px-4 py-2.5 text-navy-500">{formatWeight(a.weight)}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={a.healthStatus === "HEALTHY" ? "success" : "danger"}>
                      {t(`health_${a.healthStatus.toLowerCase()}`)}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={a.status === "ACTIVE" ? "success" : "neutral"}>
                      {t(`status_${a.status.toLowerCase()}`)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={setPage}
            itemLabel={t("animals_label")}
          />
        </div>
      )}
    </div>
  );
}
