# Regression Analysis

> **Auditor:** Chief Product Auditor (Independent)  
> **Date:** July 25, 2026  
> **Reference:** PIV_V2_AUDIT_REPORT.md

This document catalogs regressions and new issues introduced during the Platform Integrity Resolution Sprint (PIRS).

---

## REG-1: IremboPay Double Billing Event

**Severity**: HIGH  
**Type**: Data Integrity Regression  
**Location**: `src/pages/api/payments/irembo/webhook.ts:98-103` + `src/lib/services/payment-completion.service.ts:143-153`

**Description**:
The IremboPay webhook handler calls `logBillingEvent` at line 98 for `PAYMENT_SUCCESS`:
```typescript
await logBillingEvent({
  businessId: transaction.businessId,
  paymentTransactionId: transaction.id,
  eventType: BillingEventType.PAYMENT_SUCCESS,
  metadata: { source: 'payments/irembo/webhook', ... },
})
```

Then at line 145, it delegates to `PaymentCompletionService.onPaymentSuccess`, which **also** calls `logBillingEvent` at line 143:
```typescript
await logBillingEvent({
  businessId: sale.businessId,
  paymentTransactionId: paymentTransactionId || undefined,
  eventType: BillingEventType.PAYMENT_SUCCESS,
  metadata: { source: options?.source || 'payment-completion-service', ... },
})
```

**Impact**: Every IremboPay payment creates **two** `FinancialLedgerEntry` records with `PAYMENT_SUCCESS` event type. Revenue is double-counted in any aggregation query that sums by event type.

**Root Cause**: The webhook handler was partially refactored — `logBillingEvent` and `AuditLogService.log` calls were left inline when `PaymentCompletionService` delegation was added. `PaymentCompletionService` handles these internally.

**Fix**: Remove the `logBillingEvent` call at lines 98-103 and the `AuditLogService.log` call at lines 104-116 from the webhook handler. `PaymentCompletionService` already handles both.

---

## REG-2: InTouch Payment Path Bypasses PaymentCompletionService

**Severity**: HIGH  
**Type**: Missing Side Effects Regression  
**Location**: `src/pages/api/payments/intouch/status/[id].ts:89-110`

**Description**:
The InTouch status polling endpoint handles payment success by:
1. Directly updating `sale.paymentStatus = 'COMPLETED'` and `sale.isPaid = true` (line 91-94)
2. Calling `GuestRecognitionService.onOrderCompleted` inline (line 101)

It does **NOT**:
- Call `PaymentCompletionService.onPaymentSuccess`
- Generate Smart Dining Slip
- Send order notification
- Broadcast real-time update
- Log billing event to `FinancialLedgerEntry`
- Write audit log
- Mark order token as used

**Impact**: InTouch payments result in incomplete post-payment processing. Customers don't receive dining slips. Kitchen isn't notified. Financial ledger missing entries.

**Root Cause**: This payment path was not included in the PIRS scope. The PIRS only addressed CASH, MoMo polling, and IremboPay webhook paths.

**Fix**: Replace lines 91-110 with:
```typescript
if (newStatus === 'SUCCESS' && payment.referenceId) {
  await PaymentCompletionService.onPaymentSuccess(
    payment.id,
    payment.referenceId,
    { source: 'intouch-polling' }
  )
}
```

---

## REG-3: MTN MoMo Callback Missing Sale Update

**Severity**: HIGH  
**Type**: Missing Side Effects Regression  
**Location**: `src/pages/api/payments/mtn-momo/callback.ts:38-71`

**Description**:
The MTN MoMo callback handler:
1. Updates `PaymentTransaction` status (line 38-46)
2. Calls `logBillingEvent` (line 55-60)
3. Updates subscription if applicable (line 62-70)

It does **NOT**:
- Update the associated `Sale` record
- Call `PaymentCompletionService`
- Generate Smart Dining Slip
- Trigger guest recognition
- Send notifications
- Broadcast real-time updates

**Impact**: Orders paid via MTN MoMo callback remain in `PENDING` payment status. The sale is never marked as `COMPLETED`. Kitchen is not released. Customer doesn't receive dining slip.

**Root Cause**: This callback handler was not included in the PIRS scope.

**Fix**: After successful payment verification, find the associated sale and delegate to `PaymentCompletionService.onPaymentSuccess`.

---

## REG-4: Manual Payment Confirmation Bypasses PaymentCompletionService

**Severity**: MEDIUM  
**Type**: Missing Side Effects Regression  
**Location**: `src/pages/api/orders/[id]/confirm-payment.ts:66-138`

