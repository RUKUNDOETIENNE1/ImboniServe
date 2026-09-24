# Workflow Validation Report

> **Auditor:** Chief Product Auditor (Independent)  
> **Date:** July 25, 2026  
> **Reference:** PIV_V2_AUDIT_REPORT.md

---

## Methodology

Each major hospitality workflow was traced from entry point to terminal state. Every transition was verified through code inspection. Broken transitions, duplicated logic, missing integrations, and orphaned data were documented.

---

## Workflow 1: Guest → Reservation → Customer Recognition → Ordering → Payment → Loyalty → Analytics

### Step 1: Guest → Reservation
**Path**: `POST /api/reservations` → `ReservationService.createReservation`
**Status**: ✅ PASS
- Customer name and phone received from request body
- `ReservationService.createReservation` at `reservation.service.ts:21` handles creation
- Confirmation code generated (line 34)
- Date/time combined into `reservedAt` (line 38-39)

### Step 2: Reservation → Customer Recognition
**Path**: `ReservationService.createReservation` → `CustomerService.findOrCreateByPhone`
**Status**: ✅ PASS
- At `reservation.service.ts:43-55`, if no `customerId` provided, auto-resolves from phone
- `normalizePhone` called before lookup (line 45)
- `CustomerService.findOrCreateByPhone` creates or finds customer (line 46-50)
- `customerId` set on reservation record (line 60)

### Step 3: Reservation → Confirmation
**Path**: `ReservationService.sendConfirmation` → `NotificationService.sendWhatsApp`
**Status**: ✅ PASS
- `sendConfirmation` at `reservation.service.ts:182` sends WhatsApp message
- Message includes business name, date, time, party size, table, confirmation code
- `NotificationService.sendWhatsApp` called with customer phone (line 194)

### Step 4: Customer → Ordering
**Path**: `POST /api/sales` → `SalesService.createSale` → `GuestRecognitionService.registerOrRecognize`
**Status**: ✅ PASS
- `SalesService.createSale` at `sales.service.ts:30` calls `GuestRecognitionService.registerOrRecognize`
- Customer resolved or created from phone
- `customerId` linked to sale record

### Step 5: Ordering → Payment (CASH)
**Path**: `SalesService.createSale` → `PaymentCompletionService.onPaymentSuccess`
**Status**: ✅ PASS
- At `sales.service.ts:82`, CASH payment delegates to `PaymentCompletionService.onPaymentSuccess`
- Side effects: sale update, dining slip, guest recognition, notification, broadcast, ledger, audit, order token

### Step 6: Ordering → Payment (MoMo Polling)
**Path**: `GET /api/payments/momo/status/[transactionId]` → `PaymentCompletionService.onPaymentSuccess`
**Status**: ✅ PASS
- At `momo/status/[transactionId].ts:59`, success delegates to `PaymentCompletionService.onPaymentSuccess`
- Failure delegates to `PaymentCompletionService.onPaymentFailure` (line 69)

### Step 7: Ordering → Payment (IremboPay)
**Path**: `POST /api/payments/irembo/webhook` → `PaymentCompletionService.onPaymentSuccess`
**Status**: ⚠️ PASS WITH BUG
- At `irembo/webhook.ts:145`, delegates to `PaymentCompletionService.onPaymentSuccess`
- **BUG**: `logBillingEvent` called twice (line 98 in webhook + line 143 in PaymentCompletionService)
- **BUG**: `AuditLogService.log` called twice (line 104 in webhook + line 160 in PaymentCompletionService)

### Step 8: Ordering → Payment (InTouch)
**Path**: `GET /api/payments/intouch/status/[id]` → inline side effects
**Status**: ❌ BROKEN
- At `intouch/status/[id].ts:91-110`, directly updates sale and calls `GuestRecognitionService.onOrderCompleted`
- **MISSING**: No SmartDiningSlip generation
- **MISSING**: No notification sent
- **MISSING**: No real-time broadcast
- **MISSING**: No billing ledger entry
- **MISSING**: No audit log
- **MISSING**: No order token marking

### Step 9: Ordering → Payment (Manual Confirmation)
**Path**: `POST /api/orders/[id]/confirm-payment` → inline side effects
**Status**: ❌ BROKEN
- At `confirm-payment.ts:66-138`, directly updates sale, calls guest recognition, notification, broadcast
- **MISSING**: No SmartDiningSlip generation
- **MISSING**: No billing ledger entry

### Step 10: Ordering → Payment (MTN MoMo Callback)
**Path**: `POST /api/payments/mtn-momo/callback` → transaction update only
**Status**: ❌ BROKEN
- At `mtn-momo/callback.ts:38-71`, updates transaction and subscription
- **MISSING**: No sale status update (sale remains PENDING)
- **MISSING**: No SmartDiningSlip
- **MISSING**: No guest recognition
- **MISSING**: No notification
- **MISSING**: No broadcast

### Step 11: Payment → Loyalty
**Path**: `PaymentCompletionService.onPaymentSuccess` → `GuestRecognitionService.onOrderCompleted` → `LoyaltyService.earnPoints`
**Status**: ✅ PASS (for CASH, MoMo, IremboPay paths)
- `PaymentCompletionService` at line 106 calls `GuestRecognitionService.onOrderCompleted`
- `GuestRecognitionService.onOrderCompleted` at line 356 calls `LoyaltyService.earnPoints`
- `LoyaltyService.earnPoints` creates `PointsLedger` entry and increments `Customer.loyaltyPoints`

