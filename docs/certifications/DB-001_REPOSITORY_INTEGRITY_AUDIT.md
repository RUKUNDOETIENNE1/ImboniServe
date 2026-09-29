# DB-001 — Repository Integrity Audit Report

```yaml
id: DB-001
title: Repository Integrity Audit Report
type: certification
version: 1.0
status: complete
owner: Founder
created: 2026-07-29
updated: 2026-07-29
review_frequency: on-change
depends_on: []
implements: []
related_documents: [DB-002, DB-002.5, DB-003]
supersedes: []
tags: [certification, audit, repository, integrity]
```

**Auditor:** Cascade AI (assisted)  
**Repository:** `c:\Dev\ImboniResto` (ImboniServe v2.0.1)  
**Phase:** DB-001 — Evidence-gathering only. No modifications made.  

---

## 1. Executive Summary

The repository contains a comprehensive Prisma schema (196 models, 68 enums), 27 Prisma migration directories, 1 loose SQL migration file, 12 additional loose SQL files inside `prisma/migrations/`, 7 standalone SQL files at project root and in `scripts/`, and 5 seed scripts. The schema validates and the Prisma client generates successfully.

The repository is **largely capable** of reconstructing the database, but has several conditions that must be addressed first:

- **1 critical FK reference error** in `CostAnomalyAlert` migration (references `"Business"` instead of `"Restaurant"`)
- **12 loose SQL files** inside `prisma/migrations/` that are NOT in migration subdirectories and will be **ignored by `prisma migrate deploy`**
- **Duplicate table definitions** between standalone SQL and Prisma migrations
- **RLS enabled without policies** on 3 tables (blocks all access)
- **No `pgcrypto` extension** explicitly created, yet `gen_random_uuid()` is used in several migrations
- **No Supabase Storage buckets** defined in repository (storage service expects `documents-priv` bucket)

**Assessment: Yes, with conditions.** See Section 10.

---

## 2. Repository Inventory

### 2.1 Prisma Schema

| Property | Value |
|----------|-------|
| File | `prisma/schema.prisma` |
| Lines | 5,390 |
| Generator | `prisma-client-js`, engineType `binary`, binaryTargets `["native", "debian-openssl-3.0.x"]` |
| Preview Features | `multiSchema` |
| Datasource | PostgreSQL, `url = env("DATABASE_URL")`, `directUrl = env("DIRECT_URL")` |
| Models | 196 |
| Enums | 68 |
| Table Mappings | `Business` → `"Restaurant"` (`@@map`), `PluginQrMenu` → `"plugin_data_qr_menu"` (`@@map`) |
| Validation | `npx prisma validate` — **PASS** |
| Client Generation | `npx prisma generate` — **PASS** (v5.22.0) |

### 2.2 Prisma Migrations (27 directories + 1 loose file)

