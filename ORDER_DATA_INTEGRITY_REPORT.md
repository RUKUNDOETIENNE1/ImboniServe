# Order Data Integrity Report

Date: June 25, 2026
Auditor: Production Transaction Systems Engineer
Status: ✅ Completed

---

## Objectives

- Verify transactional consistency
- Check for orphaned records
- Assess rollback behavior
- Validate reporting consistency

Evidence:
- prisma/schema.prisma
- src/lib/services/sales.service.ts
- src/pages/api/sales/[id].ts, /api/sales/index.ts
- src/pages/api/public/order/draft.ts, src/lib/services/qr-order.service.ts

---

## Transactional Consistency

- POS create (SalesService.createSale): Nested create of sale + items is atomic. No explicit DB transaction, but Prisma nested writes are transactional.
- QR draft: Explicit Prisma transaction with Serializable isolation for slot capacity + sale + paymentTransaction. Good.

Risk: LOW for creation paths.

---

## Orphaned Records

- SaleItem has `onDelete: Cascade` to Sale (schema). Deleting a Sale deletes its items.
- PaymentTransaction is linked from Sale (optional). Deleting a Sale leaves PaymentTransaction orphaned. Not inherently corrupting, but complicates reconciliation and audit.
- PostAttribution and other shadows/events are best-effort; failures are caught and logged without breaking main flow.

Risk: MEDIUM for orphaned payment transactions on hard-deletes.

---

## Rollback Behavior

- QR draft handles serialization failures with one retry; returns 409 on slot conflicts. Good defensive posture.
- Irembo invoice creation is best-effort; PaymentTransaction persists even if invoice creation fails (status PENDING). Acceptable.
- No saga/compensation for POS path; acceptable for current scope.

Risk: LOW-MEDIUM.

---

## Reporting Consistency

- Hard-deleting a paid order removes it from reporting entirely; no soft-cancel trail.
- `getDailySales` sums sale totals; a hard-delete rewrites history without trace.
- No guard to prevent deletion of paid/completed orders; risk of accidental or malicious data loss.

Risk: HIGH without cancel semantics.

---

## Integrity Bugs

- `updateSale`/`deleteSale` compose invalid `where` filters (`{ id, businessId }`) for Prisma unique ops. Likely runtime failure in production when businessId is provided (the API does provide it). This blocks legitimate updates/cancellations at runtime.

Risk: HIGH (functional breakage and operational dead-ends during service).

---

## Minimum Safeguards for Pilot

- Replace hard-delete with soft cancel state; retain financial footprint and link refunds.
- Block cancellation if `paymentStatus in (PAID, COMPLETED)` unless refund processed.
- Fix Prisma where-filter usage (use `id` unique; enforce business via prior read/check).
- Add audit trail (who canceled, why, when) — minimal event log record.

---

## Conclusion

Creation paths are sound. Update/delete paths have a critical correctness bug and lack cancellation semantics, threatening reporting integrity and operational survival. Addressing these safeguards is required before a 30-day, 5-restaurant pilot.
