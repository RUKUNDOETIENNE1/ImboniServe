# PE-001 Production Database Establishment Report

| Field | Value |
|---|---|
| Date | 2026-08-10 |
| Status | **FOUNDER ACTION REQUIRED — Production database not yet created** |

## Current Database State (Dev/Verification)

| Item | Value |
|---|---|
| Provider | Supabase (managed PostgreSQL) |
| Project ref | dkhnocretmzpskadqhlq |
| Region | eu-west-1 |
| Connection | Pooler (DATABASE_URL) + Direct (DIRECT_URL) |
| Tables | 198 base tables in public schema |
| Migrations applied | 29 |
| Migrations pending | 0 |
| Migrations rolled back (historical) | 6 |
| Prisma schema | Compatible — all models queryable |
| Data | 3 test businesses, 5 test users, test orders/sales/payments/reservations |

## Prisma Configuration

| Item | Value |
|---|---|
| Provider | postgresql |
| Engine type | binary |
| Binary targets | native, debian-openssl-3.0.x |
| Preview features | multiSchema |
| URL | env("DATABASE_URL") |
| Direct URL | env("DIRECT_URL") |

## Migration History (Recent)

| Migration | Status | Date |
|---|---|---|
| 20260801000000_rc001_index_remediation | APPLIED | Recent |
| 20260731090000_pp001_partnership_platform | APPLIED | Recent |
| 20260731050000_p0_consistency_remediation | APPLIED | Recent |
| 20260729150000_phase_1a_acquisition_attribution | APPLIED | Recent |
| 20260726000000_schema_reconciliation_v1 | APPLIED | Recent |
| 20260714000000_intelligence_platform_schema | APPLIED | Recent |
| 20260710000000_add_pending_token_to_user_login_otp | APPLIED | Recent |
| 20260628000000_kitchen_consumption_phase0 | APPLIED | Recent |
| 20260616140000_block4g_system_consolidation | APPLIED | Recent |
| 20260616130000_recreate_cost_anomaly_alert | APPLIED | Recent |

Rolled-back migrations (historical, not blocking):
- 20260601081228_billing_ledger (4 attempts, all rolled back on 2026-07-29)
- 20260205_phase2a_monetization (rolled back 2026-07-29)
- 20240406_phase2a_monetization (rolled back 2026-07-29)

## Production Database Establishment Plan

### Step 1: Create Production Supabase Project (FOUNDER ACTION)

| Item | Requirement |
|---|---|
| Project name | imboniserve-production (or similar) |
| Region | eu-west-1 (same as dev, closest to Rwanda) |
| Plan | Pro tier ($25/mo) — required for daily backups + point-in-time recovery |
| Database password | Generate strong password, store in password manager |
| Connection string | Save as DATABASE_URL and DIRECT_URL for production env |

### Step 2: Apply Migrations

```bash
# Set DATABASE_URL and DIRECT_URL to production project
npx prisma migrate deploy
# Verify
npx prisma migrate status
```

**Expected result:** All 29 migrations applied, 0 pending.

### Step 3: Verify Schema Compatibility

```bash
npx prisma validate
npx prisma generate
```

**Expected result:** Schema valid, client generated successfully.

### Step 4: Verify Clean State

```sql
-- Production database should have:
-- 0 businesses
-- 0 users
-- 0 orders
-- 0 sales
-- All tables present but empty
```

**Do NOT run seed scripts against production.** Production starts clean.

### Step 5: Configure Backup (FOUNDER ACTION)

| Item | Requirement |
|---|---|
| Automated daily backups | Enable in Supabase dashboard (Pro tier) |
| Point-in-time recovery | Enable (Pro tier, 7-day retention) |
| Backup verification | Check Supabase dashboard for backup history |
| Recovery procedure | Document in runbooks/RB-001_DATABASE_RECOVERY.md (already exists) |

### Step 6: Configure Access Controls (FOUNDER ACTION)

| Item | Requirement |
|---|---|
| Database access | Restrict to production deployment + founder only |
| Connection pooling | Use pooler URL for app, direct URL for migrations |
| IP restrictions | Consider restricting to Vercel IPs + founder IP |

## Migration Strategy

| Scenario | Strategy |
|---|---|
| Initial setup | `prisma migrate deploy` against clean production DB |
| Future schema changes | Create new migration → test in dev → deploy to production via `prisma migrate deploy` |
| Never use | `prisma migrate reset` (destructive) |
| Never use | `prisma db push` (bypasses migration history) |

## Seed Mechanism

| Script | Purpose | Production Use |
|---|---|---|
| `prisma/seed.ts` | Seeds dev data (plans, test businesses) | NOT FOR PRODUCTION |
| `scripts/updatePlans.ts` | Updates subscription plans | REVIEW: may be needed for production plan setup |
| `scripts/seed-qr-templates.ts` | Seeds QR templates | REVIEW: may be needed for production |

**FOUNDER ACTION:** Determine which seed scripts (if any) should run against production. At minimum, subscription plans must be created in the production database.

## Connection Architecture

```
Vercel Production Deployment
  ├── DATABASE_URL (pooler connection)
  │   └── Used by: Application runtime (Prisma client)
  └── DIRECT_URL (direct connection)
      └── Used by: Prisma migrations (prisma migrate deploy)
```

Both URLs must point to the PRODUCTION Supabase project, not the dev project.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Accidental dev DB connection in production | Verify DATABASE_URL in Vercel env vars points to production project |
| Migration failure on production | Test migrations in dev first; `prisma migrate deploy` is safe (only applies pending) |
| Data loss | Production starts clean; no data to lose; backups enabled from day 1 |
| Schema drift | `prisma migrate status` before each deploy; never use `db push` |

## Conclusion

The production database must be a dedicated Supabase project, separate from the dev/verification environment. The schema is ready (29 migrations, all applied). The founder must:
1. Create the production Supabase project
2. Apply migrations
3. Verify clean state
4. Configure backups
5. Configure access controls
6. Determine which seed scripts (if any) to run for production plan setup

**Status: FOUNDER ACTION REQUIRED — Production database not yet created.**
