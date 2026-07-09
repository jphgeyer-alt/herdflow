import { prisma } from "@/lib/prisma";
import { LogisticsManager } from "./logistics-manager";

export const dynamic = "force-dynamic";

async function getPartners() {
  try {
    return await prisma.logisticsPartner.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { fullName: true, email: true } } },
    });
  } catch {
    return [];
  }
}

export default async function AdminLogisticsPage() {
  const partners = await getPartners();

  return (
    <main className="space-y-4 pb-10">
      <p className="text-sm text-[#38537a]">
        Review and approve transport companies. Only approved partners are eligible for delivery
        coordination.
      </p>
      <LogisticsManager initialPartners={partners} />
    </main>
  );
}
