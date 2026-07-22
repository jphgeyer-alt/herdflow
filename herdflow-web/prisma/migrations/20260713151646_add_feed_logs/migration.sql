-- CreateTable
CREATE TABLE "FarmerFeedLog" (
    "id" TEXT NOT NULL,
    "localId" TEXT,
    "farmerId" TEXT NOT NULL,
    "campId" TEXT NOT NULL,
    "campName" TEXT NOT NULL,
    "feedType" TEXT NOT NULL,
    "quantityKg" DECIMAL(65,30) NOT NULL,
    "costTotal" DECIMAL(65,30),
    "feedDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmerFeedLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FarmerFeedLog_localId_key" ON "FarmerFeedLog"("localId");

-- CreateIndex
CREATE INDEX "FarmerFeedLog_farmerId_idx" ON "FarmerFeedLog"("farmerId");

-- CreateIndex
CREATE INDEX "FarmerFeedLog_campId_idx" ON "FarmerFeedLog"("campId");
