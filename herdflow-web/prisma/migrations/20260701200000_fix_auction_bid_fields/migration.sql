/*
  Warnings:
  - You are about to drop the column `bidderId` on the `AuctionBid` table.
  - You are about to drop the column `amount` on the `AuctionBid` table.
  - You are about to drop the column `isWinning` on the `AuctionBid` table.
  - Added the required columns `bidderName`, `bidderEmail`, `amountCents` to the `AuctionBid` table.
*/

-- AlterTable
ALTER TABLE "AuctionBid" RENAME COLUMN "bidderId" TO "bidderName";
ALTER TABLE "AuctionBid" RENAME COLUMN "amount" TO "amountCents";
ALTER TABLE "AuctionBid" ADD COLUMN "bidderEmail" TEXT NOT NULL DEFAULT '';
ALTER TABLE "AuctionBid" DROP COLUMN "isWinning";
