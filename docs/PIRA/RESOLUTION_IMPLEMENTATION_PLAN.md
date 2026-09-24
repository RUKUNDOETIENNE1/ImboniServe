# Resolution Implementation Plan

**Document Type:** Implementation Sequencing & Migration Strategy  
**Phase:** Design Only  

---

## Purpose

Define the safest implementation order, dependencies, regression risks, required testing, rollback considerations, and migration strategy for every architectural change.

---

## 1. Implementation Sequencing

### Wave 1 — Critical Architecture (Weeks 1-2)

No new functionality. Resolve contradictions only.

#### Task 1.1: Create PaymentCompletionService

| Aspect | Detail |
|--------|--------|
| **Dependencies** | None (new service) |
| **Regression Risk** | LOW — additive, no existing code changes |
| **Required Testing** | Unit tests for each side effect idempotency; integration test with mock payment |
| **Rollback** | Delete service, no consumers yet |

**Steps:**
1. Create `src/lib/services/payment-completion.service.ts`
2. Implement `onPaymentSuccess(paymentTransactionId, saleId)` with all 10 side effects, each idempotent
3. Implement `onPaymentFailure(paymentTransactionId, saleId, reason)` with 3 side effects
4. Each side effect checks current state before executing (e.g., `if sale.isPaid return`)
5. Write unit tests verifying idempotency (call twice, verify no duplicate side effects)

#### Task 1.2: Route CASH path through PaymentCompletionService

| Aspect | Detail |
|--------|--------|
| **Dependencies** | Task 1.1 |
| **Regression Risk** | HIGH — changes core sales flow |
| **Required Testing** | E2E test: create CASH sale → verify all side effects fire; verify dining slip generated; verify guest recognition called |
| **Rollback** | Revert SalesService to inline handling |

**Steps:**
1. In `SalesService.createSale`, replace inline CASH side effects with `PaymentCompletionService.onPaymentSuccess()`
2. Remove inline `SmartDiningSlipService.generateSlip` call (now in PaymentCompletionService)
3. Remove inline `GuestRecognitionService.onOrderCompleted` call (now in PaymentCompletionService)
4. Test: create CASH sale, verify all side effects fire exactly once

#### Task 1.3: Route MoMo path through PaymentCompletionService

| Aspect | Detail |
|--------|--------|
| **Dependencies** | Task 1.1 |
| **Regression Risk** | HIGH — changes payment confirmation flow |
| **Required Testing** | E2E test: simulate MoMo SUCCESS status → verify all side effects; verify dining slip now generated (was missing before) |
| **Rollback** | Revert to inline `processSuccessfulPayment` |

**Steps:**
1. In `/api/payments/momo/status/[transactionId].ts`, replace `processSuccessfulPayment` with `PaymentCompletionService.onPaymentSuccess()`
2. Replace `processFailedPayment` with `PaymentCompletionService.onPaymentFailure()`
3. Remove inline `processSuccessfulPayment` and `processFailedPayment` functions
4. Test: simulate MoMo callback, verify dining slip is now generated

#### Task 1.4: Route IremboPay webhook through PaymentCompletionService

| Aspect | Detail |
|--------|--------|
| **Dependencies** | Task 1.1 |
| **Regression Risk** | HIGH — changes webhook processing |
| **Required Testing** | E2E test: simulate IremboPay webhook → verify all side effects; verify dining slip now generated |
| **Rollback** | Revert to inline webhook handling |

**Steps:**
1. In `/api/payments/irembo/webhook.ts`, replace inline side-effect block with `PaymentCompletionService.onPaymentSuccess()`
2. Move subscription activation, affiliate commissions, kitchen release, order token logic into PaymentCompletionService
3. Keep signature verification and transaction lookup in the webhook handler
4. Test: simulate webhook, verify all side effects fire

#### Task 1.5: Retire duplicate IremboPay webhook

| Aspect | Detail |
|--------|--------|
| **Dependencies** | Task 1.4 |
| **Regression Risk** | MEDIUM — if IremboPay still sends to old URL |
| **Required Testing** | Verify no webhooks received at old endpoint for 48h |
| **Rollback** | Re-enable endpoint |

