-- AlterTable
ALTER TABLE "FarmerMedicine" ADD COLUMN     "costPerUnit" DECIMAL(65,30),
ADD COLUMN     "reorderLevel" DECIMAL(65,30),
ADD COLUMN     "dosageWeightBasis" DECIMAL(65,30) NOT NULL DEFAULT 1;
