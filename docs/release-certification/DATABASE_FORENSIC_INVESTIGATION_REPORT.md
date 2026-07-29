# Database Forensic Investigation & Recovery Plan

**Date:** 2026-07-29  
**Target DB:** Supabase `dkhnocretmzpskadqhlq` (eu-west-1)  
**Repo:** ImboniServe v2.0.1  
**Status:** INVESTIGATION ONLY — No SQL executed, no DB modifications made.

---

## Phase 1 — Environment Forensics

### Env Files Found

| File | DB Target |
|------|-----------|
| `.env` | `dkhnocretmzpskadqhlq` @ `aws-1-eu-west-1.pooler.supabase.com` |
| `.next/standalone/.env` | Same Supabase project |
| `.env.example` | Placeholder (`YOUR_HOST`) |
| `.env.production.template` | Placeholder (`[PROJECT-REF]`) |
| `docker-compose.yml` | Local Postgres (`postgres:password@postgres:5432`) |

### Prisma Datasource
- `url = env("DATABASE_URL")`, `directUrl = env("DIRECT_URL")`
- Both point to same Supabase project ref `dkhnocretmzpskadqhlq`

### Deployment Config
- `vercel.json`: build runs `prisma generate` only — **no migration step in Vercel build**
- `dev-start.bat`: runs `npx prisma migrate deploy`, falls back to `npx prisma db push` on failure
- `run-all-supabase-migrations.bat`: runs standalone SQL via `psql`
- **No GitHub Actions workflows found** — no CI/CD automated migrations

### Findings
- All env files agree on same Supabase project
- `environment-truth.json` (2026-06-22) documents 63 missing env vars
- **Critical:** `dev-start.bat` fallback to `db push` creates tables WITHOUT migration history

---

## Phase 2 — Root Cause Investigation

### Destructive Operation Search

| Search | Scope | Result |
|--------|-------|--------|
| `DROP SCHEMA` | Project source files | **NOT FOUND** |
| `DROP DATABASE` | Project source files | **NOT FOUND** |
| `prisma migrate reset` | Project BAT/SH/TS/JS | **NOT FOUND** |
| `db push --force` | Project BAT/SH/TS/JS | **NOT FOUND** |
| `DROP TABLE` | Prisma migrations | 2 instances — normal schema evolution (dropping `CostAnomalyAlert`, `ReorderSuggestionLog`, `business_scans` to recreate) |
| `TRUNCATE` | Project SQL | **NOT FOUND** |

### DB State Evidence (from ENVIRONMENT_DISCOVERY_REPORT.md, 2026-06-22)
- Public schema **completely empty**
- No `_prisma_migrations` table
- No application tables, enums, functions, or views

### Root Cause Analysis

No destructive commands exist in the repository. The empty DB was caused by an **external-to-repository** action:

**Scenario A — Supabase Project Reset (MOST LIKELY):** Dashboard reset drops all tables, enums, and `_prisma_migrations`. Matches observed state exactly.

**Scenario B — Wrong Supabase Project:** Current project was never migrated. Possible but both env files point to same ref.

**Scenario C — Manual SQL Wipe:** Someone ran `DROP SCHEMA public CASCADE` via Supabase SQL Editor. Would produce same state.

**Scenario D — Branch Merge Issue:** Supabase branching reset parent. No branch config found in repo.

### Conclusion
The database was emptied externally. The absence of `_prisma_migrations` table is the key indicator — even failed `migrate deploy` runs create the table. Its complete absence suggests full reset or never-migrated state.

---

## Phase 3 — Repository Audit

### Prisma Schema Summary
- **File:** `prisma/schema.prisma` (5,390 lines)
- **Generator:** `prisma-client-js`, preview features: `multiSchema`
- **Datasource:** PostgreSQL via env vars

### Model Count: 196 models

### Enum Count: 68 enums

### Migrations: 28 migration directories

### Standalone SQL Files: 15 files

