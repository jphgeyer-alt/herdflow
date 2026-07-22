-- Migration: close a Row-Level Security gap on three farmer-scoped tables
-- that were added after the original add_row_level_security /
-- force_row_level_security migrations and were never included in either:
-- FarmerFeedLog (existed but was never wired into RLS), FarmerAnimalEvent
-- and FarmerNutritionItem (both new). Every route touching these three
-- tables already uses withFarmerContext exclusively (verified — no raw
-- `prisma` client access anywhere), so this goes straight to ENABLE +
-- POLICY + FORCE in one migration rather than the original two-step
-- rollout (which existed specifically to verify that precondition over
-- time — already true here).
--
-- Rollback (if anything breaks): run, per table,
--   ALTER TABLE "<Name>" NO FORCE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'FarmerFeedLog', 'FarmerAnimalEvent', 'FarmerNutritionItem'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         USING (current_setting(''app.bypass_rls'', true) = ''on'' OR "farmerId" = current_setting(''app.current_farmer_id'', true))
         WITH CHECK (current_setting(''app.bypass_rls'', true) = ''on'' OR "farmerId" = current_setting(''app.current_farmer_id'', true))',
      t
    );
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
