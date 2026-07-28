import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Caps Prisma's connection pool -- DATABASE_URL already carries ?sslmode=require,
// so a fixed separator would produce a second, invalid "?" in the URL; this
// picks "&" or "?" based on whether one is already present. Render Postgres
// is on the Basic-256MB plan (connection limit ~97-100); without a cap, many
// static pages independently touching Prisma during `next build` can rack up
// enough connections between them to intermittently exhaust it.
function withConnectionLimit(url: string): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}connection_limit=3&pool_timeout=10`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
    datasources: {
      db: {
        url: withConnectionLimit(process.env.DATABASE_URL ?? ""),
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
