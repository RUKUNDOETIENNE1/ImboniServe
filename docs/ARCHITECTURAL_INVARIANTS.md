# Architectural Invariants

> **Document Status**: ENFORCED  
> **Sprint**: Platform Integrity Resolution Sprint (PIRS)  
> **Date**: July 2026

These invariants are non-negotiable architectural rules that must hold at all times. Any code change that violates an invariant must be rejected in review.

---

## 1. Payment Completion — Single Orchestrator

**Invariant**: All post-payment side effects (sale status updates, dining slip generation, guest recognition updates, notifications, real-time broadcasts, ledger entries, audit logs) must flow through `PaymentCompletionService`.

**Violations**:
- Inline side-effect logic in payment webhooks or API routes
- Direct calls to `SmartDiningSlipService`, `GuestRecognitionService.onOrderCompleted`, or `NotificationService` from payment handlers
- Bypassing `PaymentCompletionService.onPaymentSuccess` / `onPaymentFailure`

**Canonical Path**:
```
Payment Event → PaymentCompletionService.onPaymentSuccess() → [all side effects]
Payment Event → PaymentCompletionService.onPaymentFailure() → [failure side effects]
```

---

## 2. Loyalty Points — Single Mutation Owner

**Invariant**: Loyalty points may only be created, modified, or decremented through `LoyaltyService`.

**Violations**:
- `CustomerService` incrementing `loyaltyPoints` directly
- Any service other than `LoyaltyService` writing to `PointsLedger`
- Direct `prisma.customer.update` with `loyaltyPoints: { increment: ... }`

**Canonical Path**:
```
Order Completed → GuestRecognitionService.onOrderCompleted() → LoyaltyService.earnPoints()
Redemption Request → LoyaltyService.redeemPoints()
```

---

## 3. VIP Tier — Single Policy Owner

**Invariant**: VIP tier calculation and thresholds are owned exclusively by `GuestRecognitionService`.

**Violations**:
- `LoyaltyService` or any other service defining VIP tier thresholds
- `LoyaltyService.updateVIPStatus`, `getVIPBenefits`, or `applyVIPDiscount` (deleted — must not be re-added)
- Hardcoding VIP tier logic outside of `VIP_TIER_CONFIG` / `calculateVIPTier()`

**Canonical Path**:
```
GuestRecognitionService.calculateVIPTier(visitCount, lifetimeSpendCents) → { tier, label }
GuestRecognitionService.recalculateVIPTier(customerId) → updates Customer.vipTier
```

---

## 4. Customer Identity — Single Source of Truth

**Invariant**: `Customer` is the canonical hospitality identity entity. All hospitality workflows (orders, reservations, hotel check-ins, loyalty) must resolve to a `Customer` record.

**Violations**:
- Creating reservations or hotel rooms without linking to a `Customer`
- Using `User` as the customer identity in hospitality contexts
- Duplicating customer data without a FK link

**Canonical Path**:
```
Phone Number → CustomerService.findOrCreateByPhone() → Customer.id
```

---

## 5. Reservation Workflow — Single Service

**Invariant**: All reservation CRUD operations must go through `ReservationService`.

**Violations**:
- Direct `prisma.reservation.create/update/delete` in API routes
- Bypassing `ReservationService.createReservation` (which handles customer resolution, confirmation codes, and WhatsApp notifications)

**Canonical Path**:
```
API Route → ReservationService.createReservation() / updateStatus() / cancelReservation()
```

---

## 6. Financial Ledger — Single Source of Truth

**Invariant**: `FinancialLedgerEntry` is the canonical source for all revenue, KPI, and financial reporting. `PaymentTransaction`, `Subscription`, `MarketplaceOrder`, and `BillingEvent` are execution/audit layers only.

**Violations**:
- Aggregating revenue from `PaymentTransaction` or `Sale` instead of `FinancialLedgerEntry`
- Writing to `FinancialLedgerEntry` outside of `billing-ledger.service.ts` (`logBillingEvent`)
- Using `payment-ledger-events.service.ts` for writes (it is a read-only guard)

**Canonical Path**:
```
Billing Event → logBillingEvent() → BillingEvent + FinancialLedgerEntry (mirrored)
Analytics/Reporting → Read from FinancialLedgerEntry
```

---

## 7. Contact ↔ Customer Bridge — Bidirectional Sync

**Invariant**: When a `Customer` is created, a `Contact` of type `CUSTOMER` must be created or linked via `ContactCustomerBridge`. When a `Contact` of type `CUSTOMER` is created, a `Customer` must be created or linked.

**Violations**:
- Creating a `Customer` without ensuring a `Contact` exists
- Creating a `Contact` of type `CUSTOMER` without ensuring a `Customer` exists
- Direct manipulation of `Customer.contactId` outside of `ContactCustomerBridge`

**Canonical Path**:
```
Customer Created → ContactCustomerBridge.ensureContactForCustomer()
Contact (CUSTOMER) Created → ContactCustomerBridge.ensureCustomerForContact()
```

---

## 8. Hotel Check-in — Customer Linkage

**Invariant**: Hotel room check-ins must link to a `Customer` record via `customerId` FK on `Room`.

**Violations**:
- Creating a room with `guestPhone` but no `customerId` link
- Bypassing `CustomerService.findOrCreateByPhone` during check-in

---

## 9. IremboPay Webhook — Single Endpoint

**Invariant**: The canonical IremboPay webhook is `/api/payments/irembo/webhook.ts`. The duplicate at `/api/webhooks/irembopay.ts` is retired (returns 410 Gone).

**Violations**:
- Routing IremboPay webhooks to any endpoint other than `/api/payments/irembo/webhook`
- Re-activating the retired webhook handler

---

## 10. Navigation — Role-Based Filtering

**Invariant**: Dashboard navigation items with `rolesAllowed` must be filtered based on the authenticated user's roles. No role-restricted item should be visible to a user lacking the required role.

**Violations**:
- Rendering navigation items without checking `rolesAllowed`
- Bypassing the `getV1Navigation()` filter logic

---

## Enforcement

These invariants are enforced through:
1. **Code review**: Reviewers must verify no invariant is violated
2. **Service boundaries**: Canonical services are the only entry points for their domain
3. **Schema constraints**: Foreign keys and unique constraints enforce data integrity
4. **Type safety**: TypeScript types prevent incorrect service calls at compile time

Any violation discovered in production must be treated as a P1 incident and remediated immediately.