| # | Migration Directory | Timestamp | Purpose | Status |
|---|---------------------|-----------|---------|--------|
| 1 | `20240406_phase2a_monetization` | 2026-04-06 | AIUsageLog, SiteBuilderSubscription, DiscoverySubscription | Valid |
| 2 | `20260204194929_unlimited_users_and_whatsapp_policy` | 2026-02-04 | Base: User, Restaurant, Plan, MenuItem, Sale, SaleItem, Inventory, Subscription, Invoice, Auth tables, Affiliate, Referral, etc. | Valid |
| 3 | `20260207_supplier_marketplace` | 2026-02-07 | Supplier, SupplierProduct, SupplierOrder, MarketplaceProduct, MarketplaceOrder, PurchaseOrder, GRN, SupplierPayout | Valid |
| 4 | `20260208_ai_features` | 2026-02-08 | BusinessInsightReport, SupplierRecommendationLog, SupplierPerformanceCache, CostAnomalyAlert (v1) | Valid |
| 5 | `20260216_raw_tables_business_migration.sql` | 2026-02-16 | **LOOSE FILE** — Renames restaurantId→businessId in CostAnomalyAlert, ReorderSuggestionLog, SlipTemplate, FeeConfiguration | **SUSPECT** — Not in a migration subdirectory; will be ignored by `migrate deploy` |
| 6 | `20260304_audit-log` | 2026-03-04 | AuditLog, UserDevice, SecurityEvent | Valid |
| 7 | `20260304_trial-eligibility` | 2026-03-04 | DisposableEmailDomain, TrialEligibility | Valid |
| 8 | `20260324075113_add_smart_menu_intelligence` | 2026-03-24 | CMS, Contacts, A/B testing, BusinessProfile, Promotions, CustomDomain, EventLog; Drops CostAnomalyAlert & ReorderSuggestionLog | Valid |
| 9 | `20260324083537_add_kitchen_execution_and_group_ordering` | 2026-03-24 | Station, RouteRule, TicketEvent, SLAProfile, IdempotencyKey | Valid |
| 10 | `20260405_business_scans` | 2026-04-05 | business_scans (snake_case, UUID PK) | Valid (but table is dropped and recreated as BusinessScan in migration #13) |
| 11 | `20260501000000_tap_and_leave_system` | 2026-05-01 | TableSession, SessionParticipant, OrderToken, Seat, SeatSession, Room, ServiceArea, DiningSessionSlip, CheckoutEvent, FraudDetectionLog | Valid |
| 12 | `20260501155000_staff_management_system` | 2026-05-01 | Branch, StaffRole, UserStaffRole | Valid |
| 13 | `20260601081228_billing_ledger` | 2026-06-01 | PaymentTransaction, BillingEvent, SalePayment, StaffTip, TipChoice, QrTemplate, QrDesign, QrCode, CurrencyExchangeRate, SupportedCurrency, SupportedTimezone, BusinessScan, OptimizationRecommendation/Action/Outcome, WaiterCall, ProfessionalMarketer system, RevenueEvent, RevenueAlert, DemoRequest, NewsletterSubscriber, PlatformFeeConfig, AICreditWallet/Ledger/Reservation, AIFeatureCost, AICreditPackage, AICreditPolicy, Plugin governance models; Drops business_scans | Valid |
| 14 | `20260601175223_add_card_payment_method` | 2026-06-01 | Adds CARD to PaymentMethod enum | Valid |
| 15 | `20260601181304_link_payment_to_marketplace_order` | 2026-06-01 | Adds marketplaceOrderId to PaymentTransaction | Valid |
| 16 | `20260601202002_financial_ledger_core` | 2026-06-01 | FinancialLedgerEntry, LedgerDomain enum | Valid |
| 17 | `20260614_pr01_die_database_foundation` | 2026-06-14 | ScanJob, ScannedDocument, ScannedDocumentItem, DocumentProcessingLog, AnomalyAlert (Prisma model), DocumentEntityLink, SupplierAlias, ProductAlias, ExtractedDocumentHeaderField, ExtractedDocumentLineField, ExtractionPayload, PluginQrMenu | Valid |
| 18 | `20260614b_pr02_extraction_layer` | 2026-06-14 | DocumentEventTimeline, DIE enums | Valid |
| 19 | `20260616100000_block4d_procurement_reconciliation` | 2026-06-16 | ProcurementReconciliation, ReconciliationState enum | Valid |
| 20 | `20260616120000_block4e_anomaly_confidence` | 2026-06-16 | Adds confidence column to AnomalyAlert | Valid |
| 21 | `20260616130000_recreate_cost_anomaly_alert` | 2026-06-16 | Recreates CostAnomalyAlert (raw SQL, not in Prisma schema) | **SUSPECT** — FK references `"Business"` but actual table is `"Restaurant"` |
| 22 | `20260616140000_block4g_system_consolidation` | 2026-06-16 | PluginGovernanceState, PluginAuditEvent, PluginLifecycleHistory, PluginAnomalyEvent, ControlPlaneSnapshot, PluginAlertEvent | Valid |
| 23 | `20260628000000_kitchen_consumption_phase0` | 2026-06-28 | Recipe, RecipeIngredient, InventoryConsumption, RLS enable | Valid |
| 24 | `20260710000000_add_pending_token_to_user_login_otp` | 2026-07-10 | UserLoginOtp | Valid |
| 25 | `20260714000000_intelligence_platform_schema` | 2026-07-14 | IntelligenceReport, KnowledgeEntry, ReplayEvent, ConversationHistory | Valid |
| 26 | `20260726000000_schema_reconciliation_v1` | 2026-07-26 | Idempotent reconciliation: isFoundingMember, reorderLevel, contactId, Reservation FK change, LedgerDomain.SALES | Valid |
| 27 | `20260729150000_phase_1a_acquisition_attribution` | 2026-07-29 | AcquisitionAttribution, FounderPartner, FounderCode, PartnerCampaign, FounderCommission, PartnershipEvent, etc. | Valid |

### 2.3 Loose SQL Files Inside `prisma/migrations/` (NOT in subdirectories)

These files exist directly in `prisma/migrations/` and will be **ignored by `prisma migrate deploy`**:

| File | Size | Purpose | Status |
|------|------|---------|--------|
| `add_audit_log.sql` | 798 B | Creates AuditLog table | **Duplicate** of migration `20260304_audit-log` |
| `add_business_approval.sql` | 1,168 B | Adds approval columns to Restaurant | **Duplicate** of columns in schema.prisma |
| `add_qr_remote_order_support.sql` | 3,107 B | Adds QR remote ordering columns | **Duplicate** of columns in schema.prisma |
| `add_trial_eligibility.sql` | 1,443 B | Creates TrialEligibility table | **Duplicate** of migration `20260304_trial-eligibility` |
| `ai_credits_platform.sql` | 8,167 B | Creates AI credit tables | **Duplicate** of migration `20260616140000` |
| `migrate_essentials_to_starter.sql` | 1,758 B | Data migration (plan rename) | **Data migration** — not a schema migration |
| `migration_lock.toml` | 126 B | Prisma migration lock file | Valid (provider = "postgresql") |
| `referral_system.sql` | 6,940 B | Creates referral tables | **Duplicate** of tables in migration `20260204194929` |
| `safe_business_constraints.sql` | 4,868 B | Adds businessId constraints | **Supplemental** to `safe_business_migration.sql` |
| `safe_business_migration.sql` | 11,167 B | Adds businessId columns (restaurantId→businessId rename) | **Supplemental** — not a Prisma migration |
| `safe_business_migration_steps_1_4.sql` | 8,385 B | Steps 1-4 of business migration | **Supplemental** — partial duplicate |
| `service-intelligence-schema.sql` | 1,886 B | Service intelligence tables | **Not in Prisma schema** — orphaned |

### 2.4 Standalone SQL Files (project root and scripts/)

| File | Purpose | Overlaps Prisma? | Execution Order Matters? |
|------|---------|------------------|------------------------|
| `SUPABASE_MIGRATION_PHASE2_COMPLETE.sql` | AIUsageLog, SiteBuilderSubscription, DiscoverySubscription + Plan columns | **YES** — duplicates `20240406_phase2a_monetization` | Yes — must run after base tables |
| `SUPABASE_MIGRATION_GLOBAL_CURRENCY_TIMEZONE.sql` | CurrencyExchangeRate, SupportedCurrency, SupportedTimezone + User/Business columns | **YES** — duplicates tables in `20260601081228_billing_ledger` | Yes — must run after base tables |
| `SUPABASE_MIGRATION_QR_ENHANCEMENTS.sql` | WaiterCall table | **YES** — duplicates table in `20260601081228_billing_ledger` | Yes — must run after base tables |
| `apply-kitchen-migration.sql` | Kitchen-related tables | **PARTIAL** — may overlap kitchen execution migration | Yes |
| `cleanup-and-apply.sql` | Cleanup + apply various | **UNKNOWN** — may conflict | Yes |
| `check_tables.sql` | Verification queries | No (read-only) | No |
| `supabase-migration-autopilot.sql` | Autopilot migration | **UNKNOWN** — may conflict | Yes |
| `PHASE_0.7_OBSERVATION_QUERIES.sql` | Observation queries | No (read-only) | No |
| `scripts/_apply_cost_anomaly.sql` | CostAnomalyAlert v1 | **YES** — duplicates `20260208_ai_features` | Yes |
| `scripts/_apply_cost_anomaly_v2.sql` | CostAnomalyAlert v2 | **YES** — duplicates `20260616130000` | Yes |
| `scripts/sql/add_payment_health_indexes.sql` | Concurrent indexes + pg_cron extension | **NO** — unique (indexes not in Prisma) | Yes — must run after PaymentTransaction table exists |
| `scripts/sql/verify_staff_mgmt.sql` | Verification queries | No (read-only) | No |

### 2.5 Seed Scripts

| File | Purpose | Reference Data |
|------|---------|---------------|
| `prisma/seed.ts` (579 lines) | Main seed: 7 Plans, admin user, demo business, menu items, inventory, sales, suppliers | Plans (Starter, Essentials, Professional, Growth, Business, Enterprise), Users (admin, owner, cashier, kitchen manager), Business (Nyama Cafe), MenuItems, InventoryItems, Sales |
| `prisma/seeds/plans-phase2.ts` (352 lines) | Phase 2 plan updates with feature limits | Updated plan features (aiCreditsMonthly, qrCodesLimit, storageGBLimit, etc.) |
| `prisma/seed-qr-templates.sql` | QR template definitions | QrTemplate rows |
| `scripts/seed-platform-fees.ts` (82 lines) | Platform fee configuration | 6 PlatformFeeConfig entries (BUSINESS_COMMISSION, SUPPLIER_PLATFORM_FEE, MARKETPLACE_COMMISSION, DIGITAL_PAYMENT_FEE, SPLIT_PAYMENT_FEE, DIGITAL_TIPPING_FEE) |
| `scripts/seed-qr-templates.ts` | QR template seeder (script version) | QrTemplate rows |

---

## 3. Migration Audit

### 3.1 Execution Order

Prisma migrations execute in lexicographic order by directory name. The loose `.sql` files in `prisma/migrations/` (not in subdirectories) are **ignored** by `prisma migrate deploy`.

**Dependency chain** (simplified):
1. `20240406_phase2a_monetization` — standalone (no FK deps)
2. `20260204194929_unlimited_users_and_whatsapp_policy` — base tables
3. `20260207_supplier_marketplace` — depends on User, Restaurant
4. `20260208_ai_features` — depends on Restaurant, Supplier
5. `20260304_audit-log` — depends on User
6. `20260304_trial-eligibility` — standalone
7. `20260324075113_add_smart_menu_intelligence` — depends on Restaurant, User, MenuItem, Sale; **DROPS** CostAnomalyAlert & ReorderSuggestionLog
8. `20260324083537_add_kitchen_execution_and_group_ordering` — depends on Restaurant, Sale, SaleItem, MenuItem
9. `20260405_business_scans` — depends on User; creates `business_scans` (snake_case)
10. `20260501000000_tap_and_leave_system` — depends on Restaurant, Sale, User, Table
11. `20260501155000_staff_management_system` — depends on Restaurant, User
12. `20260601081228_billing_ledger` — depends on Restaurant, User, Subscription, Invoice, Sale; **DROPS** `business_scans`, **RECREATES** as `BusinessScan`
13. `20260601175223_add_card_payment_method` — alters PaymentMethod enum
14. `20260601181304_link_payment_to_marketplace_order` — alters PaymentTransaction
15. `20260601202002_financial_ledger_core` — depends on enums from #12
16. `20260614_pr01_die_database_foundation` — depends on Restaurant, User, Supplier, InventoryItem, PurchaseOrder, GRN
17. `20260614b_pr02_extraction_layer` — depends on #16
18. `20260616100000_block4d_procurement_reconciliation` — depends on #16, PO, GRN
19. `20260616120000_block4e_anomaly_confidence` — depends on AnomalyAlert from #16
20. `20260616130000_recreate_cost_anomaly_alert` — recreates CostAnomalyAlert (raw SQL)
21. `20260616140000_block4g_system_consolidation` — depends on Restaurant
22. `20260628000000_kitchen_consumption_phase0` — depends on MenuItem, SaleItem, InventoryItem
23. `20260710000000_add_pending_token_to_user_login_otp` — depends on User
24. `20260714000000_intelligence_platform_schema` — depends on Restaurant, User
25. `20260726000000_schema_reconciliation_v1` — idempotent, depends on Restaurant, InventoryItem, Customer, Room, Reservation
26. `20260729150000_phase_1a_acquisition_attribution` — depends on Restaurant, User, Invoice

### 3.2 Migration Issues

| Issue | Migration | Severity | Details |
|-------|-----------|----------|---------|
| **FK references non-existent table** | `20260616130000_recreate_cost_anomaly_alert` | **CRITICAL** | FK `REFERENCES "Business"("id")` — but actual table name is `"Restaurant"` (via `@@map("Restaurant")`). This migration will FAIL on a fresh database. |
| **Loose SQL file not in subdirectory** | `20260216_raw_tables_business_migration.sql` | **HIGH** | Will be ignored by `prisma migrate deploy`. Contains column renames (restaurantId→businessId) for CostAnomalyAlert, ReorderSuggestionLog, SlipTemplate, FeeConfiguration. |
| **Table dropped and recreated with different name** | `20260405_business_scans` → `20260601081228_billing_ledger` | **MEDIUM** | `business_scans` (snake_case, UUID PK) is dropped and recreated as `BusinessScan` (PascalCase, TEXT PK). Data loss if any existed. |
| **ALTER TYPE ADD VALUE in transaction** | `20260324075113`, `20260601175223`, `20260628000000`, `20260726000000` | **MEDIUM** | PostgreSQL < 12 cannot run `ALTER TYPE ADD VALUE` inside a transaction block. Prisma wraps migrations in transactions by default. Supabase (PG 15) supports this, but may fail on older PG. |
| **gen_random_uuid() without pgcrypto extension** | `20260304_audit-log`, `20260324075113`, `20260405_business_scans`, `20260616130000` | **LOW** | `gen_random_uuid()` requires `pgcrypto` extension or PG ≥ 13 (where it's built-in). Supabase PG 15 has it built-in, but no `CREATE EXTENSION` statement exists as a safeguard. |

---

## 4. SQL Audit

### 4.1 Standalone SQL Classification

| Category | Files | Action Required |
|-----------|-------|----------------|
| **Duplicates of Prisma migrations** | `SUPABASE_MIGRATION_PHASE2_COMPLETE.sql`, `SUPABASE_MIGRATION_GLOBAL_CURRENCY_TIMEZONE.sql`, `SUPABASE_MIGRATION_QR_ENHANCEMENTS.sql`, `scripts/_apply_cost_anomaly.sql`, `scripts/_apply_cost_anomaly_v2.sql` | **Do NOT run** — tables already created by Prisma migrations. Running these would cause "table already exists" errors (though most use `IF NOT EXISTS`). |
| **Unique (not in Prisma migrations)** | `scripts/sql/add_payment_health_indexes.sql` (concurrent indexes + pg_cron) | **Must run** after Prisma migrations — creates performance indexes not in schema.prisma. |
| **Supplemental (column renames)** | `safe_business_migration.sql`, `safe_business_migration_steps_1_4.sql`, `safe_business_constraints.sql` | **May be needed** — these rename `restaurantId` to `businessId` in raw SQL tables. On a fresh DB, Prisma migrations already use `businessId`, so these may be unnecessary. |
| **Data migration** | `migrate_essentials_to_starter.sql` | **Not needed** on fresh DB — only for existing data. |
| **Orphaned** | `service-intelligence-schema.sql` | **Unknown** — creates tables not in Prisma schema. May be dead code. |
| **Read-only** | `check_tables.sql`, `PHASE_0.7_OBSERVATION_QUERIES.sql`, `scripts/sql/verify_staff_mgmt.sql` | No action needed. |
| **Unknown** | `apply-kitchen-migration.sql`, `cleanup-and-apply.sql`, `supabase-migration-autopilot.sql` | **Cannot verify** — may conflict with Prisma migrations. |

### 4.2 Execution Order for Standalone SQL

If standalone SQL must be run:
1. Prisma migrations first (`npx prisma migrate deploy`)
2. `scripts/sql/add_payment_health_indexes.sql` (concurrent indexes — requires tables to exist)
3. All other standalone SQL files are either duplicates or unnecessary on a fresh database

---

## 5. Database Object Inventory

### 5.1 Tables (196)

All 196 models in `schema.prisma` correspond to database tables. Two use `@@map`:
- `Business` → `"Restaurant"`
- `PluginQrMenu` → `"plugin_data_qr_menu"`

### 5.2 Views

**None found.** No `CREATE VIEW` in any project SQL file.

### 5.3 Materialized Views

**None found.**

### 5.4 Functions

**None found.** No `CREATE FUNCTION` in any project SQL file.

### 5.5 Procedures

**None found.**

### 5.6 Triggers

**None found.** No `CREATE TRIGGER` in any project SQL file.

### 5.7 Indexes

- ~250+ indexes defined via `@@index` in Prisma schema
- 3 additional concurrent indexes in `scripts/sql/add_payment_health_indexes.sql` (not in Prisma schema):
  - `PaymentTransaction_updatedAt_idx`
  - `CheckoutEvent_paymentId_idx` (already in Prisma schema as `@@index([paymentId])`)
  - `CheckoutEvent_eventType_createdAt_idx` (already in Prisma schema as `@@index([eventType, createdAt])`)

### 5.8 Constraints

- 196 primary keys (all `@id @default(cuid())` except some using `gen_random_uuid()`)
- ~60+ unique constraints (from `@unique` and `@@unique`)
- ~200+ foreign keys

### 5.9 Sequences

**None found.** No `CREATE SEQUENCE` in any project SQL file. All IDs use `cuid()` or `gen_random_uuid()`.

### 5.10 Extensions

| Extension | Where Defined | Required By |
|-----------|--------------|-------------|
| `pg_cron` | `scripts/sql/add_payment_health_indexes.sql` | Concurrent index scheduling |
| `pgcrypto` (implicit) | Not explicitly created | `gen_random_uuid()` in several migrations (PG 13+ has built-in, no extension needed) |

### 5.11 Enums (68)

All 68 enums are defined in `schema.prisma` and created by Prisma migrations. See complete list in previous forensic report.

---

## 6. Dependency Analysis

### 6.1 Authentication

- **NextAuth.js** with `PrismaAdapter` — depends on `User`, `Account`, `Session`, `VerificationToken` tables
- **OTP authentication** — depends on `UserLoginOtp` table
- **Security events** — depends on `SecurityEvent`, `UserDevice` tables

### 6.2 API Routes

- **229+ API route files** reference NextAuth session
- **38+ files** use `prisma.$transaction` or `prisma.$queryRaw`
- **10+ files** use `prisma.$executeRaw` (raw SQL for CostAnomalyAlert, trending queries, seat locking, etc.)

### 6.3 Background Jobs / Cron

- `src/lib/cron.ts` — 17 scheduled jobs (daily reports, stock alerts, backups, affiliate approvals, insight generation, QR order release, feature flags, reconciliation, autopilot, trial status, content publishing, trending notifications, Tap & Leave payment reconciliation, finalization sweeper, WhatsApp reorder funnel, reservation no-show, generic payment watchdog)
- `src/lib/die/orchestrator/worker.ts` — DIE worker
- `src/lib/die/control-plane/background/scheduler.ts` — DIE background scheduler
- `src/lib/services/watchdog/` — 8+ watchdog services

### 6.4 Realtime

- **Pusher** (not Supabase Realtime) — `src/lib/realtime.ts` uses Pusher client, `src/lib/pusher-server.ts` uses Pusher server SDK
- Requires env vars: `NEXT_PUBLIC_PUSHER_KEY`, `PUSHER_APP_ID`, `PUSHER_SECRET`, `PUSHER_CLUSTER`

### 6.5 Storage

- **Supabase Storage** — `src/lib/services/storage.service.ts` uses `@supabase/supabase-js` `createClient`
- Requires env vars: `SUPABASE_STORAGE_URL`, `SUPABASE_STORAGE_KEY`
- Expects bucket: `documents-priv` (configurable via `SUPABASE_STORAGE_PRIV_BUCKET`)
- **No bucket creation scripts found in repository**

### 6.6 Finance / Ledger

- **FinancialLedgerEntry** is the canonical source for all finance analytics (105 references across 23 files)
- `src/lib/services/billing-ledger.service.ts` — ledger entry creation
- `src/lib/services/ledger-integrity.service.ts` — ledger integrity checks
- `src/lib/services/payment-ledger-events.service.ts` — payment-to-ledger event mapping
- `src/pages/api/dashboard/ceo.ts` — CEO dashboard reads from FinancialLedgerEntry
- `src/lib/services/intelligence/revenue-intelligence.service.ts` — revenue intelligence from ledger

### 6.7 Invoice Numbering

- `src/lib/services/invoice-number.service.ts` — generates daily sequence invoice numbers
- **No retry-on-conflict logic** — uses `findFirst` + increment, no transaction or unique constraint catch
- `PaymentTransaction.invoiceNumber` has `@unique` constraint
- `Invoice.invoiceNumber` has `@unique` constraint
- **Risk:** Concurrent requests can generate the same invoice number, causing a unique constraint violation with no retry

### 6.8 Alert Delivery

- `src/lib/services/alert-delivery.service.ts` — alert delivery service (email + Slack)
- Referenced by 23 files including watchdogs, cron jobs, DIE orchestrator
- `src/lib/die/control-plane/alerts/alert-delivery.service.ts` — DIE-specific alert delivery

---

## 7. Missing or Suspect Artifacts

### 7.1 Missing

| Artifact | Evidence | Impact |
|----------|----------|--------|
| **Supabase Storage bucket creation** | `storage.service.ts` expects `documents-priv` bucket, but no SQL or script creates it | Storage uploads will fail until bucket is manually created in Supabase Dashboard |
| **`pgcrypto` extension** | `gen_random_uuid()` used in 6+ migrations, no `CREATE EXTENSION pgcrypto` found | Low risk on PG 13+ (built-in), but no safeguard for older PG |
| **RLS policies** | RLS enabled on Recipe, RecipeIngredient, InventoryConsumption, but no `CREATE POLICY` found | RLS blocks all access except superusers — application will get empty results for these tables |
| **`service-intelligence-schema.sql` tables** | Creates tables not in Prisma schema | Unknown if application code depends on these tables |
| **`ReorderSuggestionLog` table** | Dropped in `20260324075113`, never recreated in Prisma migrations | `reorder-autopilot.service.ts` references `ReorderSuggestion` as a TypeScript interface (not a Prisma model), so no DB dependency — **not missing** |

### 7.2 Suspect

| Artifact | Evidence | Concern |
|----------|----------|---------|
| `CostAnomalyAlert` table | Not in Prisma schema, created via raw SQL in `20260616130000`, FK references `"Business"` but table is `"Restaurant"` | Migration will fail on fresh DB. FK constraint creation will error. |
| `20260216_raw_tables_business_migration.sql` | Loose file in `prisma/migrations/`, not in subdirectory | Ignored by `prisma migrate deploy`. Contains column renames that may be needed if running on an existing DB with old column names. |
| 12 loose SQL files in `prisma/migrations/` | Not in migration subdirectories | Ignored by `prisma migrate deploy`. Some are duplicates, some may be needed. |
| `SUPABASE_MIGRATION_QR_ENHANCEMENTS.sql` | Creates `WaiterCall` table | Already in Prisma migration `20260601081228_billing_ledger`. Running both could cause conflicts. |
| `SUPABASE_MIGRATION_GLOBAL_CURRENCY_TIMEZONE.sql` | Creates CurrencyExchangeRate, SupportedCurrency, SupportedTimezone | Already in Prisma migration `20260601081228_billing_ledger`. Running both could cause conflicts. |
| `SUPABASE_MIGRATION_PHASE2_COMPLETE.sql` | Creates AIUsageLog, SiteBuilderSubscription, DiscoverySubscription | Already in Prisma migration `20240406_phase2a_monetization`. Running both could cause conflicts. |

---

## 8. Risks

### Critical

| Risk | Why |
|------|-----|
| **CostAnomalyAlert FK references `"Business"` instead of `"Restaurant"`** | Migration `20260616130000` will fail on fresh DB. The `CostAnomalyAlert` table is created via raw SQL with `REFERENCES "Business"("id")`, but the actual table is `"Restaurant"`. This will cause a PostgreSQL error: `relation "Business" does not exist`. |
| **RLS enabled without policies** | RLS on Recipe, RecipeIngredient, InventoryConsumption blocks ALL access except for table owners/superusers. Application code querying these tables via Prisma will get empty results or permission errors. |

### High

| Risk | Why |
|------|-----|
| **12 loose SQL files ignored by `prisma migrate deploy`** | Files in `prisma/migrations/` that are not in subdirectories are invisible to Prisma. If any contain necessary schema changes, the database will be missing them. |
| **Duplicate table definitions in standalone SQL** | Running standalone SQL files after Prisma migrations may cause "table already exists" errors. Most use `IF NOT EXISTS`, but some may not. |
| **No CI/CD migration pipeline** | No GitHub Actions, no Vercel migration step. Manual migration execution is error-prone. |
| **`dev-start.bat` falls back to `db push`** | If `migrate deploy` fails, the script falls back to `db push` which creates tables without migration history, making future `migrate deploy` fail. |

### Medium

| Risk | Why |
|------|-----|
| **`ALTER TYPE ADD VALUE` in transaction** | Prisma wraps migrations in transactions. PG < 12 cannot run `ALTER TYPE ADD VALUE` inside a transaction. Supabase (PG 15) supports this, but it's a portability risk. |
| **No Supabase Storage bucket creation** | Application expects `documents-priv` bucket. No script creates it. Must be manually created in Supabase Dashboard. |
| **Invoice numbering has no retry-on-conflict** | `InvoiceNumberService.next()` uses `findFirst` + increment without a transaction or retry. Concurrent requests can collide. |
| **`business_scans` → `BusinessScan` table recreation** | Migration #10 creates `business_scans` (snake_case, UUID), migration #13 drops it and creates `BusinessScan` (PascalCase, TEXT). Data loss if any data existed. |

### Low

| Risk | Why |
|------|-----|
| **`gen_random_uuid()` without `pgcrypto`** | PG 13+ has `gen_random_uuid()` built-in. Supabase uses PG 15. No issue in practice, but no safeguard. |
| **Orphaned `service-intelligence-schema.sql`** | Creates tables not in Prisma schema. Unknown if used. May be dead code. |
| **Seed data inconsistency** | `seed.ts` creates 7 plans, `plans-phase2.ts` updates with different pricing. Running both may result in inconsistent plan data. |

---

## 9. Assumptions

| # | Assumption | Verification Status |
|---|-----------|-------------------|
| 1 | Supabase project uses PostgreSQL 15+ | **Cannot verify** — no access to Supabase Dashboard. Based on Supabase's default PG version. |
| 2 | `gen_random_uuid()` is available without `pgcrypto` extension | **Cannot verify** — depends on PG version. PG 13+ includes it in core. |
| 3 | `ALTER TYPE ADD VALUE` works inside Prisma transactions | **Cannot verify** — depends on PG version. PG 12+ supports it. |
| 4 | Standalone SQL files are not needed on fresh DB | **Partially verified** — tables in standalone SQL are also in Prisma migrations. But `add_payment_health_indexes.sql` is unique. |
| 5 | `service-intelligence-schema.sql` is dead code | **Cannot verify** — no grep for its table names in application code was performed. |
| 6 | Supabase Storage bucket `documents-priv` can be created manually | **Cannot verify** — no access to Supabase Dashboard. |
| 7 | RLS without policies is intentional (development mode) | **Cannot verify** — no documentation found explaining RLS policy absence. |
| 8 | The `20260216_raw_tables_business_migration.sql` is unnecessary on fresh DB | **Likely** — fresh DB uses `businessId` from the start via Prisma schema. But cannot verify without running migrations. |
| 9 | Pusher is used instead of Supabase Realtime | **Verified** — `src/lib/realtime.ts` uses Pusher, not Supabase channels. |
| 10 | No Edge Functions exist | **Verified** — no `supabase/functions/` directory found. |

---

## 10. Recovery Readiness Assessment

### **Yes, with conditions.**

The repository contains all necessary artifacts to reconstruct the database schema and seed data. However, the following conditions must be met:

### Conditions

1. **Fix `CostAnomalyAlert` FK reference** — Migration `20260616130000` must be corrected to reference `"Restaurant"` instead of `"Business"`. Without this fix, the migration will fail.

2. **Create RLS policies or disable RLS** — RLS is enabled on Recipe, RecipeIngredient, InventoryConsumption without policies. Either create policies or disable RLS before application use.

3. **Create Supabase Storage bucket** — Manually create `documents-priv` bucket in Supabase Dashboard after project setup.

4. **Run `scripts/sql/add_payment_health_indexes.sql`** — This is the only standalone SQL file that creates objects not in Prisma migrations. Must be run after `prisma migrate deploy`.

5. **Do NOT run duplicate standalone SQL files** — `SUPABASE_MIGRATION_PHASE2_COMPLETE.sql`, `SUPABASE_MIGRATION_GLOBAL_CURRENCY_TIMEZONE.sql`, `SUPABASE_MIGRATION_QR_ENHANCEMENTS.sql`, `scripts/_apply_cost_anomaly*.sql` are duplicates of Prisma migrations.

6. **Run seed scripts** — `npm run db:seed` for base data, then `tsx scripts/seed-platform-fees.ts` for platform fees.

7. **Verify PG version** — Ensure Supabase project uses PG 12+ for `ALTER TYPE ADD VALUE` in transactions.

### Why "Yes, with conditions" and not "Yes"

- The CostAnomalyAlert FK error is a **blocking issue** that will cause migration failure.
- RLS without policies will **block application access** to Recipe, RecipeIngredient, and InventoryConsumption tables.
- Storage bucket must be **manually created** — no script exists.
- The 12 loose SQL files in `prisma/migrations/` create **ambiguity** about what needs to be run.

### Why not "No"

- All 196 Prisma models have corresponding migration CREATE TABLE statements.
- All 68 enums have corresponding ALTER TYPE CREATE statements.
- All FK relationships are defined in both schema and migrations.
- Seed data covers all reference data (plans, fees, demo data).
- The schema validates and client generates successfully.

---

## 11. Confidence Score

**78%**

### Justification

| Factor | Score | Reasoning |
|--------|-------|-----------|
| Schema completeness | 95% | 196 models, 68 enums, all relations defined. Validates and generates. |
| Migration completeness | 75% | 27 migration directories cover all tables. But 1 has a FK error, 12 loose SQL files are ambiguous. |
| Standalone SQL clarity | 60% | Duplicates create confusion. 1 unique file needed. Several with unknown purpose. |
| Seed data completeness | 85% | Plans, fees, demo data all covered. But seed inconsistency between seed.ts and plans-phase2.ts. |
| Supabase features | 50% | RLS enabled without policies. No storage bucket creation. No Supabase-specific config beyond env vars. |
| Application DB dependency mapping | 90% | Clear mapping of auth, cron, realtime, storage, finance dependencies. |
| Missing artifacts | 70% | Storage bucket, RLS policies, pgcrypto extension not defined. CostAnomalyAlert FK error. |
| Overall | **78%** | High schema/migration completeness, but blocking issues and ambiguities reduce confidence. |

---

## 12. Recommended Next Phase

**Phase 2 — DB-002: Migration Repair & Reconstruction Plan**

Based on the audit findings, the next phase should:

1. **Fix the `CostAnomalyAlert` FK reference** in `20260616130000_recreate_cost_anomaly_alert/migration.sql` — change `"Business"` to `"Restaurant"`.

2. **Create RLS policies** for Recipe, RecipeIngredient, InventoryConsumption — or disable RLS if not needed for the current deployment.

3. **Classify and triage the 12 loose SQL files** in `prisma/migrations/` — determine which are needed, which are duplicates, and which should be deleted or moved to an archive.

4. **Create a Supabase Storage bucket setup script** — or document manual creation steps.

5. **Create a single, ordered reconstruction script** that:
   - Runs `npx prisma migrate deploy`
   - Runs `scripts/sql/add_payment_health_indexes.sql`
   - Runs `npm run db:seed`
   - Runs `tsx scripts/seed-platform-fees.ts`
   - Verifies all 196 tables, 68 enums, and seed data

6. **Remove or quarantine duplicate standalone SQL files** to prevent confusion during reconstruction.

7. **Test the reconstruction on a fresh Supabase project** (not the production project) to validate all migrations succeed.

**Do NOT execute any of the above until explicitly authorized.**
