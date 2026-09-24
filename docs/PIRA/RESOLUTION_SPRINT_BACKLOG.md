# Resolution Sprint Backlog

**Document Type:** Sprint Backlog  
**Phase:** Design Only  

---

## Purpose

Break the implementation into logical waves with actionable backlog items. Each item has: ID, wave, task, dependencies, effort estimate, PIV finding resolved, and acceptance criteria.

---

## Effort Scale

- **XS** = 1-2 hours
- **S** = 0.5-1 day
- **M** = 1-2 days
- **L** = 3-5 days
- **XL** = 1+ week

---

## Wave 1 — Critical Architecture (Weeks 1-2)

| ID | Task | Effort | Dependencies | PIV Finding | Acceptance Criteria |
|----|------|--------|-------------|-------------|---------------------|
| W1.1 | Create `PaymentCompletionService` with `onPaymentSuccess` and `onPaymentFailure` | L | None | CRITICAL #4 | Service exists, all 10 success side effects implemented and idempotent, unit tests pass |
| W1.2 | Route CASH path through PaymentCompletionService | S | W1.1 | CRITICAL #4, HIGH | CASH sale triggers all side effects via service, inline code removed |
| W1.3 | Route MoMo path through PaymentCompletionService | S | W1.1 | CRITICAL #4, MEDIUM | MoMo success triggers PaymentCompletionService, dining slip now generated |
| W1.4 | Route IremboPay webhook through PaymentCompletionService | M | W1.1 | CRITICAL #4, HIGH | Webhook handler delegates to service, all side effects fire |
| W1.5 | Retire `/api/webhooks/irembopay.ts` (return 410) | XS | W1.4 | CRITICAL #4 | Old endpoint returns 410, IremboPay dashboard updated |
| W1.6 | Wire `LoyaltyService.earnPoints` into `PaymentCompletionService` | M | W1.1 | CRITICAL #1 | Points earned via LoyaltyService, PointsLedger entry created |
| W1.7 | Remove `loyaltyPoints` increment from `CustomerService.updateCustomerStats` | XS | W1.6 | CRITICAL #1 | `updateCustomerStats` renamed to `updateVisitStats`, no loyaltyPoints increment |
| W1.8 | Update `GuestRecognitionService.onOrderCompleted` to use new service methods | S | W1.6, W1.7 | CRITICAL #1 | Calls `updateVisitStats` + `LoyaltyService.earnPoints` instead of `updateCustomerStats` |
| W1.9 | Delete `LoyaltyService.updateVIPStatus`, `getVIPBenefits`, `applyVIPDiscount` | XS | None | CRITICAL #2 | Dead code deleted, no compilation errors |
| W1.10 | Extract VIP thresholds into `VIPTierConfig` | S | W1.9 | CRITICAL #2 | Single config object, GuestRecognitionService uses it |
| W1.11 | Add `customerId` FK to `Reservation` model (nullable) | XS | None | CRITICAL #3 | Migration created, existing data unaffected |
| W1.12 | Backfill: link existing reservations to customers by phone | M | W1.11 | CRITICAL #3 | Script runs, reservations with matching phone get customerId |
| W1.13 | Rewrite reservation API handlers to delegate to `ReservationService` | M | W1.11 | CRITICAL #3, MEDIUM | API handlers are thin delegates, no direct prisma calls |
| W1.14 | Add `SALES` to `LedgerDomain` enum | XS | None | Analytics | Enum value added, migration created |
| W1.15 | `PaymentCompletionService` writes SALES ledger entries | XS | W1.1, W1.14 | Analytics | Successful order payments create FinancialLedgerEntry with domain SALES |

**Wave 1 Total Effort:** ~10-12 engineering days

---

## Wave 2 — Integration (Weeks 3-5)

