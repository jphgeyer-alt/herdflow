-- Backfill migration: creates tables and columns that were added directly
-- to production (via `prisma db push`, before this project consistently
-- used tracked migrations) and were never captured in any migration
-- file. Extracted directly from the live production schema via
-- `prisma migrate diff --from-empty --to-url <production>`. Without this,
-- replaying the migration history from an empty database (disaster
-- recovery, CI, a fresh environment) fails partway through.
-- Positioned here (right after add_auction_models) because
-- AuctionRegistration/AuctionResult reference AuctionSession, and
-- add_farm_linking (which ALTERs FarmerProfile) comes right after.

-- AlterEnum
-- 'FARMER' was added to production's UserRole enum outside any migration.
ALTER TYPE "public"."UserRole" ADD VALUE 'FARMER';

-- AlterTable
-- Production's bidderEmail default was dropped directly, after this
-- column's original migration (fix_auction_bid_fields) set it to ''.
ALTER TABLE "public"."AuctionBid" ALTER COLUMN "bidderEmail" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."AuctionLot" ADD COLUMN     "documents" TEXT[],
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "healthStatus" TEXT,
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "location" TEXT,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "species" TEXT;

-- AlterTable
ALTER TABLE "public"."AuctionSession" ADD COLUMN     "bannerImage" TEXT,
ADD COLUMN     "maxBidders" INTEGER,
ADD COLUMN     "photos" TEXT[],
ADD COLUMN     "streamKey" TEXT,
ADD COLUMN     "thumbnail" TEXT,
ADD COLUMN     "videoType" TEXT,
ADD COLUMN     "videoUrl" TEXT;

-- AlterTable
-- Soft-delete fields for the Shop/Listings domain, also added via db push.
ALTER TABLE "public"."Listing" ADD COLUMN     "deleteReason" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "deleteReason" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Listing_isDeleted_status_idx" ON "public"."Listing"("isDeleted" ASC, "status" ASC);

-- CreateTable
CREATE TABLE "public"."AppContent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "content" TEXT,
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "imageUrl" TEXT,
    "linkUrl" TEXT,
    "sponsorName" TEXT,
    "targetProvinces" TEXT[],
    "targetSpecies" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "sendPush" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "scheduledDate" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AppSettings" (
    "id" TEXT NOT NULL,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT,
    "minimumAppVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "supportWhatsApp" TEXT,
    "supportEmail" TEXT,
    "maxAnnouncements" INTEGER NOT NULL DEFAULT 1,
    "maxBanners" INTEGER NOT NULL DEFAULT 2,
    "sessionTimeout" INTEGER NOT NULL DEFAULT 15,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuctionRegistration" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "physicalAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "biddingNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "depositPaid" BOOLEAN NOT NULL DEFAULT false,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "adminNotes" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuctionRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuctionResult" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "lotNumber" INTEGER NOT NULL,
    "lotTitle" TEXT NOT NULL,
    "winnerEmail" TEXT,
    "biddingNumber" TEXT,
    "winningBid" INTEGER,
    "reserveMet" BOOLEAN NOT NULL DEFAULT false,
    "totalBids" INTEGER NOT NULL DEFAULT 0,
    "startPrice" INTEGER NOT NULL,
    "lotStatus" TEXT NOT NULL,
    "soldAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuctionResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContentDismissal" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentDismissal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContentView" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
