# Architectural Invariant Verification

> **Auditor:** Chief Product Auditor (Independent)  
> **Date:** July 25, 2026  
> **Reference:** ARCHITECTURAL_INVARIANTS.md

Each invariant was verified through code inspection, grep searches, and workflow tracing. Implementation is the source of truth — documentation claims were not trusted.

---

## Invariant 1: Payment Completion — Single Orchestrator

**Status**: ❌ **FAIL**

**Claim**: All post-payment side effects flow through `PaymentCompletionService`.

**Evidence of PASS**:
- CASH path: `sales.service.ts:82` → `PaymentCompletionService.onPaymentSuccess` ✅
- MoMo polling: `momo/status/[transactionId].ts:59` → `PaymentCompletionService.onPaymentSuccess` ✅
- IremboPay webhook: `irembo/webhook.ts:145` → `PaymentCompletionService.onPaymentSuccess` ✅

**Evidence of FAIL** (4 bypass paths):
1. `payments/intouch/status/[id].ts:91-110` — Directly updates sale, calls `GuestRecognitionService.onOrderCompleted` inline. No `PaymentCompletionService`.
2. `orders/[id]/confirm-payment.ts:66-138` — Directly updates sale, calls `GuestRecognitionService.onOrderCompleted` and `NotificationService.sendOrderNotification` inline. No `PaymentCompletionService`.
3. `payments/mtn-momo/callback.ts:38-71` — Updates transaction and subscription. No sale update, no `PaymentCompletionService`, no side effects.
4. `tap-leave-finalization.service.ts:90` — Calls `SmartDiningSlipService.generateSlip` directly. No `PaymentCompletionService`.

**Verdict**: 3 of 7 payment paths comply. 4 bypass. **FAIL.**

---

## Invariant 2: Loyalty Points — Single Mutation Owner

**Status**: ✅ **PASS**

**Evidence**:
- `grep -r "loyaltyPoints.*increment" src/ --include="*.ts"` → Only match: `loyalty.service.ts:62`
- `grep -r "loyaltyPoints.*decrement" src/ --include="*.ts"` → Only match: `loyalty.service.ts:100`
- `CustomerService.updateVisitStats` (`customer.service.ts:49-58`) increments `totalSpent`, `lifetimeSpendCents`, `visitCount`, `lastVisit` — **no `loyaltyPoints`**.
- `GuestRecognitionService.onOrderCompleted` (`guest-recognition.service.ts:356`) delegates to `LoyaltyService.earnPoints`.

**Verdict**: `LoyaltyService` is the sole mutation owner. **PASS.**

---

## Invariant 3: VIP Tier — Single Policy Owner

**Status**: ✅ **PASS**

**Evidence**:
- `grep -r "updateVIPStatus|getVIPBenefits|applyVIPDiscount" src/ --include="*.ts"` → **No results found**.
- `VIP_TIER_CONFIG` exported from `guest-recognition.service.ts:89`.
- `calculateVIPTier` exported from `guest-recognition.service.ts:97`.
- `GuestRecognitionService.recalculateVIPTier` at line 515 uses `calculateVIPTier`.

**Verdict**: `GuestRecognitionService` is the sole VIP tier policy owner. **PASS.**

---

## Invariant 4: Customer Identity — Single Source of Truth

**Status**: ✅ **PASS**

**Evidence**:
- `CustomerService.findOrCreateByPhone` at `customer.service.ts:33` is the canonical entry point.
- `ReservationService.createReservation` at `reservation.service.ts:46` calls `CustomerService.findOrCreateByPhone`.
- Hotel rooms API at `hotel/rooms.ts:50` calls `CustomerService.findOrCreateByPhone`.
- `SalesService.createSale` at `sales.service.ts:30` calls `GuestRecognitionService.registerOrRecognize` which uses `CustomerService`.

**Verdict**: Customer identity is unified. **PASS.**

---

## Invariant 5: Reservation Workflow — Single Service

**Status**: ❌ **FAIL**

**Evidence of PASS**:
- POST `/api/reservations` → `ReservationService.createReservation` ✅
- DELETE `/api/reservations/[id]` → `ReservationService.cancelReservation` ✅
- PATCH status → `ReservationService.updateStatus` ✅

