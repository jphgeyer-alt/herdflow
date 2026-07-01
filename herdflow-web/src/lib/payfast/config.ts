import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export type PayFastConfig = {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  processUrl: string;
};

const PAYFAST_KEYS = ["payfast_merchant_id", "payfast_merchant_key", "payfast_passphrase"] as const;

function normalizeProcessUrl(value?: string) {
  if (value && value.trim()) return value.trim();
  return "https://sandbox.payfast.co.za/eng/process";
}

export async function getPayFastConfig(): Promise<PayFastConfig> {
  let configMap = new Map<string, string>();

  try {
    const rows = await prisma.siteConfig.findMany({
      where: { key: { in: [...PAYFAST_KEYS] } },
      select: { key: true, value: true },
    });
    configMap = new Map(rows.map((row) => [row.key, row.value]));
  } catch {
    // Fallback to env if DB settings are unavailable.
  }

  return {
    merchantId: (configMap.get("payfast_merchant_id") || env.PAYFAST_MERCHANT_ID || "").trim(),
    merchantKey: (configMap.get("payfast_merchant_key") || env.PAYFAST_MERCHANT_KEY || "").trim(),
    passphrase: (configMap.get("payfast_passphrase") || env.PAYFAST_PASSPHRASE || "").trim(),
    processUrl: normalizeProcessUrl(env.PAYFAST_PROCESS_URL),
  };
}
