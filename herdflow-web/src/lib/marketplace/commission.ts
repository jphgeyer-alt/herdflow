import { prisma } from "@/lib/prisma";
import { randToCents } from "@/lib/money";

const COMMISSION_RATE_KEY = "commission_rate";
const DEFAULT_COMMISSION_RATE = 0.05;

const LOGISTICS_COMMISSION_RATE_KEY = "logistics_commission_rate";
const DEFAULT_LOGISTICS_COMMISSION_RATE = 0.04;

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

/**
 * Commission rate for logistics/delivery jobs — kept separate from the
 * product-sale commission since freight-broker economics differ. Falls
 * back to 10% if never set.
 */
export async function getLogisticsCommissionRate(): Promise<number> {
  try {
    const row = await prisma.siteConfig.findUnique({
      where: { key: LOGISTICS_COMMISSION_RATE_KEY },
    });
    if (!row) return DEFAULT_LOGISTICS_COMMISSION_RATE;
    const rate = parseFloat(row.value);
    return Number.isFinite(rate) && rate >= 0 && rate <= 1
      ? rate
      : DEFAULT_LOGISTICS_COMMISSION_RATE;
  } catch {
    return DEFAULT_LOGISTICS_COMMISSION_RATE;
  }
}

const VAT_ENABLED_KEY = "vat_enabled";
const VAT_RATE_BPS_KEY = "vat_rate";
const DEFAULT_VAT_RATE_BPS = 1500; // 15% South African VAT

/**
 * VAT tracking, off by default — HerdFlow isn't VAT-registered yet.
 * Admin-editable at /admin/settings/payments, stored in SiteConfig like the
 * commission rates. Flipping vat_enabled on only affects payments/invoices
 * going forward and report figures computed from vatRateBps going forward —
 * it never retroactively assigns VAT to historical rows (see
 * Payment.vatRateBps / Invoice.vatRateBps).
 */
export async function getVatConfig(): Promise<{ enabled: boolean; rateBps: number }> {
  try {
    const [enabledRow, rateRow] = await Promise.all([
      prisma.siteConfig.findUnique({ where: { key: VAT_ENABLED_KEY } }),
      prisma.siteConfig.findUnique({ where: { key: VAT_RATE_BPS_KEY } }),
    ]);
    const enabled = enabledRow?.value === "true";
    const rateBps = rateRow ? parseInt(rateRow.value, 10) : DEFAULT_VAT_RATE_BPS;
    return {
      enabled,
      rateBps: Number.isFinite(rateBps) && rateBps >= 0 && rateBps <= 10000 ? rateBps : DEFAULT_VAT_RATE_BPS,
    };
  } catch {
    return { enabled: false, rateBps: DEFAULT_VAT_RATE_BPS };
  }
}

/**
 * Shared by the P&L report and the revenue CSV export so the VAT-inclusive
 * vs VAT-exclusive math can't drift between the two places it's computed.
 * Returns 0 for rows with no vatRateBps set (untracked), never treats a
 * missing rate as 0% VAT.
 */
export function calculateVatCents(
  amountRand: number,
  vatRateBps: number | null,
  vatInclusive: boolean,
): number {
  if (!vatRateBps) return 0;
  const amountCents = randToCents(amountRand);
  const rate = vatRateBps / 10000;
  return vatInclusive
    ? Math.round(amountCents * (rate / (1 + rate)))
    : Math.round(amountCents * rate);
}
