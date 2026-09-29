# GUARDIAN-001 — Operational Runbook

## Enabling Guardian

### Step 1: Enable Feature Flag
```sql
INSERT INTO "FeatureFlag" ("key", "description", "isEnabled", "createdAt", "updatedAt")
VALUES ('guardian_v1', 'Guardian service promise protection layer', true, NOW(), NOW())
ON CONFLICT ("key") DO UPDATE SET "isEnabled" = true;
```

This enables **SHADOW mode** — Guardian will detect cases, log events, and publish Heart Pulse events but will **not** dispatch interventions.

### Step 2: Enable ASSIST Mode (per business)
```sql
INSERT INTO "BusinessFeatureOverride" ("businessId", "featureFlagId", "enabled", "createdAt", "updatedAt")
SELECT 'BUSINESS_ID', f."id", true, NOW(), NOW()
FROM "FeatureFlag" f WHERE f."key" = 'guardian_v1';
```

In ASSIST mode, Guardian dispatches WhatsApp alerts, email/Slack escalations, and Heart Pulse events.

## Monitoring

### Dashboard
Navigate to **Operations → Guardian** in the dashboard (requires OWNER, MANAGER, ADMIN, or SUPERVISOR role).

### Metrics Available
- **Active Cases**: Currently being monitored
- **Total Today**: All cases detected today
- **Protected**: Cases resolved with `PROTECTED_BY_GUARDIAN` outcome
- **Breached**: Cases that breached despite intervention
- **Interventions**: Total interventions dispatched today
- **Protection Rate**: `protected / (protected + breached) * 100`

### Logs
Search for `[Guardian]` in application logs:
- `[Guardian] Cron tick` — periodic evaluation results
- `[Guardian] Case resolved` — case outcome
- `[Guardian] Cron tick error` — evaluation failures

## Troubleshooting

### Guardian not running
1. Check feature flag: `SELECT * FROM "FeatureFlag" WHERE key = 'guardian_v1';`
2. Check cron is started (production only): look for `All cron jobs started` in logs
3. Check Vercel cron: `GET /api/cron/guardian` with `Authorization: Bearer $CRON_SECRET`

### No cases being created
1. Verify Promise Engine is running (Guardian consumes WARNING/CRITICAL signals)
2. Check `ServicePromise` table for active WARNING/CRITICAL states
3. Verify `evaluateActiveSignals` is not erroring (check logs for `[Guardian] Cron tick error`)

### Interventions not dispatched
1. Confirm mode is ASSIST (not SHADOW)
2. Check `BusinessFeatureOverride` for the business
3. Verify staff users have `whatsappEnabled = true` and a valid phone
4. Check `GuardianResponsibilityRouter` found an eligible user (check logs)

### Duplicate interventions
- Guardian uses 15-minute dedup window per case + channel
- Check `GuardianIntervention.idempotencyKey` for uniqueness
- P2002 errors are caught and logged, not retried

## Disabling Guardian

### Disable for a single business
```sql
UPDATE "BusinessFeatureOverride" SET "enabled" = false
WHERE "businessId" = 'BUSINESS_ID'
AND "featureFlagId" = (SELECT "id" FROM "FeatureFlag" WHERE "key" = 'guardian_v1');
```

### Disable globally
```sql
UPDATE "FeatureFlag" SET "isEnabled" = false WHERE "key" = 'guardian_v1';
```

This immediately sets all businesses to OFF mode. Active cases remain in the database but no new evaluations occur.

## Database Cleanup

### Clear old resolved cases (> 90 days)
```sql
DELETE FROM "GuardianLearningSignal"
WHERE "caseId" IN (
  SELECT "id" FROM "GuardianCase"
  WHERE "state" IN ('RESOLVED', 'BREACHED', 'CLEARED', 'CANCELLED')
  AND "resolvedAt" < NOW() - INTERVAL '90 days'
);

DELETE FROM "GuardianIntervention"
WHERE "caseId" IN (
  SELECT "id" FROM "GuardianCase"
  WHERE "state" IN ('RESOLVED', 'BREACHED', 'CLEARED', 'CANCELLED')
  AND "resolvedAt" < NOW() - INTERVAL '90 days'
);

DELETE FROM "GuardianCase"
WHERE "state" IN ('RESOLVED', 'BREACHED', 'CLEARED', 'CANCELLED')
AND "resolvedAt" < NOW() - INTERVAL '90 days';
```

> **Note**: Learning signals are valuable for pattern analysis. Consider exporting before deletion.
