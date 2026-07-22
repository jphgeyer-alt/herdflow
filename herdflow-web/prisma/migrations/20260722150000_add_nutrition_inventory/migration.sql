-- AlterTable
ALTER TABLE "FarmerFeedLog" ADD COLUMN     "nutritionItemId" TEXT,
ADD COLUMN     "recordedByUserId" TEXT,
ADD COLUMN     "recordedByName" TEXT,
ADD COLUMN     "recordedByRole" TEXT;

-- CreateTable
CREATE TABLE "public"."FarmerNutritionItem" (
    "id" TEXT NOT NULL,
    "localId" TEXT,
    "farmerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT,
    "quantityInStock" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "costPerUnit" DECIMAL(65,30),
    "reorderLevel" DECIMAL(65,30),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmerNutritionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FarmerNutritionItem_localId_key" ON "public"."FarmerNutritionItem"("localId" ASC);

-- CreateIndex
CREATE INDEX "FarmerNutritionItem_farmerId_idx" ON "public"."FarmerNutritionItem"("farmerId" ASC);
