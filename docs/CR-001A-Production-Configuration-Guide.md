# CR-001A — Production Configuration Guide

**Certification:** CR-001A — Confidence Conditions Remediation
**Date:** 2026-08-07
**Status:** Complete

---

## Executive Summary

This guide documents the production configuration required for the features remediated in CR-001A, with focus on the Kitchen Consumption Engine (Condition 4).

---

## 1. Kitchen Consumption Engine

### Overview
The Kitchen Consumption Engine deducts inventory when kitchen items are prepared. It operates in three modes controlled by environment variables.

### Required Environment Variables

```env
# Kitchen Consumption Engine
# Controls inventory deduction when kitchen items are prepared.
# Mode: 'off' (default, no consumption), 'shadow' (dry-run, logs only, no stock changes),
#        'enforce' (actual inventory consumption with ledger mutations)
KITCHEN_CONSUMPTION_ENGINE_MODE="off"

# Comma-separated list of business IDs enrolled in the consumption pilot.
# Only businesses in this list are affected when the engine is enabled.
# Empty = disabled for all businesses.
KITCHEN_CONSUMPTION_PILOT_BUSINESS_IDS=""
```

### Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| `off` (default) | No consumption, no logging | Initial deployment, pre-pilot |
| `shadow` | Logs what WOULD be consumed, no stock changes | Validation, comparison with manual counts |
| `enforce` | Actual inventory consumption with ledger mutations | Production after shadow validation |

### Activation Procedure

#### Step 1: Shadow Mode (Validation)
1. Set `KITCHEN_CONSUMPTION_ENGINE_MODE=shadow`
2. Set `KITCHEN_CONSUMPTION_PILOT_BUSINESS_IDS=<business_id_1>` (start with one pilot business)
3. Deploy or restart the application
4. Monitor logs for consumption events
5. Compare shadow consumption logs with manual inventory counts for 3-5 days
6. Verify no actual stock changes occurred (shadow mode is read-only)

#### Step 2: Enforce Mode (Production)
1. After shadow validation confirms accuracy, set `KITCHEN_CONSUMPTION_ENGINE_MODE=enforce`
2. Keep `KITCHEN_CONSUMPTION_PILOT_BUSINESS_IDS` limited to pilot businesses
3. Deploy or restart
4. Monitor inventory levels for 24 hours
5. Verify ledger entries are created for each consumption event
6. Gradually add more business IDs to the pilot list

#### Step 3: Full Rollout
1. Set `KITCHEN_CONSUMPTION_PILOT_BUSINESS_IDS=""` (empty = all businesses)
2. Deploy or restart
3. Monitor for 48 hours
4. Verify all businesses have consumption working

### Shadow Mode Verification
- Check application logs for `[ConsumptionEngine]` entries
- Verify logs show: business ID, menu item, quantity, what would be consumed
- Confirm no `InventoryLedger` entries were created (shadow mode is read-only)
- Compare shadow consumption totals with expected values

### Rollback Procedure
1. Set `KITCHEN_CONSUMPTION_ENGINE_MODE=off`
2. Deploy or restart
3. Engine immediately stops all consumption (both shadow and enforce)
4. No data cleanup required — shadow mode made no changes, enforce mode changes are legitimate ledger entries

### Source Code Reference
- Engine logic: `src/lib/services/sale-item-status.service.ts`
- Activation check: `KITCHEN_CONSUMPTION_ENGINE_MODE` environment variable
- Pilot filter: `KITCHEN_CONSUMPTION_PILOT_BUSINESS_IDS` environment variable

---

## 2. DIE Plugin Marketplace Permissions

### Required Permissions

| Permission | Access Level | Roles |
|-----------|-------------|-------|
| `die.view` | View plugins, view plugin details | OWNER, ADMIN, MANAGER |
| `die.manage` | Install, enable, disable plugins | OWNER, ADMIN |

### Configuration
No environment variables required. Permissions are configured via the staff roles system.

### Verification
- Unauthenticated request to `/api/die/plugins/marketplace` → 401
- Authenticated request without `die.view` → 403
- Authenticated request with `die.view` → 200 (list returned)

---

## 3. Customer Referral Tracking Permissions

### Required Permissions

| Permission | Access Level |
|-----------|-------------|
| `customers.view` | Track referral conversions |

### Configuration
No environment variables required. Permissions are configured via the staff roles system.

---

## 4. Payment Completion Transaction

### Configuration
No environment variables required. The transactional behavior is implemented in code via `prisma.$transaction()`.

### Database Requirement
PostgreSQL with transaction support (already in use).

### Verification
- Process a test payment
- Verify `Sale.paymentStatus = 'COMPLETED'`
- Verify `PaymentTransaction.status = 'SUCCESS'`
- Verify `FinancialLedgerEntry` exists with matching `paymentTransactionId`
- All three records should exist together or none should be updated

---

## 5. Atomic Close-Day

### Configuration
No environment variables required. The transactional behavior is implemented in code via `prisma.$transaction()`.

### Verification
- Close a test day
- Verify `AuditLog` entry with `action = 'CLOSE_DAY'` exists
- Verify the audit log metadata includes `totalRevenueCents`, `ledgerTotalRevenueCents`, and `ledgerMatch`
- Attempt to close the same day again → 409 Conflict

---

## 6. Z-Report Outstanding Liabilities

### Configuration
No environment variables required. Liabilities are queried from existing database tables.

### Verification
- Open Z-Report for a day with pending commissions/payouts/refunds
- Verify `outstandingLiabilities` section appears in the response
- Verify `totalLiabilitiesCents` equals sum of components

---

## 7. Pending Orders Warning

### Configuration
No environment variables required. The warning is implemented in the UI.

### Verification
- Create a sale with `paymentStatus = 'PENDING'`
- Open close-day page
- Click "Close Day"
- Verify warning dialog appears with pending order count
- Verify "Go Back & Review" closes the dialog
- Verify "Close Day Anyway" proceeds with closing

---

## 8. Setup Completion (Default VAT)

### Configuration
No environment variables required. The fix is in the setup status logic.

### Verification
- Create a new business with default settings (EXCLUSIVE, 18% VAT)
- Add a menu item, table, and staff member
- Check `/api/business/setup-status`
- Verify `hasPaymentConfig = true`
- Verify `percentComplete = 100`

---

## Deployment Checklist

- [ ] `.env.example` includes `KITCHEN_CONSUMPTION_ENGINE_MODE` and `KITCHEN_CONSUMPTION_PILOT_BUSINESS_IDS`
- [ ] Production `.env` has `KITCHEN_CONSUMPTION_ENGINE_MODE=off` (safe default)
- [ ] DIE marketplace endpoints return 401 for unauthenticated requests
- [ ] Customer referral tracking returns 401 for unauthenticated requests
- [ ] Payment completion creates ledger entry atomically
- [ ] Close-day operation is atomic
- [ ] Z-Report includes outstanding liabilities
- [ ] Close-day UI shows pending orders warning
- [ ] Setup status reaches 100% with default VAT
