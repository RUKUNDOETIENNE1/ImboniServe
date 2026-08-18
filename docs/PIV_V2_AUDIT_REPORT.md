# PIV v2 Audit Report

> **Auditor:** Chief Product Auditor (Independent)  
> **Date:** July 25, 2026  
> **Status:** COMPLETE  
> **Reference:** PIV_AUDIT_REPORT.md (Original), PIV_RESOLUTION_VERIFICATION.md (Self-Assessment)

---

## Executive Summary

An independent Platform Integrity Validation v2 (PIV v2) audit was conducted to verify whether the Platform Integrity Resolution Sprint (PIRS) successfully resolved all findings from the original PIV audit. The audit was performed through code inspection, workflow tracing, and cross-system consistency verification — **not** by trusting the self-assessment documentation.

### Key Findings

The PIRS made **significant and genuine progress** on the original PIV findings. The core architectural changes (PaymentCompletionService, LoyaltyService single-ownership, VIP tier consolidation, reservation-customer linkage, duplicate webhook retirement) are **real and verified in code**.

However, the implementation is **incomplete in several critical areas**:

1. **PaymentCompletionService is bypassed by 3 additional payment paths** not covered in the PIRS scope (InTouch status polling, manual payment confirmation, MTN MoMo callback). These paths still inline side effects.
2. **ContactCustomerBridge is never called** — the service exists but is not wired into any customer or contact creation flow.
3. **ReservationService is still bypassed** by 4 code paths (cancel endpoint, InTouch webhook, reservation-reminder service, cron no-show processing).
4. **CEO and CFO dashboards remain unreachable** from navigation — the original PIV finding was not addressed.
5. **IremboPay webhook creates duplicate billing events** — `logBillingEvent` is called in the webhook handler AND again inside `PaymentCompletionService.onPaymentSuccess`.

### Overall Integrity Score: 72/100 — CONDITIONAL PASS

---

## Audit Methodology

Every claim in `PIV_RESOLUTION_VERIFICATION.md` was independently verified by:
1. Reading the actual source code of each modified file
2. Searching for bypass paths using `grep` across the entire codebase
3. Tracing payment flows from entry point to side effects
4. Verifying Prisma schema relations
5. Checking navigation reachability
6. Searching for orphaned/dead code

Where implementation did not match documentation, **implementation was recorded as the source of truth**.

---

## Workstream 1 — Original Findings Revalidation

### CRITICAL-1: Loyalty Points Ledger Desynchronization
**PIV Finding**: `CustomerService.updateCustomerStats` increments `loyaltyPoints` without `PointsLedger` entry.

**Verification**:
- `CustomerService` now has `updateVisitStats` (renamed from `updateCustomerStats`) — confirmed at `customer.service.ts:49`. It increments `totalSpent`, `lifetimeSpendCents`, `visitCount`, `lastVisit` only. **No `loyaltyPoints` increment.**
- `GuestRecognitionService.onOrderCompleted` at `guest-recognition.service.ts:356` calls `LoyaltyService.earnPoints()`.
- `LoyaltyService.earnPoints` at `loyalty.service.ts:48` creates `PointsLedger` entry AND increments `Customer.loyaltyPoints`.
- Grep for `loyaltyPoints.*increment` across all `.ts` files: only found in `loyalty.service.ts:62`. ✅
- Grep for `loyaltyPoints.*decrement`: only found in `loyalty.service.ts:100`. ✅

**Status**: ✅ FULLY RESOLVED

---

### CRITICAL-2: VIP Tier Threshold Contradiction
**PIV Finding**: `LoyaltyService` contains `updateVIPStatus`, `getVIPBenefits`, `applyVIPDiscount` with contradictory thresholds.

**Verification**:
- Grep for `updateVIPStatus|getVIPBenefits|applyVIPDiscount` across all `.ts` files: **No results found**. ✅
- `VIP_TIER_CONFIG` and `calculateVIPTier` exported from `guest-recognition.service.ts:89-105`. ✅
- `GuestRecognitionService.recalculateVIPTier` at line 515 uses `calculateVIPTier`. ✅

**Status**: ✅ FULLY RESOLVED

---

### CRITICAL-3: Reservation-Customer Disconnect
**PIV Finding**: Reservations store customer data as plain strings, never link to `Customer` records.

**Verification**:
- Prisma schema at `schema.prisma:2043`: `customer Customer? @relation(fields: [customerId], references: [id])`. ✅
- `ReservationService.createReservation` at `reservation.service.ts:42-55` calls `CustomerService.findOrCreateByPhone`. ✅
- Reservation POST API at `reservations/index.ts:81` delegates to `ReservationService.createReservation`. ✅

