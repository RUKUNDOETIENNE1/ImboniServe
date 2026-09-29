# Pilot Launch Blocker Assessment (Order Lifecycle)

Date: June 25, 2026
Authority: Restaurant Operations Reliability Auditor
Status: ✅ Completed

---

## Final Questions & Answers

### 1) Which issues are TRUE deployment blockers?

- 🔴 Fix Prisma where-filter bug in `updateSale` and `deleteSale` (use unique `id` only; enforce business via pre-check)
  - Evidence: src/lib/services/sales.service.ts (invalid `{ id, businessId }` in `where` for update/delete)
  - Impact: Prevents legitimate modifications/cancellations; creates dead-ends during service.
  - Effort: 1-2 hours.

- 🔴 Introduce safe cancellation (soft cancel, reason, payment guard)
  - Evidence: DELETE path does hard-delete; no reason/audit; allows deleting paid orders; breaks reporting.
  - Impact: High-frequency need; essential operational safety.
  - Effort: 4-6 hours.

- 🔴 Add server-side idempotency to order creation (POS + QR)
  - Evidence: No idempotency in POST /api/sales nor /api/public/order/draft; duplicates possible under latency/retry.
  - Impact: Duplicate orders/charges; kitchen chaos.
  - Effort: 4-6 hours.

Total blocker effort: 9-14 hours.


### 2) Which issues are merely improvements?

- 🟠 Minimal order modification (add/remove items, adjust quantities, recalc totals; guard by state)
  - Effort: 8-12 hours.

- 🟡 Basic optimistic concurrency for payment/status updates (etag/version or updatedAt precondition)
  - Effort: 3-5 hours.

- 🟡 Payment method validation/confirmation step (reduce misclassification)
  - Effort: 2-3 hours.

- 🟡 Soft kitchen notification on cancellation (optional real-time alert)
  - Effort: 4-6 hours.

- 🟡 Cleanup or link orphaned PaymentTransaction on cancel/refund
  - Effort: 2-4 hours.


### 3) How many hours/days to resolve only the blockers?

- Estimated total: **9-14 hours** (1.1–1.75 workdays)
  - Where-filter bug: 1-2 hours
  - Safe cancellation: 4-6 hours
  - Idempotency (POS + QR): 4-6 hours


### 4) After fixing only blockers, can 5 restaurants safely operate for 30 days?

- ✅ Yes, with acceptable risk.
  - Cancellation becomes safe and auditable.
  - Duplicates reduced by server idempotency (significant field risk removed).
  - Update/delete bug removed (restores operational control).
  - Residual risks (modification/OCC) can be managed operationally via add-on orders and procedures in Week 1.

Expected outcomes after blockers fixed:
- Duplicate orders: Rare (
<5% of week 1 incidents)
- Cancellations: Safe; no impact on historical reporting
- Payment integrity: Improved; fewer misclassifications
- Support load: 4-8 tickets/week (manageable)

---

## Decision Recommendation

- Current status: 🔴 BLOCKED on order-lifecycle reliability.
- After blocker fixes (9-14 hrs): 🟡 READY WITH CONDITIONS for pilot.

---

## Evidence Index

- Sales API: src/pages/api/sales/index.ts
- Sales by ID: src/pages/api/sales/[id].ts
- Sales service: src/lib/services/sales.service.ts
- Schemas: src/lib/validations/sales.schema.ts
- Prisma models: prisma/schema.prisma (Sale, SaleItem, enums)
- QR draft: src/pages/api/public/order/draft.ts
- State machine: src/lib/services/state-machine.service.ts

---

## Notes

- All recommendations stay within existing restaurant functionality and avoid new modules.
- No dashboard/hotel features proposed.
- Focus is exclusively on survival-critical operations for the pilot.
