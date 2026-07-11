import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Package, Calendar, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getApprovedLogisticsPartner } from "@/lib/logistics-auth";
import { formatRand } from "@/lib/marketing/format";
import { withLogisticsContext } from "@/lib/tenant-prisma";
import { ClaimButton, StatusButton } from "./route-actions";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const STATUS_STEPS = ["OPEN", "ASSIGNED", "IN_TRANSIT", "DELIVERED"] as const;

export default async function LogisticsRouteDetailPage({ params }: PageProps) {
  const { id } = await params;

  const partner = await getApprovedLogisticsPartner();
  if (!partner) {
    redirect("/auth/login");
  }

  const job = await withLogisticsContext(partner.id, (tx) =>
    tx.deliveryRequest.findUnique({ where: { id } }),
  );
  if (!job) {
    notFound();
  }

  const isMine = job.logisticsPartnerId === partner.id;
  const stepIndex = Math.max(0, STATUS_STEPS.indexOf(job.status as (typeof STATUS_STEPS)[number]));

  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      <div className="bg-[#1B3A6B] px-4 py-12 text-white md:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-2 text-4xl font-black">{job.number}</h1>
          <p className="text-lg text-white/80">{job.cargoDescription}</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-12 md:px-8">
        <Link
          href="/logistics/work"
          className="text-sm font-semibold text-[#1B3A6B] hover:underline"
        >
          ← Back to Available Work
        </Link>

        <div className="rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg">
          <div className="mb-4 grid gap-3 sm:grid-cols-4">
            {STATUS_STEPS.map((step, index) => {
              const done = index <= stepIndex && job.status !== "CANCELLED";
              return (
                <div key={step} className="space-y-1">
                  <div className={`h-2 rounded-full ${done ? "bg-[#2E7D32]" : "bg-[#e4ebf5]"}`} />
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${done ? "text-[#1B3A6B]" : "text-[#9aabb9]"}`}
                  >
                    {step}
                  </p>
                </div>
              );
            })}
          </div>
          {job.status === "CANCELLED" && (
            <p className="text-sm font-semibold text-red-600">
              This delivery request was cancelled.
            </p>
          )}
        </div>

        <div className="grid gap-4 rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg">
          <div className="flex items-center gap-3 text-sm text-[#38537a]">
            <MapPin size={18} className="text-[#2E7D32]" />
            <span>
              <strong>Pickup:</strong> {job.pickupAddress} ({job.pickupRegion})
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-[#38537a]">
            <MapPin size={18} className="text-[#1B3A6B]" />
            <span>
              <strong>Dropoff:</strong> {job.dropoffAddress} ({job.dropoffRegion})
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-[#38537a]">
            <Package size={18} />
            <span>{job.cargoDescription}</span>
          </div>
          {job.neededBy && (
            <div className="flex items-center gap-3 text-sm text-[#38537a]">
              <Calendar size={18} />
              <span>Needed by {formatDate(job.neededBy)}</span>
            </div>
          )}
          {job.notes && <p className="text-sm text-[#5d7497]">Notes: {job.notes}</p>}
          <p className="pt-2 text-2xl font-black text-[#2E7D32]">
            {job.priceCents != null ? formatRand(job.priceCents / 100) : "Quote pending"}
          </p>
        </div>

        <div className="rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg">
          {job.status === "OPEN" && <ClaimButton requestId={job.id} />}

          {isMine && job.status === "ASSIGNED" && (
            <StatusButton requestId={job.id} nextStatus="IN_TRANSIT" label="Mark Picked Up" />
          )}

          {isMine && job.status === "IN_TRANSIT" && (
            <StatusButton requestId={job.id} nextStatus="DELIVERED" label="Mark Delivered" />
          )}

          {job.status === "DELIVERED" && (
            <div className="flex items-center gap-2 text-[#2E7D32]">
              <CheckCircle2 size={20} />
              <span className="font-semibold">
                Delivered {job.deliveredAt && formatDate(job.deliveredAt)}
              </span>
            </div>
          )}

          {!isMine && (job.status === "ASSIGNED" || job.status === "IN_TRANSIT") && (
            <p className="text-sm text-[#5d7497]">This job has been claimed by another partner.</p>
          )}
        </div>
      </div>
    </div>
  );
}