| ID | Task | Effort | Dependencies | PIV Finding | Acceptance Criteria |
|----|------|--------|-------------|-------------|---------------------|
| W2.1 | `ReservationService.createReservation` resolves customer via `CustomerService.findOrCreateByPhone` | S | W1.13 | CRITICAL #3 | Reservation creates/links Customer record, customerId set |
| W2.2 | Implement `ReservationService.sendConfirmation` via `NotificationService.sendWhatsApp` | S | W1.13 | HIGH | Confirmation message sent via WhatsApp (not a stub) |
| W2.3 | Implement reservation deposit payment flow | M | W1.1 | HIGH | Deposit PaymentTransaction created, on success depositStatus updated |
| W2.4 | Add deposit payment button to reservation UI | S | W2.3 | HIGH | UI button initiates deposit payment, status displayed |
| W2.5 | Wire `StaffGuestIntelligence` into waiter dashboard | S | None | HIGH | Waiter dashboard shows guest intelligence panel for orders with customerId |
| W2.6 | Wire `StaffGuestIntelligence` into reservation form | S | W2.1 | HIGH | Reservation form shows guest intelligence when phone matches customer |
| W2.7 | Add `customerId` FK to `HotelRoom` model | XS | None | HIGH | Migration created, nullable |
| W2.8 | Implement hotel check-in UI with customer resolution | M | W2.7 | HIGH | Check-in resolves customer by phone, sets room OCCUPIED + customerId |
| W2.9 | Implement hotel check-out UI | S | W2.8 | HIGH | Check-out sets room AVAILABLE, calls guest recognition |
| W2.10 | Call `GuestRecognitionService.onHotelCheckIn` / `onHotelCheckOut` | S | W2.8 | HIGH | Guest stats updated on check-in/check-out |
| W2.11 | Add `contactId` FK to `Customer` model | XS | None | HIGH | Migration created, nullable |
| W2.12 | Add `customerId` FK to `Contact` model | XS | None | HIGH | Migration created, nullable |
| W2.13 | Auto-create Contact when Customer is created | S | W2.11, W2.12 | HIGH | CustomerService.createCustomer auto-creates Contact of type CUSTOMER |
| W2.14 | Auto-create Customer when Contact of type CUSTOMER is created | S | W2.11, W2.12 | HIGH | ContactService.createContact auto-creates Customer for CUSTOMER type |
| W2.15 | Backfill: create Contacts for existing Customers and vice versa | M | W2.13, W2.14 | HIGH | Backfill script runs, bidirectional links created with dedup |
| W2.16 | Define navigation config as data structure with role permissions | M | None | CRITICAL #5 | Config object maps items to permissions and feature flags |
| W2.17 | Implement role-based navigation filtering in DashboardLayout | S | W2.16 | HIGH | Sidebar shows only permitted items for user's role |
| W2.18 | Add CEO, CFO, Waiter, Sales, KDS to navigation | S | W2.16 | CRITICAL #5 | All integrated pages appear in navigation under correct sections |
| W2.19 | Add Referrals, Site Builder, Smart Dining Slips, Staff Performance to navigation | S | W2.16 | CRITICAL #5 | All integrated pages appear in navigation |
| W2.20 | Remove `/dashboard/customers` page, redirect to CRM | XS | None | MEDIUM | Page returns redirect to /dashboard/crm |
| W2.21 | Create `ErrorState` component with retry button | XS | None | MEDIUM | Reusable component exists |
| W2.22 | Replace inconsistent error handling with `ErrorState` | S | W2.21 | MEDIUM | All dashboard pages use ErrorState consistently |
| W2.23 | Unify terminology: rename `restaurantName` → `businessName` in code | S | None | MEDIUM | No "restaurant" in internal code, only in customer-facing strings |
| W2.24 | Update locale files for terminology consistency | S | W2.23 | MEDIUM | Dashboard strings use "Business", customer-facing use "Restaurant" |
| W2.25 | Personalize menu recommendations using guest intelligence | M | None | MEDIUM | RecommendationService calls GuestRecognitionService for personalization |
| W2.26 | Add `roomId` FK to `Sale` model (for room service) | XS | None | HIGH | Migration created, nullable |
| W2.27 | Show VIP tier badge in waiter dashboard order cards | XS | W2.5 | MEDIUM | VIP tier displayed for orders with known customers |

**Wave 2 Total Effort:** ~15-18 engineering days

---

## Wave 3 — Cleanup (Week 6)

