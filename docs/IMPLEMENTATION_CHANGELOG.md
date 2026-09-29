# Platform Integrity Resolution Sprint — Implementation Changelog

> **Sprint**: Platform Integrity Resolution Sprint (PIRS)  
> **Date**: July 2026  
> **Status**: COMPLETE

---

## Wave 1 — Critical Architecture

### W1.1 — Created PaymentCompletionService
- **File**: `src/lib/services/payment-completion.service.ts` (new)
- **Change**: Created canonical post-payment side effect orchestrator with `onPaymentSuccess` and `onPaymentFailure` methods
- **Handles**: Sale status updates, dining slip generation, guest recognition updates, notifications, real-time broadcast, ledger event logging, audit logging, order token marking

### W1.2 — Routed CASH payment path through PaymentCompletionService
- **File**: `src/lib/services/sales.service.ts`
- **Change**: Replaced inline SmartDiningSlip + GuestRecognition calls with `PaymentCompletionService.onPaymentSuccess()` delegation
- **Removed**: `SmartDiningSlipService` import (now handled by PaymentCompletionService)

### W1.3 — Routed MoMo payment path through PaymentCompletionService
- **File**: `src/pages/api/payments/momo/status/[transactionId].ts`
- **Change**: Replaced `processSuccessfulPayment` and `processFailedPayment` inline functions with `PaymentCompletionService.onPaymentSuccess/onPaymentFailure` calls

### W1.4 — Routed IremboPay webhook through PaymentCompletionService
- **File**: `src/pages/api/payments/irembo/webhook.ts`
- **Change**: Replaced inline sale update, kitchen release, order token, notification, and guest recognition calls with `PaymentCompletionService.onPaymentSuccess` delegation
- **Retained**: Subscription activation and affiliate commissions (specific to IremboPay subscription payments)

### W1.5 — Retired duplicate IremboPay webhook
- **File**: `src/pages/api/webhooks/irembopay.ts`
- **Change**: Replaced entire 196-line webhook handler with 410 Gone response
- **Reason**: Duplicate of canonical `/api/payments/irembo/webhook.ts`

### W1.6 — Wired LoyaltyService.earnPoints into GuestRecognitionService
- **File**: `src/lib/services/guest-recognition.service.ts`
- **Change**: `onOrderCompleted()` now calls `LoyaltyService.earnPoints()` after updating visit stats
- **Import**: Added `LoyaltyService` import

### W1.7 — Removed CustomerService points increment
- **File**: `src/lib/services/customer.service.ts`
- **Change**: Renamed `updateCustomerStats` → `updateVisitStats` (removes `loyaltyPoints` increment)
- **Removed**: `getTopCustomers` (raw SQL, should use FinancialLedgerEntry), `redeemLoyaltyPoints` (owned by LoyaltyService)
- **Added**: `findOrCreateByPhone` as canonical customer creation/lookup method

### W1.8 — Updated GuestRecognitionService.onOrderCompleted
- **File**: `src/lib/services/guest-recognition.service.ts`
- **Change**: Now uses `CustomerService.updateVisitStats` (not `updateCustomerStats`) + `LoyaltyService.earnPoints`
- **Architectural Note**: Loyalty points may only be modified through LoyaltyService

### W1.9 — Deleted LoyaltyService dead code
- **File**: `src/lib/services/loyalty.service.ts`
- **Removed**: `updateVIPStatus`, `getVIPBenefits`, `applyVIPDiscount` (VIP tier ownership is canonical to GuestRecognitionService)

### W1.10 — Extracted VIP Tier Config
- **File**: `src/lib/services/guest-recognition.service.ts`
- **Change**: Exported `VIP_TIER_CONFIG` and `calculateVIPTier` as canonical VIP tier policy
- **Renamed**: `VIP_TIERS` → `VIP_TIER_CONFIG` (exported const)

### W1.11-12 — Schema: Reservation.customerId → Customer
- **File**: `prisma/schema.prisma`
- **Change**: `Reservation.customerId` relation now points to `Customer` model (was `User`)
- **Removed**: Orphaned `User.reservations` relation field

### W1.13 — Routed reservation API through ReservationService
- **Files**: `src/pages/api/reservations/index.ts`, `src/pages/api/reservations/[id].ts`
- **Change**: POST delegates to `ReservationService.createReservation` (auto-resolves customer from phone)
- **Change**: PATCH delegates to `ReservationService.updateStatus`
- **Change**: DELETE delegates to `ReservationService.cancelReservation`
- **Added**: `CustomerService.findOrCreateByPhone` integration in `ReservationService.createReservation`
- **Added**: `NotificationService.sendWhatsApp` for reservation confirmations

### W1.14 — Added SALES domain to LedgerDomain enum
- **File**: `prisma/schema.prisma`
- **Change**: Added `SALES` to `LedgerDomain` enum for order revenue tracking