**Status**: ✅ FULLY RESOLVED

---

### CRITICAL-4: Duplicate IremboPay Webhook Handlers
**PIV Finding**: Two webhook endpoints process the same IremboPay events.

**Verification**:
- `/api/webhooks/irembopay.ts` at line 15-20: returns `410 Gone`. ✅
- `/api/payments/irembo/webhook.ts` is the canonical handler. ✅

**Status**: ✅ FULLY RESOLVED

---

### CRITICAL-5: 13+ Orphaned Features (Unreachable Pages)
**PIV Finding**: CEO Dashboard (801 lines), CFO Dashboard (1036 lines), Waiter dashboard, Customers page, and 9+ other routes unreachable from navigation.

**Verification**:
- **Waiter Dashboard**: Added to navigation at `DashboardLayout.tsx:107` with `rolesAllowed`. ✅
- **CEO Dashboard**: File exists at `src/pages/dashboard/ceo.tsx`. **NOT in navigation.** ❌
- **CFO Dashboard**: Files exist at `src/pages/dashboard/cfo.tsx` and `cfo-power-components.tsx`. **NOT in navigation.** ❌
- **Sales page**: Listed in "HIDDEN FROM NAV" comment at `DashboardLayout.tsx:164`. **NOT in navigation.** ❌
- **Customers page**: Not found in navigation. ❌
- **Referrals page**: Not found in navigation. ❌
- **Site Builder**: Not found in navigation. ❌

**Status**: ⚠️ PARTIALLY RESOLVED (Waiter dashboard fixed; CEO, CFO, Sales, Customers, Referrals, Site Builder remain unreachable)

---

## Workstream 2 — Architecture Verification

### PaymentCompletionService — NOT the only post-payment orchestrator

**Claim**: All three payment paths (CASH, MoMo, IremboPay) route through `PaymentCompletionService`.

**Verification**:
- **CASH**: `sales.service.ts:82` calls `PaymentCompletionService.onPaymentSuccess`. ✅
- **MoMo (status polling)**: `momo/status/[transactionId].ts:59` calls `PaymentCompletionService.onPaymentSuccess`. ✅
- **IremboPay webhook**: `irembo/webhook.ts:145` calls `PaymentCompletionService.onPaymentSuccess`. ✅

**BUT — 3 additional payment paths bypass PaymentCompletionService:**

1. **InTouch status polling** (`payments/intouch/status/[id].ts:91-110`): Directly updates `sale.paymentStatus = 'COMPLETED'`, then calls `GuestRecognitionService.onOrderCompleted` inline. **No PaymentCompletionService. No SmartDiningSlip. No notification. No broadcast. No ledger entry.**

2. **Manual payment confirmation** (`orders/[id]/confirm-payment.ts:66-138`): Directly updates sale in a transaction, then calls `GuestRecognitionService.onOrderCompleted`, `NotificationService.sendOrderNotification`, and `triggerEvent` inline. **No PaymentCompletionService. No SmartDiningSlip. No ledger entry.**

3. **MTN MoMo callback** (`payments/mtn-momo/callback.ts:38-71`): Updates transaction status, calls `logBillingEvent`, updates subscription. **No PaymentCompletionService. No sale update. No SmartDiningSlip. No guest recognition.**

4. **Tap & Leave finalization** (`tap-leave-finalization.service.ts:90`): Calls `SmartDiningSlipService.generateSlip` directly. **No PaymentCompletionService.**

**Verdict**: PaymentCompletionService is the orchestrator for 3 of 7 payment paths. 4 paths bypass it. **Invariant #1 is VIOLATED.**

---

### LoyaltyService — Single mutation owner

**Verification**: `loyaltyPoints` increment/decrement only found in `loyalty.service.ts`. ✅

**Verdict**: ✅ PASS

---

### GuestRecognitionService — Single VIP tier owner

**Verification**: No VIP tier methods found outside `guest-recognition.service.ts`. `VIP_TIER_CONFIG` and `calculateVIPTier` are the canonical exports. ✅

**Verdict**: ✅ PASS

---

### ReservationService — NOT the canonical reservation workflow

