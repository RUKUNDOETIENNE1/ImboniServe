# PIV Resolution Verification

> **Document Status**: COMPLETE  
> **Sprint**: Platform Integrity Resolution Sprint (PIRS)  
> **Date**: July 2026  
> **Reference**: PIV_AUDIT_REPORT.md

This document maps each PIV audit finding to its resolution implementation and verifies that the fix is in place.

---

## Critical Findings

### CRITICAL-1: Duplicate IremboPay Webhook Handlers
**PIV Finding**: Two webhook endpoints (`/api/payments/irembo/webhook.ts` and `/api/webhooks/irembopay.ts`) process the same IremboPay events, causing conflicting ownership and potential double-processing.

**Resolution**: 
- Canonical webhook: `/api/payments/irembo/webhook.ts` — routes through `PaymentCompletionService`
- Duplicate webhook: `/api/webhooks/irembopay.ts` — returns 410 Gone

**Status**: ✅ RESOLVED

---

### CRITICAL-2: Payment Side Effects Scattered Across Handlers
**PIV Finding**: Post-payment side effects (sale updates, dining slips, guest recognition, notifications, ledger entries) are implemented inline in CASH, MoMo, and IremboPay handlers with no single orchestrator.

**Resolution**:
- Created `PaymentCompletionService` as canonical orchestrator
- All three payment paths (CASH via `SalesService`, MoMo via status callback, IremboPay via webhook) now delegate to `PaymentCompletionService.onPaymentSuccess/onPaymentFailure`

**Status**: ✅ RESOLVED

---

### CRITICAL-3: Loyalty Points Mutated Outside LoyaltyService
**PIV Finding**: `CustomerService.updateCustomerStats` increments `loyaltyPoints` directly, bypassing `LoyaltyService` and `PointsLedger`.

**Resolution**:
- `CustomerService.updateCustomerStats` renamed to `updateVisitStats` (no longer touches `loyaltyPoints`)
- `GuestRecognitionService.onOrderCompleted` now calls `LoyaltyService.earnPoints()` which creates `PointsLedger` entries
- `CustomerService.redeemLoyaltyPoints` deleted (redemption owned by `LoyaltyService.redeemPoints`)

**Status**: ✅ RESOLVED

---

### CRITICAL-4: VIP Tier Logic Duplicated
**PIV Finding**: `LoyaltyService` contains `updateVIPStatus`, `getVIPBenefits`, and `applyVIPDiscount` which conflict with `GuestRecognitionService`'s VIP tier calculation.

**Resolution**:
- Deleted `updateVIPStatus`, `getVIPBenefits`, `applyVIPDiscount` from `LoyaltyService`
- Exported `VIP_TIER_CONFIG` and `calculateVIPTier` from `GuestRecognitionService` as canonical VIP tier policy
- `GuestRecognitionService` is the sole owner of VIP tier calculation

**Status**: ✅ RESOLVED

---

### CRITICAL-5: Reservation.customerId Points to User Instead of Customer
**PIV Finding**: `Reservation.customerId` has a foreign key to `User` instead of `Customer`, breaking the customer identity chain.

**Resolution**:
- `Reservation.customerId` relation now points to `Customer` model
- Removed orphaned `User.reservations` relation field
- `ReservationService.createReservation` auto-resolves customer from phone via `CustomerService.findOrCreateByPhone`

**Status**: ✅ RESOLVED

---

## High-Severity Findings

### HIGH-1: Reservation API Bypasses ReservationService
**PIV Finding**: Reservation API routes (`/api/reservations/index.ts`, `/api/reservations/[id].ts`) use direct Prisma calls instead of delegating to `ReservationService`.

**Resolution**:
- POST handler delegates to `ReservationService.createReservation`
- PATCH handler delegates to `ReservationService.updateStatus`
- DELETE handler delegates to `ReservationService.cancelReservation`

**Status**: ✅ RESOLVED

### HIGH-2: Hotel Check-in Not Linked to Customer
**PIV Finding**: Hotel room check-in creates rooms with `guestPhone` but no link to `Customer` entity, breaking hospitality intelligence.

**Resolution**:
- Added `customerId` FK to `Room` model in schema
- Hotel rooms API auto-resolves customer from `guestPhone` via `CustomerService.findOrCreateByPhone`
- GET response includes customer data (name, phone, vipTier, loyaltyPoints, visitCount)

**Status**: ✅ RESOLVED

### HIGH-3: No Contact ↔ Customer Bridge
**PIV Finding**: `Contact` (CRM entity) and `Customer` (hospitality entity) have no foreign key relationship, causing disconnected identity.

**Resolution**:
- Added `contactId` FK to `Customer` (with `@unique` for one-to-one)
- Added `customer Customer?` virtual back-relation to `Contact`
- Created `ContactCustomerBridge` service with bidirectional sync methods

**Status**: ✅ RESOLVED

### HIGH-4: Waiter Dashboard Lacks Guest Intelligence
**PIV Finding**: Waiter dashboard shows order queue without guest context (VIP status, visit count, loyalty points, dietary alerts).

**Resolution**:
- Waiter queue API now includes `customerPhone` and `customerId` in response
- `StaffGuestIntelligence` component wired into `OrderCard` — displays when `customerPhone` is available

**Status**: ✅ RESOLVED

### HIGH-5: No SALES Domain in Ledger
**PIV Finding**: `LedgerDomain` enum lacks a `SALES` domain, preventing accurate categorization of order revenue in `FinancialLedgerEntry`.

**Resolution**:
- Added `SALES` to `LedgerDomain` enum in Prisma schema

**Status**: ✅ RESOLVED

### HIGH-6: Reservation Confirmation Not Sent
**PIV Finding**: `ReservationService.sendConfirmation` was a stub that only logged — no actual WhatsApp/SMS message was sent.

**Resolution**:
- `sendConfirmation` now calls `NotificationService.sendWhatsApp` with the customer's phone number

**Status**: ✅ RESOLVED

---

## Medium-Severity Findings

### MEDIUM-1: Waiter Dashboard Not in Navigation
**PIV Finding**: Waiter dashboard page exists at `/dashboard/waiter` but is not accessible from the sidebar navigation.

**Resolution**:
- Added "Waiter" to `OPERATIONS` section of navigation (v1Order: 6)
- Role-restricted to `OWNER`, `ADMIN`, `MANAGER`, `WAITER`, `SUPERVISOR`, `FRONT_DESK`

**Status**: ✅ RESOLVED

### MEDIUM-2: Navigation Lacks Role-Based Filtering
**PIV Finding**: All navigation items are visible to all users regardless of role.

**Resolution**:
- Added `rolesAllowed` field to `V1NavigationItem` interface
- Applied `rolesAllowed` to Kitchen, Tables, Reservations, Waiter, Service Replay
- `getV1Navigation()` filter now checks `rolesAllowed` against user's roles

**Status**: ✅ RESOLVED

### MEDIUM-3: Dead Code in CustomerService
**PIV Finding**: `getTopCustomers` uses raw SQL (should use FinancialLedgerEntry) and `redeemLoyaltyPoints` duplicates `LoyaltyService.redeemPoints`.

**Resolution**:
- Deleted both methods from `CustomerService`

**Status**: ✅ RESOLVED

---

## Summary

| Severity | Total Findings | Resolved | Remaining |
|----------|---------------|----------|-----------|
| Critical | 5 | 5 | 0 |
| High | 6 | 6 | 0 |
| Medium | 3 | 3 | 0 |
| **Total** | **14** | **14** | **0** |

All PIV audit findings have been resolved. The platform is ready for a second PIV audit.
