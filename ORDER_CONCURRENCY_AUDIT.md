# Order Concurrency Audit

Date: June 25, 2026
Auditor: Concurrency & Data Integrity Specialist
Status: ✅ Completed

---

## Scope

- Multiple staff editing same order
- Waiter vs cashier interactions
- Simultaneous updates
- Stale state overwrites
- Double-clicks, retries, refreshes

Evidence:
- create (src/pages/api/sales/index.ts)
- update/delete (src/pages/api/sales/[id].ts, src/lib/services/sales.service.ts)
- QR draft (src/pages/api/public/order/draft.ts)
- Station item status (src/pages/api/station/update-item-status.ts)
- Idempotency (src/lib/services/idempotency.service.ts)

---

## Findings

### 1) Creation Idempotency (POS + QR)

- POS (/api/sales POST): No idempotency keys; duplicates possible on retries/double-clicks.
- QR (/api/public/order/draft POST): Serializable transaction for capacity; no idempotency. Two parallel requests can both pass token validation and create two sales before token is marked used.
- IdempotencyService exists but not wired into creation endpoints.

Risk: MEDIUM-HIGH (duplicates during network instability/latency).


### 2) Update Concurrency (Orders)

- PUT/PATCH /api/sales/[id]: No optimistic concurrency/version. Last write wins. Field scope is limited (payment flags and notes), reducing surface area but still dangerous (e.g., toggling isPaid).
- Where-filter bug ({ id, businessId }) likely prevents updates from succeeding when business context is enforced. This is a correctness bug more than a concurrency guard.

Risk: MEDIUM (inconsistent payment flags due to races; current bug may make updates fail outright).


### 3) Station Item Updates (Kitchen)

- Uses StateMachineService with explicit transitions.
- Uses IdempotencyService to guard duplicate state updates.
- Emits real-time events; validates station ownership.

Risk: LOW (well-guarded path).


### 4) Stale State Overwrites

- No ETag/version on Sale updates; concurrent toggles can overwrite silently.
- No conflict resolution on order-level; contrast with item-level where guidance exists.

Risk: MEDIUM.

---

## Race Conditions to Watch (30-day pilot)

- Double submit on POS create → duplicate orders (no idempotency)
- Parallel QR submits before token marked used → duplicate sales
- Two staff toggling payment flags concurrently → inconsistent paid status
- Update/delete endpoints failing due to invalid Prisma where filters → inability to correct orders in real-time

---

## Minimum Hardening

- Add idempotency to creation endpoints (server-stored responses)
- Fix where-filter bug in update/delete
- Add simple optimistic concurrency (version or updatedAt precondition) for payment mutations

---

## Conclusion

- Kitchen item flow is concurrency-safe.
- Order creation and header updates need idempotency and basic OCC to survive real-world usage.
