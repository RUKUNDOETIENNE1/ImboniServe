# CR-001 — Confidence Improvement Recommendations

**Review:** CR-001 — Confidence Readiness Review
**Date:** 2026-08-07
**Status:** Complete

---

## Executive Summary

This document provides specific, actionable recommendations to address the 8 confidence conditions and 20 confidence improvements identified during CR-001. Each recommendation includes the exact file to modify, the change to make, and the expected confidence impact.

---

## Priority 1: Confidence Conditions (Must Complete Before Onboarding)

### REC-001: Implement Pending Orders Warning Before Closing
**Addresses:** UNC-001 (Board Condition 2)
**File:** `src/pages/dashboard/close-day.tsx`
**Change:** Before calling the close-day API (lines 60-78), check if `pendingOrders > 0`. If so, show a confirmation dialog: "There are N pending orders. Closing the day will not resolve them. Are you sure you want to close?"
**Effort:** Low (1-2 hours)
**Confidence Impact:** Prevents accidental close with unresolved orders

### REC-002: Implement Outstanding Liabilities in Z-Report
**Addresses:** UNC-002 (Board Condition 3)
**Files:** `src/pages/api/reports/close-day.ts`, `src/pages/dashboard/close-day.tsx`
**Change:** In close-day API, query outstanding commissions (`commission.status = 'PENDING'`), pending payouts, and outstanding refunds. Add to response. In close-day UI, display "Outstanding Liabilities" section.
**Effort:** Medium (4-6 hours)
**Confidence Impact:** Manager sees complete financial picture at close

### REC-003: Create CI Pipeline for Reliability Tests
**Addresses:** UNC-003 (Board Condition 4)
**Files:** Create `.github/workflows/reliability-tests.yml`
**Change:** GitHub Actions workflow that runs `npx jest tests/reliability/ --no-coverage` on every PR. Block merge if any test fails. Also run `npx prisma validate` and `npx next build`.
**Effort:** Medium (2-4 hours)
**Confidence Impact:** Automated regression detection prevents future breaks

### REC-004: Document Consumption Engine Env Vars
**Addresses:** UNC-004 (Board Condition 1)
**File:** `.env.example`
**Change:** Add:
```
# Kitchen Consumption Engine
# Mode: 'off' (default), 'shadow' (dry run, logs only), 'enforce' (actual consumption)
KITCHEN_CONSUMPTION_ENGINE_MODE=off
# Comma-separated list of business IDs enrolled in the consumption pilot
KITCHEN_CONSUMPTION_PILOT_BUSINESS_IDS=
```
**Effort:** Low (15 minutes)
**Confidence Impact:** Operator can enable consumption engine without reading source code

### REC-005: Add Authentication to DIE Plugin Marketplace
**Addresses:** UNC-005
**Files:** `src/pages/api/die/plugins/marketplace/index.ts`, `[id]/install.ts`, `[id]/enable.ts`, `[id]/disable.ts`, `[id]/index.ts`
**Change:** Add `requireAuth` and `requireRole(['ADMIN'])` to all 5 endpoints. Import from `@/lib/api/auth.middleware`.
**Effort:** Low (1 hour)
**Confidence Impact:** Closes critical security gap — anyone can currently install/enable/disable plugins

### REC-006: Add Authentication to Customer Referral Tracking
**Addresses:** UNC-006
**File:** `src/pages/api/customer-referrals/track.ts`
**Change:** Add `requireAuth` middleware. Referral tracking should only be callable by authenticated users or via a verified webhook.
**Effort:** Low (30 minutes)
**Confidence Impact:** Prevents referral fraud

### REC-007: Make Payment Completion Ledger Write Transactional
**Addresses:** UNC-007
**File:** `src/lib/services/payment-completion.service.ts`
**Change:** Wrap the Sale update, PaymentTransaction update, and BillingLedgerEntry creation in a single `prisma.$transaction()`. If the ledger entry fails, the entire transaction rolls back — Sale is NOT marked COMPLETED. The webhook will retry.
**Alternative:** If transaction is too heavy, add a reconciliation safety net: after payment completion, immediately verify ledger entry exists. If not, create it. Log the gap.
**Effort:** Medium (4-8 hours)
**Confidence Impact:** Eliminates the root cause of SIM-CRIT-002 — Sale can no longer be COMPLETED without ledger entry

### REC-008: Make Close-Day Operation Atomic
**Addresses:** UNC-008
**File:** `src/pages/api/reports/close-day.ts`
**Change:** Wrap the close-day operation in a `prisma.$transaction()`. If any step fails, the entire close rolls back. The day is only marked closed if all operations succeed.
**Effort:** Medium (3-5 hours)
**Confidence Impact:** Eliminates half-closed day risk

---

## Priority 2: Confidence Improvements (Should Complete Before or Shortly After Onboarding)

### REC-009: Add Admin Override for DELIVERED Status Reversal
**Addresses:** UNC-009
**File:** `src/lib/services/sale-item-status.service.ts`
**Change:** Add an admin-only endpoint that allows reversing DELIVERED → READY with an audit log entry. Require ADMIN role and reason text.
**Effort:** Medium (3-4 hours)

### REC-010: Fix Setup Bug — Payment Config with Default VAT
**Addresses:** UNC-019
**File:** `src/pages/api/business/setup-status.ts` lines 42-45
**Change:** Remove the `business.taxRate !== 18.0` condition. Payment config should be considered "done" if `taxMode` is set (any value) OR `taxRate` is set (any value including 18.0).
**Effort:** Low (15 minutes)
**Confidence Impact:** Critical — every Rwandan restaurant owner is currently stuck at 75% setup

