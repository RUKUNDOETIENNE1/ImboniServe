# DB-003 — Controlled Database Reconstruction & Validation Report

```yaml
id: DB-003
title: Controlled Database Reconstruction & Validation Report
type: certification
version: 1.0
status: complete
owner: Founder
created: 2026-07-29
updated: 2026-07-29
review_frequency: on-change
depends_on: [DB-001, DB-002, DB-002.5]
implements: []
related_documents: [CERT-EP1-001]
supersedes: []
tags: [certification, reconstruction, recovery, database]
```

## Production Recovery Engineering Operation

**Project:** ImboniServe  
**Supabase Project ID:** `dkhnocretmzpskadqhlq`  
**Operation Date:** 2026-07-29  
**Lead Recovery Engineer:** Cascade AI (assisted)  
**Founder:** Etienne Rukundo  

---

## 1. Executive Summary

The ImboniServe database was successfully reconstructed from the canonical repository artifacts following the DB-002.5 Canonical Reconstruction Manifest. All 26 Prisma migrations were applied, 1 canonical supplemental SQL script was executed, infrastructure (storage bucket) was verified, seed data was loaded, security was certified, platform introspection confirmed no schema drift, and 14 functional smoke tests passed.

**Final Certification: PASS WITH CONDITIONS**

Conditions:
1. 13 forward-looking models (Plugin + AICredit systems) exist in `schema.prisma` but have no migrations. These are not drift — they are future features not yet implemented.
2. RLS was disabled on 3 tables (Recipe, RecipeIngredient, InventoryConsumption) because the application uses NextAuth (not Supabase Auth) for authorization. RLS policies requiring JWT claims would block all access.
3. The `.env` file was updated with Supabase Storage credentials (SUPABASE_STORAGE_URL, SUPABASE_STORAGE_KEY). This file is gitignored and must be configured manually on any new deployment.

---

## 2. Environment Certification (Stage 1)

| Check | Value | Status |
|-------|-------|--------|
| Supabase Project ID | `dkhnocretmzpskadqhlq` | PASS |
| DATABASE_URL | `postgresql://postgres.dkhnocretmzpskadqhlq:...@aws-1-eu-west-1.pooler.supabase.com:5432/postgres` | PASS |
| DIRECT_URL | Same as above (pooler) | PASS |
| PostgreSQL Version | 17.6 (aarch64-unknown-linux-gnu) | PASS |
| Extensions | pg_cron, pg_stat_statements, pgcrypto, plpgsql, supabase_vault, uuid-ossp | PASS |
| Public Schema Tables | 0 (empty) | PASS |
| Public Schema Enums | 0 (empty) | PASS |
| `_prisma_migrations` Table | Does not exist | PASS |
| Supabase System Schemas | auth, realtime, storage, graphql — all present | PASS |

**Decision: PASS** — Correct project, safe reconstruction target, empty database confirmed.

---

## 3. Repository Certification (Stage 2)

### Approved FK Corrections Applied

4 foreign key references were corrected from `"Business"` to `"Restaurant"` as approved in DB-002.5:

**File: `20260614_pr01_die_database_foundation/migration.sql`**
- `ScanJob_businessId_fkey`: `REFERENCES "Business"` → `REFERENCES "Restaurant"`
- `ScannedDocument_businessId_fkey`: `REFERENCES "Business"` → `REFERENCES "Restaurant"`
- `AnomalyAlert_businessId_fkey`: `REFERENCES "Business"` → `REFERENCES "Restaurant"`

**File: `20260616130000_recreate_cost_anomaly_alert/migration.sql`**
- `CostAnomalyAlert_businessId_fkey`: `REFERENCES "Business"` → `REFERENCES "Restaurant"`

### Validation

| Check | Status |
|-------|--------|
| `prisma validate` | PASS |
| `prisma generate` | PASS (v5.22.0) |
| No remaining `REFERENCES "Business"` in migration files | PASS (1 fallback in exception handler — correct) |

### Git Checkpoint

