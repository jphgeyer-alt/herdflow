"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonClass } from "./button-styles";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  /**
   * Server-rendered link mode: base path/query to page from, e.g.
   * "/admin/activity" or "/admin/customers?role=ADMIN". The page number is
   * appended as a `page` query param. A plain string (not a callback) so
   * this can be rendered from a Server Component without crossing the
   * server/client boundary with a function prop.
   */
  basePath?: string;
  /** Client-managed mode: called instead of navigating. */
  onPageChange?: (page: number) => void;
};

function hrefForPage(basePath: string, page: number): string {
  const [path, query] = basePath.split("?");
  const params = new URLSearchParams(query);
  params.set("page", String(page));
  return `${path}?${params.toString()}`;
}

export function Pagination({ page, pageSize, total, basePath, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  const btnClass = buttonClass("outline", "sm");

  function icon(dir: "prev" | "next") {
    return dir === "prev" ? <ChevronLeft size={14} /> : <ChevronRight size={14} />;
  }

  const prevButton = prevDisabled ? (
    <span className={`${btnClass} opacity-40`}>{icon("prev")}</span>
  ) : basePath ? (
    <Link className={btnClass} href={hrefForPage(basePath, page - 1)}>
      {icon("prev")}
    </Link>
  ) : (
    <button className={btnClass} onClick={() => onPageChange?.(page - 1)} type="button">
      {icon("prev")}
    </button>
  );

  const nextButton = nextDisabled ? (
    <span className={`${btnClass} opacity-40`}>{icon("next")}</span>
  ) : basePath ? (
    <Link className={btnClass} href={hrefForPage(basePath, page + 1)}>
      {icon("next")}
    </Link>
  ) : (
    <button className={btnClass} onClick={() => onPageChange?.(page + 1)} type="button">
      {icon("next")}
    </button>
  );

  return (
    <div className="flex items-center justify-between border-t border-navy-50 px-4 py-3 text-sm text-navy-300">
      <span>
        Showing <span className="font-semibold text-navy-500">{from}</span>–
        <span className="font-semibold text-navy-500">{to}</span> of{" "}
        <span className="font-semibold text-navy-500">{total}</span>
      </span>
      <div className="flex items-center gap-2">
        {prevButton}
        <span className="px-2 text-xs font-semibold text-navy-500">
          Page {page} of {totalPages}
        </span>
        {nextButton}
      </div>
    </div>
  );
}
