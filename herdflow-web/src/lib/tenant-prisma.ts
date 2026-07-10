// Wraps Prisma queries in a transaction that sets a Postgres session variable
// before running them, so Row-Level Security policies (see the
// add_row_level_security migrations) can enforce tenant isolation at the
// database level — not just via application-code WHERE clauses.
//
// set_config()'s value argument is a bound parameter, not raw SQL text, so
// this is injection-safe even though the key names are interpolated (the key
// names below are fixed string literals, never derived from user input).

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

async function withContext<T>(
  vars: Array<[string, string]>,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    for (const [key, value] of vars) {
      await tx.$executeRaw`SELECT set_config(${key}, ${value}, true)`;
    }
    return fn(tx);
  });
}

export const withFarmerContext = <T>(farmerId: string, fn: (tx: Tx) => Promise<T>) =>
  withContext([["app.current_farmer_id", farmerId]], fn);

export const withSellerContext = <T>(sellerId: string, fn: (tx: Tx) => Promise<T>) =>
  withContext([["app.current_seller_id", sellerId]], fn);

export const withLogisticsContext = <T>(logisticsPartnerId: string, fn: (tx: Tx) => Promise<T>) =>
  withContext([["app.current_logistics_partner_id", logisticsPartnerId]], fn);

export const withUserContext = <T>(userId: string, fn: (tx: Tx) => Promise<T>) =>
  withContext([["app.current_user_id", userId]], fn);

/**
 * Bypasses tenant-scoped RLS policies entirely. ONLY call this from code
 * already gated by isValidAdminSession() — never derive the decision to call
 * this from client-supplied input.
 */
export const withAdminContext = <T>(fn: (tx: Tx) => Promise<T>) =>
  withContext([["app.bypass_rls", "on"]], fn);
