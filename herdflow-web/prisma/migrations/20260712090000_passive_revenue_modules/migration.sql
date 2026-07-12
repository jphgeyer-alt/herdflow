-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'SENT_TO_PARTNER', 'CONVERTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ClassifiedCategory" AS ENUM ('FARM_EQUIPMENT', 'FARM_JOBS', 'GRAZING_LAND', 'WANTED');

-- CreateEnum
CREATE TYPE "DirectoryCategory" AS ENUM ('VETERINARIAN', 'SHEARER', 'FENCING_CONTRACTOR', 'BOREHOLE_DRILLING', 'AI_TECHNICIAN', 'DIP_SUPPLIER', 'AUCTIONEER', 'FARM_SECURITY', 'MECHANIC', 'OTHER');

-- CreateEnum
CREATE TYPE "DirectoryPlan" AS ENUM ('STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "SponsorSlot" AS ENUM ('THURSDAY_PRICE_EMAIL', 'PRICE_PUSH_NOTIFICATION');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentType" ADD VALUE 'DIRECTORY_SUBSCRIPTION';
ALTER TYPE "PaymentType" ADD VALUE 'DIGITAL_PRODUCT';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "classifiedId" TEXT,
ADD COLUMN     "digitalPurchaseId" TEXT,
ADD COLUMN     "directoryListingId" TEXT;

-- CreateTable
CREATE TABLE "LeadCategory" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "partnerName" TEXT NOT NULL,
    "partnerEmail" TEXT NOT NULL,
    "externalUrl" TEXT,
    "useExternalRedirect" BOOLEAN NOT NULL DEFAULT false,
    "commissionNote" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LeadCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "province" TEXT NOT NULL,
    "farmName" TEXT,
    "message" TEXT,
    "amountSought" DECIMAL(12,2),
    "livestockValue" DECIMAL(12,2),
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "sentToPartnerAt" TIMESTAMP(3),
    "outcome" TEXT,
    "commissionEarned" DECIMAL(10,2),
    "source" TEXT NOT NULL DEFAULT 'website',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Classified" (
    "id" TEXT NOT NULL,
    "posterId" TEXT NOT NULL,
    "category" "ClassifiedCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(12,2),
    "priceType" TEXT NOT NULL DEFAULT 'FIXED',
    "province" TEXT NOT NULL,
    "town" TEXT,
    "photos" JSONB NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactWhatsApp" TEXT,
    "jobType" TEXT,
    "hectares" DECIMAL(10,2),
    "availableFrom" TIMESTAMP(3),
    "tier" "ListingTier" NOT NULL DEFAULT 'BASIC',
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "feePaid" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Classified_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectoryListing" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "category" "DirectoryCategory" NOT NULL,
    "contactName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "whatsapp" TEXT,
    "provinces" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "logoUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "plan" "DirectoryPlan" NOT NULL DEFAULT 'STANDARD',
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "subscriptionActive" BOOLEAN NOT NULL DEFAULT false,
    "renewsAt" TIMESTAMP(3),
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DirectoryListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailSponsorship" (
    "id" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "slotType" "SponsorSlot" NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "creativeId" TEXT,
    "invoiceId" TEXT,
    "fee" DECIMAL(10,2) NOT NULL,
    "status" "PayStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailSponsorship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalProduct" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "coverImage" TEXT,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "salesCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigitalProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalPurchase" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "buyerName" TEXT,
    "paymentRef" TEXT NOT NULL,
    "status" "PayStatus" NOT NULL DEFAULT 'PENDING',
    "downloadToken" TEXT NOT NULL,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "maxDownloads" INTEGER NOT NULL DEFAULT 5,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigitalPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateLink" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "network" TEXT,
    "targetUrl" TEXT NOT NULL,
    "placement" TEXT NOT NULL,
    "imageUrl" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeadCategory_key_key" ON "LeadCategory"("key");

-- CreateIndex
CREATE INDEX "Lead_categoryId_status_idx" ON "Lead"("categoryId", "status");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "Classified_category_status_idx" ON "Classified"("category", "status");

-- CreateIndex
CREATE INDEX "Classified_posterId_idx" ON "Classified"("posterId");

-- CreateIndex
CREATE INDEX "DirectoryListing_category_status_idx" ON "DirectoryListing"("category", "status");

-- CreateIndex
CREATE INDEX "EmailSponsorship_weekStart_idx" ON "EmailSponsorship"("weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "EmailSponsorship_slotType_weekStart_key" ON "EmailSponsorship"("slotType", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalProduct_slug_key" ON "DigitalProduct"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalPurchase_paymentRef_key" ON "DigitalPurchase"("paymentRef");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalPurchase_downloadToken_key" ON "DigitalPurchase"("downloadToken");

-- CreateIndex
CREATE INDEX "DigitalPurchase_downloadToken_idx" ON "DigitalPurchase"("downloadToken");

-- CreateIndex
CREATE INDEX "AffiliateLink_placement_isActive_idx" ON "AffiliateLink"("placement", "isActive");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_classifiedId_fkey" FOREIGN KEY ("classifiedId") REFERENCES "Classified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_directoryListingId_fkey" FOREIGN KEY ("directoryListingId") REFERENCES "DirectoryListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_digitalPurchaseId_fkey" FOREIGN KEY ("digitalPurchaseId") REFERENCES "DigitalPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LeadCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classified" ADD CONSTRAINT "Classified_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSponsorship" ADD CONSTRAINT "EmailSponsorship_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSponsorship" ADD CONSTRAINT "EmailSponsorship_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "SponsorCreative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSponsorship" ADD CONSTRAINT "EmailSponsorship_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalPurchase" ADD CONSTRAINT "DigitalPurchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "DigitalProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
