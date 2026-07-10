-- Migration: add marketingConsent opt-in flag to User
-- Captures whether a buyer agreed to receive marketing emails at signup

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "marketingConsent" BOOLEAN NOT NULL DEFAULT false;