### RLS
Enabled on 3 tables (in `20260628000000_kitchen_consumption_phase0`):
- `Recipe`, `RecipeIngredient`, `InventoryConsumption`
- **No RLS policies (CREATE POLICY) found** — only ENABLE ROW LEVEL SECURITY

### Triggers, Functions, Views
- **Custom Functions:** None
- **Custom Triggers:** None
- **Views:** None
- **Extensions:** `pg_cron` (in `scripts/sql/add_payment_health_indexes.sql`)

### Table Mappings (@@map)
- `Business` → `Restaurant` (`@@map("Restaurant")`)
- `PluginQrMenu` → `plugin_data_qr_menu` (`@@map("plugin_data_qr_menu")`)

### Seed Data
- `prisma/seed.ts`: Creates Plans (Starter, Essentials, Professional), demo Users, Business, MenuItems, InventoryItems, Sales, Suppliers
- `prisma/seed-qr-templates.sql`: QR template definitions
- `scripts/seed-platform-fees.ts`: Platform fee configuration

### Complete Model List (196 models)

FinancialLedgerEntry, User, Business, Plan, MenuItem, Sale, SaleItem, InventoryItem, InventoryUpdate, Recipe, RecipeIngredient, InventoryConsumption, Subscription, Invoice, WhatsAppMessage, Session, Account, VerificationToken, Supplier, SupplierProduct, SupplierOrder, SupplierOrderItem, SupplierDelivery, ContentPost, MediaAsset, PostEngagement, PostAttribution, MarketplaceProduct, MarketplaceOrder, MarketplaceOrderItem, Table, TableSession, SessionParticipant, Customer, CommissionInvoice, Affiliate, AffiliateCommission, AffiliatePayout, FeeConfiguration, SmartDiningSlip, SlipLineItem, SlipEditHistory, SlipTemplate, ReferralLink, DiningCredit, PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatusHistory, GoodsReceivedNote, GoodsReceivedNoteItem, SupplierPayout, PaymentTransaction, AffiliateCommissionNew, BusinessInsightReport, OrderToken, DisposableEmailDomain, TrialEligibility, AuditLog, FeatureFlag, BusinessFeatureOverride, PlatformMetrics, Branch, Outlet, StaffRole, UserStaffRole, Seat, SeatSession, MenuItemTranslation, PointsLedger, LoyaltyRule, MenuSourceDocument, MenuItemCandidate, Room, ServiceArea, BusinessProfile, BusinessReview, BusinessView, Promotion, PromotionRedemption, ReconciliationLog, WhatsAppTemplate, TaxConfiguration, CustomerReferral, Reservation, ActivityLog, CustomDomain, BusinessInvite, InviteCredit, UserLoginOtp, UserDevice, SecurityEvent, BillingEvent, SalePayment, SplitPaymentWhatsAppTrigger, StaffTip, TipChoice, SupplierInsightsSubscription, PlatformFeeConfig, EventLog, QrTemplate, QrDesign, QrCode, AIUsageLog, SiteBuilderSubscription, DiscoverySubscription, WaiterCall, CurrencyExchangeRate, SupportedCurrency, BusinessScan, OptimizationRecommendation, OptimizationAction, OptimizationOutcome, SupportedTimezone, ReferralClick, ReferralReward, AffiliateEarnings, TableSessionInvite, FraudDetectionLog, ABTest, ABVariant, ABAssignment, ABEvent, SupplierRecommendationLog, SupplierPerformanceCache, Contact, ContactOrganization, OrganizationMember, ContactRelationship, ContactActivity, ContactSegment, ContactTag, SupportConversation, SupportMessage, SupportCannedReply, DiningSessionSlip, DiningSessionSlipItem, CheckoutEvent, ProfessionalMarketer, MarketerAttribution, MarketerWallet, MarketerCommission, MarketerPayout, MarketerRiskProfile, RevenueEvent, RevenueAlert, DemoRequest, NewsletterSubscriber, Station, RouteRule, TicketEvent, SLAProfile, IdempotencyKey, ScanJob, ScannedDocument, ScannedDocumentItem, DocumentProcessingLog, DocumentEventTimeline, ProcurementReconciliation, DocumentEntityLink, SupplierAlias, ProductAlias, AnomalyAlert, ExtractedDocumentHeaderField, ExtractedDocumentLineField, ExtractionPayload, PluginQrMenu, IntelligenceReport, KnowledgeEntry, ReplayEvent, ConversationHistory, PluginGovernanceState, PluginAuditEvent, PluginLifecycleHistory, PluginAnomalyEvent, ControlPlaneSnapshot, PluginAlertEvent, AICreditWallet, AICreditLedgerEntry, AICreditReservation, AIFeatureCost, AICreditPackage, AICreditPolicy, AcquisitionAttribution, FounderPartner, FounderPartnerApplication, PartnerAgreement, FounderCode, FounderCodeRedemption, PartnerCampaign, FounderCommission, FounderPartnerPayout, FounderPartnerRiskProfile, PartnerActivity, PartnerQBR, PartnershipAuditLog, PartnershipEvent

