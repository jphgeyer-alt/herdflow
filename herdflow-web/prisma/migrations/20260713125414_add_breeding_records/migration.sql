-- CreateTable
CREATE TABLE "FarmerBreedingRecord" (
    "id" TEXT NOT NULL,
    "localId" TEXT,
    "farmerId" TEXT NOT NULL,
    "femaleAnimalId" TEXT NOT NULL,
    "femaleAnimalTag" TEXT NOT NULL,
    "maleAnimalId" TEXT,
    "maleAnimalTag" TEXT,
    "species" TEXT NOT NULL,
    "breedingDate" TIMESTAMP(3) NOT NULL,
    "expectedDueDate" TIMESTAMP(3),
    "outcome" TEXT NOT NULL DEFAULT 'PENDING',
    "calvingDate" TIMESTAMP(3),
    "offspringCount" INTEGER,
    "notes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmerBreedingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FarmerBreedingRecord_localId_key" ON "FarmerBreedingRecord"("localId");

-- CreateIndex
CREATE INDEX "FarmerBreedingRecord_farmerId_idx" ON "FarmerBreedingRecord"("farmerId");

-- CreateIndex
CREATE INDEX "FarmerBreedingRecord_femaleAnimalId_idx" ON "FarmerBreedingRecord"("femaleAnimalId");
