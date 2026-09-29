# OCR V1 Review Screen Specification

Date: June 25, 2026
Owner: Hospitality SaaS Product Director
Status: READY FOR IMPLEMENTATION
Scope: Restaurant-facing review of extracted receipt data prior to applying to inventory

---

## Goals
- Minimize steps to validate extracted receipt data
- Make correctness obvious; make edits fast
- Block corruption via guardrails (units, quantity bounds)
- Mobile-friendly for on-floor use

---

## Routes
- Page: `/dashboard/inventory/receipts/review/[id]`
- Data: `GET /api/inventory/receipts/[id]` (transforms DIE document to restaurant-friendly shape)
- Apply: Reuse existing `POST /api/die/documents/[id]/apply` with added validations (server-side). Optionally expose alias `POST /api/inventory/receipts/apply` as a thin proxy.

---

## Page Layout
- Top Bar
  - Back button
  - Title: Invoice number or "Receipt Review"
  - Subtext: Document type + created date
  - Badges: Status, Confidence, Supplier match status
  - Actions: Approve (if pending), Reject (if pending), Apply (if approved)

- Left Column
  - Document Preview (image/PDF)
  - Zoom controls (50–200%)
  - Rotate controls (0/90/180/270)

- Right Column
  - Header Summary Card
    - Supplier name (editable select with search)
    - Invoice number (text, editable)
    - Invoice date (date picker)
    - Total amount (read-only unless edited)
    - Confidence overall badge
  - Line Items Table
    - Columns: State, Product from receipt, Qty, Unit, Unit Price, Total, Inventory Match (dropdown), Confidence, Actions
    - Row States
      - ✅ AUTO_MATCHED (confidence ≥ 0.80; unit valid; qty valid)
      - ⚠️ NEEDS_CONFIRM (0.60 ≤ confidence < 0.80 OR qty outlier OR unit alias normalized)
      - ❌ NOT_MATCHED (no productId)
    - Row Actions
      - Edit line (opens inline controls)
      - Skip line (exclude from apply)

- Footer Bar
  - Summary: N auto-matched, M need confirmation, K not matched, Skipped L
  - Primary: "Add to Inventory"
  - Secondary: "Skip Unmatched & Add"

---

## Data Contract (GET /api/inventory/receipts/[id])
```
{
  id: string,
  status: 'UPLOADED'|'EXTRACTED'|'INTELLIGENCE_DONE'|'REVIEW'|'APPROVED'|'APPLIED'|'REJECTED',
  confidenceOverall: number|null, // 0..1
  header: {
    supplier: { id?: string, name?: string, confidence?: number },
    invoiceNumber?: string,
    documentDate?: string, // ISO
    totalCents?: number,
    currency?: string
  },
  items: Array<{
    itemId: string, // ScannedDocumentItem.id
    productName: string,
    quantity: number|null,
    unit: string|null,
    unitPriceCents?: number|null,
    totalPriceCents?: number|null,
    match?: { productId?: string, name?: string, confidence?: number },
    state: 'AUTO_MATCHED'|'NEEDS_CONFIRM'|'NOT_MATCHED',
    warnings: string[] // e.g., ['UNIT_NORMALIZED', 'QTY_OUTLIER']
  }>
}
```

---

## Client-Side Validation Rules
- Product selection
  - Must be present for inclusion in apply payload
- Quantity
  - Required if included; > 0; < 10,000
  - Warn if > 1,000
- Unit
  - Normalize alias then compare with inventory item unit
  - If mismatch after normalization → block apply and mark row ❌
- Price
  - Optional
  - Warn if 0 unless explicitly marked free sample

---

## Server-Side Validation (on Apply)
- Re-check business ownership and document status (must be APPROVED or INTELLIGENCE_DONE depending on policy; set to APPROVED in UI before apply)
- For each included line:
  - Product exists and belongs to business
  - Quantity bounds (0 < qty < 10,000)
  - Unit normalization then exact match with inventory unit
- Idempotency
  - Reject second apply for same document (status already APPLIED)

---

## Interactions & UX
- Inline Editing
  - Quantity: numeric input
  - Unit: select with normalized choices
  - Product match: searchable dropdown of inventory items
- Bulk Actions
  - "Confirm all auto-matched"
  - "Skip all not matched"
- Keyboard
  - Arrow keys to move rows
  - Enter to confirm edit
- Mobile
  - One-line-per-screen swipe flow
  - Large touch targets
- Accessibility
  - Focus states, ARIA labels, semantic table

---

## Empty/Error States
- No items extracted
  - Message + link to re-upload
- Low confidence overall (< 0.6)
  - Banner: "Low-quality scan; please verify carefully"
- Duplicate receipt (server-detected)
  - Banner: "Already uploaded on <date>"

---

## Success Criteria
- Time from page load to apply ≤ 60s for 10-line receipt
- ≥ 60% lines arrive AUTO_MATCHED for well-named catalogs
- Zero unit-mismatch inventory corruptions (blocked by validation)

---

## Telemetry
- Events
  - receipt.review.opened, receipt.item.edited, receipt.item.skipped
  - receipt.apply.clicked, receipt.apply.succeeded, receipt.apply.failed
- Metrics
  - review_time_ms, items_auto_matched, items_confirmed, items_skipped

---

## Non-Goals (V1)
- Batch review of multiple receipts
- Inline inventory item creation
- Unit conversions (kg ↔ g) without user confirmation
