# Payment Pipeline Verification

> **Sprint:** Certification Remediation Sprint (CRS)  
> **Date:** July 25, 2026

---

## Objective

Verify that every payment completion path reaches the canonical `PaymentCompletionService`. No bypass paths may exist.

---

## Payment Path Inventory

### Path 1: CASH Payment
**Entry**: `SalesService.createSale` → CASH branch  
**File**: `src/lib/services/sales.service.ts:82`  
**Delegation**: `PaymentCompletionService.onPaymentSuccess(transactionId, saleId, { source: 'cash' })`  
**Side Effects**: Sale update, dining slip, guest recognition, notification, broadcast, ledger, audit, order token  
**Status**: ✅ COMPLIANT (was already compliant before CRS)

---

### Path 2: MoMo Status Polling
**Entry**: `GET /api/payments/momo/status/[transactionId]`  
**File**: `src/pages/api/payments/momo/status/[transactionId].ts:59`  
**Delegation**: `PaymentCompletionService.onPaymentSuccess(transactionId, saleId)` on success; `PaymentCompletionService.onPaymentFailure(transactionId, saleId, reason)` on failure  
**Side Effects**: All canonical side effects  
**Status**: ✅ COMPLIANT (was already compliant before CRS)

---

### Path 3: IremboPay Webhook
**Entry**: `POST /api/payments/irembo/webhook`  
**File**: `src/pages/api/payments/irembo/webhook.ts:145`  
**Delegation**: `PaymentCompletionService.onPaymentSuccess(transactionId, saleId, { source: 'irembopay-webhook' })`  
**Side Effects**: All canonical side effects via PaymentCompletionService  
**CRS Fix**: Removed duplicate `logBillingEvent` and `AuditLogService.log` calls that were inline in the webhook handler (lines 98-116 of original file). These are now handled exclusively by `PaymentCompletionService`.  
**Status**: ✅ COMPLIANT (CRS fixed duplicate billing)

---

### Path 4: InTouch Status Polling
**Entry**: `GET /api/payments/intouch/status/[id]`  
**File**: `src/pages/api/payments/intouch/status/[id].ts:92`  
**Delegation**: `PaymentCompletionService.onPaymentSuccess(payment.id, payment.referenceId, { source: 'intouch-status-polling' })` on success; `PaymentCompletionService.onPaymentFailure(payment.id, payment.referenceId, reason)` on failure  
**CRS Fix**: Replaced inline `prisma.sale.update` + `GuestRecognitionService.onOrderCompleted` with `PaymentCompletionService` delegation. Previously missing: dining slip, notification, broadcast, ledger, audit, order token.  
**Status**: ✅ COMPLIANT (CRS fixed)

---

### Path 5: MTN MoMo Callback
**Entry**: `POST /api/payments/mtn-momo/callback`  
**File**: `src/pages/api/payments/mtn-momo/callback.ts:60`  
**Delegation**: Looks up sale by `paymentTransactionId`. If sale exists: `PaymentCompletionService.onPaymentSuccess(transactionId, saleId, { source: 'mtn-momo-callback' })`. If no sale (subscription payment): inline `logBillingEvent` + subscription update.  
**CRS Fix**: Added sale lookup and `PaymentCompletionService` delegation. Previously: sale was never updated, no side effects triggered.  
**Status**: ✅ COMPLIANT (CRS fixed)

---

### Path 6: Manual Payment Confirmation
**Entry**: `POST /api/orders/[id]/confirm-payment`  
**File**: `src/pages/api/orders/[id]/confirm-payment.ts:96`  
**Delegation**: `PaymentCompletionService.onPaymentSuccess('', saleId, { source: 'manual-confirmation' })`  
**Note**: No payment transaction ID for manual confirmations (empty string passed). `PaymentCompletionService` handles this gracefully — payment transaction update is skipped when ID is empty.  
**CRS Fix**: Replaced inline `GuestRecognitionService.onOrderCompleted`, `NotificationService.sendOrderNotification`, and `triggerEvent` with `PaymentCompletionService` delegation. Previously missing: dining slip, ledger.  
**Status**: ✅ COMPLIANT (CRS fixed)

---

### Path 7: Tap & Leave Finalization
**Entry**: `TapLeaveFinalizationService.finalize(paymentId, source)`  
**File**: `src/lib/services/tap-leave-finalization.service.ts:92`  
**Delegation**: `PaymentCompletionService.onPaymentSuccess(payment.id, primary.id, { clientPhone, clientConsentedWhatsApp: false, source: 'tap-leave-{source}' })`  
**CRS Fix**: Replaced direct `SmartDiningSlipService.generateSlip` with `PaymentCompletionService` delegation. Now all side effects (guest recognition, notification, broadcast, ledger, audit) are triggered.  
**Note**: Tap & Leave also performs tip allocation and session closing — these are Tap & Leave-specific operations that remain in the finalization service. Only the post-payment side effects were routed through `PaymentCompletionService`.  
**Status**: ✅ COMPLIANT (CRS fixed)

---

## Grep Verification

### GuestRecognitionService.onOrderCompleted
```
grep -r "GuestRecognitionService.onOrderCompleted" src/ --include="*.ts"
```
**Result**: 1 match — `payment-completion.service.ts` only ✅

### SmartDiningSlipService.generateSlip
```
grep -r "SmartDiningSlipService.generateSlip" src/ --include="*.ts"
```
**Result**: 1 match — `payment-completion.service.ts` only ✅

### Direct Sale Updates Outside PaymentCompletionService
No payment path directly updates `sale.paymentStatus` or `sale.isPaid` outside of `PaymentCompletionService`. The InTouch path previously did this at line 91-94 — that code has been removed.

---

## Idempotency Verification

All payment paths are idempotent:
- `PaymentCompletionService.onPaymentSuccess` uses `updateMany` with `paymentStatus: { not: 'COMPLETED' }` guard — if sale is already COMPLETED, it returns early
- `PaymentCompletionService.onPaymentFailure` uses `updateMany` with `paymentStatus: { notIn: ['FAILED', 'CANCELLED', 'COMPLETED'] }` guard
- IremboPay webhook uses `updateMany` with `status: { not: 'SUCCESS' }` guard for idempotent transaction updates
- Tap & Leave uses `rawStatus.finalizedAt` flag for idempotent finalization

---

## Conclusion

**All 7 payment paths now route through `PaymentCompletionService`.** No bypass paths exist. No duplicate billing events. No missing side effects. All paths are idempotent.
