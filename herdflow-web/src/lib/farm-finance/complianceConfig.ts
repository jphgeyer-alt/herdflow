// WEBSITE — herdflow-web/src/lib/farm-finance/complianceConfig.ts
// G8: per-country regulatory/compliance parameters. Mirrors
// herdflow-app/src/config/complianceConfig.ts exactly. "ZA" matches today's
// hardcoded 15% VAT rate exactly (zero behavior change) --
// getComplianceConfig() with no argument returns it. vatLabel and
// traceabilityRegistryName are prepared for later per-country reference
// work but aren't wired into any page yet.
export interface ComplianceConfig {
  vatLabel: string;
  vatRate: number;
  traceabilityRegistryName: string | null;
}

const COMPLIANCE_CONFIG_BY_COUNTRY: Record<string, ComplianceConfig> = {
  ZA: { vatLabel: "VAT", vatRate: 0.15, traceabilityRegistryName: "RMIS" },
  KE: { vatLabel: "VAT", vatRate: 0.16, traceabilityRegistryName: null },
};

export function getComplianceConfig(countryCode: string = "ZA"): ComplianceConfig {
  return COMPLIANCE_CONFIG_BY_COUNTRY[countryCode] ?? COMPLIANCE_CONFIG_BY_COUNTRY.ZA;
}
