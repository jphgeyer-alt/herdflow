-- CreateEnum
CREATE TYPE "AuctionSessionStatus" AS ENUM ('UPCOMING', 'LIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "AuctionLotStatus" AS ENUM ('PENDING', 'ACTIVE', 'SOLD', 'UNSOLD');

-- CreateTable
CREATE TABLE "AuctionSession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "AuctionSessionStatus" NOT NULL DEFAULT 'UPCOMING',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuctionSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionLot" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "livestockListingId" TEXT NOT NULL,
    "lotNumber" INTEGER NOT NULL,
    "startPrice" INTEGER NOT NULL,
    "reservePrice" INTEGER,
    "currentBid" INTEGER NOT NULL DEFAULT 0,
    "currentBidderId" TEXT,
    "bidCount" INTEGER NOT NULL DEFAULT 0,
    "status" "AuctionLotStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "AuctionLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionBid" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "bidderId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "isWinning" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuctionBid_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuctionSession_status_startTime_idx" ON "AuctionSession"("status", "startTime");

-- CreateIndex
CREATE INDEX "AuctionLot_status_idx" ON "AuctionLot"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AuctionLot_sessionId_lotNumber_key" ON "AuctionLot"("sessionId", "lotNumber");

-- CreateIndex
CREATE INDEX "AuctionBid_lotId_createdAt_idx" ON "AuctionBid"("lotId", "createdAt");

-- AddForeignKey
ALTER TABLE "AuctionLot" ADD CONSTRAINT "AuctionLot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AuctionSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionBid" ADD CONSTRAINT "AuctionBid_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "AuctionLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