### Complete Enum List (68 enums)

UserRole, TaxMode, PaymentMethod, PaymentStatus, PaymentTransactionStatus, SubscriptionStatus, BillingEventType, PaymentGateway, LedgerDomain, PaymentProvider, CommissionType, CommissionStatus, OrderSource, InsightPeriodType, OutletType, TaxType, ReferralStatus, ReservationStatus, BusinessInviteStatus, InviteCreditStatus, SalePaymentStatus, StaffTipStatus, SupplierInsightsTier, ABTestStatus, ABEventType, ContactType, ContactStatus, OrganizationType, RelationshipType, ActivityType, SupportStatus, SupportPriority, SupportSenderType, MarketerStatus, MarketerCommissionType, MarketerCommissionStatus, PayoutMethod, PayoutStatus, RiskLevel, AlertSeverity, RevenueEventType, DemoRequestStatus, StationType, ItemStatus, MutationType, ExpoStatus, TicketEventType, DocumentType, DocumentStatus, DocumentLifecycleState, ReconciliationState, EntityLinkType, LinkType, AnomalyStatus, AnomalySeverity, AICreditLedgerEntryType, AICreditReservationStatus, AttributionSourceType, AttributionStatus, PartnerStatus, PartnerType, FounderCodeStatus, CampaignStatus, FounderCommissionType, FounderCommissionStatus, ApplicationStatus, AgreementStatus, PartnershipEventType

### Migration Directories (28)

1. `20240406_phase2a_monetization`
2. `20260204194929_unlimited_users_and_whatsapp_policy` (base tables)
3. `20260207_supplier_marketplace`
4. `20260208_ai_features`
5. `20260216_raw_tables_business_migration.sql`
6. `20260304_audit-log`
7. `20260304_trial-eligibility`
8. `20260324075113_add_smart_menu_intelligence`
9. `20260324083537_add_kitchen_execution_and_group_ordering`
10. `20260405_business_scans`
11. `20260501000000_tap_and_leave_system`
12. `20260501155000_staff_management_system`
13. `20260601081228_billing_ledger`
14. `20260601175223_add_card_payment_method`
15. `20260601181304_link_payment_to_marketplace_order`
16. `20260601202002_financial_ledger_core`
17. `20260614_pr01_die_database_foundation`
18. `20260614b_pr02_extraction_layer`
19. `20260616100000_block4d_procurement_reconciliation`
20. `20260616120000_block4e_anomaly_confidence`
21. `20260616130000_recreate_cost_anomaly_alert`
22. `20260616140000_block4g_system_consolidation`
23. `20260628000000_kitchen_consumption_phase0`
24. `20260710000000_add_pending_token_to_user_login_otp`
25. `20260714000000_intelligence_platform_schema`
26. `20260726000000_schema_reconciliation_v1`
27. `20260729150000_phase_1a_acquisition_attribution`
28. `safe_business_migration.sql` (standalone)

