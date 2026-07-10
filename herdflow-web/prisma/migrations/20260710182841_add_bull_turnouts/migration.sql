-- CreateTable
CREATE TABLE "FarmerBullTurnout" (
    "id" TEXT NOT NULL,
    "localId" TEXT,
    "farmerId" TEXT NOT NULL,
    "campId" TEXT NOT NULL,
    "campName" TEXT NOT NULL,
    "bullIds" TEXT NOT NULL,
    "bullTags" TEXT NOT NULL,
    "dateIn" TIMESTAMP(3) NOT NULL,
    "dateOut" TIMESTAMP(3),
    "expectedCalvingStart" TIMESTAMP(3),
    "expectedCalvingEnd" TIMESTAMP(3),
    "recordedByUserId" TEXT NOT NULL,
    "recordedByName" TEXT NOT NULL,
    "recordedByRole" TEXT NOT NULL,
    "notes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmerBullTurnout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FarmerBullTurnout_farmerId_idx" ON "FarmerBullTurnout"("farmerId");

-- CreateIndex
CREATE INDEX "FarmerBullTurnout_campId_idx" ON "FarmerBullTurnout"("campId");