### REC-011: Add Trust Indicators to CEO Dashboard AI Insights
**Addresses:** UNC-020
**File:** `src/pages/dashboard/ceo.tsx` lines 352-405
**Change:** Add the same advisory disclaimer used in the 7 AI assistants: "AI-generated insights are advisory only, derived from your business data. Always use your judgment before acting." Add confidence scores if available.
**Effort:** Low (1 hour)

### REC-012: Standardize Revenue Calculation
**Addresses:** UNC-016
**Files:** `src/pages/api/reports/close-day.ts`, `src/pages/api/admin/revenue-operations/index.ts`, `src/pages/api/admin/executive/cfo.ts`
**Change:** All revenue calculations should query `FinancialLedgerEntry` as the canonical source. The Z-Report should calculate revenue from ledger entries, not from `Sale.totalAmountCents`. The cross-check (SIM-CRIT-002) becomes unnecessary if both use the same source.
**Effort:** Medium (6-8 hours)

### REC-013: Add Error Logging to Silent Catch Blocks
**Addresses:** UNC-011, UNC-012, UNC-013
**Files:** `src/lib/services/kitchen-dispatch.service.ts`, `src/pages/admin/reconciliation.tsx`, `src/lib/die/kernel/unified-intelligence-kernel.ts`
**Change:** Replace `.catch(() => {})` with `.catch(e => log.warn('[Context] Operation failed', e))`. Don't block the operation, but log the failure.
**Effort:** Low (2 hours)

### REC-014: Add Kitchen Delay Watchdog
**Addresses:** UNC-022
**File:** Create `src/lib/services/watchdog/operational/kitchen-delay-watchdog.service.ts`
**Change:** Watchdog that checks for orders in "PREPARING" status for > 30 minutes. Alert via WhatsApp to kitchen manager. Add to cron schedule.
**Effort:** Medium (4-6 hours)

### REC-015: Add Payment Retry Mechanism
**Addresses:** UNC-023
**File:** `src/pages/api/orders/[id]/confirm-payment.ts`
**Change:** If payment failed, allow customer to retry via a new payment link. Update order status from FAILED back to PENDING when retry initiated.
**Effort:** Medium (3-5 hours)

### REC-016: Add Transactions to Reservation Update Methods
**Addresses:** UNC-017
**File:** `src/lib/services/reservation.service.ts` lines 151-174
**Change:** Wrap `updateStatus()` and `updateTable()` in `prisma.$transaction()`.
**Effort:** Low (1 hour)

### REC-017: Show Platform Fee Before Checkout
**Addresses:** UNC-021
**File:** `src/pages/order/index.tsx` lines 1053-1055
**Change:** Show estimated platform fee amount in cart, before checkout. Change language from "shown at checkout" to actual amount.
**Effort:** Low (1-2 hours)

### REC-018: Add Emergency Support Contact
**Addresses:** UNC-024
**File:** `src/components/SupportWidget.tsx`
**Change:** Add "For urgent issues (payment down, system outage), call: [phone number]" in the support widget.
**Effort:** Low (30 minutes)

---

## Priority 3: Long-Term Improvements (Deferred)

These are tracked in the Remaining Uncertainty Register (UNC-029 through UNC-043) and should be addressed over time. They don't block Customer #1 onboarding.

---

## Implementation Priority Order

| Order | Recommendation | Effort | Impact |
|-------|---------------|--------|--------|
| 1 | REC-010: Fix setup bug (default VAT) | 15 min | Critical |
| 2 | REC-005: Auth on DIE marketplace | 1 hour | Critical |
| 3 | REC-006: Auth on referral tracking | 30 min | High |
| 4 | REC-004: Document env vars | 15 min | Medium |
| 5 | REC-001: Pending orders warning | 2 hours | High |
| 6 | REC-011: CEO dashboard trust indicators | 1 hour | High |
| 7 | REC-013: Log silent failures | 2 hours | High |
| 8 | REC-018: Emergency support contact | 30 min | Medium |
| 9 | REC-017: Show platform fee before checkout | 2 hours | Medium |
| 10 | REC-016: Reservation transactions | 1 hour | High |
| 11 | REC-002: Liabilities in Z-Report | 6 hours | High |
| 12 | REC-003: CI pipeline | 4 hours | High |
| 13 | REC-007: Transactional payment | 8 hours | Critical |
| 14 | REC-008: Atomic close-day | 5 hours | High |
| 15 | REC-009: DELIVERED reversal | 4 hours | High |
| 16 | REC-012: Standardize revenue | 8 hours | High |
| 17 | REC-014: Kitchen delay watchdog | 6 hours | Medium |
| 18 | REC-015: Payment retry | 5 hours | Medium |

**Total estimated effort for Priority 1 (8 conditions): ~25 hours**
**Total estimated effort for Priority 2 (10 improvements): ~35 hours**

---

## Board Assessment

The 8 confidence conditions are all correctable with reasonable effort. The most critical are:

1. **REC-010** (setup bug) — 15 minutes, affects every new user
2. **REC-005** (DIE marketplace auth) — 1 hour, critical security gap
3. **REC-007** (transactional payment) — 8 hours, root cause of SIM-CRIT-002

After completing the 8 confidence conditions, the Board will re-evaluate for HIGH CONFIDENCE.
