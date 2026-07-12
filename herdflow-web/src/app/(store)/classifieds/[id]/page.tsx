import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { withAdminContext } from "@/lib/tenant-prisma";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  FARM_EQUIPMENT: "Farm Equipment",
  FARM_JOBS: "Farm Job",
  GRAZING_LAND: "Grazing & Land",
  WANTED: "Wanted",
};

function formatPrice(price: unknown, priceType: string) {
  if (priceType === "POA") return "Price on Application";
  const num = price ? Number(price) : null;
  if (priceType === "NEGOTIABLE") return num ? `R${num.toLocaleString("en-ZA")} (Negotiable)` : "Negotiable";
  return num ? `R${num.toLocaleString("en-ZA")}` : "—";
}

export default async function ClassifiedDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const classified = await prisma.classified.findUnique({
    where: { id },
    include: { poster: { select: { fullName: true } } },
  });

  if (!classified || classified.status !== "ACTIVE") notFound();

  await withAdminContext((tx) =>
    tx.classified.update({ where: { id }, data: { views: { increment: 1 } } }),
  ).catch(() => {});

  const photos = Array.isArray(classified.photos) ? (classified.photos as string[]) : [];

  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/classifieds" className="mb-4 inline-block text-sm text-[#1B3A6B] hover:underline">
          ← Back to Classifieds
        </Link>

        <div className="overflow-hidden rounded-2xl border border-[#e4ebf5] bg-white shadow-xl">
          <div className="relative h-72 bg-[#f5f8fd]">
            {photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photos[0]} alt={classified.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-[#9aabb9]">No photo</div>
            )}
            {classified.tier === "FEATURED" && (
              <span className="absolute left-4 top-4 rounded-full bg-[#A07C3A] px-4 py-1.5 text-xs font-black uppercase tracking-wide text-white shadow">
                Featured
              </span>
            )}
          </div>

          <div className="p-6 md:p-8">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#A07C3A]">
              {CATEGORY_LABELS[classified.category]}
            </p>
            <h1 className="mb-2 text-2xl font-black text-[#1B3A6B] md:text-3xl">{classified.title}</h1>
            <p className="mb-4 text-xl font-bold text-[#2E7D32]">
              {formatPrice(classified.price, classified.priceType)}
            </p>

            <div className="mb-6 grid gap-3 text-sm text-[#5d7497] sm:grid-cols-2">
              <p>
                <span className="font-semibold text-[#244367]">Location:</span>{" "}
                {classified.town ? `${classified.town}, ` : ""}
                {classified.province}
              </p>
              {classified.jobType && (
                <p>
                  <span className="font-semibold text-[#244367]">Job Type:</span> {classified.jobType}
                </p>
              )}
              {classified.hectares && (
                <p>
                  <span className="font-semibold text-[#244367]">Size:</span>{" "}
                  {Number(classified.hectares).toLocaleString("en-ZA")} ha
                </p>
              )}
              {classified.availableFrom && (
                <p>
                  <span className="font-semibold text-[#244367]">Available From:</span>{" "}
                  {classified.availableFrom.toLocaleDateString("en-ZA")}
                </p>
              )}
            </div>

            <p className="mb-6 whitespace-pre-line text-[#38537a]">{classified.description}</p>

            <div className="mb-6 flex flex-wrap gap-3">
              <a
                href={`tel:${classified.contactPhone}`}
                className="rounded-lg bg-[#1B3A6B] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#122844]"
              >
                Call {classified.contactPhone}
              </a>
              {classified.contactWhatsApp && (
                <a
                  href={`https://wa.me/${classified.contactWhatsApp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-[#2E7D32] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20]"
                >
                  WhatsApp
                </a>
              )}
            </div>

            <div className="rounded-lg border border-[#e4ebf5] bg-[#f5f8fd] p-4 text-xs leading-relaxed text-[#5d7497]">
              All transactions are concluded directly between the parties. HerdFlow is an
              advertising platform only.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
