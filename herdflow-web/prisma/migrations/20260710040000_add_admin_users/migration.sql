-- Migration: multi-admin accounts + audit trail
-- Replaces the single shared ADMIN_USERNAME/ADMIN_PASSWORD credential with
-- real per-staff admin accounts (AdminUser), DB-backed revocable sessions
-- (AdminUserSession, mirroring UserSession), and an activity log
-- (AdminActivityLog) so admin actions can be attributed to a real person.

CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN');

CREATE TABLE IF NOT EXISTS "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_email_key" ON "AdminUser"("email");

CREATE TABLE IF NOT EXISTS "AdminUserSession" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,

    CONSTRAINT "AdminUserSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AdminUserSession_tokenHash_key" ON "AdminUserSession"("tokenHash");
CREATE INDEX IF NOT EXISTS "AdminUserSession_adminUserId_idx" ON "AdminUserSession"("adminUserId");

DO $$ BEGIN
    ALTER TABLE "AdminUserSession" ADD CONSTRAINT "AdminUserSession_adminUserId_fkey"
        FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "AdminActivityLog" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT,
    "adminName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityLabel" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminActivityLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AdminActivityLog_adminUserId_idx" ON "AdminActivityLog"("adminUserId");
CREATE INDEX IF NOT EXISTS "AdminActivityLog_createdAt_idx" ON "AdminActivityLog"("createdAt");
