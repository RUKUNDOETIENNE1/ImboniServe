# RB-001: Database Recovery Runbook

```yaml
id: RB-001
title: Database Recovery Runbook
type: runbook
version: 1.0
status: active
owner: Principal Site Reliability Engineer
created: 2026-07-30
updated: 2026-07-30
review_frequency: bi-annual
depends_on: [ESC-001, ADR-001, DB-003]
implements: []
related_documents: [DB-002.5, IEL-001, PB-V7]
supersedes: []
tags: [runbook, recovery, database, emergency]
```

## Overview

Step-by-step procedure for reconstructing the ImboniServe database from the repository using Prisma migrations. Based on the DB-003 controlled reconstruction operation.

## Prerequisites

- Access to Supabase project dashboard
- Local repository with latest `main` branch
- Node.js and npm installed
- `.env` file with `DATABASE_URL` pointing to target database
- Prisma CLI installed (`npx prisma --version`)

## Procedure

### Step 1: Assess Current State
1. Check if database is accessible:
   ```bash
   npx prisma db pull --print | head -20
   ```
2. **Verify:** If output shows schema, database is accessible. If error, check connection string.
3. Check migration status:
   ```bash
   npx prisma migrate status
   ```
4. **Verify:** Note any pending or failed migrations.

### Step 2: Backup Current State (If Database Has Data)
1. Export current schema:
   ```bash
   npx prisma db pull --print > backup_schema_$(date +%Y%m%d).prisma
   ```
2. **Verify:** Backup file exists and contains schema.

### Step 3: Reset Database (Destructive — Requires Authorization)
1. **STOP:** This step destroys all data. Require founder authorization.
2. Reset database:
   ```bash
   npx prisma migrate reset --force --skip-seed
   ```
3. **Verify:** `migrate status` shows all migrations applied.

### Step 4: Deploy Migrations
1. Deploy all migrations:
   ```bash
   npx prisma migrate deploy
   ```
2. **Verify:** All migrations marked as applied. No errors.

### Step 5: Generate Prisma Client
1. Generate client:
   ```bash
   npx prisma generate
   ```
2. **Verify:** No errors in output.

### Step 6: Seed Database
1. Run seed scripts:
   ```bash
   npx tsx prisma/seed.ts
   ```
2. **Verify:** Seed completes without errors.

### Step 7: Validate Reconstruction
1. Run schema comparison:
   ```bash
   npx tsx scripts/recovery/compare-schema-v2.ts
   ```
2. **Verify:** 0 unexpected schema drift.
3. Run smoke tests:
   ```bash
   npx tsx scripts/recovery/smoke-tests.ts
   ```
4. **Verify:** 14/14 tests pass.

### Step 8: Validate Seeds
1. Run seed validation:
   ```bash
   npx tsx scripts/recovery/validate-seeds.ts
   ```
2. **Verify:** All expected seed data present.

## Rollback

If recovery fails at any step:

1. If Step 3 (reset) was executed and Step 4 (deploy) fails:
   - Check migration error messages
   - Fix the failing migration (add IF NOT EXISTS, DO $$ blocks)
   - Re-run `npx prisma migrate deploy`
   - If unfixable, contact founder

2. If Step 6 (seed) fails:
   - Check seed error messages
   - Fix seed script
   - Re-run seed

3. If Step 7 (validation) fails:
   - Check schema drift report
   - If forward-looking models (not yet in DB), acceptable
   - If missing tables, check migration order

## Verification

- [ ] All migrations applied successfully
- [ ] Prisma client generates without errors
- [ ] Schema comparison shows 0 unexpected drift
- [ ] Smoke tests pass 14/14
- [ ] Seed validation passes
- [ ] Application can connect to database

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| `P3009` migration error | Non-idempotent migration | Add `IF NOT EXISTS` or `DO $$ BEGIN ... END $$` |
| `P1001` connection error | Wrong DATABASE_URL or network | Check `.env` and Supabase status |
| Seed fails with unique constraint | Data already exists | Run `npx prisma migrate reset --force` first |
| Schema drift on forward-looking models | Models in schema not in migrations | Acceptable; not real drift |
| RLS blocks access | RLS enabled without policies | See ADR-002; disable RLS |

## Escalation

- Migration errors that can't be fixed → Engineering Lead
- Data loss risk → Founder (immediate)
- Production downtime → Founder (immediate) → See PB-V7 Incident Management
