# Order State Machine Audit

Date: June 25, 2026
Auditor: Restaurant Operations Reliability Auditor
Status: ✅ Completed

---

## Objective

Map the operational state model for orders and items, verify valid/invalid transitions, and assess recovery behavior under real conditions.

Sources:
- prisma/schema.prisma (Sale, SaleItem, enums)
- src/pages/api/station/update-item-status.ts
- src/lib/services/state-machine.service.ts
- src/pages/api/sales/[id].ts, src/lib/services/sales.service.ts

---

## Item-Level State Machine (Implemented and Enforced)

- Enum: `ItemStatus` = NEW → PREPARING → READY → DELIVERED; CANCELED as off-ramp.
- Enforced by `StateMachineService` (TRANSITIONS table) and API `/api/station/update-item-status`.
- Validation:
  - Allowed transitions enforced.
  - Same-state idempotency returns 200 with idempotent flag.
  - Invalid transitions return 400 with allowedTransitions.
  - Timestamps recorded for PREPARING/READY/DELIVERED.
  - Idempotency key optional and supported.

Assessment: Strong. Item state flow is explicit and guarded.

---

## Order-Level State Model (Fragmented, Unenforced)

Observed fields on `Sale` (schema):
- `status: String @default("ACTIVE")` (free-form)
- `kitchenStatus: String? @default("pending")` (commented expected values)
- `paymentStatus: PaymentStatus` (enum: PENDING, COMPLETED, FAILED, REFUNDED, ...)
- `isPaid: Boolean`
- `expoStatus: ExpoStatus?` (enum)
- Timing markers: `acceptedAt`, `preparingAt`, `readyAt`, `servedAt`, etc.

Issues:
- No unified order enum; order state is inferred from multiple fields without enforcement.
- No API that validates order-level transitions (e.g., cannot serve a canceled order, cannot pay before served, etc.).
- Cancellation is a hard-delete path, not a state transition.
- No explicit Draft/Submitted states; QR draft creates a Sale directly with `status='ACTIVE'` and `paymentStatus='PENDING'`.

Assessment: Weak. Order-level transitions are not explicitly modeled or enforced in endpoints.

---

## Expected Full Order State Map (Conceptual)

- Draft → Submitted → Preparing → Ready → Served → Paid
- Off-ramps: Cancelled (from Draft/Submitted/Preparing/Ready), Refund (from Paid)

Mapping to current fields:
- Draft: Not represented formally (QR creates active order immediately)
- Submitted: Implicit when items exist + paymentStatus=PENDING
- Preparing/Ready/Served: Tracked on items (enforced) and timestamps on Sale; kitchenStatus string is advisory.
- Paid: paymentStatus=COMPLETED or PAID; isPaid=true
- Cancelled: Not modeled; implemented as hard-delete.

---

## Validity and Recovery

- Valid transitions are enforced only for items.
- Invalid order-level transitions are not blocked (e.g., could set isPaid=true while items not delivered if such UI existed).
- Recovery after errors:
  - Items: OK (idempotent updates, conflict resolution helpers exist)
  - Orders: No recovery logic; deletion removes history; no audit trail.

---

## Gaps to Address (Order-Level)

- Introduce a cancel path that marks orders as canceled (soft state) rather than deleting.
- Add minimal server-side checks for key transitions (e.g., prohibit payment completion on canceled orders).
- Align kitchenStatus to item aggregate or formalize order enum; do not rely on free-form strings.

---

## Conclusion

- Item state machine: ✅ Robust and enforced.
- Order state machine: ❌ Fragmented, unenforced, and risky (especially around cancellation and payment finalization).

Minimum hardening for pilot reliability:
- Replace hard-delete with cancel state; block pay-on-canceled; persist reason.
- Add idempotency on order creation; reduce accidental duplicates impacting state.
