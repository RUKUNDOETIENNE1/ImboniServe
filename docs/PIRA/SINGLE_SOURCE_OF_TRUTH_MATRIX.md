# Single Source of Truth Matrix

**Document Type:** Duplication Resolution Matrix  
**Phase:** Design Only  

---

## Purpose

Identify every duplicated business rule, document current implementations, define the canonical implementation, and specify the migration strategy.

---

## 1. Loyalty Points Balance

| Aspect | Detail |
|--------|--------|
| **Duplicated Responsibility** | Determining how many loyalty points a customer has |

**Current Implementations:**

| # | Implementation | Location | Method |
|---|---------------|----------|--------|
| 1 | Direct field read | `Customer.loyaltyPoints` | `prisma.customer.findUnique` |
| 2 | Ledger aggregate | `PointsLedger` | `LoyaltyService.getBalance()` — `SUM(amount) WHERE type IN ('PURCHASE','MANUAL','BONUS') - SUM(amount) WHERE type='REDEMPTION'` |
| 3 | Direct increment (no ledger) | `CustomerService.updateCustomerStats` | `prisma.customer.update({ loyaltyPoints: { increment } })` |

**Divergence:** Path 3 increments the field without creating a ledger entry. `getBalance()` (path 2) will underreport. Field read (path 1) will overreport relative to ledger.

**Canonical Implementation:**

```
PointsLedger is the single source of truth.
LoyaltyService.getBalance(customerId) is the canonical read method.
  - Reads from PointsLedger aggregate (active, non-expired entries)
Customer.loyaltyPoints is a denormalized cache.
  - Maintained exclusively by LoyaltyService.earnPoints() and .redeemPoints()
  - May be used for fast UI reads but MUST be reconciled with ledger
```

**Migration Strategy:**

1. Wire `LoyaltyService.earnPoints()` into `GuestRecognitionService.onOrderCompleted()`
2. Remove `loyaltyPoints: { increment }` from `CustomerService.updateCustomerStats`
3. Rename `updateCustomerStats` → `updateVisitStats` (only visitCount, lifetimeSpendCents, lastVisit)
4. Run backfill script: for each Customer, recalculate `loyaltyPoints` from `PointsLedger` aggregate
5. Add reconciliation check: periodic job compares `Customer.loyaltyPoints` vs `PointsLedger` sum

**Consumers After Migration:**
- `/api/loyalty/balance` → `LoyaltyService.getBalance()`
- CRM page → `LoyaltyService.getBalance()`
- Any UI showing points → `LoyaltyService.getBalance()` or `Customer.loyaltyPoints` (cache)

**Deprecated Implementations:**
- `CustomerService.updateCustomerStats` loyalty points increment → **REMOVED**
- `/api/loyalty/issue` direct prisma writes → **DELEGATES to LoyaltyService**

---

## 2. VIP Tier Calculation

| Aspect | Detail |
|--------|--------|
| **Duplicated Responsibility** | Determining a customer's VIP tier |

**Current Implementations:**

| # | Implementation | Location | Thresholds |
|---|---------------|----------|------------|
| 1 | Dual-threshold (visits + spend) | `GuestRecognitionService.calculateVIPTier` | BRONZE: 3 visits + 500 RWF, SILVER: 8 + 1,500, GOLD: 15 + 4,000, PLATINUM: 30 + 10,000 |
| 2 | Spend-only | `LoyaltyService.updateVIPStatus` | BRONZE: 100,000 RWF, SILVER: 500,000, GOLD: 1,000,000, PLATINUM: 5,000,000 |

**Divergence:** 200x threshold discrepancy. Path 1 is live. Path 2 is dead code.

**Canonical Implementation:**

```
GuestRecognitionService.calculateVIPTier() is the sole calculation.
Thresholds are defined in a single VIPTierConfig (extracted from hardcoded array).
  - Config can be loaded from database (Business.vipTierConfig JSON) or env defaults
  - Dual-threshold: both visits AND spend must be met

GuestRecognitionService.recalculateVIPTier(customerId) is the sole update trigger.
  - Called from onOrderCompleted()
  - Called from reservation completion (Wave 2)
  - Called from hotel check-in (Wave 2)
```

**Migration Strategy:**

