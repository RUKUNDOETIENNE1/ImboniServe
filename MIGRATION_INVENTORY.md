# Migration Inventory — ImboniServe Database Schema

## AUDIT DATE
**Generated**: Phase 0.7A Infrastructure Audit  
**Purpose**: Document all migrations in repository  
**Status**: READ-ONLY INVENTORY

---

## MIGRATION SUMMARY

**Total Migrations**: 21 timestamped directories + 7 standalone SQL files  
**Migration Provider**: PostgreSQL (Prisma)  
**Location**: `prisma/migrations/`

---

## TIMESTAMPED MIGRATIONS (Chronological Order)

### 1. `20240406_phase2a_monetization`
**Timestamp**: 2024-04-06  
**Purpose**: Initial monetization features  
**Status**: ⏳ REQUIRES INSPECTION  
**Tables Affected**: Unknown (requires migration.sql review)

---

### 2. `20260204194929_unlimited_users_and_whatsapp_policy`
**Timestamp**: 2026-02-04 19:49:29  
**Purpose**: Remove user limits, add WhatsApp policy  
**Status**: ⏳ REQUIRES INSPECTION  
**Tables Affected**: Plan, Restaurant (likely)

---

### 3. `20260207_supplier_marketplace`
**Timestamp**: 2026-02-07  
**Purpose**: Supplier marketplace foundation  
**Status**: ⏳ REQUIRES INSPECTION  
**Tables Affected**: Supplier, Product, MarketplaceOrder (likely)

---

### 4. `20260208_ai_features`
**Timestamp**: 2026-02-08  
**Purpose**: AI features foundation  
**Status**: ⏳ REQUIRES INSPECTION  
**Tables Affected**: AI-related tables

---

### 5. `20260304_audit-log`
**Timestamp**: 2026-03-04  
**Purpose**: Audit logging system  
**Status**: ⏳ REQUIRES INSPECTION  
**Tables Affected**: AuditLog (likely)

---

### 6. `20260304_trial-eligibility`
**Timestamp**: 2026-03-04  
**Purpose**: Trial eligibility tracking  
**Status**: ⏳ REQUIRES INSPECTION  
**Tables Affected**: Restaurant, Subscription (likely)

---

### 7. `20260324075113_add_smart_menu_intelligence`
**Timestamp**: 2026-03-24 07:51:13  
**Purpose**: Smart menu intelligence features  
**Status**: ⏳ REQUIRES INSPECTION  
**Tables Affected**: MenuItem, MenuIntelligence (likely)

---

### 8. `20260324083537_add_kitchen_execution_and_group_ordering`
**Timestamp**: 2026-03-24 08:35:37  
**Purpose**: Kitchen execution system + group ordering  
**Status**: ⏳ REQUIRES INSPECTION  
**Tables Affected**: KitchenStation, KitchenTicket, Sale, SaleItem

---

### 9. `20260405_business_scans`
**Timestamp**: 2026-04-05  
**Purpose**: Business health scanning system  
**Status**: ⏳ REQUIRES INSPECTION  
**Tables Affected**: BusinessScan, OptimizationRecommendation

---

### 10. `20260501000000_tap_and_leave_system`
**Timestamp**: 2026-05-01 00:00:00  
**Purpose**: Tap & Leave dining system  
**Status**: ⏳ REQUIRES INSPECTION  
**Tables Affected**: TableSession, DiningSessionSlip, CheckoutEvent

---

### 11. `20260501155000_staff_management_system`
**Timestamp**: 2026-05-01 15:50:00  
**Purpose**: Staff management and roles  
**Status**: ⏳ REQUIRES INSPECTION  
**Tables Affected**: StaffRole, UserStaffRole

---

### 12. `20260601081228_billing_ledger` ⚠️ **CRITICAL**
**Timestamp**: 2026-06-01 08:12:28  
**Purpose**: **MAJOR SCHEMA OVERHAUL** - Billing system, payment enums, kitchen execution  
**Status**: ✅ REVIEWED  
**Size**: 2021 lines (MASSIVE)

