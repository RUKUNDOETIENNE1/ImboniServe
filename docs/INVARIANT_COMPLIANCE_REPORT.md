# Invariant Compliance Report

> **Sprint:** Certification Remediation Sprint (CRS)  
> **Date:** July 25, 2026  
> **Reference:** ARCHITECTURAL_INVARIANTS.md, ARCHITECTURAL_INVARIANT_VERIFICATION.md (PIV v2)

---

## Summary

| Invariant | PIV v2 Status | CRS Status | Change |
|-----------|--------------|------------|--------|
| 1. Payment Completion — Single Orchestrator | ❌ FAIL | ✅ PASS | Fixed |
| 2. Loyalty Points — Single Mutation Owner | ✅ PASS | ✅ PASS | No change needed |
| 3. VIP Tier — Single Policy Owner | ✅ PASS | ✅ PASS | No change needed |
| 4. Customer Identity — Single Source of Truth | ✅ PASS | ✅ PASS | No change needed |
| 5. Reservation Workflow — Single Service | ❌ FAIL | ✅ PASS | Fixed |
| 6. Financial Ledger — Single Source of Truth | ✅ PASS (caveat) | ✅ PASS | Double-entry caveat resolved |
| 7. Contact ↔ Customer Bridge — Bidirectional Sync | ❌ FAIL | ✅ PASS | Fixed |
| 8. Hotel Check-in — Customer Linkage | ✅ PASS | ✅ PASS | No change needed |
| 9. IremboPay Webhook — Single Endpoint | ✅ PASS | ✅ PASS | No change needed |
| 10. Navigation — Role-Based Filtering | ✅ PASS | ✅ PASS | No change needed |

**Score: 10/10 invariants pass. 0 fail.**

---

## Invariant 1: Payment Completion — Single Orchestrator

**Status: ✅ PASS**

### Verification Evidence

All 7 payment paths now route through `PaymentCompletionService`:

| Path | File | Delegation | Verified |
|------|------|-----------|----------|
| CASH | `sales.service.ts:82` | `PaymentCompletionService.onPaymentSuccess` | ✅ |
| MoMo polling | `momo/status/[transactionId].ts:59` | `PaymentCompletionService.onPaymentSuccess` | ✅ |
| IremboPay webhook | `irembo/webhook.ts:145` | `PaymentCompletionService.onPaymentSuccess` | ✅ |
| InTouch polling | `intouch/status/[id].ts:92` | `PaymentCompletionService.onPaymentSuccess` / `onPaymentFailure` | ✅ (CRS fixed) |
| MTN MoMo callback | `mtn-momo/callback.ts:60` | `PaymentCompletionService.onPaymentSuccess` | ✅ (CRS fixed) |
| Manual confirmation | `orders/[id]/confirm-payment.ts:96` | `PaymentCompletionService.onPaymentSuccess` | ✅ (CRS fixed) |
| Tap & Leave | `tap-leave-finalization.service.ts:92` | `PaymentCompletionService.onPaymentSuccess` | ✅ (CRS fixed) |

### Grep Verification
- `GuestRecognitionService.onOrderCompleted` → Only in `payment-completion.service.ts` ✅
- `SmartDiningSlipService.generateSlip` → Only in `payment-completion.service.ts` ✅

---

## Invariant 2: Loyalty Points — Single Mutation Owner

**Status: ✅ PASS (unchanged)**

### Verification Evidence
- `loyaltyPoints.*increment` → Only in `loyalty.service.ts:62` ✅
- `loyaltyPoints.*decrement` → Only in `loyalty.service.ts:100` ✅
- `CustomerService.updateVisitStats` does not touch `loyaltyPoints` ✅

---

## Invariant 3: VIP Tier — Single Policy Owner

**Status: ✅ PASS (unchanged)**

### Verification Evidence
- `updateVIPStatus|getVIPBenefits|applyVIPDiscount` → No results found ✅
- `VIP_TIER_CONFIG` and `calculateVIPTier` canonical in `guest-recognition.service.ts` ✅

---

## Invariant 4: Customer Identity — Single Source of Truth

**Status: ✅ PASS (unchanged)**

### Verification Evidence
- `CustomerService.findOrCreateByPhone` is canonical entry point ✅
- Used by `ReservationService.createReservation` ✅
- Used by hotel rooms API ✅
- Used by `SalesService.createSale` via `GuestRecognitionService` ✅

---

## Invariant 5: Reservation Workflow — Single Service

**Status: ✅ PASS (CRS fixed)**

### Verification Evidence
- `prisma.reservation.update` → Only in `reservation.service.ts` ✅
- All 10 bypass paths replaced with `ReservationService` method calls ✅

### Methods Added to ReservationService
- `updateTable`, `updateDepositStatus`, `confirmReservation`, `markNoShow`, `completeReservation`, `forfeitDeposit`, `markReminderSent`

---

## Invariant 6: Financial Ledger — Single Source of Truth

**Status: ✅ PASS (caveat resolved)**

### Verification Evidence
- `logBillingEvent` in `billing-ledger.service.ts` is canonical writer ✅
- `SALES` domain in `LedgerDomain` enum ✅
- `PaymentCompletionService.onPaymentSuccess` calls `logBillingEvent` ✅
- IremboPay duplicate `logBillingEvent` call removed (CRS fixed) ✅
- All payment paths now create ledger entries via `PaymentCompletionService` ✅

---

## Invariant 7: Contact ↔ Customer Bridge — Bidirectional Sync

**Status: ✅ PASS (CRS fixed)**

### Verification Evidence
- `ContactCustomerBridge.ensureContactForCustomer` called from `CustomerService.createCustomer` ✅
- `ContactCustomerBridge.ensureCustomerForContact` called from `ContactService.createContact` for CUSTOMER type ✅
- Bridge bug fixed: `contact.customerId` → `contact.customer` relation ✅

---

## Invariant 8: Hotel Check-in — Customer Linkage

**Status: ✅ PASS (unchanged)**

### Verification Evidence
- `Room.customerId` FK → `Customer` ✅
- Hotel rooms API auto-resolves customer from `guestPhone` via `CustomerService.findOrCreateByPhone` ✅

---

## Invariant 9: IremboPay Webhook — Single Endpoint

**Status: ✅ PASS (unchanged)**

### Verification Evidence
- `/api/webhooks/irembopay.ts` returns 410 Gone ✅
- `/api/payments/irembo/webhook.ts` is canonical handler ✅

---

## Invariant 10: Navigation — Role-Based Filtering

**Status: ✅ PASS (unchanged)**

### Verification Evidence
- `rolesAllowed` checked in `getV1Navigation()` via `hasAnyRole()` ✅
- Role-restricted items: Kitchen, Tables, Reservations, Waiter, Service Replay ✅

---

## Conclusion

**All 10 architectural invariants pass.** The 3 previously failed invariants (1, 5, 7) have been resolved through focused enforcement gap fixes. No invariants were weakened or compromised.