1. Extract VIP thresholds from `GuestRecognitionService` hardcoded array into `VIPTierConfig`
2. Delete `LoyaltyService.updateVIPStatus`, `getVIPBenefits`, `applyVIPDiscount`
3. No data migration needed (Customer.vipTier already set by live path)

**Consumers After Migration:**
- `GuestRecognitionService.recalculateVIPTier()` — sole writer
- Waiter Dashboard, Reservations, CRM — readers of `Customer.vipTier`

**Deprecated Implementations:**
- `LoyaltyService.updateVIPStatus` → **DELETED**
- `LoyaltyService.getVIPBenefits` → **DELETED**
- `LoyaltyService.applyVIPDiscount` → **DELETED** (re-introduce when VIP benefits are a product feature)

---

## 3. Payment Processing / Post-Payment Side Effects

| Aspect | Detail |
|--------|--------|
| **Duplicated Responsibility** | Handling what happens after a payment succeeds or fails |

**Current Implementations:**

| # | Path | Side Effects Covered |
|---|------|---------------------|
| 1 | CASH (`SalesService.createSale`) | Dining Slip ✅, Guest Recognition ✅, Notification ❌, Ledger ❌, Subscription ❌, Affiliate ❌ |
| 2 | MoMo (`processSuccessfulPayment`) | Dining Slip ❌, Guest Recognition ✅, Notification ✅, Broadcast ✅, Ledger ❌, Subscription ❌, Affiliate ❌ |
| 3 | IremboPay (`/api/payments/irembo/webhook.ts`) | Dining Slip ❌, Guest Recognition ✅, Notification ✅, Ledger ✅, Subscription ✅, Affiliate ✅, Kitchen ✅, OrderToken ✅ |
| 4 | IremboPay (`/api/webhooks/irembopay.ts`) | Dining Slip ❌, Guest Recognition ❌, Notification ❌, Ledger ❌, Subscription ✅, Affiliate ❌ |

**Divergence:** Each path covers different subsets of side effects. No path covers all.

**Canonical Implementation:**

```
PaymentCompletionService is the sole orchestrator.

onPaymentSuccess(paymentTransactionId, saleId):
  1. Update Sale → COMPLETED + isPaid=true (idempotent)
  2. Generate Smart Dining Slip (idempotent via saleId unique constraint)
  3. GuestRecognitionService.onOrderCompleted() (idempotent via visitCount check)
  4. NotificationService.sendOrderNotification() (idempotent via check)
  5. Broadcast real-time event (idempotent)
  6. logBillingEvent() → FinancialLedgerEntry (idempotent via idempotencyKey)
  7. SubscriptionEngine.activate() (if subscription payment, idempotent)
  8. AffiliateService.createCommissions() (if applicable, idempotent)
  9. Kitchen release (if applicable, idempotent)
  10. OrderToken mark used (if applicable, idempotent)

onPaymentFailure(paymentTransactionId, saleId, reason):
  1. Update Sale → FAILED (idempotent)
  2. logBillingEvent() → FinancialLedgerEntry
  3. AlertDeliveryService.deliver() for critical failures
```

**Migration Strategy:**

1. Create `PaymentCompletionService` with `onPaymentSuccess` and `onPaymentFailure`
2. Move all side-effect logic from inline handlers into the service
3. Make each side effect idempotent (check before execute)
4. Route CASH path: `SalesService.createSale` → `PaymentCompletionService.onPaymentSuccess`
5. Route MoMo path: `processSuccessfulPayment` → `PaymentCompletionService.onPaymentSuccess`
6. Route IremboPay path: webhook handler → `PaymentCompletionService.onPaymentSuccess`
7. Retire `/api/webhooks/irembopay.ts` (all logic now in PaymentCompletionService)

**Consumers After Migration:**
- `SalesService.createSale` (CASH) → calls `PaymentCompletionService`
- `/api/payments/momo/status/[transactionId].ts` → calls `PaymentCompletionService`
- `/api/payments/irembo/webhook.ts` → calls `PaymentCompletionService`
- `TapLeaveFinalizationService` → calls `PaymentCompletionService`

**Deprecated Implementations:**
- Inline `processSuccessfulPayment` function → **REMOVED** (logic in PaymentCompletionService)
- Inline side effects in IremboPay webhook → **REMOVED**
- `/api/webhooks/irembopay.ts` → **REMOVED**

