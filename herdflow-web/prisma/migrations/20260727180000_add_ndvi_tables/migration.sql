-- Copernicus/Sentinel-2 NDVI pasture advisory: config table + historical
-- readings table. See src/lib/ndvi.ts (added alongside this migration) for
-- how both are used.

-- ── NdviThresholdConfig ──────────────────────────────────────────────────────
-- Global/admin-managed, NOT farmer-scoped -- same convention as PlatformFee/
-- ExpenseCategory (no RLS, admin-only write enforced at the application
-- layer). A real table instead of a hardcoded map (unlike
-- complianceConfig.ts) because these thresholds must be admin-adjustable
-- without a redeploy.
CREATE TABLE "NdviThresholdConfig" (
    "id"                  TEXT NOT NULL,
    "livestockType"       TEXT,
    "countryCode"         TEXT,
    "poorMax"             DECIMAL(3,2) NOT NULL DEFAULT 0.20,
    "moderateMax"         DECIMAL(3,2) NOT NULL DEFAULT 0.40,
    "goodMax"             DECIMAL(3,2) NOT NULL DEFAULT 0.60,
    "refreshIntervalDays" INTEGER NOT NULL DEFAULT 5,
    "isActive"            BOOLEAN NOT NULL DEFAULT true,
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NdviThresholdConfig_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NdviThresholdConfig_livestockType_countryCode_idx" ON "NdviThresholdConfig"("livestockType", "countryCode");

-- Seed the one global default row (livestockType/countryCode both NULL) --
-- 0.20/0.40/0.60 bands and 5-day refresh interval as approved.
INSERT INTO "NdviThresholdConfig" ("id", "livestockType", "countryCode", "poorMax", "moderateMax", "goodMax", "refreshIntervalDays", "isActive", "createdAt", "updatedAt")
VALUES ('ndvi-threshold-global-default', NULL, NULL, 0.20, 0.40, 0.60, 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ── FarmerCampNdviReading ────────────────────────────────────────────────────
-- Farmer-scoped -- RLS applied directly with FORCE (unlike the historical
-- two-step ENABLE-then-FORCE rollout other tables needed), since this table
-- is brand new: there's no existing unwrapped route reading/writing it yet,
-- so there's no transition period to protect.
CREATE TABLE "FarmerCampNdviReading" (
    "id"                 TEXT NOT NULL,
    "farmerId"           TEXT NOT NULL,
    "campId"             TEXT NOT NULL,
    "ndvi"               DECIMAL(4,3) NOT NULL,
    "score10"            INTEGER NOT NULL,
    "interpretation"     TEXT NOT NULL,
    "thresholdConfigId"  TEXT,
    "satellitePassDate"  TIMESTAMP(3) NOT NULL,
    "fetchedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "thumbnailUrl"       TEXT,
    "aiAdvisory"         TEXT,
    "aiAdvisoryPriority" TEXT,
    "aiAdvisoryAt"       TIMESTAMP(3),
    "isDeleted"          BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FarmerCampNdviReading_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FarmerCampNdviReading_farmerId_idx" ON "FarmerCampNdviReading"("farmerId");
CREATE INDEX "FarmerCampNdviReading_campId_satellitePassDate_idx" ON "FarmerCampNdviReading"("campId", "satellitePassDate");

ALTER TABLE "FarmerCampNdviReading" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "FarmerCampNdviReading"
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR "farmerId" = current_setting('app.current_farmer_id', true)
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR "farmerId" = current_setting('app.current_farmer_id', true)
  );
ALTER TABLE "FarmerCampNdviReading" FORCE ROW LEVEL SECURITY;
