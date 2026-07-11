-- CreateEnum
CREATE TYPE "VendorPlan" AS ENUM ('BASIC', 'UNLIMITED');

-- CreateEnum
CREATE TYPE "ListingTier" AS ENUM ('BASIC', 'FEATURED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'LIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "SubStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "Cycle" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('SUBSCRIPTION', 'STORE_ORDER', 'LISTING_FEE', 'TRANSPORT_BOOKING', 'SPONSORSHIP', 'VENDOR_REG');

-- CreateEnum
CREATE TYPE "PayStatus" AS ENUM ('PENDING', 'COMPLETE', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "FeeKind" AS ENUM ('FLAT', 'PERCENT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CreativePlacement" ADD VALUE 'APP_HOME_BANNER';
ALTER TYPE "CreativePlacement" ADD VALUE 'APP_ANNOUNCEMENT';
ALTER TYPE "CreativePlacement" ADD VALUE 'WEB_HOMEPAGE';
ALTER TYPE "CreativePlacement" ADD VALUE 'WEB_MARKETPLACE';
ALTER TYPE "CreativePlacement" ADD VALUE 'EMAIL_HEADER';
ALTER TYPE "CreativePlacement" ADD VALUE 'PUSH_NOTIFICATION';

-- AlterTable
ALTER TABLE "DeliveryRequest" ADD COLUMN     "bookingFeePaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "farmerId" TEXT,
ADD COLUMN     "headCount" INTEGER,
ADD COLUMN     "livestockType" TEXT,
ALTER COLUMN "priceCents" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "contactWhatsApp" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "feePaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tier" "ListingTier" NOT NULL DEFAULT 'BASIC',
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "releasedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Seller" ADD COLUMN     "accountHolder" TEXT,
ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "branchCode" TEXT,
ADD COLUMN     "registrationFeePaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "storefrontPlan" "VendorPlan" NOT NULL DEFAULT 'BASIC';

-- AlterTable
ALTER TABLE "SponsorCreative" ADD COLUMN     "bgColor" TEXT NOT NULL DEFAULT '#1B3A6B',
ADD COLUMN     "ctaText" TEXT,
ADD COLUMN     "ctaUrl" TEXT,
ADD COLUMN     "headline" TEXT,
ADD COLUMN     "status" "CampaignStatus" NOT NULL DEFAULT 'LIVE',
ADD COLUMN     "subline" TEXT,
ADD COLUMN     "template" TEXT NOT NULL DEFAULT 'banner-classic',
ADD COLUMN     "textColor" TEXT NOT NULL DEFAULT '#FFFFFF';

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "monthlyPrice" DECIMAL(10,2) NOT NULL,
    "annualPrice" DECIMAL(10,2) NOT NULL,
    "maxAnimals" INTEGER,
    "maxUsers" INTEGER,
    "maxFarms" INTEGER NOT NULL DEFAULT 1,
    "features" JSONB NOT NULL,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubStatus" NOT NULL DEFAULT 'TRIAL',
    "billingCycle" "Cycle" NOT NULL DEFAULT 'MONTHLY',
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "trialEndsAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "payfastToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentType" "PaymentType" NOT NULL,
    "status" "PayStatus" NOT NULL DEFAULT 'PENDING',
    "payfastId" TEXT,
    "reference" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "orderId" TEXT,
    "listingId" TEXT,
    "deliveryRequestId" TEXT,
    "invoiceId" TEXT,
    "sellerId" TEXT,
    "metadata" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformFee" (
    "id" TEXT NOT NULL,
    "feeKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "feeType" "FeeKind" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformFee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_key_key" ON "SubscriptionPlan"("key");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- CreateIndex
CREATE INDEX "Payment_paymentType_status_idx" ON "Payment"("paymentType", "status");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformFee_feeKey_key" ON "PlatformFee"("feeKey");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_deliveryRequestId_fkey" FOREIGN KEY ("deliveryRequestId") REFERENCES "DeliveryRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

