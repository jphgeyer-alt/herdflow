-- AlterTable
-- F6: Equipment & Other purchases tab. Purely additive -- unitCost/quantity
-- are nullable with no default (every existing row reads as "not
-- recorded"), isDepreciableAsset defaults to false (accurate for every
-- existing row, none of which were ever asked this question). No RLS
-- changes -- FarmerTransaction already has RLS enabled/forced from earlier
-- migrations (20260710020000, 20260710030000).
ALTER TABLE "FarmerTransaction" ADD COLUMN     "unitCost" DECIMAL(65,30),
ADD COLUMN     "quantity" INTEGER,
ADD COLUMN     "isDepreciableAsset" BOOLEAN NOT NULL DEFAULT false;