### W1.15 — Schema: Customer-Contact-Room relations
- **File**: `prisma/schema.prisma`
- **Change**: Added `contactId` FK to `Customer` (with `@unique` for one-to-one relation)
- **Change**: Added `customer Customer?` virtual back-relation to `Contact`
- **Change**: Added `customerId` FK to `Room` for hotel check-in Customer linkage
- **Change**: Added `reservations` and `rooms` relations to `Customer`

---

## Wave 2 — Platform Integration

### W2.1-2 — Reservation customer resolution + WhatsApp confirmation
- **File**: `src/lib/services/reservation.service.ts`
- **Change**: `createReservation` now auto-resolves customer from phone via `CustomerService.findOrCreateByPhone`
- **Change**: `sendConfirmation` now sends via `NotificationService.sendWhatsApp` (was stub)

### W2.5-6 — StaffGuestIntelligence in waiter dashboard
- **File**: `src/pages/dashboard/waiter.tsx`
- **Change**: Wired `StaffGuestIntelligence` component into `OrderCard` — shows guest context when `customerPhone` is available
- **File**: `src/pages/api/waiter/queue.ts`
- **Change**: Added `customer` relation to query, included `customerPhone` and `customerId` in response

### W2.7-10 — Hotel check-in with Customer linkage
- **File**: `src/pages/api/hotel/rooms.ts`
- **Change**: POST auto-resolves customer from `guestPhone` via `CustomerService.findOrCreateByPhone`
- **Change**: GET includes `customer` relation data (name, phone, vipTier, loyaltyPoints, visitCount)

### W2.11-15 — Contact ↔ Customer bridge
- **File**: `src/lib/services/contact-customer-bridge.service.ts` (new)
- **Change**: Created bidirectional bridge service with `ensureContactForCustomer` and `ensureCustomerForContact`
- **Design**: Customer owns the FK (`contactId`), Contact has virtual back-relation

### W2.16-20 — Navigation integration + role-based filtering
- **File**: `src/components/DashboardLayout.tsx`
- **Change**: Added Waiter Dashboard to navigation (`OPERATIONS` section, v1Order: 6)
- **Change**: Added `rolesAllowed` to Kitchen, Tables, Reservations, Waiter, Service Replay nav items
- **Change**: `getV1Navigation()` filter now checks `rolesAllowed` against user's roles

---

## Wave 3 — Cleanup

### W3.1 — Retired duplicate IremboPay webhook (W1.5)
### W3.2 — Deleted LoyaltyService dead VIP methods (W1.9)
### W3.3 — Deleted CustomerService dead methods (W1.7)
### W3.4 — `payment-ledger-events.service.ts` retained as backward-compatible read-only guard (used by 13 files)

---

## Wave 4 — Verification + Deliverables

### W4.1 — Prisma schema validated and pushed to database
### W4.2 — ARCHITECTURAL_INVARIANTS.md written
### W4.3 — IMPLEMENTATION_CHANGELOG.md (this document)
### W4.4 — PIV_RESOLUTION_VERIFICATION.md
### W4.5 — MIGRATION_SUMMARY.md
### W4.6 — PLATFORM_INTEGRITY_RESOLUTION_REPORT.md
### W4.7 — FINAL_PLATFORM_CONVERGENCE_REPORT.md

---

## Files Modified

| File | Change Type |
|------|------------|
| `prisma/schema.prisma` | Modified — schema relations, enum, FKs |
| `src/lib/services/payment-completion.service.ts` | New — canonical payment orchestrator |
| `src/lib/services/sales.service.ts` | Modified — delegated to PaymentCompletionService |
| `src/pages/api/payments/momo/status/[transactionId].ts` | Modified — delegated to PaymentCompletionService |
| `src/pages/api/payments/irembo/webhook.ts` | Modified — delegated to PaymentCompletionService |
| `src/pages/api/webhooks/irembopay.ts` | Modified — retired (410 Gone) |
| `src/lib/services/customer.service.ts` | Modified — removed loyalty increment, added findOrCreateByPhone |
| `src/lib/services/loyalty.service.ts` | Modified — removed dead VIP methods |
| `src/lib/services/guest-recognition.service.ts` | Modified — wired LoyaltyService, exported VIP config |
| `src/lib/services/reservation.service.ts` | Modified — auto-resolve customer, WhatsApp confirmation |
| `src/pages/api/reservations/index.ts` | Modified — delegated to ReservationService |
| `src/pages/api/reservations/[id].ts` | Modified — delegated to ReservationService |
| `src/pages/api/hotel/rooms.ts` | Modified — auto-resolve customer, include customer data |
| `src/pages/dashboard/waiter.tsx` | Modified — wired StaffGuestIntelligence |
| `src/pages/api/waiter/queue.ts` | Modified — include customer phone/id in response |
| `src/components/DashboardLayout.tsx` | Modified — added Waiter nav, role-based filtering |
| `src/lib/services/contact-customer-bridge.service.ts` | New — Contact ↔ Customer bridge |
