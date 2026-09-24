# Order Lifecycle Hardening Report

Date: June 25, 2026
Auditor: Senior Restaurant POS Architect / Production Transaction Systems Engineer
Status: ✅ Completed

---

## Scope

- Order cancellation
- Order modification
- Duplicate prevention
- Concurrency protection
- Order state machine (order/item)
- Data integrity

Evidence is drawn from actual implementation:
- src/pages/api/sales/index.ts
- src/pages/api/sales/[id].ts
- src/lib/services/sales.service.ts
- src/lib/validations/sales.schema.ts
- prisma/schema.prisma (Sale, SaleItem, enums)
- src/pages/api/public/order/draft.ts
- src/lib/services/qr-order.service.ts
- src/pages/api/orders/[id]/add-items.ts
- src/pages/api/station/update-item-status.ts
- src/lib/services/state-machine.service.ts

---

## Findings by Area

### 1) Order Cancellation

- Implementation present: DELETE /api/sales/[id] ⇒ SalesService.deleteSale
- Permission bug: entire handler is wrapped by `requirePermission('orders.read')` (src/pages/api/sales/[id].ts:45). Delete operation is therefore gated only by read permission.
- Hard-delete: `prisma.sale.delete({ where })` is used; no soft-cancel semantics.
- Where-filter bug: `deleteSale(id, businessId?)` composes `where = { id, businessId }` which is NOT a valid unique filter for Prisma delete. This likely throws at runtime when businessId is present.
- Payment implications: No guard to prevent deletion of paid/settled orders; no refund linkage; possible historical tampering.
- Kitchen implications: No KDS/Kitchen notification on cancel; tickets/items vanish on hard-delete.
- Audit trail: No cancellation reason tracking.

Assessment: Not safe. Cancellation is functionally broken (invalid where) and operationally destructive (hard delete, no audit).


### 2) Order Modification

- API for modification of sale header: PUT/PATCH /api/sales/[id] with `updateSaleSchema` allowing only paymentStatus, paymentReference, notes, isPaid.
- Where-filter bug: `updateSale(id, input, businessId?)` uses `where = { id, businessId }` which is not valid for Prisma update and will likely error when businessId supplied by API.
- Item-level modification: Not supported in `updateSale`. No endpoint to change quantities/remove items.
- Add-on path exists: POST /api/orders/[id]/add-items creates a separate Sale as an "addon" linked via `parentOrderId` (isAddon=true). No remove/change support.
- Table reassignment not in schema; not supported by the update endpoint.

Assessment: Core modifications (item/qty/table) are not supported. Header updates likely fail due to where-filter bug. Add-on only partially addresses real-world needs.


### 3) Duplicate Prevention

- Waiter POS create (POST /api/sales): No idempotency keys; no double-click guard server-side.
- QR draft (POST /api/public/order/draft): Uses serializable transaction for slot capacity, but no idempotency; `orderNumber` is generated anew on each try. Token is marked as used after success; parallel submissions before mark can both succeed.
- IdempotencyService exists but is not used in sales creation endpoints (only used in station item status update path).

Assessment: Duplicate orders can be created under slow networks, retries, and double-clicks.


### 4) Concurrency Protection

- Multiple editors: Update endpoint has no optimistic concurrency/versioning; last write wins for payment fields.
- Station item transitions use StateMachineService and IdempotencyService (good), but that is item-level only.
- Table assignment/update has no concurrency guard (outside order scope, but adjacent to lifecycle) and no version field.

Assessment: Order-level updates lack OCC. Item-level station updates have a guarded state machine.


### 5) Order State Machine (Order vs Item)

- Order-level: `Sale.status` is a free-form string default "ACTIVE"; `kitchenStatus` is a string with comments; `paymentStatus` is enum; `expoStatus` is enum. No unified order state machine or enforcement in endpoints.
- Item-level: `SaleItem.itemStatus` is enum with explicit allowed transitions enforced by StateMachineService and update-item-status API.

Assessment: Item state machine enforced; order state machine is fragmented and unenforced.


### 6) Data Integrity

- Transactionality: Sale creation with nested items is atomic. QR draft uses explicit DB transaction.
- Orphans/Cascade: `SaleItem -> Sale` has onDelete: Cascade (prisma); deleting Sale deletes its items. `PaymentTransaction` is referenced from Sale (optional). Deleting Sale does not clean up PaymentTransaction records.
- Reporting consistency: Hard-deleting sales modifies historical totals; no soft-cancel flag. No audit/history.
- Update/Delete filter bug likely generates runtime errors (Prisma invalid where) causing inability to modify/cancel via API in production when businessId is present.

Assessment: Core creation OK; update/delete pathways are unsafe or broken; historical integrity at risk via hard-deletes.

---

## Summary of Operational Risk (30 Days, 5 Restaurants)

- Cancellation requests will occur frequently; current pathway is functionally broken and unsafe.
- Order changes are routine; current implementation cannot change items/quantities; real-world workarounds (addon orders) fragment billing/reconciliation.
- Duplicate orders will occur under latency/retry; no idempotency.
- Concurrency issues possible when staff update payment flags simultaneously; last write wins.
- Reporting integrity can be corrupted by hard-deletes (no cancel state/audit).

---

## Minimum Hardening Required (Blockers Only)

- Fix Prisma where-filter bug for update/delete (use unique id only; enforce businessId via pre-check) — 1-2 hours.
- Replace hard-delete with safe cancellation path (status: CANCELLED or similar; block if paid/refund first; store reason) — 4-6 hours.
- Introduce idempotency for order creation (POS + QR) with server-enforced keys and cached response — 4-6 hours.

Optional but Important (Week 1-2):
- Minimal order modification: add/remove item, change quantity, recalc total (guard transitions) — 8-12 hours.
- Basic OCC for payment/status updates (etag/version) — 3-5 hours.

---

## Verdict

Current order lifecycle is NOT safe for real-world operations without the above blockers fixed. After addressing blockers, operations are viable; further improvements recommended during Week 1-2.
