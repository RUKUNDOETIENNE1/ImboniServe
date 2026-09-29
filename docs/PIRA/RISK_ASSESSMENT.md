# Risk Assessment

**Document Type:** Risk Analysis & Mitigation  
**Phase:** Design Only  

---

## Purpose

Identify high-risk, medium-risk, and low-risk changes. Propose mitigation strategies for each high-risk change.

---

## Risk Classification

### High-Risk Changes (4)

---

#### HR-1: Routing CASH path through PaymentCompletionService

| Aspect | Detail |
|--------|--------|
| **Task** | 1.2 |
| **Risk** | CASH is the most common payment path. Any regression affects every cash sale. |
| **Impact if Failed** | Cash sales fail to complete, no dining slip, no loyalty points, no guest recognition |
| **Probability** | Medium (well-tested code being refactored) |
| **Severity** | Critical (blocks all cash transactions) |

**Mitigation Strategies:**
1. **Feature flag**: Deploy behind `payment_completion_service` flag. Roll out to 1 business first.
2. **Parallel execution**: During migration, run both old inline code AND PaymentCompletionService. Compare results. Log discrepancies. After 48h of matching results, remove old code.
3. **Integration test**: Automated E2E test that creates a CASH sale and verifies all 10 side effects fire.
4. **Monitoring**: Alert on any CASH sale that doesn't have a PointsLedger entry within 5 minutes.
5. **Rollback plan**: Revert SalesService to inline handling. PaymentCompletionService remains available but unused.

---

#### HR-2: Routing MoMo path through PaymentCompletionService

| Aspect | Detail |
|--------|--------|
| **Task** | 1.3 |
| **Risk** | MoMo payment confirmation is async and time-sensitive. Regression could cause stuck payments. |
| **Impact if Failed** | MoMo payments not confirmed, sales stuck in INITIATED, customer charged but order not completed |
| **Probability** | Medium |
| **Severity** | Critical (affects real money flow) |

**Mitigation Strategies:**
1. **Feature flag**: Same as HR-1, deploy behind flag.
2. **Idempotency verification**: Test that calling `onPaymentSuccess` twice produces same result as calling once.
3. **Staging test with sandbox**: Use MoMo sandbox to simulate payment success/failure before production.
4. **Monitoring**: Alert on MoMo transactions stuck in PROCESSING for >10 minutes.
5. **Rollback plan**: Revert to inline `processSuccessfulPayment`. PaymentCompletionService remains for other paths.

---

#### HR-3: Routing IremboPay webhook through PaymentCompletionService

| Aspect | Detail |
|--------|--------|
| **Task** | 1.4 |
| **Risk** | Webhook processing is external-triggered. Can't easily test in production without real webhook. |
| **Impact if Failed** | IremboPay payments not confirmed, subscriptions not activated, affiliate commissions not created |
| **Probability** | Medium |
| **Severity** | Critical (affects subscription revenue) |

**Mitigation Strategies:**
1. **Webhook replay**: Use IremboPay's webhook replay feature to re-send recent webhooks after deployment.
2. **Idempotency guard**: Ensure `PaymentCompletionService` checks transaction status before processing. If already SUCCESS, skip.
3. **Signature verification**: Keep existing HMAC-SHA256 verification unchanged — only side effects move.
4. **Staging test**: Send mock webhook to staging endpoint, verify all side effects.
5. **Monitoring**: Alert on IremboPay webhooks that return non-200 status.
6. **Rollback plan**: Revert webhook handler to inline side effects.

---

#### HR-4: Loyalty points earning path change

| Aspect | Detail |
|--------|--------|
| **Task** | 1.6 |
| **Risk** | Changes how loyalty points are calculated and stored. Existing customers may have points that don't match ledger. |
| **Impact if Failed** | Customers lose points, incorrect points awarded, loyalty program credibility damaged |
| **Probability** | Medium |
| **Severity** | High (customer-facing trust issue) |

**Mitigation Strategies:**
1. **Backfill first**: Before switching, run backfill to create PointsLedger entries for all historical `CustomerService.updateCustomerStats` increments. Estimate historical points from `Customer.visitCount` and `Customer.lifetimeSpendCents`.
2. **Reconciliation job**: After migration, run job comparing `Customer.loyaltyPoints` vs `PointsLedger` aggregate. Log and fix discrepancies.
3. **Earning rate audit**: Document the new earning rate (configurable via `LoyaltyEarnRule`). Ensure default rate is reasonable.
4. **Feature flag**: Deploy behind `loyalty_service_earn` flag. Roll out to 1 business first.
5. **Customer communication**: If earning rate changes (from 1pt/10RWF to 1pt/100RWF), proactively communicate to customers or adjust default earn rule to match current rate.
6. **Rollback plan**: Revert to `CustomerService.updateCustomerStats`. PointsLedger entries remain but are not used for balance calculation.