**Steps:**
1. Update IremboPay dashboard to point to `/api/payments/irembo/webhook.ts` only
2. Monitor for 48 hours to confirm no traffic to `/api/webhooks/irembopay.ts`
3. Change `/api/webhooks/irembopay.ts` to return 410 Gone
4. After verification period (1 sprint), delete the file

#### Task 1.6: Wire LoyaltyService.earnPoints into order completion

| Aspect | Detail |
|--------|--------|
| **Dependencies** | Task 1.2, 1.3, 1.4 (PaymentCompletionService routes) |
| **Regression Risk** | HIGH — changes points earning logic |
| **Required Testing** | Verify points earned match formula; verify PointsLedger entry created; verify Customer.loyaltyPoints matches ledger; verify earning rate is correct |
| **Rollback** | Revert to CustomerService.updateCustomerStats |

**Steps:**
1. In `PaymentCompletionService.onPaymentSuccess`, replace `CustomerService.updateCustomerStats` call with:
   - `CustomerService.updateVisitStats(customerId, orderAmountCents)` (visit/spend only)
   - `LoyaltyService.earnPoints({ customerId, businessId, saleId, amountCents })` (points + ledger)
2. Rename `CustomerService.updateCustomerStats` → `updateVisitStats` and remove `loyaltyPoints: { increment }` line
3. Update `GuestRecognitionService.onOrderCompleted` to call `CustomerService.updateVisitStats` instead of `updateCustomerStats`
4. Test: complete an order, verify PointsLedger entry exists, verify Customer.loyaltyPoints matches ledger sum

#### Task 1.7: Retire LoyaltyService dead code

| Aspect | Detail |
|--------|--------|
| **Dependencies** | Task 1.6 |
| **Regression Risk** | LOW — deleting dead code |
| **Required Testing** | Verify no compilation errors; verify no runtime references |
| **Rollback** | Git revert |

**Steps:**
1. Delete `LoyaltyService.updateVIPStatus`
2. Delete `LoyaltyService.getVIPBenefits`
3. Delete `LoyaltyService.applyVIPDiscount`
4. Extract VIP thresholds from `GuestRecognitionService` into a `VIPTierConfig` constant or database config
5. Run `grep` to verify no remaining references

#### Task 1.8: Add customerId FK to Reservation model

| Aspect | Detail |
|--------|--------|
| **Dependencies** | None |
| **Regression Risk** | MEDIUM — schema change |
| **Required Testing** | Migration applies cleanly; existing reservations still accessible |
| **Rollback** | Revert migration |

**Steps:**
1. Add `customerId` optional FK to `Reservation` in `prisma/schema.prisma`
2. Run `prisma migrate dev` to create migration
3. Verify existing reservations still work (customerId is nullable)
4. Backfill script: for each reservation with customerPhone, call `CustomerService.findOrCreateByPhone`, set customerId
5. After backfill, consider making customerId required (separate migration)

#### Task 1.9: Route reservation API through ReservationService

| Aspect | Detail |
|--------|--------|
| **Dependencies** | Task 1.8 |
| **Regression Risk** | MEDIUM — changes API behavior |
| **Required Testing** | API integration tests: create, update, cancel, list reservations |
| **Rollback** | Revert to inline prisma calls |

**Steps:**
1. Enhance `ReservationService.createReservation` to accept `customerId` or resolve via phone
2. Enhance `ReservationService.updateReservation` and `cancelReservation`
3. Rewrite `/api/reservations/index.ts` POST handler → `ReservationService.createReservation()`
4. Rewrite `/api/reservations/index.ts` GET handler → `ReservationService.getBusinessReservations()`
5. Rewrite `/api/reservations/[id].ts` PATCH handler → `ReservationService.updateReservation()`
6. Rewrite `/api/reservations/[id].ts` DELETE handler → `ReservationService.cancelReservation()`
7. Test: full reservation CRUD via API

---

### Wave 2 — Integration (Weeks 3-5)

Connect disconnected workflows.

#### Task 2.1: Reservation customer resolution

