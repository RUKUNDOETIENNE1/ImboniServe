# Platform Integrity Resolution Architecture (PIRA)

**Document Type:** Architecture Blueprint  
**Source:** Platform Integrity Validation (PIV) Audit Report  
**Phase:** Design Only — No Implementation  
**Status:** Complete  

---

## 1. Executive Summary

The PIV audit identified 5 critical, 8 high, and 14 medium-severity integrity failures across ImboniServe. The root causes fall into three categories:

1. **Competing implementations** of the same business rule (loyalty points, VIP tiers, payment completion, IremboPay webhooks)
2. **Disconnected workflows** where data flows terminate without reaching downstream consumers (reservations → customer, payments → dining slip, hotel → everything)
3. **Orphaned features** that are fully implemented but unreachable (CEO/CFO dashboards, waiter dashboard, sales page)

This architecture defines a **single canonical implementation** for every business domain, a **unified payment completion pipeline** that all providers converge into, a **customer-centric reservation integration** that connects hospitality data, and a **navigation reconciliation** that classifies every orphaned feature.

The architecture is organized into **4 implementation waves**:
- **Wave 1** — Resolve architectural contradictions (no new functionality)
- **Wave 2** — Connect disconnected workflows
- **Wave 3** — Remove obsolete implementations and retire duplicates
- **Wave 4** — Verify all PIV findings resolved and prepare for re-validation

**Estimated scope:** 3–4 engineering sprints (6–8 weeks)

---

## 2. Critical Architectural Contradictions — Summary & Resolution

### 2.1 Loyalty Points Ledger Desynchronization [CRITICAL]

**Contradiction:** Two code paths modify loyalty points. `CustomerService.updateCustomerStats` directly increments `Customer.loyaltyPoints` without creating `PointsLedger` entries. `LoyaltyService.earnPoints` (orphaned) creates ledger entries + increments the field. `LoyaltyService.getBalance()` reads from ledger aggregate. Result: balance ≠ customer record.

**Root Cause:** `GuestRecognitionService.onOrderCompleted` calls `CustomerService.updateCustomerStats` instead of `LoyaltyService.earnPoints`. The loyalty service was designed as the canonical owner but was never wired in.

**Canonical Resolution:**

```
LoyaltyService is the SOLE owner of loyalty points mutation.

All points earning flows through LoyaltyService.earnPoints().
All points redemption flows through LoyaltyService.redeemPoints().
CustomerService.updateCustomerStats STOPS incrementing loyaltyPoints.
Customer.loyaltyPoints becomes a denormalized cache field
  maintained exclusively by LoyaltyService.

PointsLedger is the single source of truth.
LoyaltyService.getBalance() reads from PointsLedger aggregate.
Customer.loyaltyPoints is a convenience cache for fast UI reads.
```

**Architecture:**

```
Order Completed
      │
      ▼
GuestRecognitionService.onOrderCompleted()
      │
      ├──→ LoyaltyService.earnPoints()     [CANONICAL]
      │       │
      │       ├── Creates PointsLedger entry
      │       └── Increments Customer.loyaltyPoints
      │
      ├──→ CustomerService.updateVisitStats()  [MODIFIED]
      │       │
      │       └── Increments visitCount, lifetimeSpendCents, lastVisit
      │           (NO loyaltyPoints increment)
      │
      ├──→ learnPreferencesFromOrder()
      │
      └──→ recalculateVIPTier()
```

**Key Change:** `CustomerService.updateCustomerStats` is split. Loyalty points logic moves to `LoyaltyService.earnPoints`. Visit/spend stats remain in a renamed `CustomerService.updateVisitStats`.

---

### 2.2 VIP Tier Threshold Contradiction [CRITICAL]

**Contradiction:** `GuestRecognitionService` uses visit count + lifetime spend thresholds (BRONZE at 500 RWF + 3 visits). `LoyaltyService.updateVIPStatus` uses only lifetime spend at 200x higher thresholds (BRONZE at 100,000 RWF). The latter is dead code.

**Root Cause:** Two services independently defined VIP tier logic without coordination. The guest recognition version went live; the loyalty version was never called.

**Canonical Resolution:**

```
GuestRecognitionService is the SOLE owner of VIP tier calculation.

VIP tier thresholds are defined in a single configuration object
  (VIPTierConfig) loaded from database or environment.

LoyaltyService.updateVIPStatus is RETIRED.
LoyaltyService.getVIPBenefits and applyVIPDiscount are RETIRED
  until VIP benefits are formally designed as a product feature.

VIP tier is recalculated by GuestRecognitionService.recalculateVIPTier()
  which is called from onOrderCompleted() and from reservation completion.
```

