-- AlterTable
ALTER TABLE "FarmerTransaction" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "localId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "FarmerTransaction_localId_key" ON "FarmerTransaction"("localId");
