-- Subscription and Payment are new this change and hold per-user financial
-- data, so they get the same RLS treatment as Order/DeviceToken (scoped by
-- app.current_user_id, matching src/lib/tenant-prisma.ts's withUserContext).
-- SubscriptionPlan/PlatformFee are global catalog data (like MarketingPackage)
-- and intentionally get no RLS — they're public read, admin-only write via
-- application-level checks only.
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "Subscription";
CREATE POLICY tenant_isolation ON "Subscription"
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR "userId" = current_setting('app.current_user_id', true)
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR "userId" = current_setting('app.current_user_id', true)
  );

ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "Payment";
CREATE POLICY tenant_isolation ON "Payment"
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR "userId" = current_setting('app.current_user_id', true)
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR "userId" = current_setting('app.current_user_id', true)
  );
