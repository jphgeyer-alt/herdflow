-- AlterTable
ALTER TABLE "FarmerAnimal" ADD COLUMN     "electronicId" TEXT;

-- AlterTable
ALTER TABLE "FarmerProfile" ADD COLUMN     "traceabilityGln" TEXT;

-- CreateTable
CREATE TABLE "public"."FarmerAnimalEvent" (
    "id" TEXT NOT NULL,
    "localId" TEXT,
    "animalId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "salePrice" DECIMAL(65,30),
    "buyerName" TEXT,
    "causeOfDeath" TEXT,
    "notes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmerAnimalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FarmerAnimalEvent_localId_key" ON "public"."FarmerAnimalEvent"("localId" ASC);

-- CreateIndex
CREATE INDEX "FarmerAnimalEvent_animalId_idx" ON "public"."FarmerAnimalEvent"("animalId" ASC);

-- CreateIndex
CREATE INDEX "FarmerAnimalEvent_farmerId_idx" ON "public"."FarmerAnimalEvent"("farmerId" ASC);