**Verification**:
- POST `/api/reservations` → `ReservationService.createReservation`. ✅
- PATCH `/api/reservations/[id]` → `ReservationService.updateStatus` for status, BUT directly calls `prisma.reservation.update` for `tableId` (line 58) and `depositStatus` (line 67). ⚠️
- DELETE `/api/reservations/[id]` → `ReservationService.cancelReservation`. ✅
- **Bypass paths found:**
  - `/api/reservations/[id]/cancel.ts:34` — direct `prisma.reservation.update` for cancellation. ❌
  - `/api/webhooks/intouch.ts:211,220` — direct `prisma.reservation.update` for deposit status. ❌
  - `reservation-reminder.service.ts:130,191,300,319` — direct `prisma.reservation.update` for reminders, confirmations, no-shows, completions. ❌
  - `lib/cron.ts:620` — direct `prisma.reservation.update` for deposit forfeiture. ❌

**Verdict**: ⚠️ PARTIAL — ReservationService is used for create/cancel in the main API, but 6 direct `prisma.reservation.update` calls bypass it. **Invariant #5 is VIOLATED.**

---

### Customer Identity — Single source of truth

**Verification**: `CustomerService.findOrCreateByPhone` exists and is called from `ReservationService` and hotel rooms API. ✅

**Verdict**: ✅ PASS (for the flows that use it)

---

## Workstream 3 — Architectural Invariant Verification

| # | Invariant | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Payment Completion — Single Orchestrator | **FAIL** | 4 of 7 payment paths bypass `PaymentCompletionService` (InTouch, manual confirm, MTN callback, Tap & Leave) |
| 2 | Loyalty Points — Single Mutation Owner | **PASS** | `loyaltyPoints` increment/decrement only in `loyalty.service.ts` |
| 3 | VIP Tier — Single Policy Owner | **PASS** | No VIP tier methods outside `GuestRecognitionService`; dead code deleted |
| 4 | Customer Identity — Single Source of Truth | **PASS** | `CustomerService.findOrCreateByPhone` is canonical; used by reservations and hotel |
| 5 | Reservation Workflow — Single Service | **FAIL** | 6 direct `prisma.reservation.update` calls outside `ReservationService` |
| 6 | Financial Ledger — Single Source of Truth | **PASS** | `logBillingEvent` is canonical writer; `SALES` domain added |
| 7 | Contact ↔ Customer Bridge — Bidirectional Sync | **FAIL** | `ContactCustomerBridge` exists but is **never called** from any flow |
| 8 | Hotel Check-in — Customer Linkage | **PASS** | Hotel rooms API resolves customer from `guestPhone` via `CustomerService.findOrCreateByPhone` |
| 9 | IremboPay Webhook — Single Endpoint | **PASS** | Duplicate returns 410 Gone |
| 10 | Navigation — Role-Based Filtering | **PASS** | `rolesAllowed` checked in `getV1Navigation()` filter |

**Score: 7/10 invariants pass. 3 fail.**

---

## Workstream 4 — Regression Audit

### REGRESSION-1: IremboPay Webhook Double Billing Event
**Severity**: HIGH  
**Location**: `src/pages/api/payments/irembo/webhook.ts:98-103` and `payment-completion.service.ts:143-153`  
**Description**: The IremboPay webhook handler calls `logBillingEvent` at line 98 for `PAYMENT_SUCCESS`, then delegates to `PaymentCompletionService.onPaymentSuccess` at line 145, which **also** calls `logBillingEvent` at line 143. This creates **duplicate `FinancialLedgerEntry` records** for every IremboPay payment.  
**Impact**: Double-counted revenue in financial reports.

### REGRESSION-2: InTouch Payment Path Missing Side Effects
**Severity**: HIGH  
**Location**: `src/pages/api/payments/intouch/status/[id].ts:91-110`  
**Description**: InTouch status polling directly updates sale status and calls `GuestRecognitionService.onOrderCompleted`, but does NOT generate SmartDiningSlip, does NOT send notifications, does NOT broadcast real-time updates, does NOT log billing events.  
**Impact**: Inconsistent post-payment experience for InTouch payments.

### REGRESSION-3: Manual Payment Confirmation Missing Side Effects
**Severity**: MEDIUM  
**Location**: `src/pages/api/orders/[id]/confirm-payment.ts:66-138`  
**Description**: Manual payment confirmation calls `GuestRecognitionService.onOrderCompleted` and `NotificationService.sendOrderNotification` inline, but does NOT generate SmartDiningSlip, does NOT log billing events.  
**Impact**: Missing dining slips for manually confirmed orders.

### REGRESSION-4: MTN MoMo Callback Missing Sale Update
**Severity**: HIGH  
**Location**: `src/pages/api/payments/mtn-momo/callback.ts:38-71`  
**Description**: MTN MoMo callback updates `PaymentTransaction` status and subscription, but does NOT update the associated `Sale`, does NOT call `PaymentCompletionService`, does NOT generate SmartDiningSlip, does NOT trigger guest recognition.  
**Impact**: Orders paid via MTN MoMo callback remain in PENDING status.