### Standalone SQL Files (15)

- `SUPABASE_MIGRATION_PHASE2_COMPLETE.sql` — Phase 2 monetization
- `SUPABASE_MIGRATION_GLOBAL_CURRENCY_TIMEZONE.sql` — Currency/timezone
- `SUPABASE_MIGRATION_QR_ENHANCEMENTS.sql` — QR system
- `apply-kitchen-migration.sql` — Kitchen system
- `cleanup-and-apply.sql` — Cleanup + apply
- `check_tables.sql` — Verification queries
- `supabase-migration-autopilot.sql` — Autopilot
- `PHASE_0.7_OBSERVATION_QUERIES.sql` — Observation
- `prisma/seed-qr-templates.sql` — QR seed data
- `scripts/_apply_cost_anomaly.sql` — Cost anomaly v1 (superseded)
- `scripts/_apply_cost_anomaly_v2.sql` — Cost anomaly v2 (superseded)
- `scripts/sql/add_payment_health_indexes.sql` — Concurrent indexes + pg_cron
- `scripts/sql/verify_staff_mgmt.sql` — Verification
- `archive/MIGRATION_SQL_BACKUP.sql` — Archived backup
- `archive/VERIFY_MIGRATION.sql` — Archived verification

---

## Phase 4 — Canonical Reconstruction Package

### Execution Order

1. **Verify empty DB** — Confirm public schema is empty
2. **`npx prisma migrate deploy`** — Runs all 28 migrations in order, creates `_prisma_migrations` table
3. **Run standalone SQL** (objects NOT in Prisma migrations):
   - `SUPABASE_MIGRATION_QR_ENHANCEMENTS.sql` (QrTemplate, QrDesign, QrCode)
   - `SUPABASE_MIGRATION_GLOBAL_CURRENCY_TIMEZONE.sql` (CurrencyExchangeRate, SupportedCurrency, SupportedTimezone)
   - `scripts/sql/add_payment_health_indexes.sql` (concurrent indexes + pg_cron)
4. **`npm run db:seed`** — Seed Plans, demo data
5. **Verify** — Introspect and compare

### Potential Issues on Empty DB

| Risk | Mitigation |
|------|-----------|
| Enum already exists | Latest migration has `IF NOT EXISTS` guards for shared enums |
| FK to non-existent table | Latest migration has `to_regclass` conditional checks |
| `ALTER TYPE ADD VALUE` in transaction | Prisma wraps in txn — may need `--create-only` for some |
| Standalone SQL conflicts | Run Prisma migrations first, then standalone SQL |

---

## Phase 5 — Database Manifest

### Expected Objects After Reconstruction

| Object Type | Count |
|-------------|-------|
| Tables | 196 |
| Enums | 68 |
| Indexes | ~250+ |
| Primary Keys | 196 |
| Unique Constraints | ~60+ |
| Foreign Keys | ~200+ |
| RLS-enabled Tables | 3 (Recipe, RecipeIngredient, InventoryConsumption) |
| Extensions | 1 (pg_cron) |
| Custom Functions | 0 |
| Custom Triggers | 0 |
| Views | 0 |
| Seed Plans | 3 (Starter, Essentials, Professional) |

---

## Phase 6 — Verification

### Commands

```bash
npx prisma validate          # Validate schema syntax
npx prisma generate          # Generate client (confirms relations resolve)
npx prisma introspect        # After reconstruction, compare with schema.prisma
```

### Checklist

| Check | Method | Expected |
|-------|--------|----------|
| Schema valid | `prisma validate` | No errors |
| Client generates | `prisma generate` | No errors |
| All tables exist | `SELECT tablename FROM pg_tables WHERE schemaname='public'` | 196 tables |
| All enums exist | `SELECT typname FROM pg_type WHERE typtype='e'` | 68 enums |
| Migration history | `SELECT count(*) FROM "_prisma_migrations"` | 28 rows |
| RLS enabled | `SELECT relname FROM pg_class WHERE relrowsecurity = true` | 3 tables |
| Seed data | `SELECT count(*) FROM "Plan"` | ≥3 rows |
| FK integrity | `SELECT count(*) FROM pg_constraint WHERE contype='f'` | 200+ |

