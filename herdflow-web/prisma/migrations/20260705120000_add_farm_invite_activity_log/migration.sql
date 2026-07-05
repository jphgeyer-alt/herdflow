-- Migration: add FarmInvite and FarmerActivityLog tables

CREATE TABLE IF NOT EXISTS "FarmInvite" (
  "id"            TEXT NOT NULL PRIMARY KEY,
  "farmOwnerId"   TEXT NOT NULL,
  "farmName"      TEXT NOT NULL,
  "farmOwnerName" TEXT NOT NULL,
  "inviteCode"    TEXT NOT NULL,
  "role"          TEXT NOT NULL,
  "status"        TEXT NOT NULL DEFAULT 'PENDING',
  "expiresAt"     TIMESTAMP(3) NOT NULL,
  "acceptedBy"    TEXT,
  "acceptedAt"    TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "FarmInvite_inviteCode_key" ON "FarmInvite"("inviteCode");
CREATE INDEX IF NOT EXISTS "FarmInvite_farmOwnerId_idx" ON "FarmInvite"("farmOwnerId");
CREATE INDEX IF NOT EXISTS "FarmInvite_status_idx" ON "FarmInvite"("status");

CREATE TABLE IF NOT EXISTS "FarmerActivityLog" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "userId"       TEXT NOT NULL,
  "userName"     TEXT NOT NULL,
  "userRole"     TEXT NOT NULL,
  "farmId"       TEXT NOT NULL,
  "activityType" TEXT NOT NULL,
  "description"  TEXT NOT NULL,
  "entityId"     TEXT,
  "entityType"   TEXT,
  "entityName"   TEXT,
  "metadata"     TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "FarmerActivityLog_farmId_createdAt_idx" ON "FarmerActivityLog"("farmId", "createdAt");
CREATE INDEX IF NOT EXISTS "FarmerActivityLog_userId_idx" ON "FarmerActivityLog"("userId");
