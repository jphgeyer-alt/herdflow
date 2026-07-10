-- AlterTable
ALTER TABLE "FarmerAnimal" ADD COLUMN     "localId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "FarmerAnimal_localId_key" ON "FarmerAnimal"("localId");

-- CreateIndex
CREATE UNIQUE INDEX "FarmerBullTurnout_localId_key" ON "FarmerBullTurnout"("localId");

