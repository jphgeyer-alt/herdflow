-- FarmerBreedingRecord was added after the original RLS rollout
-- (20260710020000_add_row_level_security / 20260710030000_force_row_level_security)
-- so it was never covered. Enable AND force immediately — no separate
-- transitional window needed since the route code was written from the
-- start using withFarmerContext().
ALTER TABLE "FarmerBreedingRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FarmerBreedingRecord" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "FarmerBreedingRecord";
CREATE POLICY tenant_isolation ON "FarmerBreedingRecord"
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR "farmerId" = current_setting('app.current_farmer_id', true)
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR "farmerId" = current_setting('app.current_farmer_id', true)
  );
