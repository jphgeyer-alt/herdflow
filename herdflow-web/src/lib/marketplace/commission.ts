import { prisma } from "@/lib/prisma";

const COMMISSION_RATE_KEY = "commission_rate";
const DEFAULT_COMMISSION_RATE = 0.05;

/**
 * Single source of truth for the platform commission rate — admin-editable
 * at /admin/settings/payments, stored in SiteConfig like the PayFast
 * credentials. Falls back to 5% if never set.
 */
export async function getCommissionRate(): Promise<number> {
  try {
    const row = await prisma.siteConfig.findUnique({ where: { key: COMMISSION_RATE_KEY } });
    if (!row) return DEFAULT_COMMISSION_RATE;
    const rate = parseFloat(row.value);
    return Number.isFinite(rate) && rate >= 0 && rate <= 1 ? rate : DEFAULT_COMMISSION_RATE;
  } catch {
    return DEFAULT_COMMISSION_RATE;
  }
}