**Evidence of FAIL** (6 direct `prisma.reservation.update` calls):
1. `reservations/[id].ts:58` — `prisma.reservation.update` for `tableId`
2. `reservations/[id].ts:67` — `prisma.reservation.update` for `depositStatus`
3. `reservations/[id]/cancel.ts:34` — `prisma.reservation.update` for cancellation
4. `webhooks/intouch.ts:211` — `prisma.reservation.update` for deposit status
5. `webhooks/intouch.ts:220` — `prisma.reservation.update` for deposit failure
6. `reservation-reminder.service.ts:130,191,300,319` — Multiple `prisma.reservation.update` calls for reminders, confirmations, no-shows, completions
7. `lib/cron.ts:620` — `prisma.reservation.update` for deposit forfeiture

**Verdict**: ReservationService is used for create and cancel in main API, but 7+ direct prisma calls bypass it. **FAIL.**

---

## Invariant 6: Financial Ledger — Single Source of Truth

**Status**: ✅ **PASS** (with caveat)

**Evidence**:
- `logBillingEvent` in `billing-ledger.service.ts` is the canonical writer.
- `SALES` domain added to `LedgerDomain` enum at `schema.prisma:2264`.
- `PaymentCompletionService.onPaymentSuccess` calls `logBillingEvent` at line 143.

**Caveat**: The IremboPay webhook handler calls `logBillingEvent` at line 98 AND `PaymentCompletionService` calls it again at line 143, creating duplicate entries. This is a data integrity issue, not an invariant violation per se — the ledger is still the single source of truth, but it has duplicate data.

**Verdict**: **PASS** (with double-entry caveat for IremboPay path).

---

## Invariant 7: Contact ↔ Customer Bridge — Bidirectional Sync

**Status**: ❌ **FAIL**

**Evidence**:
- `ContactCustomerBridge` class exists at `contact-customer-bridge.service.ts`.
- `ensureContactForCustomer` method exists at line 24.
- `ensureCustomerForContact` method exists at line 86.
- `grep -r "ContactCustomerBridge" src/` → Only matches in `contact-customer-bridge.service.ts` itself.
- `grep -r "ensureContactForCustomer|ensureCustomerForContact" src/` → Only matches in `contact-customer-bridge.service.ts`.

**Verdict**: The bridge service exists but is **never called** from any customer or contact creation flow. It is dead code. **FAIL.**

---

## Invariant 8: Hotel Check-in — Customer Linkage

**Status**: ✅ **PASS**

**Evidence**:
- `Room.customerId` FK exists in schema at `schema.prisma:1819`.
- `Room.customer` relation at `schema.prisma:1826`.
- Hotel rooms API at `hotel/rooms.ts:47-55` resolves customer from `guestPhone` via `CustomerService.findOrCreateByPhone`.
- GET includes customer data at `hotel/rooms.ts:29-31`.

**Verdict**: Hotel check-in links to Customer. **PASS.**

---

## Invariant 9: IremboPay Webhook — Single Endpoint

**Status**: ✅ **PASS**

**Evidence**:
- `/api/webhooks/irembopay.ts` returns `410 Gone` at line 16.
- `/api/payments/irembo/webhook.ts` is the canonical handler.

**Verdict**: **PASS.**

---

## Invariant 10: Navigation — Role-Based Filtering

**Status**: ✅ **PASS**

**Evidence**:
- `V1NavigationItem` interface includes `rolesAllowed` field.
- `getV1Navigation()` at `DashboardLayout.tsx:170-205` checks `item.rolesAllowed && !hasAnyRole(item.rolesAllowed)` to filter items.
- `hasAnyRole` at `DashboardLayout.tsx:93` checks `userRoles.some((r: string) => roles.includes(r))`.
- Role-restricted items: Kitchen, Tables, Reservations, Waiter, Service Replay.

**Verdict**: **PASS.**

---

## Summary

| Invariant | Status |
|-----------|--------|
| 1. Payment Completion — Single Orchestrator | ❌ FAIL |
| 2. Loyalty Points — Single Mutation Owner | ✅ PASS |
| 3. VIP Tier — Single Policy Owner | ✅ PASS |
| 4. Customer Identity — Single Source of Truth | ✅ PASS |
| 5. Reservation Workflow — Single Service | ❌ FAIL |
| 6. Financial Ledger — Single Source of Truth | ✅ PASS (caveat: double entries) |
| 7. Contact ↔ Customer Bridge — Bidirectional Sync | ❌ FAIL |
| 8. Hotel Check-in — Customer Linkage | ✅ PASS |
| 9. IremboPay Webhook — Single Endpoint | ✅ PASS |
| 10. Navigation — Role-Based Filtering | ✅ PASS |

**Score: 7/10 PASS, 3/10 FAIL**
