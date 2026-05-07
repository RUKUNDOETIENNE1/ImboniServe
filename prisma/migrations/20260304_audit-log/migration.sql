-- Prisma Migration: 20260304_audit-log
-- Append-only AuditLog table for critical financial actions

CREATE TABLE "AuditLog" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "actorId" text NULL,
  action text NOT NULL,
  "entityType" text NOT NULL,
  "entityId" text NULL,
  metadata jsonb NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog" ("createdAt");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog" (action);
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog" ("entityType");
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog" ("entityId");
CREATE INDEX "AuditLog_entity_combo_idx" ON "AuditLog" ("entityType", "entityId");