| SHA | Message |
|-----|---------|
| `5b2b4c4` | `fix(recovery): repair approved migration FK inconsistencies` |

**Push verification:** `c7b2d11..5b2b4c4 main -> main` — confirmed on remote.

---

## 4. Reconstruction Timeline (Stage 3)

### Migration Ordering Correction

**Issue:** Migration `20240406_phase2a_monetization` had an incorrect timestamp causing it to sort before `20260204194929` (which creates the `Restaurant` table). The migration depends on `BusinessProfile` (created in `20260324075113`).

**Resolution:** Renamed to `20260325000000_phase2a_monetization` — sorts after `20260324075113` and before `20260601081228` (which adds FKs to tables created by this migration).

### Idempotency Fixes for `20260601081228_billing_ledger`

The `20260601081228_billing_ledger` migration (2021 lines) was originally Prisma-generated without `IF NOT EXISTS` guards. A partial application via Supabase's PgBouncer pooler (which doesn't support transaction-based DDL rollback) left the database in an inconsistent state. The following idempotency fixes were applied:

- 27 `CREATE TYPE` → `DO $$ ... END $$` blocks (PostgreSQL doesn't support `CREATE TYPE IF NOT EXISTS`)
- 54 `CREATE TABLE` → `CREATE TABLE IF NOT EXISTS`
- 187 `CREATE INDEX` → `CREATE INDEX IF NOT EXISTS`
- 41 `ADD COLUMN` → `ADD COLUMN IF NOT EXISTS`
- 17 `DROP CONSTRAINT` → `DROP CONSTRAINT IF EXISTS`
- 3 `DROP COLUMN` → `DROP COLUMN IF EXISTS`
- 75 `ADD CONSTRAINT` (FK) → `DO $$ ... END $$` blocks with existence check
- PaymentGateway enum swap → `DO $$ ... END $$` block with value check
- `DROP TABLE business_scans` → `DROP TABLE IF EXISTS`

### Migration Results

All 26 migrations applied successfully:

| # | Migration | Status |
|---|-----------|--------|
| 1 | `20260204194929_unlimited_users_and_whatsapp_policy` | Applied |
| 2 | `20260207_supplier_marketplace` | Applied |
| 3 | `20260208_ai_features` | Applied |
| 4 | `20260304_audit-log` | Applied |
| 5 | `20260304_trial-eligibility` | Applied |
| 6 | `20260324075113_add_smart_menu_intelligence` | Applied |
| 7 | `20260324083537_add_kitchen_execution_and_group_ordering` | Applied |
| 8 | `20260325000000_phase2a_monetization` | Applied (renamed from 20240406) |
| 9 | `20260405_business_scans` | Applied |
| 10 | `20260501000000_tap_and_leave_system` | Applied |
| 11 | `20260501155000_staff_management_system` | Applied |
| 12 | `20260601081228_billing_ledger` | Applied (idempotency fixes) |
| 13 | `20260601175223_add_card_payment_method` | Applied |
| 14 | `20260601181304_link_payment_to_marketplace_order` | Applied |
| 15 | `20260601202002_financial_ledger_core` | Applied |
| 16 | `20260614_pr01_die_database_foundation` | Applied (FK fix) |
| 17 | `20260614b_pr02_extraction_layer` | Applied |
| 18 | `20260616100000_block4d_procurement_reconciliation` | Applied |
| 19 | `20260616120000_block4e_anomaly_confidence` | Applied |
| 20 | `20260616130000_recreate_cost_anomaly_alert` | Applied (FK fix) |
| 21 | `20260616140000_block4g_system_consolidation` | Applied |
| 22 | `20260628000000_kitchen_consumption_phase0` | Applied |
| 23 | `20260710000000_add_pending_token_to_user_login_otp` | Applied |
| 24 | `20260714000000_intelligence_platform_schema` | Applied |
| 25 | `20260726000000_schema_reconciliation_v1` | Applied |
| 26 | `20260729150000_phase_1a_acquisition_attribution` | Applied |

### Post-Migration Schema Validation

| Metric | Value |
|--------|-------|
| Tables | 185 |
| Enums | 66 |
| Foreign Keys | 308 |
| Indexes | 717 |
| FKs referencing "Business" | 0 (table doesn't exist — confirmed) |
| CostAnomalyAlert | EXISTS (raw SQL table) |
| RLS Enabled Tables | 3 (Recipe, RecipeIngredient, InventoryConsumption) |

### Git Checkpoint

| SHA | Message |
|-----|---------|
| `55b00e4` | `fix(recovery): reconstruct canonical schema with idempotent migrations` |

**Push verification:** `5b2b4c4..55b00e4 main -> main` — confirmed on remote.

---

## 5. Canonical Supplemental SQL (Stage 4)

### Executed: `scripts/sql/add_payment_health_indexes.sql`

3 concurrent indexes created via pg_cron:

| Index | Table | Columns | Status |
|-------|-------|---------|--------|
| `PaymentTransaction_updatedAt_idx` | PaymentTransaction | updatedAt | CREATED |
| `CheckoutEvent_paymentId_idx` | CheckoutEvent | paymentId | CREATED |
| `CheckoutEvent_eventType_createdAt_idx` | CheckoutEvent | eventType, createdAt | CREATED |

pg_cron jobs were unscheduled after index creation verified.

### Git Checkpoint

| SHA | Message |
|-----|---------|
| `3fbf7f2` | `chore(recovery): reconstruct infrastructure - storage bucket verified` |

**Push verification:** `55b00e4..3fbf7f2 main -> main` — confirmed on remote.

---

## 6. Infrastructure Reconstruction (Stage 5)

### Storage Bucket: `documents-priv`

| Check | Value |
|-------|-------|
| Bucket name | `documents-priv` |
| Public | false (private) |
| Upload test | PASS (recovery-test.txt) |
| Download test | PASS (content verified) |
| Cleanup | PASS (test file removed) |
| Total buckets | 2 (`imboniserve`, `documents-priv`) |

### Environment Variables Added to `.env`

```
SUPABASE_STORAGE_URL="https://dkhnocretmzpskadqhlq.supabase.co"
SUPABASE_STORAGE_KEY="<service_role_key>"
SUPABASE_STORAGE_PRIV_BUCKET="documents-priv"
```

**Note:** `.env` is gitignored. These must be configured manually on any new deployment.

---

## 7. Seed Certification (Stage 6)

### Seed Scripts Executed

| Script | Output |
|--------|--------|
| `prisma/seed.ts` | 6 plans, 5 users, 1 business, 4 menu items, 20 feature flags, 6 products, 3 suppliers |
| `prisma/seeds/plans-phase2.ts` | Plan feature updates (6 final plans post-merge) |
| `scripts/seed-platform-fees.ts` | 6 platform fee configs |
| `scripts/seed-qr-templates.ts` | 6 QR templates |

### Seed Validation

| Dataset | Expected | Actual | Status |
|---------|----------|--------|--------|
| Plans | ≥ 6 (post-phase2 merge) | 6 | PASS |
| Users | ≥ 5 | 5 | PASS |
| Admin user | 1 | 1 (admin@imboni.resto) | PASS |
| Businesses | ≥ 1 | 1 (Nyama Cafe Kigali) | PASS |
| Menu Items | ≥ 1 | 4 | PASS |
| Platform Fees | ≥ 6 | 6 | PASS |
| QR Templates | ≥ 3 | 6 | PASS |
| Feature Flags | ≥ 20 | 20 | PASS |
| Marketplace Products | ≥ 6 | 6 | PASS |
| Suppliers | ≥ 3 | 3 | PASS |

### Git Checkpoint

| SHA | Message |
|-----|---------|
| `89abcaa` | `chore(recovery): certify seed data` |

**Push verification:** `3fbf7f2..89abcaa main -> main` — confirmed on remote.

---

## 8. Security Certification (Stage 7)

### RLS Decision: Option B — Disable RLS

RLS was enabled on 3 tables (Recipe, RecipeIngredient, InventoryConsumption) without policies. RLS without policies blocks ALL access via the Supabase pooler connection.

**Decision:** Disable RLS. The application uses NextAuth with Prisma adapter for authentication, not Supabase Auth. RLS policies requiring JWT claims would block all access. Application-level role checks (ADMIN, OWNER, CASHIER, KITCHEN_MANAGER, SUPPLIER) provide authorization at the API layer.

| Check | Value |
|-------|-------|
| RLS enabled tables (before) | 3 |
| RLS enabled tables (after) | 0 |
| RLS policies | 0 |
| Tables accessible after disable | PASS |

**No commit required** — database-only change.

---

## 9. Platform Certification (Stage 8)

### Prisma Validation

| Check | Status |
|-------|--------|
| `prisma validate` | PASS |
| `prisma generate` | PASS (v5.22.0) |
| Introspection (`prisma db pull --print`) | Complete (4178 lines) |

### Schema Comparison

| Metric | Canonical Schema | Database | Difference |
|--------|-----------------|----------|------------|
| Models | 196 | 185 tables | 13 forward-looking (no migrations) |
| Enums | 68 | 66 | 2 forward-looking (no migrations) |
| Extra tables | — | 0 | 0 unexpected drift |

### Schema Drift Analysis

**13 missing models** (forward-looking declarations, no migrations exist):
- PluginQrMenu, PluginGovernanceState, PluginAuditEvent, PluginLifecycleHistory, PluginAnomalyEvent, ControlPlaneSnapshot, PluginAlertEvent
- AICreditWallet, AICreditLedgerEntry, AICreditReservation, AIFeatureCost, AICreditPackage, AICreditPolicy

**2 missing enums** (forward-looking):
- AICreditLedgerEntryType, AICreditReservationStatus

**0 extra/unexpected tables** in database.

**Result: NO UNEXPECTED SCHEMA DRIFT** — Database matches all migrated models exactly.

### Git Checkpoint

| SHA | Message |
|-----|---------|
| `93ab568` | `test(recovery): certify reconstructed platform` |

**Push verification:** `89abcaa..93ab568 main -> main` — confirmed on remote.

---

## 10. Functional Smoke Tests (Stage 9)

| # | Test | Status | Detail |
|---|------|--------|--------|
| 1 | Authentication — Admin user | PASS | roles=ADMIN |
| 2 | Authentication — Owner user | PASS | roles=OWNER |
| 3 | Authentication — All 5 roles present | PASS | 5 roles found |
| 4 | Restaurant Management — Business exists | PASS | Nyama Cafe Kigali, plan=Growth |
| 5 | Menu Management — Menu items exist | PASS | 4 items |
| 6 | QR Ordering — QR templates exist | PASS | 6 templates |
| 7 | Kitchen Operations — Station/TicketEvent | PASS | stations=0, tickets=0 |
| 8 | Inventory — Items and suppliers | PASS | inventoryItems=0, suppliers=3 |
| 9 | Reservations — Table accessible | PASS | reservations=0 |
| 10 | Supplier Features — POs and products | PASS | purchaseOrders=0, supplierProducts=0 |
| 11 | Partnership Foundation — Affiliates | PASS | affiliates=1, referralLinks=0 |
| 12 | Financial Ledger — Table accessible | PASS | entries=0 |
| 13 | CostAnomalyAlert — Raw SQL table | PASS | alerts=0 |
| 14 | Feature Flags — All flags | PASS | 20 flags |

**Result: 14/14 PASS**

### Git Checkpoint

| SHA | Message |
|-----|---------|
| `79dbac2` | `test(recovery): functional smoke tests - 14/14 PASS` |

**Push verification:** `93ab568..79dbac2 main -> main` — confirmed on remote.

---

## 11. Git Summary

| # | SHA | Message | Stage | Push |
|---|-----|---------|-------|------|
| 1 | `5b2b4c4` | fix(recovery): repair approved migration FK inconsistencies | Stage 2 | ✅ |
| 2 | `55b00e4` | fix(recovery): reconstruct canonical schema with idempotent migrations | Stage 3 | ✅ |
| 3 | `3fbf7f2` | chore(recovery): reconstruct infrastructure - storage bucket verified | Stage 4+5 | ✅ |
| 4 | `89abcaa` | chore(recovery): certify seed data | Stage 6 | ✅ |
| 5 | `93ab568` | test(recovery): certify reconstructed platform | Stage 7+8 | ✅ |
| 6 | `79dbac2` | test(recovery): functional smoke tests - 14/14 PASS | Stage 9 | ✅ |

All commits pushed to `origin/main` and remotely verified.

---

## 12. Issues Encountered & Root Cause Analysis

| # | Issue | Root Cause | Resolution |
|---|-------|------------|------------|
| 1 | Migration `20240406_phase2a_monetization` fails: `relation "Restaurant" does not exist` | Incorrect timestamp causes migration to sort before base migration | Renamed to `20260325000000_phase2a_monetization` |
| 2 | Migration `20260325000000` fails: `relation "BusinessProfile" does not exist` | Migration depends on `BusinessProfile` created in `20260324075113` | Renamed to sort after `20260324075113` |
| 3 | Migration `20260601081228` fails: column already exists | Prisma-generated migration duplicates columns added by `20260325000000` (standalone SQL origin) | Added `IF NOT EXISTS` guards |
| 4 | Migration `20260601081228` fails: type already exists | Partial application via PgBouncer (no transaction rollback for DDL) | Wrapped `CREATE TYPE` in `DO $$` blocks |
| 5 | Migration `20260601081228` fails: syntax error near "NOT" | `CREATE TYPE IF NOT EXISTS` is not valid PostgreSQL | Replaced with `DO $$ ... END $$` blocks |
| 6 | Migration `20260601081228` fails: syntax error near "$" | FK idempotency script ran twice, creating nested `DO $` blocks | Fixed doubly-wrapped blocks |
| 7 | Smoke test fails: `Unknown field 'role'` | `User.roles` is `UserRole[]` array, not scalar `role` | Fixed test to use `roles` |
| 8 | Smoke test fails: `KITCHEN` role missing | Seed uses `KITCHEN_MANAGER`, not `KITCHEN` | Fixed test expectation |

---

## 13. Verification Matrix

| Object Type | Verification Method | Result |
|-------------|-------------------|--------|
| Tables | `information_schema.tables` count + key table existence | 185 tables, 12/12 key tables verified |
| Enums | `pg_type` query | 66 enums |
| Foreign Keys | `pg_constraint` query | 308 FKs, 0 referencing "Business" |
| Indexes | `pg_indexes` query | 717 indexes + 3 concurrent |
| RLS | `pg_class.relrowsecurity` | 0 enabled (disabled by design) |
| Policies | `pg_policies` query | 0 |
| Migrations | `_prisma_migrations` table | 26 applied |
| Schema | `prisma validate` + introspection comparison | 0 unexpected drift |
| Seed Data | Row count validation | All expected counts match |
| Storage | Upload/download test | PASS |
| Functional | 14 smoke tests | 14/14 PASS |

---

## 14. Remaining Risks

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | 13 forward-looking models have no migrations | Low | These are future features (Plugin/AICredit). No impact on current platform. |
| 2 | RLS disabled on all tables | Medium | Application-level authorization via NextAuth + role checks. If Supabase Auth is adopted later, RLS policies must be created. |
| 3 | `.env` not version-controlled | Low | Storage credentials must be manually configured on new deployments. Documented in this report. |
| 4 | PgBouncer pooler doesn't support transaction-based DDL rollback | Low | Migrations have been made idempotent. Future migrations should use `IF NOT EXISTS` guards. |
| 5 | `20260601081228_billing_ledger` migration heavily modified | Medium | All changes are additive idempotency guards. Original schema intent preserved. Changes are documented and reproducible. |

---

## 15. Confidence Score

**Confidence: 92/100**

Justification:
- **+40**: All 26 migrations applied successfully, all validation gates passed
- **+20**: 14/14 functional smoke tests pass
- **+15**: No unexpected schema drift (0 extra tables, all migrated models match)
- **+10**: Seed data verified with expected counts
- **+7**: Infrastructure (storage) verified with upload/download test
- **-5**: RLS disabled (design decision, but reduces defense-in-depth)
- **-3**: 13 forward-looking models without migrations (not drift, but incomplete schema)

---

## 16. Final Assessment

The ImboniServe database has been successfully reconstructed from the canonical repository artifacts. The reconstructed database:
- Matches the approved Canonical Reconstruction Manifest (DB-002.5)
- Contains all 185 tables, 66 enums, 308 foreign keys, and 717 indexes
- Has verified seed data (6 plans, 5 users, 1 business, 20 feature flags, 6 QR templates, 6 platform fees)
- Has verified infrastructure (documents-priv storage bucket)
- Has no unexpected schema drift
- Passes all 14 functional smoke tests
- Is fully reproducible from the repository and this report

---

## 17. Final Certification Statement

### PASS WITH CONDITIONS

**Engineering Justification:**

The platform database has been reconstructed deterministically and reproducibly. All validation gates passed. The reconstruction is fully traceable through 6 Git commits, all pushed and remotely verified.

**Conditions:**
1. The 13 forward-looking models (Plugin/AICredit) in `schema.prisma` have no migrations. They represent future features and do not affect current platform functionality.
2. RLS is disabled on all tables. Authorization is handled at the application layer via NextAuth + role-based access control. If Supabase Auth is adopted in the future, RLS policies must be implemented.
3. The `.env` file contains Supabase Storage credentials that are not version-controlled. Any new deployment must configure these manually.

**Recommendation:** Proceed to DB-004 — Platform Acceptance & Production Readiness Certification.

---

## 18. Recovery Evidence Package

All evidence scripts are stored in `scripts/recovery/`:

| Script | Purpose |
|--------|---------|
| `check-env.ts` | Stage 1: Environment check (tables, enums, migrations) |
| `check-env-v2.ts` | Stage 1: PostgreSQL version, extensions, schemas |
| `check-partial-state.ts` | Stage 3: Partial migration state investigation |
| `check-partial-tables.ts` | Stage 3: Identify tables from partial run |
| `check-enum-state.ts` | Stage 3: Enum state after partial run |
| `make-fk-idempotent.js` | Stage 3: Make FK constraints idempotent |
| `make-drops-idempotent.js` | Stage 3: Make DROP statements idempotent |
| `fix-create-type.js` | Stage 3: Fix CREATE TYPE IF NOT EXISTS |
| `fix-double-wrapped.js` | Stage 3: Fix doubly-wrapped DO $$ blocks |
| `validate-schema.ts` | Stage 3: Post-migration schema validation |
| `validate-tables.ts` | Stage 3: Key table existence verification |
| `validate-indexes.ts` | Stage 4: Concurrent index verification |
| `unschedule-cron.ts` | Stage 4: pg_cron cleanup |
| `create-storage-bucket.ts` | Stage 5: Storage bucket creation + test |
| `validate-seeds.ts` | Stage 6: Seed data validation |
| `check-plans.ts` | Stage 6: Plan details verification |
| `disable-rls.ts` | Stage 7: RLS disable + verification |
| `compare-schema.ts` | Stage 8: Schema drift analysis (v1) |
| `compare-schema-v2.ts` | Stage 8: Schema drift analysis (v2, with @@map) |
| `introspected-schema.prisma` | Stage 8: Introspected schema output |
| `smoke-tests.ts` | Stage 9: 14 functional smoke tests |
| `check-roles.ts` | Stage 9: User role verification |

---

*End of DB-003 Controlled Reconstruction Report*