**Architecture:**

```
VIP Tier Configuration (single source)
      │
      ▼
GuestRecognitionService.calculateVIPTier()
      │
      ├── Reads: visitCount, lifetimeSpendCents
      ├── Policy: dual-threshold (visits AND spend)
      └── Writes: Customer.vipTier
              │
              ▼
      Consumers:
      ├── Waiter dashboard (display VIP badge)
      ├── Reservation UI (display VIP status)
      ├── CRM page (display tier)
      └── Checkout (future: apply VIP discount)
```

---

### 2.3 Reservation-Customer Disconnect [CRITICAL]

**Contradiction:** Reservations store `customerName`, `customerPhone`, `customerEmail` as plain strings. No foreign key to `Customer`. Hospitality intelligence (loyalty, VIP, preferences) is blind to reservation customers.

**Root Cause:** The reservation system was built independently of the customer/guest recognition system.

**Canonical Resolution:**

```
Reservation.customerId is a required foreign key to Customer.

ReservationService.createReservation() resolves customer by phone:
  1. If customer exists (by phone + businessId), link customerId
  2. If not, create Customer record, then link customerId
  3. customerName/phone/email fields remain as denormalized snapshots
     for historical integrity but customerId is the canonical link

ReservationService becomes the canonical reservation handler.
API endpoints delegate to ReservationService (no direct prisma calls).
```

**Architecture:**

```
Reservation Creation
      │
      ▼
ReservationService.createReservation()
      │
      ├── CustomerService.findByPhone() or createCustomer()
      │       └── Sets customerId on reservation
      │
      ├── Creates Reservation with customerId FK
      │
      ├── GuestRecognitionService.onReservationConfirmed()
      │       └── Updates guest stats (visitCount for reservations)
      │
      ├── NotificationService.sendReservationConfirmation()
      │       └── WhatsApp/SMS (NOT a stub)
      │
      └── Deposit Payment (if required)
              └── PaymentCompletionService.initiateDeposit()
```

---

### 2.4 Duplicate IremboPay Webhook Handlers [CRITICAL]

**Contradiction:** Two webhook endpoints process the same IremboPay events with different verification, different idempotency guards, and different side effects.

**Root Cause:** Two teams or phases independently implemented IremboPay webhook handling without consolidating.

**Canonical Resolution:**

```
/api/payments/irembo/webhook.ts is the CANONICAL webhook endpoint.
  - HMAC-SHA256 verification with timestamp tolerance
  - Idempotency via updateMany with status guard
  - Calls PaymentCompletionService (see §2.5)

/api/webhooks/irembopay.ts is RETIRED.
  - Its subscription activation logic moves into PaymentCompletionService
  - Its affiliate commission logic moves into PaymentCompletionService
  - IremboPay dashboard is configured to send to canonical endpoint only

If both endpoints must temporarily coexist during migration:
  - /api/webhooks/irembopay.ts delegates to PaymentCompletionService
  - PaymentCompletionService idempotency prevents double-processing
  - After migration, /api/webhooks/irembopay.ts returns 410 Gone
```

---

### 2.5 Unified Payment Completion Pipeline [CRITICAL — New Architecture]

**Contradiction:** Smart Dining Slip is generated for CASH orders but not for MoMo or one IremboPay webhook path. Guest recognition is called from some payment paths but not all. Side effects (notifications, ledger entries, affiliate commissions) are scattered across handlers with inconsistent coverage.

**Root Cause:** Each payment provider handler independently implements post-payment side effects instead of delegating to a shared service.

**Canonical Resolution:**

