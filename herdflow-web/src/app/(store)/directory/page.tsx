import type { Metadata } from "next";
import { DirectoryClient } from "./directory-client";

export const metadata: Metadata = {
  title: "Services Directory | HerdFlow",
  description: "Find trusted vets, shearers, fencing contractors, borehole drillers, and more.",
};

export const dynamic = "force-dynamic";

export default function DirectoryPage() {
  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      <div className="bg-linear-to-br from-[#1B3A6B] to-[#122844] px-4 py-16 text-center text-white md:px-8">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#A07C3A]">
          Services Directory
        </p>
        <h1 className="mb-4 text-3xl font-black sm:text-5xl">Find Trusted Farm Services</h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/80">
          Vets, shearers, fencing contractors, borehole drillers, and more — verified providers
          across South Africa.
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <DirectoryClient />
      </div>
    </div>
  );
}