**Description**:
The manual payment confirmation endpoint:
1. Updates sale status in a transaction (line 66-86)
2. Writes audit log (line 88-102)
3. Calls `GuestRecognitionService.onOrderCompleted` inline (line 110)
4. Calls `NotificationService.sendOrderNotification` inline (line 123)
5. Broadcasts via `triggerEvent` inline (line 129)

It does **NOT**:
- Call `PaymentCompletionService`
- Generate Smart Dining Slip
- Log billing event to `FinancialLedgerEntry`

**Impact**: Manually confirmed orders are missing dining slips and financial ledger entries.

**Root Cause**: This endpoint was not included in the PIRS scope.

**Fix**: Replace inline side effects with `PaymentCompletionService.onPaymentSuccess` call.

---

## REG-5: ContactCustomerBridge Never Wired

**Severity**: MEDIUM  
**Type**: Dead Code / Incomplete Implementation  
**Location**: `src/lib/services/contact-customer-bridge.service.ts`

**Description**:
The `ContactCustomerBridge` service was created with two methods:
- `ensureContactForCustomer(customerId)` — creates/links a Contact for a Customer
- `ensureCustomerForContact(contactId)` — creates/links a Customer for a Contact

However, grep across the entire `src/` directory confirms that **no code outside the service file itself references `ContactCustomerBridge`, `ensureContactForCustomer`, or `ensureCustomerForContact`**.

The bridge is not called from:
- `CustomerService.createCustomer`
- `CustomerService.findOrCreateByPhone`
- `ReservationService.createReservation`
- Hotel rooms API
- Any Contact creation API
- Any CRM API

**Impact**: Contact and Customer entities remain disconnected. The architectural invariant #7 is violated. The PIRS self-assessment claimed this was resolved, but the implementation is incomplete.

**Root Cause**: The service was created but never integrated into the calling flows.

**Fix**: Call `ContactCustomerBridge.ensureContactForCustomer` after `CustomerService.createCustomer` and `findOrCreateByPhone`. Call `ContactCustomerBridge.ensureCustomerForContact` after Contact creation in CRM APIs.

---

## REG-6: Reservation PATCH Partial Bypass

**Severity**: MEDIUM  
**Type**: Incomplete Refactor  
**Location**: `src/pages/api/reservations/[id].ts:55-74`

**Description**:
The PATCH handler delegates `status` updates to `ReservationService.updateStatus` (line 52), but then directly calls `prisma.reservation.update` for:
- `tableId` update (line 58)
- `depositStatus` and `depositPaidAt` update (line 67)

**Impact**: Table assignment and deposit status changes bypass `ReservationService`, meaning any future logic added to the service (e.g., notifications, validations) won't be executed for these fields.

**Root Cause**: Incomplete refactoring — only the `status` field was delegated to the service.

**Fix**: Add `updateTable` and `updateDeposit` methods to `ReservationService` and delegate from the API handler.

---

## REG-7: Tap & Leave Finalization Direct SmartDiningSlip Call

**Severity**: LOW  
**Type**: Incomplete Refactor  
**Location**: `src/lib/services/tap-leave-finalization.service.ts:90`

**Description**:
The Tap & Leave finalization service calls `SmartDiningSlipService.generateSlip` directly instead of routing through `PaymentCompletionService`.

**Impact**: Minor — Tap & Leave is a specialized flow. However, it violates invariant #1.

**Fix**: Consider whether Tap & Leave should route through `PaymentCompletionService` or if it's a special case that warrants an exception.

---

## Regression Summary

| # | Regression | Severity | Type | Fix Effort |
|---|-----------|----------|------|-----------|
| REG-1 | IremboPay double billing | HIGH | Data integrity | 5 min — remove duplicate calls |
| REG-2 | InTouch path missing side effects | HIGH | Missing functionality | 15 min — route through PaymentCompletionService |
| REG-3 | MTN callback missing sale update | HIGH | Missing functionality | 15 min — route through PaymentCompletionService |
| REG-4 | Manual confirm missing side effects | MEDIUM | Missing functionality | 10 min — route through PaymentCompletionService |
| REG-5 | ContactCustomerBridge dead code | MEDIUM | Incomplete implementation | 30 min — wire into creation flows |
| REG-6 | Reservation PATCH partial bypass | MEDIUM | Incomplete refactor | 20 min — add service methods |
| REG-7 | Tap & Leave direct slip call | LOW | Incomplete refactor | 10 min — evaluate if exception needed |

**Total estimated fix effort**: ~2 hours