```
PaymentCompletionService is the SOLE orchestrator for post-payment side effects.

Every payment confirmation path (CASH, MoMo polling, IremboPay webhook)
calls PaymentCompletionService.onPaymentSuccess() or .onPaymentFailure().

PaymentCompletionService handles:
  1. Update Sale status (COMPLETED + isPaid)
  2. Generate Smart Dining Slip (if not already generated)
  3. Trigger GuestRecognitionService.onOrderCompleted()
  4. Send notification (WhatsApp/SMS)
  5. Broadcast real-time event
  6. Log billing event → FinancialLedgerEntry
  7. Activate subscription (if subscription payment)
  8. Create affiliate commissions (if applicable)
  9. Release kitchen order (if applicable)
  10. Mark order token used (if applicable)

All side effects are idempotent — safe to call multiple times.
```

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Payment Providers                         │
│                                                              │
│  CASH          MoMo Polling       IremboPay Webhook         │
│  (SalesService)  (status API)     (canonical webhook)       │
└──────┬──────────────┬──────────────────┬────────────────────┘
       │              │                  │
       └──────────────┴──────────────────┘
                      │
                      ▼
           PaymentCompletionService
           ├── onPaymentSuccess()
           │   ├── Update Sale
           │   ├── Generate Dining Slip
           │   ├── Guest Recognition
           │   ├── Notification
           │   ├── Real-time Broadcast
           │   ├── Ledger Entry
           │   ├── Subscription Activation
           │   ├── Affiliate Commissions
           │   ├── Kitchen Release
           │   └── Order Token
           │
           └── onPaymentFailure()
               ├── Update Sale (FAILED)
               ├── Ledger Entry
               └── Alert (AlertDeliveryService)
```

---

### 2.6 Orphaned Features & Navigation [CRITICAL]

**Contradiction:** 13+ fully implemented features are unreachable from navigation.

**Root Cause:** Features were developed without updating the navigation sidebar. No navigation audit was performed before feature freeze.

**Canonical Resolution — Feature Disposition Table:**

| Feature | Disposition | Rationale |
|---------|------------|-----------|
| CEO Dashboard | **Integrate** | Executive feature, add under "Insights" section |
| CFO Dashboard | **Integrate** | Executive feature, add under "Insights" section |
| Waiter Dashboard | **Integrate** | Core operational, add under "Operations" section |
| Sales List | **Integrate** | Core operational, add under "Operations" section |
| Sales/New | **Integrate** | Keep Quick Action + add under "Operations" |
| Customers page | **Remove** | Superseded by CRM page (feature-flagged) |
| Referrals | **Integrate** | Add under "Growth" section |
| Site Builder | **Integrate** | Add under "Marketing" section (feature-flagged) |
| Smart Dining Slips | **Integrate** | Add under "Operations" section |
| A/B Testing | **Future roadmap** | Not in RC1 scope |
| Campaigns | **Future roadmap** | Not in RC1 scope |
| Staff Performance | **Integrate** | Add under "Team" section |
| KDS | **Integrate** | Add under "Operations" section |

**Navigation Architecture:**

```
Navigation is role-filtered.

Each user sees only items their role permits.
A navigation config maps items to required permissions.
The sidebar is generated from this config, not hardcoded.

Sections:
  ├── Overview (Dashboard)
  ├── Operations (Sales, New Sale, Waiter, KDS, Tables, Reservations, Smart Dining Slips)
  ├── Customers (CRM, Loyalty)
  ├── Hospitality (Hotel, Reservations)
  ├── Growth (Referrals, Site Builder, Discover)
  ├── Insights (CEO Dashboard, CFO Dashboard, Reports, Staff Performance)
  ├── Team (Staff, Staff Performance)
  ├── Finance (Transactions, Payouts, Payment Settings)
  ├── Inventory (Stock, Procurement, Suppliers)
  └── Admin (Settings, Business Profile, Feature Flags)
```

---

## 3. Additional Architectural Decisions

### 3.1 Customer Identity Unification

**Problem:** `Customer` and `Contact` are parallel systems with no bridge.

**Resolution:**

```
Customer is the canonical identity for hospitality (orders, loyalty, VIP, reservations).
Contact is the canonical identity for business relationships (suppliers, partners, leads).

A Customer CAN have a linked Contact (via contactId FK, nullable).
A Contact of type CUSTOMER SHOULD have a linked Customer.

When a Customer is created (via GuestRecognitionService):
  - A Contact of type CUSTOMER is auto-created and linked.
  - This enables CRM features (organizations, activities) for dining customers.

When a Contact of type CUSTOMER is created (via Contacts UI):
  - A Customer is auto-created and linked.
  - This enables loyalty and guest recognition for CRM-managed contacts.

