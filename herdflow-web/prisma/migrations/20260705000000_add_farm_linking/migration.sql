-- Migration: add farm linking fields to FarmerProfile
-- Adds farmCode (unique 6-char code for farmers), mobileRole, and ownerUserId

ALTER TABLE "FarmerProfile" ADD COLUMN IF NOT EXISTS "farmCode" TEXT;
ALTER TABLE "FarmerProfile" ADD COLUMN IF NOT EXISTS "mobileRole" TEXT NOT NULL DEFAULT 'FARMER';
ALTER TABLE "FarmerProfile" ADD COLUMN IF NOT EXISTS "ownerUserId" TEXT;

-- Unique index on farmCode
CREATE UNIQUE INDEX IF NOT EXISTS "FarmerProfile_farmCode_key" ON "FarmerProfile"("farmCode");
-- Index on ownerUserId for staff queries
CREATE INDEX IF NOT EXISTS "FarmerProfile_ownerUserId_idx" ON "FarmerProfile"("ownerUserId");