**Enums Created**:
- `PaymentTransactionStatus`: PENDING, PROCESSING, SUCCESS, FAILED, CANCELLED, REFUNDED
- `SubscriptionStatus`: TRIAL, ACTIVE, GRACE_PERIOD, EXPIRED, SUSPENDED, CANCELLED
- `BillingEventType`: 15 event types
- `ABTestStatus`, `ContactType`, `ContactStatus`, `OrganizationType`, `RelationshipType`
- `ActivityType`, `SupportStatus`, `SupportPriority`, `SupportSenderType`
- `MarketerStatus`, `MarketerCommissionType`, `MarketerCommissionStatus`
- `PayoutMethod`, `PayoutStatus`, `RiskLevel`, `RevenueEventType`, `AlertSeverity`
- `DemoRequestStatus`, `StationType`, `ItemStatus`, `MutationType`, `ExpoStatus`, `TicketEventType`

**Enum Modified**:
- `PaymentGateway`: Removed MTN_MONEY, AIRTEL_MONEY; Added IREMBO_PAY, PESAPAL, INTOUCH, CASH, MOBILE_MONEY, CARD, BANK_TRANSFER

**Tables Created** (40+ tables):
- `SeatSession`, `BusinessView`, `UserLoginOtp`, `UserDevice`, `SecurityEvent`
- `BillingEvent` ⚠️ **CRITICAL FOR OBSERVATION**
- `EventLog`, `QrTemplate`, `QrDesign`, `QrCode`, `WaiterCall`
- `CurrencyExchangeRate`, `SupportedCurrency`
- `BusinessScan`, `OptimizationRecommendation`, `OptimizationAction`, `OptimizationOutcome`
- `SupportedTimezone`, `ReferralClick`, `ReferralReward`, `AffiliateEarnings`
- `TableSessionInvite`, `FraudDetectionLog`
- `ABTest`, `ABVariant`, `ABAssignment`, `ABEvent`
- `SupplierRecommendationLog`, `SupplierPerformanceCache`
- `Contact`, `ContactOrganization`, `OrganizationMember`, `ContactRelationship`
- `ContactActivity`, `ContactSegment`, `ContactTag`
- `SupportConversation`, `SupportMessage`, `SupportCannedReply`
- `ProfessionalMarketer`, `MarketerAttribution`, `MarketerWallet`

**Tables Modified**:
- `PaymentTransaction`: Changed status column to enum (BREAKING)
- `Subscription`: Changed status column to enum (BREAKING)
- `Reservation`: Dropped depositAmountCents column
- `Restaurant`: Added 13 new columns (AI credits, approval, risk, storage)
- `Sale`: Added 8 new columns (kitchen execution, expo status)
- `SaleItem`: Added 9 new columns (kitchen tracking, item status)
- `TableSession`: Made 3 columns required
- `User`: Added locale, preferredCurrency, timezone

**Tables Dropped**:
- `business_scans` (replaced by BusinessScan)

**Foreign Keys Dropped**: 13 FK constraints removed (likely for performance)

**Risk**: 🚨 **CRITICAL** - This migration has BREAKING CHANGES to enums

---

### 13. `20260601175223_add_card_payment_method`
**Timestamp**: 2026-06-01 17:52:23  
**Purpose**: Add card payment support  
**Status**: ⏳ REQUIRES INSPECTION  
**Tables Affected**: PaymentTransaction, PaymentMethod enum (likely)

---

### 14. `20260601181304_link_payment_to_marketplace_order`
**Timestamp**: 2026-06-01 18:13:04  
**Purpose**: Link payments to marketplace orders  
**Status**: ⏳ REQUIRES INSPECTION  
**Tables Affected**: PaymentTransaction, MarketplaceOrder

---

### 15. `20260601202002_financial_ledger_core` ⚠️ **CRITICAL**
**Timestamp**: 2026-06-01 20:20:02  
**Purpose**: **FINANCIAL LEDGER SYSTEM** - Single source of truth for finance  
**Status**: ✅ REVIEWED

