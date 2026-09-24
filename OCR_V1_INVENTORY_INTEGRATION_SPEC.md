# OCR V1 Inventory Integration Specification

Date: June 25, 2026
Owner: Restaurant Operations Expert
Status: READY FOR IMPLEMENTATION
Scope: Safe application of extracted receipt data into Inventory

---

## Goals
- Prevent inventory corruption (units, quantities)
- Maintain full auditability
- Keep integration simple (single apply endpoint)

---

## Apply Endpoint
- Path: `POST /api/inventory/receipts/apply` (thin wrapper)
- Internally forwards to existing `/api/die/documents/[id]/apply` after server-side validations

### Request Body
```
{
  documentId: string,
  items: Array<{
    itemId: string,         // ScannedDocumentItem.id
    productId: string,      // InventoryItem.id
    quantity: number,
    unit: string,           // normalized unit
    unitPriceCents?: number // optional
  }>
}
```

### Response
```
{
  success: true,
  itemsUpdated: number,
  stockLevels: Array<{
    productId: string,
    name: string,
    oldStock: number,
    newStock: number,
    unit: string
  }>
}
```

---

## Server-Side Validations
- Business ownership
- Document status ∈ { REVIEW, APPROVED, INTELLIGENCE_DONE } and not APPLIED
- For each item:
  - InventoryItem exists and belongs to business
  - Quantity: 0 < qty < 10,000 (float)
  - Unit: normalize then strict-equal to InventoryItem.unit
- If any row fails → reject entire request (atomicity)

---

## Transactional Apply
- Use Prisma `$transaction` with the following steps:
  1. For each item:
     - `InventoryItem.update({ currentStock: { increment: quantity }, unitCostCents: unitPriceCents || existing })`
     - `InventoryUpdate.create({ businessId, inventoryItemId, userId, type: 'ADD', quantity, reason: 'Receipt: <invoice#>', notes: 'Supplier: <name>' })`
  2. Update ScannedDocument: `{ status: 'APPLIED', lifecycleState: 'APPLIED' }`
  3. Append DocumentEventTimeline with `{ stage: 'application', status: 'APPLIED', metadata }`

---

## Duplicate Protections
- Upload deduplication: `(sourceHash, businessId)` unique
- Apply idempotency:
  - Reject if document already APPLIED
  - Optional: add `AppliedFingerprint` record `{ documentId, businessId }` with unique index to defensively guard against retried POSTs

---

## Matching Logic (Pre-Apply)
- Product matching done before review via service (see Supplier/Product Memory spec)
- Review UI may override productId selections
- Apply validates final chosen productId and units

---

## Failure Handling
- Validation error → 400 with per-item error list
- Concurrency conflict (rare) → 409; advise user to refresh
- Transaction error → 500; no partial updates committed

---

## Observability
- Log: documentId, businessId, itemsUpdated, durationMs
- Metrics: apply_success_count, apply_failure_count, avg_apply_duration_ms
- Audit: `InventoryUpdate` + `DocumentEventTimeline`

---

## Non-Goals (V1)
- Price history ledgering beyond `unitCostCents` update
- GRN/PO reconciliation flows
- Negative adjustments