---

## 4. Customer Identity

| Aspect | Detail |
|--------|--------|
| **Duplicated Responsibility** | Representing a customer/guest across the platform |

**Current Implementations:**

| # | Model | Created By | Used By |
|---|-------|-----------|---------|
| 1 | `Customer` | `GuestRecognitionService.registerOrRecognize` | Loyalty, CRM analytics, Guest Recognition |
| 2 | `Contact` | `ContactService.createContact` | Contacts UI, organizations, relationships |
| 3 | `Reservation` fields | Reservation API (inline prisma) | Reservations UI |
| 4 | `HotelRoom` fields | Hotel API (inline prisma) | Hotel UI |

**Canonical Implementation:**

```
Customer is the canonical identity for hospitality.
Contact is the canonical identity for business relationships.

Bridge: Customer.contactId (nullable FK) links the two.

CustomerService.findOrCreateByPhone(phone, businessId, name?) is the sole
  customer creation/lookup method for all hospitality flows.

When a Customer is created:
  - A Contact of type CUSTOMER is auto-created and linked (via contactId)

When a Contact of type CUSTOMER is created:
  - A Customer is auto-created and linked (via customerId on Contact)

Reservation.customerId (new FK) links reservations to Customer.
HotelRoom.customerId (new FK) links room occupancy to Customer.
```

**Migration Strategy:**

1. Add `customerId` FK to `Reservation` model (nullable during migration)
2. Add `contactId` FK to `Customer` model (nullable)
3. Add `customerId` FK to `Contact` model (nullable, for CUSTOMER type contacts)
4. Add `customerId` FK to `HotelRoom` model (nullable)
5. Backfill: for each Reservation with a phone, find/create Customer, set customerId
6. Backfill: for each Contact of type CUSTOMER, find/create Customer, link both
7. Make `customerId` required on Reservation after backfill

**Consumers After Migration:**
- All hospitality services use `CustomerService.findOrCreateByPhone()`
- CRM UI shows Customer data enriched with Contact data
- Reservation UI shows Customer's loyalty/VIP info
- Hotel UI shows Customer's guest intelligence

**Deprecated Implementations:**
- `Reservation.customerName/phone/email` as standalone fields → **Retained as denormalized snapshots** but `customerId` is canonical
- `HotelRoom.guestName/guestPhone` as standalone fields → **Retained as snapshots** but `customerId` is canonical
- `/dashboard/customers` page → **REMOVED** (CRM is canonical)

---

## 5. IremboPay Webhook Processing

| Aspect | Detail |
|--------|--------|
| **Duplicated Responsibility** | Processing IremboPay payment webhook notifications |

**Current Implementations:**

| # | Endpoint | Verification | Idempotency | Side Effects |
|---|----------|-------------|-------------|-------------|
| 1 | `/api/payments/irembo/webhook.ts` | HMAC-SHA256 + timestamp | `updateMany` with `status: { not: 'SUCCESS' }` | Guest recognition, ledger, affiliate, kitchen, notification |
| 2 | `/api/webhooks/irembopay.ts` | `IremboPayProvider.validateWebhook` | None on update | Subscription activation only |

**Canonical Implementation:**

```
/api/payments/irembo/webhook.ts is the sole webhook endpoint.
  - HMAC-SHA256 verification with timestamp tolerance
  - Idempotency via PaymentCompletionService (all side effects idempotent)
  - Calls PaymentCompletionService.onPaymentSuccess() or .onPaymentFailure()

IremboPay dashboard configured to send webhooks to this endpoint only.
```

**Migration Strategy:**

1. Ensure `/api/payments/irembo/webhook.ts` calls `PaymentCompletionService` (which handles subscription activation)
2. Update IremboPay dashboard to point to canonical endpoint
3. Make `/api/webhooks/irembopay.ts` return 410 Gone
4. After verification period, delete `/api/webhooks/irembopay.ts`

**Deprecated Implementations:**
- `/api/webhooks/irembopay.ts` → **RETIRED (410 Gone, then deleted)**

---

## 6. Reservation Management

| Aspect | Detail |
|--------|--------|
| **Duplicated Responsibility** | Creating, updating, and managing reservations |

