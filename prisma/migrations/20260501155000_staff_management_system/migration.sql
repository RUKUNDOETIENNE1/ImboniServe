-- Staff Management System Migration
-- Adds StaffRole, UserStaffRole, and User.primaryBranchId
-- SAFE, ADDITIVE migration. No destructive changes.

-- ============================================
-- 1) ALTER User: add primaryBranchId (nullable) + FK to Branch
-- ============================================
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "primaryBranchId" TEXT;
DO $$ BEGIN
  ALTER TABLE "User"
    ADD CONSTRAINT "User_primaryBranchId_fkey"
    FOREIGN KEY ("primaryBranchId") REFERENCES "Branch"("id") ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2) CREATE StaffRole (system and custom roles with permissions)
-- ============================================
CREATE TABLE IF NOT EXISTS "StaffRole" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "businessId" TEXT,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT,
  "icon" TEXT,
  "baseRole" "UserRole" NOT NULL,
  "isSystem" BOOLEAN NOT NULL DEFAULT FALSE,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "permissions" JSONB NOT NULL,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- FKs for StaffRole
DO $$ BEGIN
  ALTER TABLE "StaffRole"
    ADD CONSTRAINT "StaffRole_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "StaffRole"
    ADD CONSTRAINT "StaffRole_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indexes & constraints for StaffRole
CREATE UNIQUE INDEX IF NOT EXISTS "StaffRole_businessId_key_key" ON "StaffRole"("businessId", "key");
CREATE INDEX IF NOT EXISTS "StaffRole_businessId_isSystem_idx" ON "StaffRole"("businessId", "isSystem");

-- ============================================
-- 3) CREATE UserStaffRole (user-to-role assignments)
-- ============================================
CREATE TABLE IF NOT EXISTS "UserStaffRole" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "staffRoleId" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "assignedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- FKs for UserStaffRole
DO $$ BEGIN
  ALTER TABLE "UserStaffRole"
    ADD CONSTRAINT "UserStaffRole_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "UserStaffRole"
    ADD CONSTRAINT "UserStaffRole_staffRoleId_fkey"
    FOREIGN KEY ("staffRoleId") REFERENCES "StaffRole"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "UserStaffRole"
    ADD CONSTRAINT "UserStaffRole_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Restaurant"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indexes & constraints for UserStaffRole
CREATE UNIQUE INDEX IF NOT EXISTS "UserStaffRole_userId_staffRoleId_key" ON "UserStaffRole"("userId", "staffRoleId");
CREATE INDEX IF NOT EXISTS "UserStaffRole_businessId_idx" ON "UserStaffRole"("businessId");