### REGRESSION-5: ContactCustomerBridge Never Wired
**Severity**: MEDIUM  
**Location**: `src/lib/services/contact-customer-bridge.service.ts`  
**Description**: The bridge service exists with `ensureContactForCustomer` and `ensureCustomerForContact` methods, but **no code in the entire codebase calls these methods** (grep confirms only self-references).  
**Impact**: Contact and Customer entities remain disconnected despite the bridge service existing.

### REGRESSION-6: Reservation [id].ts Direct Prisma Calls
**Severity**: MEDIUM  
**Location**: `src/pages/api/reservations/[id].ts:57-73`  
**Description**: The PATCH handler delegates `status` to `ReservationService.updateStatus`, but then directly calls `prisma.reservation.update` for `tableId` and `depositStatus` updates.  
**Impact**: Partial bypass of ReservationService.

---

## Workstream 5 — Workflow Validation

### Guest → Reservation → Customer Recognition → Ordering → Payment → Loyalty → Analytics

| Step | Status | Notes |
|------|--------|-------|
| Guest → Reservation | ✅ | `ReservationService.createReservation` resolves customer from phone |
| Reservation → Customer | ✅ | `CustomerService.findOrCreateByPhone` creates/links customer |
| Customer → Ordering | ✅ | `SalesService.createSale` uses `GuestRecognitionService.registerOrRecognize` |
| Ordering → Payment (CASH) | ✅ | Routes through `PaymentCompletionService` |
| Ordering → Payment (MoMo polling) | ✅ | Routes through `PaymentCompletionService` |
| Ordering → Payment (IremboPay) | ✅ | Routes through `PaymentCompletionService` (with double billing bug) |
| Ordering → Payment (InTouch) | ❌ | Bypasses `PaymentCompletionService` — missing dining slip, notification, broadcast, ledger |
| Ordering → Payment (Manual) | ❌ | Bypasses `PaymentCompletionService` — missing dining slip, ledger |
| Ordering → Payment (MTN callback) | ❌ | Bypasses `PaymentCompletionService` — missing sale update entirely |
| Payment → Loyalty | ✅ | `PaymentCompletionService` → `GuestRecognitionService.onOrderCompleted` → `LoyaltyService.earnPoints` |
| Loyalty → Analytics | ⚠️ | `FinancialLedgerEntry` with `SALES` domain exists but double-billing in IremboPay path |

### Hotel Check-in Workflow
| Step | Status | Notes |
|------|--------|-------|
| Check-in → Customer | ✅ | Hotel rooms API resolves customer from `guestPhone` |
| Customer → Guest Intelligence | ✅ | GET includes customer data (vipTier, loyaltyPoints, visitCount) |
| Customer → Contact (CRM) | ❌ | `ContactCustomerBridge` never called — no CRM sync |

---

## Workstream 6 — Cross-System Consistency

| System Pair | Status | Notes |
|------------|--------|-------|
| Customers ↔ Reservations | ✅ | FK linked, auto-resolution on create |
| Customers ↔ Orders | ✅ | `SalesService` resolves customer via `GuestRecognitionService` |
| Customers ↔ Hotel | ✅ | Hotel rooms API resolves customer from phone |
| Customers ↔ Loyalty | ✅ | `LoyaltyService.earnPoints` creates `PointsLedger` |
| Customers ↔ CRM Contacts | ❌ | Bridge service exists but never called |
| Payments ↔ Ledger | ⚠️ | Double billing in IremboPay path; missing in InTouch and manual paths |
| Payments ↔ Sale Status | ⚠️ | InTouch and MTN callback paths don't properly update sale status |
| Reservations ↔ Payments | ⚠️ | Deposit status updated via direct prisma calls, not ReservationService |

---

## Workstream 7 — Navigation & Reachability

| Route | In Navigation? | Status |
|-------|---------------|--------|
| `/dashboard/waiter` | ✅ Yes (OPERATIONS, v1Order: 6) | RESOLVED |
| `/dashboard/ceo` | ❌ No | STILL UNREACHABLE |
| `/dashboard/cfo` | ❌ No | STILL UNREACHABLE |
| `/dashboard/sales` | ❌ No (hidden from nav) | STILL UNREACHABLE |
| `/dashboard/customers` | ❌ No | STILL UNREACHABLE |
| `/dashboard/referrals` | ❌ No | STILL UNREACHABLE |
| `/dashboard/site-builder` | ❌ No | STILL UNREACHABLE |

