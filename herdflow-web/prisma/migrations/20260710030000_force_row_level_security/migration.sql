-- Migration: FORCE Row-Level Security on every tenant-scoped table.
--
-- This is the actual cutover: until now, RLS was ENABLEd with policies but
-- not FORCEd, so the app's DB role (which owns these tables) bypassed RLS
-- entirely — a safe no-op used to verify every route handler was already
-- wrapped with src/lib/tenant-prisma.ts. From this point on, RLS applies to
-- every query, including from the owning role, and only queries that set the
-- correct app.current_*_id / app.bypass_rls session variable will see rows.
--
-- Rollback (if anything breaks): run, per table,
--   ALTER TABLE "<Name>" NO FORCE ROW LEVEL SECURITY;
-- which instantly reverts to the enabled-but-not-forced (safe) state.

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'FarmerAnimal', 'FarmerHealthRecord', 'FarmerTransaction', 'FarmerWeightRecord',
    'FarmerVaccination', 'FarmerCamp', 'FarmerCampCount', 'FarmerCampMovement',
    'FarmerMedicine', 'FarmerTreatment', 'ContentView', 'ContentDismissal',
    'FarmerActivityLog', 'DeviceToken', 'SellerPayout', 'LogisticsPayout',
    'Order', 'Product', 'Listing', 'DeliveryRequest'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
