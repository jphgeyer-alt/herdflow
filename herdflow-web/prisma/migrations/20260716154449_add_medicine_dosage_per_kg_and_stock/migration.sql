-- AlterTable
ALTER TABLE "FarmerMedicine" ADD COLUMN     "dosagePerKg" DECIMAL(65,30),
ADD COLUMN     "quantityInStock" DECIMAL(65,30) NOT NULL DEFAULT 0;
