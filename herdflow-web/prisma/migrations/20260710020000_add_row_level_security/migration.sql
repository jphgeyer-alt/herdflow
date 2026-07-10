-- Migration: enable Postgres Row-Level Security on every tenant-scoped table.
--
-- IMPORTANT: this migration only ENABLEs RLS and creates policies — it does
-- NOT run FORCE ROW LEVEL SECURITY. Table owners bypass RLS by default unless
-- FORCE is also applied, and the app's DB role owns every table it migrated
-- into existence, so this step is a safe no-op for all existing (as-yet
-- unwrapped) queries. FORCE ships in a later, separate migration once every
-- route handler has been updated to use src/lib/tenant-prisma.ts.
--
-- app.bypass_rls is only ever set server-side by withAdminContext() (see
-- src/lib/tenant-prisma.ts), gated behind isValidAdminSession() — never
-- derived from client input.
--
-- current_setting(key, true) returns '' when the variable was never set for
-- the current transaction, which always fails the equality check below —
-- i.e. "no tenant context set" safely defaults to deny, not allow.

-- ── Fully private tables (farm data) ─────────────────────────────────────────
-- Pattern: USING + WITH CHECK, same for both, comparing "farmerId" against
-- app.current_farmer_id.

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'FarmerAnimal', 'FarmerHealthRecord', 'FarmerTransaction', 'FarmerWeightRecord',
    'FarmerVaccination', 'FarmerCamp', 'FarmerCampCount', 'FarmerCampMovement',
    'FarmerMedicine', 'FarmerTreatment', 'ContentView', 'ContentDismissal'
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
  END LOOP;
END $$;

-- FarmerActivityLog is scoped by "farmId" (the farm the activity happened on,
-- so every team member can see it), not by the acting "userId".
ALTER TABLE "FarmerActivityLog" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "FarmerActivityLog";
CREATE POLICY tenant_isolation ON "FarmerActivityLog"
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR "farmId" = current_setting('app.current_farmer_id', true)
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR "farmId" = current_setting('app.current_farmer_id', true)
  );

-- DeviceToken is private per individual user (push tokens), not per farm.
ALTER TABLE "DeviceToken" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "DeviceToken";
CREATE POLICY tenant_isolation ON "DeviceToken"
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR "userId" = current_setting('app.current_user_id', true)
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR "userId" = current_setting('app.current_user_id', true)
  );

-- ── Marketplace: fully private ──────────────────────────────────────────────

ALTER TABLE "SellerPayout" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "SellerPayout";
CREATE POLICY tenant_isolation ON "SellerPayout"
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR "sellerId" = current_setting('app.current_seller_id', true)
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR "sellerId" = current_setting('app.current_seller_id', true)
  );

ALTER TABLE "LogisticsPayout" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "LogisticsPayout";
CREATE POLICY tenant_isolation ON "LogisticsPayout"
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR "logisticsPartnerId" = current_setting('app.current_logistics_partner_id', true)
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR "logisticsPartnerId" = current_setting('app.current_logistics_partner_id', true)
  );

-- Order is private to the buyer who placed it (guest checkout is disallowed
-- app-side, so userId is always set on new orders; NULL rows on old/legacy
-- orders are simply invisible to any tenant context, only admin can see them).
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "Order";
CREATE POLICY tenant_isolation ON "Order"
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR "userId" = current_setting('app.current_user_id', true)
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR "userId" = current_setting('app.current_user_id', true)
  );

-- ── Marketplace: public read, tenant-restricted write ───────────────────────
-- Product and Listing back the public /shop, /listings, /products/[slug] and
-- /sellers/[slug] storefront pages — anyone (including anonymous visitors)
-- must be able to SELECT active listings, but only the owning seller (or
-- admin) may INSERT/UPDATE/DELETE.

ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_read ON "Product";
DROP POLICY IF EXISTS tenant_write ON "Product";
CREATE POLICY public_read ON "Product" FOR SELECT USING (true);
CREATE POLICY tenant_write ON "Product" FOR INSERT WITH CHECK (
  current_setting('app.bypass_rls', true) = 'on'
  OR "sellerId" = current_setting('app.current_seller_id', true)
);
CREATE POLICY tenant_update ON "Product" FOR UPDATE USING (
  current_setting('app.bypass_rls', true) = 'on'
  OR "sellerId" = current_setting('app.current_seller_id', true)
) WITH CHECK (
  current_setting('app.bypass_rls', true) = 'on'
  OR "sellerId" = current_setting('app.current_seller_id', true)
);
CREATE POLICY tenant_delete ON "Product" FOR DELETE USING (
  current_setting('app.bypass_rls', true) = 'on'
  OR "sellerId" = current_setting('app.current_seller_id', true)
);

ALTER TABLE "Listing" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_read ON "Listing";
CREATE POLICY public_read ON "Listing" FOR SELECT USING (true);
CREATE POLICY tenant_write ON "Listing" FOR INSERT WITH CHECK (
  current_setting('app.bypass_rls', true) = 'on'
  OR "sellerId" = current_setting('app.current_seller_id', true)
);
CREATE POLICY tenant_update ON "Listing" FOR UPDATE USING (
  current_setting('app.bypass_rls', true) = 'on'
  OR "sellerId" = current_setting('app.current_seller_id', true)
) WITH CHECK (
  current_setting('app.bypass_rls', true) = 'on'
  OR "sellerId" = current_setting('app.current_seller_id', true)
);
CREATE POLICY tenant_delete ON "Listing" FOR DELETE USING (
  current_setting('app.bypass_rls', true) = 'on'
  OR "sellerId" = current_setting('app.current_seller_id', true)
);

-- ── DeliveryRequest: role-conditional read ──────────────────────────────────
-- Any authenticated logistics partner may see OPEN (unclaimed) jobs so they
-- can browse and claim one, plus their own already-claimed jobs. Only admin
-- creates new requests today; claiming/status updates are done by the
-- assigned partner.

ALTER TABLE "DeliveryRequest" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS role_read ON "DeliveryRequest";
CREATE POLICY role_read ON "DeliveryRequest" FOR SELECT USING (
  current_setting('app.bypass_rls', true) = 'on'
  OR status = 'OPEN'
  OR "logisticsPartnerId" = current_setting('app.current_logistics_partner_id', true)
);
CREATE POLICY admin_write ON "DeliveryRequest" FOR INSERT WITH CHECK (
  current_setting('app.bypass_rls', true) = 'on'
);
CREATE POLICY claim_update ON "DeliveryRequest" FOR UPDATE USING (
  current_setting('app.bypass_rls', true) = 'on'
  OR status = 'OPEN'
  OR "logisticsPartnerId" = current_setting('app.current_logistics_partner_id', true)
) WITH CHECK (
  current_setting('app.bypass_rls', true) = 'on'
  OR "logisticsPartnerId" = current_setting('app.current_logistics_partner_id', true)
);
CREATE POLICY admin_delete ON "DeliveryRequest" FOR DELETE USING (
  current_setting('app.bypass_rls', true) = 'on'
);