---

### Medium-Risk Changes (6)

---

#### MR-1: Retiring duplicate IremboPay webhook

| Aspect | Detail |
|--------|--------|
| **Task** | 1.5 |
| **Risk** | If IremboPay still sends to old URL, payments not processed |
| **Mitigation** | Update IremboPay dashboard first. Monitor old endpoint for 48h. Return 410 before deleting. |

#### MR-2: Adding customerId FK to Reservation

| Aspect | Detail |
|--------|--------|
| **Task** | 1.8 |
| **Risk** | Schema migration on production database |
| **Mitigation** | Nullable column (additive). Backfill script runs in background. No downtime. |

#### MR-3: Routing reservation API through ReservationService

| Aspect | Detail |
|--------|--------|
| **Task** | 1.9 |
| **Risk** | API behavior change could break existing UI |
| **Mitigation** | Same request/response shape. Integration tests for all CRUD operations. |

#### MR-4: Hotel check-in/check-out with Customer linkage

| Aspect | Detail |
|--------|--------|
| **Task** | 2.6 |
| **Risk** | New functionality on previously bare module |
| **Mitigation** | Feature flag `hotel_checkin`. Roll out to one business first. |

#### MR-5: Contact ↔ Customer bridge

| Aspect | Detail |
|--------|--------|
| **Task** | 2.7 |
| **Risk** | Dual auto-creation could cause infinite loops or duplicate records |
| **Mitigation** | Guard against circular creation: check if linked record exists before creating. Use upsert pattern. Backfill script with dedup. |

#### MR-6: Reservation deposit payment flow

| Aspect | Detail |
|--------|--------|
| **Task** | 2.3 |
| **Risk** | Payment processing for deposits adds complexity |
| **Mitigation** | Use existing PaymentCompletionService (already idempotent). Feature flag `reservation_deposits`. |

---

### Low-Risk Changes (8)

---

| ID | Task | Risk | Rationale |
|----|------|------|-----------|
| LR-1 | 1.1 — Create PaymentCompletionService | LOW | Additive, no existing code changes |
| LR-2 | 1.7 — Delete LoyaltyService dead code | LOW | Deleting code that is never called |
| LR-3 | 2.2 — Reservation confirmation via NotificationService | LOW | Replaces stub with real call, graceful fallback |
| LR-4 | 2.4 — StaffGuestIntelligence in waiter dashboard | LOW | UI additive, no backend changes |
| LR-5 | 2.5 — StaffGuestIntelligence in reservations | LOW | UI additive, no backend changes |
| LR-6 | 2.8 — Navigation integration | LOW | UI changes, no backend impact |
| LR-7 | 2.9 — Standardize error handling | LOW | UI consistency improvement |
| LR-8 | 2.10 — Unify terminology | LOW | Rename variables and locale strings |
| LR-9 | 3.1 — Delete dead code | LOW | Removing unreachable code |
| LR-10 | 3.2 — Update documentation | LOW | No code impact |

---

## Risk Heat Map

```
         Low Probability    Medium Probability    High Probability
High     │                   HR-1, HR-2,          │
Severity │                   HR-3, HR-4           │
         │                                         │
─────────┼─────────────────┼──────────────────────┼──────────
Medium   │                   MR-1, MR-2,          │
Severity │                   MR-3, MR-4,          │
         │                   MR-5, MR-6           │
─────────┼─────────────────┼──────────────────────┼──────────
Low      │  LR-1 through     │                    │
Severity │  LR-10            │                    │
```

---

## Deployment Safety Protocol

1. **Never deploy Wave 1 tasks in isolation** — Deploy as a cohesive unit after all Wave 1 tasks pass integration tests
2. **Feature flag every high-risk change** — Allows instant rollback without redeployment
3. **Canary deployment** — Roll out to 1 business first, monitor for 24h, then roll out to all
4. **Monitoring dashboard** — Track: payment success rate, loyalty points reconciliation, webhook processing time, reservation creation rate
5. **Rollback drill** — Practice rollback procedure in staging before production deployment
6. **Communication plan** — Notify businesses of navigation changes, terminology changes, and any loyalty program adjustments

---

## Testing Requirements by Risk Level

| Risk Level | Testing Required |
|-----------|-----------------|
| High | Unit tests + integration tests + E2E tests + staging deployment + canary rollout + monitoring |
| Medium | Unit tests + integration tests + staging deployment |
| Low | Unit tests + compilation check |
