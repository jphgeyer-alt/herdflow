-- AlterTable
ALTER TABLE "FarmerBreedingRecord" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "FarmerBullTurnout" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "FarmerHealthRecord" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "FarmerVaccination" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;