-- NOTE: deliberately WITHOUT "auctionHouse"/"prevFarm"/"sellerName" (added
-- later by 20260710180150_add_animal_acquisition_and_camp_count_breakdown)
-- or "localId" (added later by 20260710190742_add_animal_localid) — those
-- already-tracked migrations own those columns.
CREATE TABLE "public"."FarmerAnimal" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "tagNumber" TEXT,
    "name" TEXT,
    "species" TEXT NOT NULL,
    "breed" TEXT,
    "gender" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "weight" DECIMAL(65,30),
    "bodyConditionScore" INTEGER,
    "colour" TEXT,
    "microchipId" TEXT,
    "source" TEXT,
    "purchasePrice" DECIMAL(65,30),
    "dateAcquired" TIMESTAMP(3),
    "camp" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "photos" TEXT[],
    "healthStatus" TEXT NOT NULL DEFAULT 'HEALTHY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmerAnimal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FarmerCamp" (
    "id" TEXT NOT NULL,
    "localId" TEXT,
    "farmerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" TEXT,
    "hectares" DECIMAL(65,30),
    "forageType" TEXT,
    "currentStatus" TEXT NOT NULL DEFAULT 'RESTING',
    "maxCarryingCapacity" INTEGER,
    "restingDaysRequired" INTEGER NOT NULL DEFAULT 42,
    "gpsCoordinates" TEXT,
    "notes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmerCamp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
