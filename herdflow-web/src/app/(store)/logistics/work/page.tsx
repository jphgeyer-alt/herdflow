import { redirect } from "next/navigation";
import Link from "next/link";
import { MapPin, Package, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getApprovedLogisticsPartner } from "@/lib/logistics-auth";
import { formatRand } from "@/lib/marketing/format";

export const dynamic = "force-dynamic";

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function LogisticsWorkPage() {
  const partner = await getApprovedLogisticsPartner();
  if (!partner) {
    redirect("/auth/login");
  }

  // Simple substring match against the partner's free-text routes-covered
  // field — sufficient at this scale, no geocoding required.
  const routes = partner.routesCovered
    .split(",")
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean);

  let openJobs: Awaited<ReturnType<typeof prisma.deliveryRequest.findMany>> = [];
  try {
    const allOpen = await prisma.deliveryRequest.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
    });
    openJobs =
      routes.length === 0
        ? allOpen
        : allOpen.filter((job) => {
            const pickup = job.pickupRegion.toLowerCase();
            const dropoff = job.dropoffRegion.toLowerCase();
            return routes.some(
              (r) =>
                pickup.includes(r) ||
                dropoff.includes(r) ||
                r.includes(pickup) ||
                r.includes(dropoff),
            );
          });
  } catch {
    openJobs = [];
  }

  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      <div className="bg-[#1B3A6B] px-4 py-12 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-2 text-4xl font-black">Available Work</h1>
          <p className="text-lg text-white/80">
            Open delivery requests matching your routes ({partner.routesCovered})
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-4 px-4 py-12 md:px-8">
        <Link
          href="/dashboard/logistics"
          className="text-sm font-semibold text-[#1B3A6B] hover:underline"
        >
          ← Back to Dashboard
        </Link>

        {openJobs.length === 0 ? (
          <div className="rounded-2xl border border-[#e4ebf5] bg-white p-12 text-center shadow-lg">
            <Package size={64} className="mx-auto mb-4 text-[#cdd8e7]" />
            <p className="text-lg text-[#5d7497]">
              No open jobs currently match your routes. Check back soon.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {openJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-xl border border-[#e4ebf5] bg-white p-6 shadow-lg"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xl font-black text-[#244367]">{job.number}</p>
                    <div className="flex items-center gap-2 text-sm text-[#5d7497]">
                      <MapPin size={16} className="text-[#2E7D32]" />
                      <span>
                        <strong>Pickup:</strong> {job.pickupAddress} ({job.pickupRegion})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#5d7497]">
                      <MapPin size={16} className="text-[#1B3A6B]" />
                      <span>
                        <strong>Dropoff:</strong> {job.dropoffAddress} ({job.dropoffRegion})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#5d7497]">
                      <Package size={16} />
                      <span>{job.cargoDescription}</span>
                    </div>
                    {job.neededBy && (
                      <div className="flex items-center gap-2 text-sm text-[#5d7497]">
                        <Calendar size={16} />
                        <span>Needed by {formatDate(job.neededBy)}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 text-right">
                    <p className="text-2xl font-black text-[#2E7D32]">
                      {formatRand(job.priceCents / 100)}
                    </p>
                    <Link
                      href={`/logistics/routes/${job.id}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#1B3A6B] px-6 py-2 text-sm font-bold text-white transition hover:bg-[#122844]"
                    >
                      View & Claim
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