---

## Phase 7 — Recovery Strategy Recommendation

### Options

| Option | Description | Risk | Feasibility |
|--------|-------------|------|-------------|
| A. Supabase backup restore | Restore from Supabase automatic backups | LOW | Check Dashboard → Backups |
| B. Reconstruct from migrations | `prisma migrate deploy` + standalone SQL + seed | MEDIUM | HIGH — all migrations in repo |
| C. `db push` only | Sync schema from `schema.prisma` directly | HIGH — no migration history | HIGH but creates tech debt |

### Recommended: Option A first, Option B as fallback

#### Step 1: Check Supabase Backups
1. Log into Supabase Dashboard for `dkhnocretmzpskadqhlq`
2. Navigate to **Database → Backups**
3. If a backup exists from before the empty state was discovered (pre-2026-06-22):
   - Restore the backup
   - Run `npx prisma migrate deploy` to apply any newer migrations
   - Run `npx prisma introspect` to verify schema matches

#### Step 2: If No Backup — Reconstruct from Migrations
1. Verify DB is empty: `SELECT tablename FROM pg_tables WHERE schemaname='public'`
2. Run: `npx prisma migrate deploy`
3. Run standalone SQL files:
   - `psql "$DATABASE_URL" -f SUPABASE_MIGRATION_QR_ENHANCEMENTS.sql`
   - `psql "$DATABASE_URL" -f SUPABASE_MIGRATION_GLOBAL_CURRENCY_TIMEZONE.sql`
   - `psql "$DATABASE_URL" -f scripts/sql/add_payment_health_indexes.sql`
4. Run: `npm run db:seed`
5. Verify with introspection

#### Step 3: Post-Recovery Hardening
1. **Remove `db push` fallback** from `dev-start.bat` — it masks migration failures
2. **Add migration step to Vercel build** or use a deploy script
3. **Set up CI/CD** with GitHub Actions to run `prisma migrate deploy` on push to main
4. **Enable Supabase PITR** (Point-in-Time Recovery) for automatic backups
5. **Document the Supabase project ref** in deployment docs
6. **Never use `prisma migrate reset`** in production

### Why NOT Option C (db push)
- Creates no `_prisma_migrations` entries
- Future `migrate deploy` will fail (migrations already "applied" in DB but not recorded)
- Loses migration history and audit trail
- Cannot roll back specific migrations

---

## Phase 6 — Verification Results

### Static Verification (Completed)

| Check | Command | Result |
|-------|---------|--------|
| Schema valid | `npx prisma validate` | **PASS** — "The schema at prisma\schema.prisma is valid" |
| Client generates | `npx prisma generate` | **PASS** — Generated Prisma Client v5.22.0 (engine=binary) in 4.77s |

### Runtime Verification (Pending — requires DB access)

These checks must be run after database reconstruction:

| Check | Method | Expected |
|-------|--------|----------|
| All tables exist | `SELECT count(*) FROM pg_tables WHERE schemaname='public'` | 196 tables |
| All enums exist | `SELECT count(*) FROM pg_type WHERE typtype='e'` | 68 enums |
| Migration history | `SELECT count(*) FROM "_prisma_migrations"` | 28 rows |
| RLS enabled | `SELECT relname FROM pg_class WHERE relrowsecurity = true` | 3 tables |
| Seed data | `SELECT count(*) FROM "Plan"` | ≥3 rows |
| FK integrity | `SELECT count(*) FROM pg_constraint WHERE contype='f'` | 200+ |
| Introspection match | `npx prisma introspect` then diff with `schema.prisma` | No drift |
