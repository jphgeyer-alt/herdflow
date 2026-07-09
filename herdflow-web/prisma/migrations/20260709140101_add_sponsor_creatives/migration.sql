-- CreateEnum
CREATE TYPE "CreativePlacement" AS ENUM ('HOMEPAGE', 'SHOP', 'LISTINGS');

-- CreateTable
CREATE TABLE "SponsorCreative" (
    "id" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "placement" "CreativePlacement" NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorCreative_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SponsorCreative_placement_isActive_idx" ON "SponsorCreative"("placement", "isActive");

-- AddForeignKey
ALTER TABLE "SponsorCreative" ADD CONSTRAINT "SponsorCreative_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