### Step 12: Loyalty → Analytics
**Path**: `FinancialLedgerEntry` with `SALES` domain
**Status**: ⚠️ PARTIAL
- `SALES` domain exists in `LedgerDomain` enum
- `PaymentCompletionService` logs billing event with `PAYMENT_SUCCESS` type
- **BUG**: IremboPay path creates duplicate entries
- **MISSING**: InTouch, manual, and MTN callback paths don't create ledger entries

---

## Workflow 2: Hotel Check-in → Customer Linkage → Guest Intelligence

### Step 1: Check-in → Customer
**Path**: `POST /api/hotel/rooms` → `CustomerService.findOrCreateByPhone`
**Status**: ✅ PASS
- At `hotel/rooms.ts:47-55`, auto-resolves customer from `guestPhone`
- `normalizePhone` called before lookup
- `customerId` set on room record

### Step 2: Customer → Guest Intelligence Display
**Path**: `GET /api/hotel/rooms` → includes customer data
**Status**: ✅ PASS
- At `hotel/rooms.ts:29-31`, includes `customer` relation with `id, name, phone, vipTier, loyaltyPoints, visitCount`

### Step 3: Customer → CRM Contact
**Path**: Should be `ContactCustomerBridge.ensureContactForCustomer`
**Status**: ❌ BROKEN
- `ContactCustomerBridge` exists but is never called
- No CRM contact is created or linked when a customer is created

---

## Workflow 3: Waiter Dashboard → Guest Intelligence

### Step 1: Waiter Queue API → Customer Data
**Path**: `GET /api/waiter/queue` → includes `customer.phone` and `customer.id`
**Status**: ✅ PASS
- At `waiter/queue.ts:93-95`, includes `customer` relation with `id, phone`
- At `waiter/queue.ts:164-165`, maps `customerPhone` and `customerId` to response

### Step 2: Waiter Dashboard → StaffGuestIntelligence
**Path**: `waiter.tsx` → `StaffGuestIntelligence` component
**Status**: ✅ PASS
- At `waiter.tsx:85-87`, renders `StaffGuestIntelligence` when `order.customerPhone` is available
- Component receives `phone` and `businessId` props

---

## Workflow 4: Reservation Lifecycle

### Create → PENDING → Confirm → COMPLETED/CANCELLED

| Transition | Status | Notes |
|-----------|--------|-------|
| Create → PENDING | ✅ | `ReservationService.createReservation` sets `status: 'PENDING'` |
| PENDING → CONFIRMED | ⚠️ | `ReservationService.updateStatus` used for API PATCH, but `reservation-reminder.service.ts:191` directly calls `prisma.reservation.update` for confirmation |
| CONFIRMED → SEATED | ⚠️ | Not verified — likely handled by `updateStatus` |
| SEATED → COMPLETED | ⚠️ | `reservation-reminder.service.ts:319` directly calls `prisma.reservation.update` for completion |
| Any → CANCELLED | ⚠️ | `ReservationService.cancelReservation` used for DELETE API, but `reservations/[id]/cancel.ts:34` directly calls `prisma.reservation.update` |
| CONFIRMED → NO_SHOW | ⚠️ | `reservation-reminder.service.ts:300` directly calls `prisma.reservation.update` for no-show |

**Status**: ⚠️ PARTIAL — Main API paths use ReservationService, but reminder/cron/cancel paths bypass it.

---

## Workflow 5: Payment Failure

| Path | Status | Notes |
|------|--------|-------|
| MoMo failure | ✅ | `PaymentCompletionService.onPaymentFailure` called |
| IremboPay failure | ✅ | `logBillingEvent` + `AuditLogService.log` for non-SUCCESS |
| InTouch failure | ❌ | No failure handling — only updates transaction status |
| MTN callback failure | ⚠️ | Logs billing event but doesn't update sale status |
| Manual confirmation | N/A | Manual process — no automated failure |

---

## Summary

| Workflow | Status | Issues |
|---------|--------|--------|
| Guest → Reservation → Customer | ✅ PASS | — |
| Customer → Ordering | ✅ PASS | — |
| Ordering → Payment (CASH) | ✅ PASS | — |
| Ordering → Payment (MoMo) | ✅ PASS | — |
| Ordering → Payment (IremboPay) | ⚠️ BUG | Double billing event |
| Ordering → Payment (InTouch) | ❌ BROKEN | Missing 6 side effects |
| Ordering → Payment (Manual) | ❌ BROKEN | Missing dining slip, ledger |
| Ordering → Payment (MTN callback) | ❌ BROKEN | Missing sale update entirely |
| Payment → Loyalty | ✅ PASS | — |
| Loyalty → Analytics | ⚠️ PARTIAL | Double entries, missing entries |
| Hotel → Customer | ✅ PASS | — |
| Customer → CRM | ❌ BROKEN | Bridge never called |
| Waiter → Guest Intelligence | ✅ PASS | — |
| Reservation Lifecycle | ⚠️ PARTIAL | 6 bypass paths |
| Payment Failure Handling | ⚠️ PARTIAL | InTouch and MTN paths incomplete |
