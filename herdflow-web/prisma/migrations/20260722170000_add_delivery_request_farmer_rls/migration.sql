-- Migration: extend DeliveryRequest's existing role-conditional RLS
-- policies to also recognize the requesting farmer (farmerId), not just
-- OPEN status / the assigned logistics partner.
--
-- Found during a defense-in-depth audit: DeliveryRequest.farmerId (the
-- self-service booking flow) was never covered by any RLS clause. Not
-- currently exploitable -- no route today reads a farmer's own delivery
-- requests by farmerId -- but a future "my bookings" route added without
-- an explicit app-level farmerId filter would have no RLS backstop.
-- Additive only: OR's a farmerId clause into the existing role_read /
-- claim_update policies, doesn't remove the OPEN/logisticsPartnerId
-- visibility the marketplace already relies on.

DROP POLICY IF EXISTS role_read ON "DeliveryRequest";
CREATE POLICY role_read ON "DeliveryRequest" FOR SELECT USING (
  current_setting('app.bypass_rls', true) = 'on'
  OR status = 'OPEN'
  OR "logisticsPartnerId" = current_setting('app.current_logistics_partner_id', true)
  OR "farmerId" = current_setting('app.current_farmer_id', true)
);

DROP POLICY IF EXISTS claim_update ON "DeliveryRequest";
CREATE POLICY claim_update ON "DeliveryRequest" FOR UPDATE USING (
  current_setting('app.bypass_rls', true) = 'on'
  OR status = 'OPEN'
  OR "logisticsPartnerId" = current_setting('app.current_logistics_partner_id', true)
  OR "farmerId" = current_setting('app.current_farmer_id', true)
) WITH CHECK (
  current_setting('app.bypass_rls', true) = 'on'
  OR "logisticsPartnerId" = current_setting('app.current_logistics_partner_id', true)
  OR "farmerId" = current_setting('app.current_farmer_id', true)
);