-- NOTE: deliberately WITHOUT "bullsCount"/"calvesCount"/"cowsCount"/
-- "heifersCount" — added later by
-- 20260710180150_add_animal_acquisition_and_camp_count_breakdown.
CREATE TABLE "public"."FarmerCampCount" (
    "id" TEXT NOT NULL,
    "localId" TEXT,
    "campId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "countedByUserId" TEXT NOT NULL,
    "countedByName" TEXT NOT NULL,
    "countedByRole" TEXT NOT NULL,
    "countDate" TIMESTAMP(3) NOT NULL,
    "expectedCount" INTEGER,
    "actualCount" INTEGER NOT NULL,
    "variance" INTEGER,
    "varianceNotes" TEXT,
    "countMethod" TEXT NOT NULL DEFAULT 'MANUAL',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmerCampCount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FarmerCampMovement" (
    "id" TEXT NOT NULL,
    "localId" TEXT,
    "farmerId" TEXT NOT NULL,
    "fromCampId" TEXT,
    "fromCampName" TEXT,
    "toCampId" TEXT NOT NULL,
    "toCampName" TEXT NOT NULL,
    "animalIds" TEXT NOT NULL,
    "headCount" INTEGER NOT NULL,
    "movedByUserId" TEXT NOT NULL,
    "movedByName" TEXT NOT NULL,
    "movedByRole" TEXT NOT NULL,
    "movementDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmerCampMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FarmerHealthRecord" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "vetName" TEXT,
    "severity" TEXT,
    "cost" DECIMAL(65,30),
    "followUpDate" TIMESTAMP(3),
    "documents" TEXT[],
    "eventDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmerHealthRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FarmerMedicine" (
    "id" TEXT NOT NULL,
    "localId" TEXT,
    "farmerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "manufacturer" TEXT,
    "withdrawalPeriodDays" INTEGER,
    "dosageUnit" TEXT,
    "standardDosage" DECIMAL(65,30),
    "storageInstructions" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmerMedicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FarmerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "farmName" TEXT NOT NULL DEFAULT '',
    "province" TEXT NOT NULL DEFAULT '',
    "species" TEXT[],
    "farmCode" TEXT,
    "mobileRole" TEXT NOT NULL DEFAULT 'FARMER',
    "ownerUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
-- NOTE: deliberately WITHOUT "isDeleted"/"localId" — added later by
-- 20260711160000_add_farmer_transaction_local_id.
CREATE TABLE "public"."FarmerTransaction" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "vatAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "description" TEXT,
    "animalId" TEXT,
    "supplier" TEXT,
    "invoiceNumber" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmerTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FarmerTreatment" (
    "id" TEXT NOT NULL,
    "localId" TEXT,
    "animalId" TEXT NOT NULL,
    "animalTag" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "medicineId" TEXT,
    "medicineName" TEXT NOT NULL,
    "medicineCategory" TEXT NOT NULL,
    "treatmentType" TEXT NOT NULL,
    "dosage" DECIMAL(65,30),
    "dosageUnit" TEXT,
    "batchNumber" TEXT,
    "administeredByUserId" TEXT NOT NULL,
    "administeredByName" TEXT NOT NULL,
    "administeredByRole" TEXT NOT NULL,
    "treatmentDate" TIMESTAMP(3) NOT NULL,
    "nextTreatmentDate" TIMESTAMP(3),
    "withdrawalEndDate" TIMESTAMP(3),
    "campId" TEXT,
    "campName" TEXT,
    "diagnosis" TEXT,
    "symptoms" TEXT,
    "vetName" TEXT,
    "prescriptionNumber" TEXT,
    "cost" DECIMAL(65,30),
    "notes" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "followUpCompleted" BOOLEAN NOT NULL DEFAULT false,
    "outcome" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmerTreatment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FarmerVaccination" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "vaccineName" TEXT NOT NULL,
    "batchNumber" TEXT,
    "administeredBy" TEXT,
    "vetName" TEXT,
    "cost" DECIMAL(65,30),
    "vaccinatedDate" TIMESTAMP(3),
    "nextDueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmerVaccination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FarmerWeightRecord" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "weight" DECIMAL(65,30) NOT NULL,
    "bodyConditionScore" INTEGER,
    "notes" TEXT,
    "recordedDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmerWeightRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MarketPriceCache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "priceData" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketPriceCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PushNotificationLog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "targetValue" TEXT,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "sentBy" TEXT NOT NULL,
    "scheduleTime" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
-- NOTE: deliberately WITHOUT "packageId" — that column (and its FK to
-- MarketingPackage) is added later by the already-tracked migration
-- 20260709094857_add_marketing_packages_quotes_invoices, which is also
-- where MarketingPackage itself first gets created. Adding it here would
-- reference a table that doesn't exist yet at this point in the sequence.
CREATE TABLE "public"."Sponsor" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "website" TEXT,
    "businessType" TEXT NOT NULL,
    "package" TEXT NOT NULL,
    "targetProvinces" TEXT[],
    "marketingGoal" TEXT NOT NULL,
    "logoUrl" TEXT,
    "bannerUrls" TEXT[],
    "brief" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "monthlyFee" DECIMAL(65,30),
    "notes" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sponsor_email_key" ON "public"."Sponsor"("email" ASC);

-- CreateIndex
CREATE INDEX "AuctionRegistration_biddingNumber_idx" ON "public"."AuctionRegistration"("biddingNumber" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "AuctionRegistration_biddingNumber_key" ON "public"."AuctionRegistration"("biddingNumber" ASC);

-- CreateIndex
CREATE INDEX "AuctionRegistration_sessionId_status_idx" ON "public"."AuctionRegistration"("sessionId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "AuctionResult_sessionId_idx" ON "public"."AuctionResult"("sessionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ContentDismissal_contentId_farmerId_key" ON "public"."ContentDismissal"("contentId" ASC, "farmerId" ASC);

-- CreateIndex
CREATE INDEX "ContentDismissal_farmerId_idx" ON "public"."ContentDismissal"("farmerId" ASC);

-- CreateIndex
CREATE INDEX "ContentView_contentId_idx" ON "public"."ContentView"("contentId" ASC);

-- CreateIndex
CREATE INDEX "ContentView_farmerId_idx" ON "public"."ContentView"("farmerId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_token_key" ON "public"."DeviceToken"("token" ASC);

-- CreateIndex
CREATE INDEX "DeviceToken_userId_idx" ON "public"."DeviceToken"("userId" ASC);

-- CreateIndex
CREATE INDEX "FarmerAnimal_farmerId_isDeleted_idx" ON "public"."FarmerAnimal"("farmerId" ASC, "isDeleted" ASC);

-- CreateIndex
CREATE INDEX "FarmerAnimal_farmerId_species_idx" ON "public"."FarmerAnimal"("farmerId" ASC, "species" ASC);

-- (FarmerAnimal_localId_key is created later, by 20260710190742_add_animal_localid, alongside the column itself)

-- CreateIndex
CREATE INDEX "FarmerCamp_farmerId_idx" ON "public"."FarmerCamp"("farmerId" ASC);

-- CreateIndex
CREATE INDEX "FarmerCamp_farmerId_isDeleted_idx" ON "public"."FarmerCamp"("farmerId" ASC, "isDeleted" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "FarmerCamp_localId_key" ON "public"."FarmerCamp"("localId" ASC);

-- CreateIndex
CREATE INDEX "FarmerCampCount_campId_idx" ON "public"."FarmerCampCount"("campId" ASC);

-- CreateIndex
CREATE INDEX "FarmerCampCount_farmerId_idx" ON "public"."FarmerCampCount"("farmerId" ASC);

-- CreateIndex
CREATE INDEX "FarmerCampMovement_farmerId_idx" ON "public"."FarmerCampMovement"("farmerId" ASC);

-- CreateIndex
CREATE INDEX "FarmerCampMovement_toCampId_idx" ON "public"."FarmerCampMovement"("toCampId" ASC);

-- CreateIndex
CREATE INDEX "FarmerHealthRecord_animalId_idx" ON "public"."FarmerHealthRecord"("animalId" ASC);

-- CreateIndex
CREATE INDEX "FarmerHealthRecord_farmerId_idx" ON "public"."FarmerHealthRecord"("farmerId" ASC);

-- CreateIndex
CREATE INDEX "FarmerMedicine_farmerId_idx" ON "public"."FarmerMedicine"("farmerId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "FarmerMedicine_localId_key" ON "public"."FarmerMedicine"("localId" ASC);

-- CreateIndex
CREATE INDEX "FarmerProfile_farmCode_idx" ON "public"."FarmerProfile"("farmCode" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "FarmerProfile_farmCode_key" ON "public"."FarmerProfile"("farmCode" ASC);

-- CreateIndex
CREATE INDEX "FarmerProfile_ownerUserId_idx" ON "public"."FarmerProfile"("ownerUserId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "FarmerProfile_userId_key" ON "public"."FarmerProfile"("userId" ASC);

-- CreateIndex
CREATE INDEX "FarmerTransaction_farmerId_date_idx" ON "public"."FarmerTransaction"("farmerId" ASC, "date" ASC);

-- CreateIndex
CREATE INDEX "FarmerTransaction_farmerId_idx" ON "public"."FarmerTransaction"("farmerId" ASC);

-- (FarmerTransaction_localId_key is created later, by 20260711160000_add_farmer_transaction_local_id, alongside the column itself)

-- CreateIndex
CREATE INDEX "FarmerTreatment_animalId_idx" ON "public"."FarmerTreatment"("animalId" ASC);

-- CreateIndex
CREATE INDEX "FarmerTreatment_farmerId_idx" ON "public"."FarmerTreatment"("farmerId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "FarmerTreatment_localId_key" ON "public"."FarmerTreatment"("localId" ASC);

-- CreateIndex
CREATE INDEX "FarmerTreatment_withdrawalEndDate_idx" ON "public"."FarmerTreatment"("withdrawalEndDate" ASC);

-- CreateIndex
CREATE INDEX "FarmerVaccination_animalId_idx" ON "public"."FarmerVaccination"("animalId" ASC);

-- CreateIndex
CREATE INDEX "FarmerVaccination_farmerId_idx" ON "public"."FarmerVaccination"("farmerId" ASC);

-- CreateIndex
CREATE INDEX "FarmerVaccination_nextDueDate_idx" ON "public"."FarmerVaccination"("nextDueDate" ASC);

-- CreateIndex
CREATE INDEX "FarmerWeightRecord_animalId_idx" ON "public"."FarmerWeightRecord"("animalId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MarketPriceCache_cacheKey_key" ON "public"."MarketPriceCache"("cacheKey" ASC);

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "public"."PasswordResetToken"("token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "public"."PasswordResetToken"("token" ASC);

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "public"."PasswordResetToken"("userId" ASC);

-- AddForeignKey
ALTER TABLE "public"."AuctionRegistration" ADD CONSTRAINT "AuctionRegistration_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AuctionSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuctionResult" ADD CONSTRAINT "AuctionResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AuctionSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