The /dashboard/customers page is REMOVED.
The /dashboard/crm page is the canonical customer list.
It shows Customer data with Contact enrichment.
```

### 3.2 Reservation Service Restoration

**Problem:** `ReservationService` exists but API endpoints bypass it.

**Resolution:**

```
ReservationService is the canonical reservation handler.
All API endpoints (/api/reservations/*) delegate to ReservationService.
Direct prisma calls in API handlers are removed.

ReservationService methods:
  - createReservation() — resolves customer, creates reservation, sends confirmation
  - updateReservation() — updates status, deposit, table assignment
  - cancelReservation() — cancels with reason
  - getBusinessReservations() — filtered list
  - sendConfirmation() — delegates to NotificationService (NOT a stub)
  - sendReminders() — cron-triggered 24h before
  - getAvailableSlots() — checks existing bookings + table capacity
```

### 3.3 Hotel Module Integration

**Problem:** Hotel module is a bare room list with no integrations.

**Resolution:**

```
Hotel module gains check-in/check-out functionality.

Check-in:
  1. Staff selects room + enters guest phone
  2. CustomerService.findByPhone() or createCustomer()
  3. Room status → OCCUPIED, guestName/Phone populated
  4. GuestRecognitionService.onHotelCheckIn() called
  5. Room linked to Customer via customerId (new FK on HotelRoom)

Check-out:
  1. Staff selects occupied room
  2. Room status → AVAILABLE
  3. If room service orders exist, ensure all paid
  4. GuestRecognitionService.onHotelCheckOut() called
  5. Optionally trigger feedback request

Room Service:
  - Room service orders are Sales with tableId replaced by roomId
  - Sales model gains optional roomId FK
  - Kitchen display shows room number instead of table number
```

### 3.4 Terminology Unification

**Problem:** "Restaurant" and "Business" used interchangeably.

**Resolution:**

```
"Business" is the canonical term in all code, APIs, and internal documentation.
"Restaurant" is used ONLY in customer-facing UI/marketing contexts.

Code changes:
  - NotificationService.sendSmartDiningSlip: rename `restaurantName` → `businessName`
  - SmartDiningSlipService.getRestaurantSlips → getBusinessSlips
  - SmartDiningSlipService.setRestaurantTemplate → setBusinessTemplate
  - All variable names: restaurant → business

Locale changes:
  - Internal/dashboard strings: use "Business"
  - Customer-facing strings (discover, referrals, dining slip): use "Restaurant"
```

### 3.5 Analytics & Finance Alignment

**Problem:** Potential for analytics to read from wrong source.

**Resolution:**

```
FinancialLedgerEntry is the SOLE source of truth for all finance analytics.
This is already established in the codebase (billing-ledger.service.ts, PaymentsOpsService).

All new analytics code MUST read from FinancialLedgerEntry.
PaymentTransaction, Subscription, BillingEvent are execution/audit layers only.

The unified PaymentCompletionService writes to FinancialLedgerEntry
  via logBillingEvent() for every payment state change.

Sales revenue (currently not in ledger) is added as a new LedgerDomain: SALES.
PaymentCompletionService creates SALES domain entries on successful order payments.
```

---

## 4. Implementation Waves

### Wave 1 — Critical Architecture (No New Functionality)

| Task | PIV Finding | Risk |
|------|------------|------|
| Wire LoyaltyService.earnPoints into onOrderCompleted | CRITICAL #1 | High |
| Remove loyaltyPoints increment from CustomerService | CRITICAL #1 | High |
| Retire LoyaltyService.updateVIPStatus | CRITICAL #2 | Low |
| Create PaymentCompletionService | CRITICAL #4 | Medium |
| Route all payment paths through PaymentCompletionService | CRITICAL #4 | High |
| Consolidate IremboPay webhook to one endpoint | CRITICAL #4 | High |
| Add customerId FK to Reservation model | CRITICAL #3 | Medium |
| Route reservation API through ReservationService | CRITICAL #3 | Medium |

### Wave 2 — Integration (Connect Disconnected Workflows)

| Task | PIV Finding | Risk |
|------|------------|------|
| ReservationService resolves/creates Customer on reservation | CRITICAL #3 | Medium |
| Implement reservation confirmation via NotificationService | HIGH | Low |
| Implement reservation deposit payment flow | HIGH | Medium |
| Wire StaffGuestIntelligence into waiter dashboard | HIGH | Low |
| Wire StaffGuestIntelligence into reservations | HIGH | Low |
| Implement hotel check-in/check-out with Customer linkage | HIGH | Medium |
| Bridge Contact ↔ Customer auto-creation | HIGH | Medium |
| Add role-based navigation filtering | HIGH | Low |
| Add orphaned pages to navigation | CRITICAL #5 | Low |
| Standardize error handling patterns | MEDIUM | Low |
| Unify terminology (restaurant → business in code) | MEDIUM | Low |

### Wave 3 — Cleanup (Remove Obsolete Implementations)

| Task | PIV Finding | Risk |
|------|------------|------|
| Remove /api/webhooks/irembopay.ts | CRITICAL #4 | Low |
| Remove LoyaltyService.updateVIPStatus, getVIPBenefits, applyVIPDiscount | CRITICAL #2 | Low |
| Remove CustomerService.getTopCustomers, redeemLoyaltyPoints | WS-1 | Low |
| Remove /dashboard/customers page (superseded by CRM) | WS-8 | Low |
| Remove InTouchService (deprecated) | WS-7 | Low |
| Remove direct prisma calls from reservation API handlers | WS-3 | Low |
| Remove HotelRoomsPluginAdapter, RoomServicePluginAdapter (empty adapters) | WS-7 | Low |
| Update all documentation to reflect canonical architecture | — | Low |

### Wave 4 — Verification

| Task | PIV Finding | Risk |
|------|------------|------|
| Run automated integration tests for all payment paths | — | — |
| Verify loyalty points balance matches ledger for sample customers | CRITICAL #1 | — |
| Verify VIP tier is consistent across all UI surfaces | CRITICAL #2 | — |
| Verify reservations create Customer records | CRITICAL #3 | — |
| Verify only one IremboPay webhook processes each event | CRITICAL #4 | — |
| Verify all integrated pages are navigable | CRITICAL #5 | — |
| Conduct second PIV audit | — | — |

---

## 5. Risk Assessment Summary

| Risk Level | Count | Mitigation Strategy |
|-----------|-------|---------------------|
| High | 4 | Feature flags + staged rollout + integration tests |
| Medium | 6 | Backward-compatible schema changes + migration scripts |
| Low | 8 | Safe deletions after verification |

See `RISK_ASSESSMENT.md` for detailed analysis.

---

## 6. Estimated Scope

| Wave | Duration | Engineers | Key Deliverables |
|------|----------|-----------|-----------------|
| Wave 1 | 2 weeks | 2-3 | PaymentCompletionService, loyalty fix, VIP consolidation, reservation FK |
| Wave 2 | 3 weeks | 2-3 | Reservation integration, hotel check-in, navigation, guest intelligence wiring |
| Wave 3 | 1 week | 1-2 | Dead code removal, documentation |
| Wave 4 | 1 week | 1-2 | Testing, verification, re-audit |
| **Total** | **7 weeks** | **2-3** | **Complete PIRA implementation** |

---

## 7. Confirmation

This architecture resolves all findings from the Platform Integrity Validation audit:

- ✅ CRITICAL #1 (Loyalty Ledger) → LoyaltyService as sole owner, PointsLedger as SOT
- ✅ CRITICAL #2 (VIP Thresholds) → GuestRecognitionService as sole owner, dead code retired
- ✅ CRITICAL #3 (Reservation-Customer) → customerId FK, ReservationService restoration
- ✅ CRITICAL #4 (Duplicate Webhooks) → Single canonical endpoint + PaymentCompletionService
- ✅ CRITICAL #5 (Orphaned Features) → Navigation integration + role-based filtering
- ✅ HIGH: Smart Dining Slip for all paths → PaymentCompletionService
- ✅ HIGH: Deposit payment flow → PaymentCompletionService
- ✅ HIGH: StaffGuestIntelligence wiring → Wave 2 integration
- ✅ HIGH: CRM Contact ↔ Customer bridge → Auto-creation on both paths
- ✅ HIGH: Hotel module integration → Check-in/out with Customer linkage
- ✅ MEDIUM: All 14 medium findings → Addressed in Waves 2-3

The proposed architecture moves ImboniServe toward a single, coherent Hospitality Intelligence Platform and prepares it for re-validation before Product Readiness.

---

## Final Report

✅ **Platform Integrity Resolution Architecture — Complete**

All 5 critical findings have defined architectural resolutions. All 8 high-severity findings have integration designs. All 14 medium findings have cleanup plans. Every duplicated responsibility has one canonical owner. Every disconnected workflow has a target integration. Every orphaned feature has a documented disposition. The implementation order minimizes regression risk by resolving contradictions before adding integrations, and cleaning up only after verification.

The architecture is ready for the Platform Integrity Resolution Sprint.