**Enum Created**:
- `LedgerDomain`: SUBSCRIPTION, MARKETPLACE, PLATFORM, OTHER

**Table Created**:
- `FinancialLedgerEntry` ⚠️ **CRITICAL FOR OBSERVATION**

**Columns**:
- `id` (PK), `businessId`, `domain`, `eventType` (BillingEventType)
- `amountCents`, `currency` (default RWF), `vatAmountCents`, `exVatAmountCents`
- `gatewayFeeCents`, `platformFeeCents`, `netAmountCents`
- `gateway` (PaymentGateway), `paymentMethod`, `status` (PaymentTransactionStatus)
- `paymentTransactionId`, `subscriptionId`, `marketplaceOrderId`
- `invoiceNumber`, `providerReference`, `idempotencyKey` ⚠️ **UNIQUE**
- `occurredAt`, `createdAt`

**Indexes Created** (8 indexes):
- UNIQUE: `idempotencyKey`
- Composite: `businessId + occurredAt`
- Composite: `eventType + occurredAt`
- Composite: `domain + occurredAt`
- Composite: `gateway + occurredAt`
- Single: `paymentTransactionId`
- Single: `subscriptionId`
- Single: `marketplaceOrderId`
- Single: `invoiceNumber`

**Risk**: ✅ **SAFE** - Well-designed ledger with idempotency

---

### 16. `20260614_pr01_die_database_foundation`
**Timestamp**: 2026-06-14  
**Purpose**: DIE (Document Intelligence Engine) database foundation  
**Status**: ⏳ REQUIRES INSPECTION  
**Tables Affected**: DIE-related tables

---

### 17. `20260614b_pr02_extraction_layer`
**Timestamp**: 2026-06-14  
**Purpose**: DIE extraction layer  
**Status**: ⏳ REQUIRES INSPECTION  
**Tables Affected**: DIE extraction tables

---

### 18. `20260616100000_block4d_procurement_reconciliation`
**Timestamp**: 2026-06-16 10:00:00  
**Purpose**: Procurement reconciliation system  
**Status**: ⏳ REQUIRES INSPECTION  
**Tables Affected**: Procurement, reconciliation tables

---

### 19. `20260616120000_block4e_anomaly_confidence`
**Timestamp**: 2026-06-16 12:00:00  
**Purpose**: Anomaly detection confidence system  
**Status**: ⏳ REQUIRES INSPECTION  
**Tables Affected**: Anomaly detection tables

---

### 20. `20260616130000_recreate_cost_anomaly_alert`
**Timestamp**: 2026-06-16 13:00:00  
**Purpose**: Recreate cost anomaly alert system  
**Status**: ⏳ REQUIRES INSPECTION  
**Tables Affected**: CostAnomalyAlert (likely)

---

### 21. `20260616140000_block4g_system_consolidation`
**Timestamp**: 2026-06-16 14:00:00  
**Purpose**: System consolidation (DIE finalization)  
**Status**: ⏳ REQUIRES INSPECTION  
**Tables Affected**: Multiple DIE tables

---

## STANDALONE SQL MIGRATIONS (No Timestamp)

### 1. `add_audit_log.sql`
**Purpose**: Add audit logging  
**Status**: ⚠️ **MANUAL MIGRATION** - Not managed by Prisma  
**Risk**: May conflict with `20260304_audit-log` migration

---

### 2. `add_business_approval.sql`
**Purpose**: Add business approval workflow  
**Status**: ⚠️ **MANUAL MIGRATION**  
**Risk**: May conflict with Restaurant.approvalStatus in billing_ledger migration

---

### 3. `add_qr_remote_order_support.sql`
**Purpose**: Add QR remote order support  
**Status**: ⚠️ **MANUAL MIGRATION**  
**Risk**: May conflict with QR tables in billing_ledger migration

---

### 4. `add_trial_eligibility.sql`
**Purpose**: Add trial eligibility tracking  
**Status**: ⚠️ **MANUAL MIGRATION**  
**Risk**: May conflict with `20260304_trial-eligibility` migration

---

