-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('UNPAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- AlterTable
ALTER TABLE "Sponsor" ADD COLUMN     "packageId" TEXT;

-- CreateTable
CREATE TABLE "MarketingPackage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyFee" DECIMAL(65,30) NOT NULL,
    "badge" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "features" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "packageId" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "validUntil" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "quoteId" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "paymentReference" TEXT,
    "periodLabel" TEXT,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentCounter" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DocumentCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketingPackage_slug_key" ON "MarketingPackage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_number_key" ON "Quote"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- AddForeignKey
ALTER TABLE "Sponsor" ADD CONSTRAINT "Sponsor_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "MarketingPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "MarketingPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed: real pricing tiers, replacing the hardcoded array that used to live
-- in src/app/(store)/marketing/page.tsx. Copy preserved verbatim.
INSERT INTO "MarketingPackage" ("id", "slug", "name", "monthlyFee", "badge", "isCustom", "features", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
('pkg-starter', 'starter', 'Starter', 2500, NULL, false, ARRAY[
  'Logo on HerdFlow homepage',
  'Listed in Trusted Suppliers directory',
  '1 featured product or service listing',
  'Monthly performance report',
  'HerdFlow Trusted Sponsor badge',
  'Email to farmer database once per month'
], true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('pkg-growth', 'growth', 'Growth', 5500, 'MOST POPULAR', false, ARRAY[
  'Everything in Starter',
  'Banner ads on listings and shop pages',
  '3 featured product or service listings',
  'Social media mention twice per month',
  'Priority search placement',
  'Bi-weekly performance reports',
  'Dedicated account manager contact'
], true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('pkg-premium', 'premium', 'Premium', 12000, NULL, false, ARRAY[
  'Everything in Growth',
  'Homepage hero banner rotation',
  '10 featured listings priority placement',
  'Weekly social media posts about brand',
  'Email campaign to full farmer database',
  'Video or image ads in auction rooms',
  'Weekly detailed analytics report',
  'Co-branded content creation',
  'Early access to new HerdFlow features'
], true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('pkg-enterprise', 'enterprise', 'Enterprise', 0, NULL, true, ARRAY[
  'Custom sponsorship agreement',
  'Exclusive category sponsorship available',
  'Live auction naming rights',
  'Full website takeover options',
  'National and regional targeting',
  'Custom reporting dashboard',
  'Dedicated HerdFlow marketing team'
], true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed: initialize sequential document counters for quote/invoice numbering.
INSERT INTO "DocumentCounter" ("id", "value") VALUES ('quote', 0), ('invoice', 0);
