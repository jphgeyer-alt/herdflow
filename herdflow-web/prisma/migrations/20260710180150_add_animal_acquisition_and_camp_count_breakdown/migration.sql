-- AlterTable
ALTER TABLE "FarmerAnimal" ADD COLUMN     "auctionHouse" TEXT,
ADD COLUMN     "prevFarm" TEXT,
ADD COLUMN     "sellerName" TEXT;

-- AlterTable
ALTER TABLE "FarmerCampCount" ADD COLUMN     "bullsCount" INTEGER,
ADD COLUMN     "calvesCount" INTEGER,
ADD COLUMN     "cowsCount" INTEGER,
ADD COLUMN     "heifersCount" INTEGER;

