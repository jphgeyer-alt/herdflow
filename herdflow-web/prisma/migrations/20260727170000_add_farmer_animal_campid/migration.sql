-- CAMPS-MAP: add a real campId column to FarmerAnimal so per-camp head
-- counts can be computed server-side (see src/app/api/app/camps/route.ts).
--
-- No @relation / FK constraint -- matches every other camp cross-reference
-- in this schema (FarmerCampMovement.toCampId/fromCampId, FarmerTreatment.
-- campId, FarmerFeedLog.campId, etc.), all plain columns validated at the
-- application layer (see getCampForFarmer in src/lib/tenant-lookups.ts)
-- rather than a DB-level foreign key.
--
-- RLS: FarmerAnimal's tenant_isolation policy only ever inspects "farmerId"
-- (see 20260710020000_add_row_level_security), so this new nullable column
-- needs no policy change -- it's invisible to that predicate for every
-- operation. Ownership of the referenced camp (i.e. that campId actually
-- belongs to the same farmer) is enforced in the API route via
-- getCampForFarmer, same as every other child-record reference.

ALTER TABLE "FarmerAnimal" ADD COLUMN "campId" TEXT;
CREATE INDEX "FarmerAnimal_campId_idx" ON "FarmerAnimal"("campId");

-- Backfill: `camp` has actually been storing the camp's real id all along
-- (mobile sends assignedCampId as `campId`/`assignedCampId`, and
-- animals/route.ts writes whichever arrives straight into `camp` -- see
-- that route's POST/PATCH handlers). This copies it into the new column
-- only where it's an exact, farmer-scoped match against a real camp id --
-- any row where `camp` holds something else (older free-text data entered
-- before this convention existed, CSV imports, etc.) is deliberately left
-- NULL rather than guessed at. `camp` itself is untouched either way.
UPDATE "FarmerAnimal" a
SET "campId" = a.camp
WHERE a.camp IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM "FarmerCamp" c
    WHERE c.id = a.camp AND c."farmerId" = a."farmerId"
  );