**Current Implementations:**

| # | Implementation | Location | Used By |
|---|---------------|----------|---------|
| 1 | `ReservationService` (258 lines) | `src/lib/services/reservation.service.ts` | **Nothing** (orphaned) |
| 2 | Inline prisma calls | `/api/reservations/index.ts`, `/api/reservations/[id].ts` | Reservations UI |

**Canonical Implementation:**

```
ReservationService is the sole reservation handler.
All API endpoints delegate to ReservationService methods.
No direct prisma calls in API handlers for reservation CRUD.
```

**Migration Strategy:**

1. Enhance `ReservationService.createReservation` to resolve customer via `CustomerService.findOrCreateByPhone`
2. Enhance `ReservationService.sendConfirmation` to call `NotificationService.sendWhatsApp`
3. Rewrite API handlers as thin delegates:
   - `POST /api/reservations` → `ReservationService.createReservation()`
   - `PATCH /api/reservations/[id]` → `ReservationService.updateReservation()`
   - `DELETE /api/reservations/[id]` → `ReservationService.cancelReservation()`
   - `GET /api/reservations` → `ReservationService.getBusinessReservations()`
4. Remove inline prisma calls from API handlers

**Deprecated Implementations:**
- Inline prisma reservation CRUD in API handlers → **REMOVED**

---

## 7. Analytics Aggregation

| Aspect | Detail |
|--------|--------|
| **Duplicated Responsibility** | Calculating revenue and financial metrics |

**Current Implementations:**

| # | Source | Location | Used By |
|---|--------|----------|---------|
| 1 | `FinancialLedgerEntry` aggregate | `PaymentsOpsService`, `billing-ledger.service.ts` | CFO Dashboard, PaymentsOps |
| 2 | `Sale.totalAmountCents` sum | Various dashboard APIs | CEO Dashboard, Reports |
| 3 | `PaymentTransaction` status counts | Some API handlers | Payment metrics |

**Canonical Implementation:**

```
FinancialLedgerEntry is the sole source of truth for all finance analytics.
This is already established for subscription and marketplace revenue.

New: Add LedgerDomain.SALES for order/sale revenue.
PaymentCompletionService writes SALES entries on successful order payments.

All dashboard APIs read revenue from FinancialLedgerEntry.
PaymentTransaction is used only for operational status, not revenue aggregation.
Sale.totalAmountCents is used only for per-sale display, not aggregation.
```

**Migration Strategy:**

1. Add `SALES` to `LedgerDomain` enum
2. `PaymentCompletionService.onPaymentSuccess` creates `FinancialLedgerEntry` with `domain: SALES`
3. Update dashboard APIs to read from `FinancialLedgerEntry` instead of `Sale` aggregation
4. Backfill: `LedgerIntegrityService` creates SALES entries for historical completed sales

**Deprecated Implementations:**
- Revenue aggregation from `Sale.totalAmountCents` → **REPLACED** with FinancialLedgerEntry reads
- Revenue aggregation from `PaymentTransaction` → **REPLACED** (already mostly done)

---

## 8. Menu Recommendations

| Aspect | Detail |
|--------|--------|
| **Duplicated Responsibility** | Generating menu recommendations for customers |

**Current Implementations:**

| # | Implementation | Location | Personalization |
|---|---------------|----------|-----------------|
| 1 | Inline API logic | `/api/menu/recommendations` | Accepts `userPreferences` param but doesn't use guest intelligence |

**Canonical Implementation:**

```
RecommendationService is the sole recommendation engine.
  - Reads guest intelligence from GuestRecognitionService.getGuestIntelligence()
  - Uses learned preferences, allergies, dietary restrictions
  - Falls back to popular items for new customers

/api/menu/recommendations delegates to RecommendationService.
  - Accepts customerPhone to resolve customer
  - Calls GuestRecognitionService for personalization data
```

**Migration Strategy:**

1. Create `RecommendationService` class
2. Move inline logic from API handler into service
3. Add `GuestRecognitionService.getGuestIntelligence(customerId)` call
4. Use intelligence data to filter/rank recommendations

**Deprecated Implementations:**
- Inline recommendation logic in API handler → **DELEGATES to RecommendationService**
