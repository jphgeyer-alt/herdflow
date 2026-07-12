import type { Metadata } from "next";
import Link from "next/link";
import { ClassifiedsClient } from "./classifieds-client";

export const metadata: Metadata = {
  title: "Classifieds | HerdFlow",
  description: "Farm equipment, jobs, grazing & land, and wanted ads from farmers across South Africa.",
};

export const dynamic = "force-dynamic";

export default function ClassifiedsPage() {
  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      <div className="bg-linear-to-br from-[#1B3A6B] to-[#122844] px-4 py-16 text-center text-white md:px-8">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#A07C3A]">
          Classifieds
        </p>
        <h1 className="mb-4 text-3xl font-black sm:text-5xl">Farm Equipment, Jobs &amp; Land</h1>
        <p className="mx-auto mb-6 max-w-2xl text-lg leading-relaxed text-white/80">
          Buy, sell, hire, and find opportunities — posted directly by farmers.
        </p>
        <Link
          href="/classifieds/new"
          className="inline-block rounded-lg bg-[#2E7D32] px-8 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20]"
        >
          + Post an Ad
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <ClassifiedsClient />
      </div>
    </div>
  );
}