**Role-based filtering**: ✅ Verified — `getV1Navigation()` checks `rolesAllowed` via `hasAnyRole()`.

---

## Workstream 8 — Dead Code & Duplicate Logic

| Item | Status | Evidence |
|------|--------|----------|
| `LoyaltyService.updateVIPStatus` | ✅ Deleted | Grep: no results |
| `LoyaltyService.getVIPBenefits` | ✅ Deleted | Grep: no results |
| `LoyaltyService.applyVIPDiscount` | ✅ Deleted | Grep: no results |
| `CustomerService.getTopCustomers` | ✅ Deleted | Grep: no results |
| `CustomerService.redeemLoyaltyPoints` | ✅ Deleted | Grep: no results |
| Duplicate IremboPay webhook | ✅ Retired (410) | Verified |
| `ContactCustomerBridge` | ⚠️ Dead code | Exists but never called — effectively dead |
| Inline payment side effects | ❌ Still present | 4 payment paths have inline side effects |
| Direct `prisma.reservation.update` | ❌ Still present | 6 calls bypass ReservationService |

---

## Workstream 9 — Platform Convergence Assessment

| Domain | PIV Original | PIV v2 | Change | Notes |
|--------|-------------|--------|--------|-------|
| Customer Identity | 20/100 | 85/100 | +65 | Reservations and hotel now link to Customer |
| Payment Processing | 30/100 | 65/100 | +35 | 3 paths fixed, 4 still bypass |
| Loyalty & VIP | 25/100 | 95/100 | +70 | Single owner, dead code removed |
| Reservations | 35/100 | 70/100 | +35 | Service used for create, but 6 bypass paths remain |
| Hotel Operations | 15/100 | 80/100 | +65 | Customer linkage works, CRM bridge not wired |
| CRM Integration | 10/100 | 30/100 | +20 | Bridge service exists but never called |
| Navigation & Access | 40/100 | 60/100 | +20 | Waiter added, CEO/CFO/Sales still unreachable |
| Financial Ledger | 60/100 | 75/100 | +15 | SALES domain added, but double-billing and missing entries |
| Notifications | 50/100 | 75/100 | +25 | Reservation confirmation works, InTouch path missing |
| Staff Intelligence | 30/100 | 80/100 | +50 | Waiter dashboard integrated |
| **Overall** | **39/100** | **72/100** | **+33** | |

---

## Certification Decision

### ⚠️ CONDITIONALLY CERTIFIED

The platform has made significant architectural progress. The core PIRS changes are genuine and verified. However, minor-to-moderate findings remain that should be addressed before Product Readiness Validation:

### Remaining Issues (Must Fix Before PRV)

1. **[HIGH] IremboPay double billing** — Remove `logBillingEvent` call from webhook handler (lines 98-103) since `PaymentCompletionService` already logs it
2. **[HIGH] InTouch payment path bypasses PaymentCompletionService** — Route through `PaymentCompletionService.onPaymentSuccess`
3. **[HIGH] MTN MoMo callback missing sale update** — Route through `PaymentCompletionService.onPaymentSuccess`
4. **[MEDIUM] Manual payment confirmation bypasses PaymentCompletionService** — Route through `PaymentCompletionService.onPaymentSuccess`
5. **[MEDIUM] ContactCustomerBridge never called** — Wire into `CustomerService.createCustomer` and Contact creation flows
6. **[MEDIUM] 6 direct `prisma.reservation.update` calls bypass ReservationService** — Route through service methods

### Remaining Issues (Should Fix Before PRV)

7. **[MEDIUM] CEO, CFO, Sales, Customers, Referrals, Site Builder pages still unreachable** — Add to navigation or formally deprecate
8. **[LOW] Tap & Leave finalization calls SmartDiningSlipService directly** — Consider routing through PaymentCompletionService

### Recommendation on Readiness for Product Readiness Validation

The platform is **not yet ready** for Product Readiness Validation. The 3 HIGH-severity payment bypass issues (items 1-3) must be resolved first, as they cause missing side effects and duplicate financial entries. The MEDIUM issues (items 4-6) should also be addressed to achieve full architectural invariant compliance.

**Estimated remediation effort**: 1-2 days for a focused sprint to wire the remaining payment paths through `PaymentCompletionService`, call `ContactCustomerBridge` from customer creation flows, and route remaining direct `prisma.reservation` calls through `ReservationService`.
