-- RC-001 Index Remediation
-- Add missing indexes defined in schema.prisma but not in the PP-001 migration.
-- Additive, idempotent, zero-downtime.

-- Missing index on PartnershipAgreement.expiresAt
CREATE INDEX IF NOT EXISTS "PartnershipAgreement_expiresAt_idx" ON "PartnershipAgreement"("expiresAt");

-- Missing composite index on PartnershipCommission(partnershipId, status, periodMonth)
CREATE INDEX IF NOT EXISTS "PartnershipCommission_partnershipId_status_periodMonth_idx" ON "PartnershipCommission"("partnershipId", "status", "periodMonth");
