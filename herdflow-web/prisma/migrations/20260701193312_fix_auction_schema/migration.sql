/*
  Warnings:

  - The values [ACTIVE,UNSOLD] on the enum `AuctionLotStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [ENDED] on the enum `AuctionSessionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `bidCount` on the `AuctionLot` table. All the data in the column will be lost.
  - You are about to drop the column `currentBid` on the `AuctionLot` table. All the data in the column will be lost.
  - You are about to drop the column `currentBidderId` on the `AuctionLot` table. All the data in the column will be lost.
  - You are about to drop the column `reservePrice` on the `AuctionLot` table. All the data in the column will be lost.
  - You are about to drop the column `startPrice` on the `AuctionLot` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `AuctionSession` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `AuctionSession` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `AuctionSession` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `description` to the `AuctionLot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startingPriceCents` to the `AuctionLot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `AuctionLot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduledAt` to the `AuctionSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `AuctionSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AuctionLotStatus_new" AS ENUM ('PENDING', 'OPEN', 'SOLD', 'PASSED', 'CANCELLED');
ALTER TABLE "public"."AuctionLot" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "AuctionLot" ALTER COLUMN "status" TYPE "AuctionLotStatus_new" USING ("status"::text::"AuctionLotStatus_new");
ALTER TYPE "AuctionLotStatus" RENAME TO "AuctionLotStatus_old";
ALTER TYPE "AuctionLotStatus_new" RENAME TO "AuctionLotStatus";
DROP TYPE "public"."AuctionLotStatus_old";
ALTER TABLE "AuctionLot" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "AuctionSessionStatus_new" AS ENUM ('UPCOMING', 'LIVE', 'CLOSED', 'CANCELLED');
ALTER TABLE "public"."AuctionSession" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "AuctionSession" ALTER COLUMN "status" TYPE "AuctionSessionStatus_new" USING ("status"::text::"AuctionSessionStatus_new");
ALTER TYPE "AuctionSessionStatus" RENAME TO "AuctionSessionStatus_old";
ALTER TYPE "AuctionSessionStatus_new" RENAME TO "AuctionSessionStatus";
DROP TYPE "public"."AuctionSessionStatus_old";
ALTER TABLE "AuctionSession" ALTER COLUMN "status" SET DEFAULT 'UPCOMING';
COMMIT;

-- DropIndex
DROP INDEX "AuctionSession_status_startTime_idx";

-- AlterTable
ALTER TABLE "AuctionLot" DROP COLUMN "bidCount",
DROP COLUMN "currentBid",
DROP COLUMN "currentBidderId",
DROP COLUMN "reservePrice",
DROP COLUMN "startPrice",
ADD COLUMN     "breed" TEXT,
ADD COLUMN     "currentBidCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "reservePriceCents" INTEGER,
ADD COLUMN     "startingPriceCents" INTEGER NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "weightKg" INTEGER,
ADD COLUMN     "winnerEmail" TEXT,
ADD COLUMN     "winnerName" TEXT,
ALTER COLUMN "livestockListingId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AuctionSession" DROP COLUMN "endTime",
DROP COLUMN "startTime",
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "scheduledAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL,
ALTER COLUMN "createdBy" SET DEFAULT 'admin';

-- CreateIndex
CREATE UNIQUE INDEX "AuctionSession_slug_key" ON "AuctionSession"("slug");

-- CreateIndex
CREATE INDEX "AuctionSession_status_scheduledAt_idx" ON "AuctionSession"("status", "scheduledAt");