| ID | Task | Effort | Dependencies | PIV Finding | Acceptance Criteria |
|----|------|--------|-------------|-------------|---------------------|
| W3.1 | Delete `/api/webhooks/irembopay.ts` file | XS | W1.5 | CRITICAL #4 | File deleted, no references |
| W3.2 | Delete `InTouchService` | XS | None | WS-7 | File deleted, no references |
| W3.3 | Delete `HotelRoomsPluginAdapter`, `RoomServicePluginAdapter` | XS | None | WS-7 | Files deleted, no references |
| W3.4 | Delete `CustomerService.getTopCustomers`, `redeemLoyaltyPoints` | XS | None | WS-1 | Methods deleted, no references |
| W3.5 | Delete `/dashboard/customers` page file | XS | W2.20 | WS-8 | File deleted |
| W3.6 | Remove inline `processSuccessfulPayment` / `processFailedPayment` | XS | W1.3 | CRITICAL #4 | Functions removed, PaymentCompletionService is sole handler |
| W3.7 | Remove inline reservation prisma calls (verify none remain) | XS | W1.13 | WS-3 | Grep confirms no direct prisma in reservation API |
| W3.8 | Update README with canonical architecture overview | S | All | — | README reflects new architecture |
| W3.9 | Update API documentation | S | All | — | API docs reflect canonical endpoints |
| W3.10 | Update service documentation with ownership matrix | S | All | — | Service docs match Canonical Domain Ownership |

**Wave 3 Total Effort:** ~3-4 engineering days

---

## Wave 4 — Verification (Week 7)

| ID | Task | Effort | Dependencies | PIV Finding | Acceptance Criteria |
|----|------|--------|-------------|-------------|---------------------|
| W4.1 | Write E2E test: CASH sale full lifecycle | S | W1.2 | CRITICAL #4 | Test passes, all 10 side effects verified |
| W4.2 | Write E2E test: MoMo payment full lifecycle | S | W1.3 | CRITICAL #4 | Test passes, all 10 side effects verified |
| W4.3 | Write E2E test: IremboPay webhook full lifecycle | S | W1.4 | CRITICAL #4 | Test passes, all 10 side effects verified |
| W4.4 | Write idempotency test: duplicate webhook | S | W1.4 | CRITICAL #4 | Duplicate webhook processed once, no duplicate side effects |
| W4.5 | Write loyalty points reconciliation test | S | W1.6 | CRITICAL #1 | Customer.loyaltyPoints matches PointsLedger aggregate |
| W4.6 | Write VIP tier consistency test | XS | W1.10 | CRITICAL #2 | VIP tier consistent across all surfaces |
| W4.7 | Write reservation-customer link test | S | W2.1 | CRITICAL #3 | Reservation creates/links Customer, customerId set |
| W4.8 | Write hotel check-in/check-out test | S | W2.8 | HIGH | Room status transitions, Customer linked |
| W4.9 | Write navigation role filtering test | S | W2.17 | CRITICAL #5 | Each role sees only permitted items |
| W4.10 | Write Contact ↔ Customer bridge test | S | W2.13 | HIGH | Bidirectional auto-creation works |
| W4.11 | Run full integration test suite | M | W4.1-W4.10 | — | All tests pass |
| W4.12 | Conduct second PIV audit | L | W4.11 | — | Overall score ≥ 85/100 |

**Wave 4 Total Effort:** ~7-8 engineering days

---

## Summary

| Wave | Duration | Tasks | Total Effort | Key Deliverable |
|------|----------|-------|-------------|-----------------|
| Wave 1 — Critical Architecture | 2 weeks | 15 | ~10-12 days | PaymentCompletionService, loyalty fix, VIP consolidation, reservation FK |
| Wave 2 — Integration | 3 weeks | 27 | ~15-18 days | Reservation integration, hotel check-in, navigation, guest intelligence |
| Wave 3 — Cleanup | 1 week | 10 | ~3-4 days | Dead code removal, documentation |
| Wave 4 — Verification | 1 week | 12 | ~7-8 days | Test suite, second PIV audit |
| **Total** | **7 weeks** | **64 tasks** | **~35-42 engineering days** | **Complete PIRA implementation** |

---

## Backlog Priority Matrix

```
     HIGH IMPACT
         │
    W1.1 │ W1.6    W1.2
    W1.4 │ W1.8    W1.3
         │
─────────┼──────────────────
         │
    W2.1 │ W2.8    W2.16
    W2.3 │ W2.13   W2.17
         │
─────────┼──────────────────
         │
    W3.1 │ W3.8    W4.12
    W3.2 │ W3.9    W4.11
         │
     LOW IMPACT
```

**Critical path:** W1.1 → W1.2/W1.3/W1.4 → W1.6 → W1.7 → W1.8 (PaymentCompletionService + loyalty fix)

**Secondary path:** W1.11 → W1.12 → W1.13 → W2.1 → W2.2 (Reservation integration)

**Parallel track:** W2.16 → W2.17 → W2.18 (Navigation, no backend dependencies)