| Aspect | Detail |
|--------|--------|
| **Dependencies** | Task 1.8, 1.9 |
| **Regression Risk** | MEDIUM |
| **Required Testing** | Create reservation with existing customer phone → verify linked; with new phone → verify customer created |
| **Rollback** | Revert ReservationService changes |

**Steps:**
1. In `ReservationService.createReservation`, add `CustomerService.findOrCreateByPhone(phone, businessId, name)` call
2. Set `customerId` on reservation creation
3. Keep `customerName/phone/email` as denormalized snapshots
4. Test: create reservation, verify Customer record exists and is linked

#### Task 2.2: Reservation confirmation via NotificationService

| Aspect | Detail |
|--------|--------|
| **Dependencies** | Task 1.9 |
| **Regression Risk** | LOW |
| **Required Testing** | Create reservation → verify WhatsApp message attempted (mock in test) |
| **Rollback** | Revert to stub |

**Steps:**
1. Replace `ReservationService.sendConfirmation` stub with `NotificationService.sendWhatsApp(phone, message)`
2. Build confirmation message with reservation details (date, time, party size, table, confirmation code)
3. Handle gracefully if WhatsApp not configured (log warning, don't fail)
4. Test: create reservation, verify NotificationService.sendWhatsApp called

#### Task 2.3: Reservation deposit payment flow

| Aspect | Detail |
|--------|--------|
| **Dependencies** | Task 1.1 (PaymentCompletionService) |
| **Regression Risk** | MEDIUM |
| **Required Testing** | Initiate deposit → simulate payment success → verify deposit status updated |
| **Rollback** | Remove deposit payment initiation |

**Steps:**
1. Add `initiateDeposit(reservationId, amountCents, paymentMethod)` to ReservationService
2. Create PaymentTransaction with `domain: SALES`, `description: 'Reservation deposit'`
3. Link PaymentTransaction to Reservation via new `reservationId` FK (optional)
4. On payment success, `PaymentCompletionService` updates `Reservation.depositStatus` to SUCCESS
5. Add deposit payment button to reservation UI
6. Test: initiate deposit, simulate webhook, verify deposit status

#### Task 2.4: Wire StaffGuestIntelligence into waiter dashboard

| Aspect | Detail |
|--------|--------|
| **Dependencies** | None |
| **Regression Risk** | LOW — UI additive |
| **Required Testing** | Waiter dashboard loads with guest intelligence for orders with customer phone |
| **Rollback** | Remove component from waiter dashboard |

**Steps:**
1. Import `StaffGuestIntelligence` into `waiter.tsx`
2. For each order in the queue with a customerId, render guest intelligence panel
3. Show VIP tier badge, visit count, allergies, preferences, last visit
4. Test: waiter dashboard shows guest info for known customers

#### Task 2.5: Wire StaffGuestIntelligence into reservations

| Aspect | Detail |
|--------|--------|
| **Dependencies** | Task 2.1 |
| **Regression Risk** | LOW — UI additive |
| **Required Testing** | Reservation form shows guest intelligence when phone matches existing customer |
| **Rollback** | Remove component |

**Steps:**
1. Add phone lookup to reservation form
2. When phone matches existing customer, show `StaffGuestIntelligence` panel
3. Display VIP tier, visit count, allergies, special preferences
4. Test: type existing customer phone, verify intelligence panel appears

#### Task 2.6: Hotel check-in/check-out with Customer linkage

| Aspect | Detail |
|--------|--------|
| **Dependencies** | Task 1.8 (customerId FK pattern) |
| **Regression Risk** | MEDIUM |
| **Required Testing** | Check-in → verify room status OCCUPIED + Customer linked; check-out → verify room status AVAILABLE |
| **Rollback** | Revert to bare room list |

**Steps:**
1. Add `customerId` FK to `HotelRoom` model
2. Add check-in UI: select room → enter guest phone → `CustomerService.findOrCreateByPhone` → update room
3. Add check-out UI: select occupied room → verify no unpaid room service → set AVAILABLE
4. Call `GuestRecognitionService.onHotelCheckIn(customerId, roomId, businessId)` on check-in
5. Test: check-in flow, verify Customer linked and room occupied

#### Task 2.7: Contact ↔ Customer bridge

| Aspect | Detail |
|--------|--------|
| **Dependencies** | None |
| **Regression Risk** | MEDIUM — dual creation logic |
| **Required Testing** | Create Customer → verify Contact auto-created; create Contact type CUSTOMER → verify Customer auto-created |
| **Rollback** | Remove auto-creation hooks |

**Steps:**
1. Add `contactId` FK to `Customer` model (nullable)
2. Add `customerId` FK to `Contact` model (nullable)
3. In `CustomerService.createCustomer`, after creating Customer, auto-create Contact of type CUSTOMER and link
4. In `ContactService.createContact`, if type is CUSTOMER, auto-create Customer and link
5. Backfill: for existing Customers, create Contacts; for existing CUSTOMER Contacts, create Customers
6. Test: both creation paths, verify bidirectional link

#### Task 2.8: Navigation integration + role-based filtering

| Aspect | Detail |
|--------|--------|
| **Dependencies** | None |
| **Regression Risk** | LOW — UI changes |
| **Required Testing** | Each role sees only permitted navigation items; all integrated pages accessible |
| **Rollback** | Revert navigation config |

**Steps:**
1. Define navigation config as data structure (not hardcoded JSX)
2. Each item has: label, route, icon, requiredPermission, featureFlag
3. Filter navigation by user's role permissions and feature flags
4. Add missing items: CEO, CFO, Waiter, Sales, Referrals, Site Builder, Smart Dining Slips, Staff Performance, KDS
5. Group into sections: Overview, Operations, Customers, Hospitality, Growth, Insights, Team, Finance, Inventory, Admin
6. Remove `/dashboard/customers` (superseded by CRM)
7. Test: login as each role, verify navigation shows only permitted items

#### Task 2.9: Standardize error handling

| Aspect | Detail |
|--------|--------|
| **Dependencies** | None |
| **Regression Risk** | LOW |
| **Required Testing** | Trigger errors on each page, verify consistent error UI |
| **Rollback** | Revert to per-page error handling |

**Steps:**
1. Create `ErrorState` component with retry button (used by CEO/CFO dashboards)
2. Replace `toast.error()` in reservations with `ErrorState` component
3. Replace `console.error` in CRM with `ErrorState` component
4. Replace empty catch blocks in hotel.tsx with `ErrorState` component
5. Test: simulate API failure on each page, verify consistent error UI

#### Task 2.10: Unify terminology

| Aspect | Detail |
|--------|--------|
| **Dependencies** | None |
| **Regression Risk** | LOW |
| **Required Testing** | Grep for "restaurant" in code, verify all changed to "business" except customer-facing |
| **Rollback** | Git revert |

**Steps:**
1. Rename `NotificationService.sendSmartDiningSlip` parameter `restaurantName` → `businessName`
2. Rename `SmartDiningSlipService.getRestaurantSlips` → `getBusinessSlips`
3. Rename `SmartDiningSlipService.setRestaurantTemplate` → `setBusinessTemplate`
4. Update locale files: dashboard/internal strings use "Business", customer-facing strings use "Restaurant"
5. Test: verify no compilation errors, verify UI labels correct

---

### Wave 3 — Cleanup (Week 6)

Remove obsolete implementations.

#### Task 3.1: Delete dead code

| Aspect | Detail |
|--------|--------|
| **Dependencies** | Wave 1 and 2 complete |
| **Regression Risk** | LOW |
| **Required Testing** | Compilation check, full test suite |
| **Rollback** | Git revert |

**Delete:**
- `LoyaltyService.updateVIPStatus`, `getVIPBenefits`, `applyVIPDiscount` (already done in 1.7)
- `CustomerService.getTopCustomers`, `redeemLoyaltyPoints`
- `/api/webhooks/irembopay.ts` (already done in 1.5)
- `InTouchService` (deprecated)
- `HotelRoomsPluginAdapter`, `RoomServicePluginAdapter` (empty adapters)
- `/dashboard/customers` page (superseded by CRM)
- Inline `processSuccessfulPayment` / `processFailedPayment` functions (already done in 1.3)

#### Task 3.2: Update documentation

| Aspect | Detail |
|--------|--------|
| **Dependencies** | Wave 1 and 2 complete |
| **Regression Risk** | NONE |
| **Required Testing** | N/A |

**Update:**
- README with canonical architecture overview
- API documentation with canonical endpoints
- Service documentation with ownership matrix
- Database schema documentation with new FKs

---

### Wave 4 — Verification (Week 7)

#### Task 4.1: Integration test suite

| Aspect | Detail |
|--------|--------|
| **Dependencies** | All waves complete |
| **Regression Risk** | N/A |
| **Required Testing** | This IS the testing |

**Test scenarios:**
1. CASH sale → verify all 10 side effects fire exactly once
2. MoMo payment success → verify all 10 side effects fire exactly once
3. IremboPay webhook → verify all 10 side effects fire exactly once
4. Duplicate webhook → verify idempotency (side effects fire once)
5. Loyalty points: complete order → verify ledger entry + field match
6. VIP tier: complete orders → verify tier upgrades correctly
7. Reservation: create with existing customer → verify linked
8. Reservation: create with new phone → verify customer created
9. Hotel check-in → verify customer linked + room occupied
10. Navigation: each role → verify only permitted items visible

#### Task 4.2: Conduct second PIV audit

| Aspect | Detail |
|--------|--------|
| **Dependencies** | Task 4.1 |
| **Regression Risk** | N/A |

Re-run all 13 PIV workstreams against the updated codebase. Target: overall score ≥ 85/100.

---

## 2. Migration Strategy

### 2.1 Database Impact

| Change | Migration | Backfill Required | Downtime |
|--------|-----------|-------------------|----------|
| Add `customerId` FK to `Reservation` | Add column (nullable) | Yes — resolve customers by phone | None |
| Add `contactId` FK to `Customer` | Add column (nullable) | Yes — auto-create Contacts | None |
| Add `customerId` FK to `Contact` | Add column (nullable) | Yes — auto-create Customers | None |
| Add `customerId` FK to `HotelRoom` | Add column (nullable) | No (future data) | None |
| Add `SALES` to `LedgerDomain` enum | Add enum value | Yes — backfill historical sales | None |
| Add `reservationId` FK to `PaymentTransaction` | Add column (nullable) | No | None |

All migrations are additive (nullable columns, new enum values). No destructive schema changes. Zero downtime.

### 2.2 API Impact

| Change | API Impact | Backward Compatibility |
|--------|-----------|----------------------|
| PaymentCompletionService routes | Internal refactor, no API signature change | Fully backward compatible |
| Reservation API delegates to service | Internal refactor, same request/response | Fully backward compatible |
| `/api/webhooks/irembopay.ts` returns 410 | Endpoint retired | IremboPay dashboard must be updated first |
| `/api/loyalty/issue` delegates to service | Internal refactor, same request/response | Fully backward compatible |
| `/dashboard/customers` removed | Page returns 404 | Users redirected to `/dashboard/crm` |

### 2.3 UI Impact

| Change | UI Impact | Backward Compatibility |
|--------|-----------|----------------------|
| Navigation restructured | New items appear, sections reorganized | Additive — no existing items removed (except /customers) |
| Role-based navigation filtering | Users see fewer items (only permitted) | May surprise users who bookmarked URLs — communicate |
| Waiter dashboard shows guest intelligence | New panel appears | Additive |
| Reservation form shows guest intelligence | New panel appears | Additive |
| Hotel check-in/check-out UI | New buttons and forms | Additive |
| Error handling standardized | Consistent error UI | Improvement |
| Terminology unified | "Restaurant" → "Business" in dashboard | Minor label changes |

### 2.4 Deployment Considerations

1. **Deploy Wave 1 first** — PaymentCompletionService and loyalty fix are behind-the-scenes changes
2. **Feature flag new UI** — Navigation changes, hotel check-in, guest intelligence panels behind feature flags for staged rollout
3. **Monitor after Wave 1** — Watch for payment processing issues, loyalty points discrepancies
4. **Deploy Wave 2 incrementally** — Each integration task can be deployed independently
5. **Deploy Wave 3 after verification** — Dead code removal after confirming no references
6. **Run Wave 4 verification in staging** — Full integration test suite before production
