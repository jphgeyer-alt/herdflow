import { prisma } from "@/lib/prisma";
import { AdminListingsManager } from "./listings-manager";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const [listings, sellers, categories] = await Promise.all([
      prisma.listing.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          breed: true,
          region: true,
          priceCents: true,
          weightKg: true,
          ageMonths: true,
          photos: true,
          status: true,
          isFeatured: true,
          isDeleted: true,
          deletedAt: true,
          deletedBy: true,
          deleteReason: true,
          createdAt: true,
          category: { select: { id: true, name: true } },
          seller: {
            select: {
              id: true,
              farmName: true,
              location: true,
              status: true,
              user: { select: { email: true, phone: true } },
            },
          },
        },
      }),
      prisma.seller.findMany({
        orderBy: { farmName: "asc" },
        select: { id: true, farmName: true, status: true },
      }),
      prisma.category.findMany({
        where: { kind: { in: ["LIVESTOCK", "BOTH"] } },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);
    return { listings, sellers, categories };
  } catch {
    return { listings: [], sellers: [], categories: [] };
  }
}

export default async function AdminListingsPage() {
  const { listings, sellers, categories } = await getData();

  return (
    <main className="pb-10 space-y-6">
      <AdminListingsManager
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialListings={listings as any}
        sellers={sellers}
        categories={categories}
      />
    </main>
  );
}