### 5. `referral_system.sql`
**Purpose**: Referral system implementation  
**Status**: ⚠️ **MANUAL MIGRATION**  
**Risk**: May conflict with ReferralClick, ReferralReward tables

---

### 6. `safe_business_constraints.sql`
**Purpose**: Add business constraints safely  
**Status**: ⚠️ **MANUAL MIGRATION**

---

### 7. `safe_business_migration.sql`
**Purpose**: Safe business data migration  
**Status**: ⚠️ **MANUAL MIGRATION**

---

### 8. `safe_business_migration_steps_1_4.sql`
**Purpose**: Business migration steps 1-4  
**Status**: ⚠️ **MANUAL MIGRATION**

---

### 9. `20260216_raw_tables_business_migration.sql`
**Purpose**: Raw tables business migration  
**Status**: ⚠️ **MANUAL MIGRATION** (has timestamp but is SQL file, not directory)

---

## CRITICAL OBSERVATIONS

### 🚨 BREAKING CHANGES DETECTED

**Migration**: `20260601081228_billing_ledger`

**Breaking Changes**:
1. `PaymentTransaction.status` column type changed from string to enum
   - **Risk**: If old data has non-enum values, migration will FAIL
   - **Mitigation**: Requires data migration script

2. `Subscription.status` column type changed from string to enum
   - **Risk**: If old data has non-enum values, migration will FAIL
   - **Mitigation**: Requires data migration script

3. `PaymentGateway` enum values removed: MTN_MONEY, AIRTEL_MONEY
   - **Risk**: If existing data uses these values, migration will FAIL
   - **Mitigation**: Requires data migration to map to MOBILE_MONEY or INTOUCH

4. `Reservation.depositAmountCents` column dropped
   - **Risk**: Data loss if column has values
   - **Mitigation**: Requires data preservation script

### ⚠️ MANUAL MIGRATION CONFLICTS

**Issue**: 7+ standalone SQL files exist alongside Prisma migrations

**Conflicts**:
- `add_audit_log.sql` vs `20260304_audit-log/`
- `add_trial_eligibility.sql` vs `20260304_trial-eligibility/`
- `add_qr_remote_order_support.sql` vs QR tables in `billing_ledger`
- `referral_system.sql` vs Referral tables in `billing_ledger`

**Risk**: Duplicate table creation, constraint conflicts, data inconsistency

**Recommendation**: Audit which migrations have been applied manually

### ✅ WELL-DESIGNED SYSTEMS

**Financial Ledger** (`20260601202002_financial_ledger_core`):
- ✅ Unique idempotency key prevents duplicates
- ✅ Comprehensive indexes for performance
- ✅ Proper foreign key references
- ✅ Timestamp tracking (occurredAt, createdAt)

---

## MIGRATION HEALTH ASSESSMENT

| Aspect | Status | Notes |
|--------|--------|-------|
| **Prisma Managed** | ⚠️ PARTIAL | 21 Prisma migrations + 9 manual SQL files |
| **Breaking Changes** | 🚨 YES | Enum changes in billing_ledger migration |
| **Manual Conflicts** | ⚠️ LIKELY | Duplicate migration purposes detected |
| **Idempotency** | ✅ GOOD | FinancialLedgerEntry has unique idempotencyKey |
| **Indexes** | ✅ GOOD | Comprehensive indexes on critical tables |
| **Foreign Keys** | ⚠️ DROPPED | 13 FK constraints removed in billing_ledger |

---

## NEXT STEPS (AUDIT ONLY)

1. **Verify Supabase State**: Check which migrations are actually applied
2. **Compare Prisma vs DB**: Identify schema drift
3. **Validate Observation Queries**: Ensure all tables/columns exist
4. **Document Payment Schema**: Map PaymentTransaction → FinancialLedgerEntry flow
5. **Risk Assessment**: Prioritize critical vs low-risk discrepancies

---

**Inventory Status**: ✅ COMPLETE (High-Level)  
**Detailed Review Required**: 16 migrations need full inspection  
**Critical Migrations Reviewed**: 2 (billing_ledger, financial_ledger_core)
