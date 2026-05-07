-- Phase 4: Append-only AuditLog table
-- Safe to run repeatedly (IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS "AuditLog" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "actorId" text NULL,
  action text NOT NULL,
  "entityType" text NOT NULL,
  "entityId" text NULL,
  metadata jsonb NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog" ("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog" (action);
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_idx" ON "AuditLog" ("entityType");
CREATE INDEX IF NOT EXISTS "AuditLog_entityId_idx" ON "AuditLog" ("entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_entity_combo_idx" ON "AuditLog" ("entityType", "entityId");
