# OCR V1 Execution Contract

**Date**: 2026-06-25  
**Authority**: Chief Product Officer / Principal Systems Engineer / OCR Product Owner  
**Status**: **EXECUTION-READY**  
**Target**: Restaurant Pilot (5 restaurants)

---

## 1. Scope Lock

### IN SCOPE (Permitted)

| Category | Deliverable |
|----------|-------------|
| Upload | Single receipt upload (JPG, PNG, PDF) via `/dashboard/inventory/receipts/upload` |
| Extraction | OCR extraction of: supplier name, invoice number, date, product names, quantities, units, unit prices, totals |
| Supplier Recognition | Deterministic matching via SupplierAlias (exact + fuzzy); alias learning on confirmation |
| Product Matching | Deterministic matching via ProductAlias (exact + fuzzy); alias learning on confirmation |
| Human Review | Restaurant-facing review screen at `/dashboard/inventory/receipts/review/[id]` with document preview, line-item table, edit capability, product dropdown |
| Validation | Unit normalization + strict unit match; quantity bounds (0 < qty < 10,000); outlier warning (qty > 1,000) |
| Inventory Update | Add stock only; transactional; creates `InventoryUpdate` audit record per line |
| Idempotency | Duplicate upload detection (SHA-256 hash); apply idempotency (reject if already APPLIED) |
| Audit Trail | `InventoryUpdate` per applied line; `DocumentEventTimeline` per lifecycle transition |
| Document Preview | Secure signed URL or server-stream for receipt image/PDF in review screen |

### OUT OF SCOPE (Forbidden)

- Batch upload (multiple receipts at once)
- Automatic product creation
- Automatic supplier creation
- Unit conversion (kg to g, etc.) without user confirmation
- Price history ledgering beyond `unitCostCents` update
- GRN/PO reconciliation flows
- Negative inventory adjustments
- Forecasting, recommendations, autonomous ordering
- ML-based matching (only deterministic fuzzy allowed)
- Any feature not explicitly listed above

---

## 2. Release Goal

**OCR V1 successfully delivers:**

> A restaurant owner uploads a supplier receipt, reviews the AI-extracted line items in under 60 seconds, clicks Approve, and sees their inventory updated with a full audit trail — eliminating 80% of manual data entry.

---

## 3. P0 Blockers

### P0-1: PDF Extraction

**Current State**  
- Image receipts (JPG/PNG) extract correctly via OpenAI Vision or Azure DI.  
- PDF extraction via OpenAI provider returns empty fields/lines (stubbed).  
- Azure DI supports PDF but requires `AZURE_DI_ENDPOINT` + `AZURE_DI_KEY` configured.

**Target State**  
- PDF receipts extract successfully with at least one provider.  
- If Azure DI is unavailable, OpenAI PDF path must be implemented (rasterize pages → image extraction).

**Files Likely Impacted**  
- `src/lib/die/provider/openai.ts` (implement PDF handling)  
- `src/lib/die/provider/index.ts` (provider chain fallback logic)  
- Environment config (`.env.example`, deployment docs)

**Acceptance Criteria**  
- Upload a 1-page PDF receipt → extraction returns ≥1 header field and ≥1 line item.  
- Upload a 2-page PDF receipt → extraction returns fields from both pages.  
- If Azure DI is not configured, OpenAI fallback still extracts PDF.

**Risk if Unfinished**  
- **CRITICAL**: Restaurants commonly receive PDF invoices from suppliers. Failure to support PDF blocks a significant portion of real-world receipts.

---

### P0-2: Inventory Safety Layer

**Current State**  
- DIE apply endpoint (`/api/die/documents/[id]/apply`) increments `InventoryItem.currentStock`.  
- No unit validation (extracted unit vs inventory unit).  
- No quantity bounds enforcement.  
- No `InventoryUpdate` audit record created.

**Target State**  
- Apply validates: extracted unit (normalized) must match inventory item unit exactly.  
- Apply validates: 0 < quantity < 10,000; warn if > 1,000.  
- Apply creates `InventoryUpdate` record per applied line item (type: ADD, reason: "Receipt: <invoice#>", notes: "Supplier: <name>").  
- Apply is atomic: all-or-nothing transaction.

**Files Likely Impacted**  
- New: `src/pages/api/inventory/receipts/apply.ts` (wrapper endpoint)  
- New: `src/lib/services/unit-normalization.service.ts`  
- Modify: `src/lib/services/inventory.service.ts` (add receipt-triggered update method)  
- Modify: `src/pages/api/die/documents/[id]/apply.ts` (or delegate to new wrapper)

**Acceptance Criteria**  
- Unit mismatch → apply rejected with 400 error listing mismatched items.  
- Quantity ≤ 0 → apply rejected.  
- Quantity > 10,000 → apply rejected.  
- Quantity > 1,000 → warning flag returned (but apply allowed if user confirms).  
- After successful apply, `InventoryUpdate` records exist for each applied line.  
- After successful apply, `InventoryItem.currentStock` reflects added quantities.

**Risk if Unfinished**  
- **CRITICAL**: Inventory corruption (wrong units, impossible quantities) destroys trust and operational accuracy. This is the highest-risk blocker.

---

### P0-3: Receipt Preview

**Current State**  
- Review screen exists at `/dashboard/die/review/[id].tsx`.  
- Document preview shows placeholder (no actual image/PDF).  
- Storage service supports `getPrivateSignedUrl` but no API exposes it.

**Target State**  
- Review screen displays actual receipt image or PDF.  
- User can zoom and rotate preview.  
- Side-by-side layout: preview on left, extracted data on right.

**Files Likely Impacted**  
- New: `src/pages/api/die/documents/[id]/preview.ts` (returns signed URL or streams file)  
- Modify: `src/pages/dashboard/die/review/[id].tsx` (or new `/dashboard/inventory/receipts/review/[id].tsx`)  
- Modify: `src/lib/services/storage.service.ts` (ensure signed URL works for all supported types)

**Acceptance Criteria**  
- Upload JPG → preview displays image in review screen.  
- Upload PNG → preview displays image in review screen.  
- Upload PDF → preview displays PDF (embedded viewer or first-page image).  
- Zoom controls work (50%–200%).  
- Rotate controls work (0/90/180/270).

**Risk if Unfinished**  
- **HIGH**: Without preview, users cannot verify extraction against the original document. Trust is destroyed; adoption fails.

---

### P0-4: Redis / Worker Readiness

**Current State**  
- Workers require `REDIS_URL` environment variable.  
- BullMQ queues (`die_extract`, `die_intelligence`) are configured with retries and DLQ.  
- Worker startup throws if Redis is not configured.

**Target State**  
- Redis (Upstash or equivalent) is provisioned and accessible from production environment.  
- Workers start successfully and process jobs.  
- DLQ alerts are delivered on permanent failure.

**Files Likely Impacted**  
- Environment config (`.env`, deployment secrets)  
- `src/lib/die/orchestrator/worker-start.ts` (already implemented; verify deployment)  
- `src/lib/services/alert-delivery.service.ts` (DLQ alerts)

**Acceptance Criteria**  
- Worker process starts without error when `REDIS_URL` is set.  
- Upload a receipt → extraction job completes within 30 seconds.  
- Simulate provider failure → job retries 3 times → moves to DLQ → alert delivered.

**Risk if Unfinished**  
- **CRITICAL**: Without Redis, no extraction or intelligence processing occurs. OCR is completely non-functional.

---

## 4. Build Order

**Strict implementation sequence. No parallel planning. No future roadmap.**

### Step 1: Environment & Infrastructure Validation (0.5 days)

1. Confirm Redis (Upstash) is provisioned and `REDIS_URL` is set in production environment.
2. Confirm storage credentials (`SUPABASE_STORAGE_URL`, `SUPABASE_STORAGE_KEY`, `SUPABASE_STORAGE_PRIV_BUCKET`) are set.
3. Confirm at least one OCR provider is configured:
   - Azure DI: `AZURE_DI_ENDPOINT` + `AZURE_DI_KEY`, OR
   - OpenAI: `OPENAI_API_KEY`
4. Start workers locally; verify they connect to Redis and Prisma.
5. Upload a test JPG receipt; verify extraction completes.

**Exit Criteria**: Workers run, extraction succeeds for JPG.

---

### Step 2: PDF Extraction (1.5 days)

1. If Azure DI is configured and working for PDF → mark PDF support as Azure-dependent and document this.
2. If Azure DI is NOT available or unreliable:
   - Implement OpenAI PDF handling in `src/lib/die/provider/openai.ts`:
     - Use `pdf-lib` or `pdf2pic` to rasterize PDF pages to images.
     - Send each page image to OpenAI Vision.
     - Merge extracted fields/lines from all pages.
3. Test: Upload 1-page PDF → extraction returns fields.
4. Test: Upload 2-page PDF → extraction returns fields from both pages.

**Exit Criteria**: PDF extraction works with at least one provider.

---

### Step 3: Unit Normalization Service (1 day)

1. Create `src/lib/services/unit-normalization.service.ts`:
   - Build alias table: `kgs` → `kg`, `kilogram` → `kg`, `litre` → `l`, `liter` → `l`, `pieces` → `pcs`, etc. (30+ common aliases).
   - Implement `normalizeUnit(raw: string): string` function.
   - Implement `unitsMatch(extractedUnit: string, inventoryUnit: string): boolean` function.
2. Write unit tests for normalization.
3. Integrate into intelligence worker (normalize extracted unit before storing in `ScannedDocumentItem.unit`).

**Exit Criteria**: Unit normalization covers 95% of common units; `unitsMatch` returns correct results.

---

### Step 4: Inventory Safety Layer (1.5 days)

1. Create `src/pages/api/inventory/receipts/apply.ts`:
   - Accept `{ documentId, items: [{ itemId, productId, quantity, unit }] }`.
   - Validate business ownership.
   - Validate document status (not already APPLIED).
   - For each item:
     - Validate `productId` exists and belongs to business.
     - Validate quantity: `0 < qty < 10,000`.
     - Normalize unit and validate: `unitsMatch(extractedUnit, inventoryItem.unit)`.
     - If any validation fails → reject entire request with 400 and per-item errors.
   - If all validations pass:
     - Begin transaction.
     - For each item: increment `InventoryItem.currentStock`, create `InventoryUpdate` record.
     - Update `ScannedDocument.status` to APPLIED, `lifecycleState` to APPLIED.
     - Create `DocumentEventTimeline` entry.
     - Commit transaction.
   - Return success with updated stock levels.
2. Write integration tests for validation and apply.

**Exit Criteria**: Apply rejects invalid data; apply creates audit records; inventory updates correctly.

---

### Step 5: Document Preview API (0.5 days)

1. Create `src/pages/api/die/documents/[id]/preview.ts`:
   - Validate business ownership.
   - Retrieve `ScanJob.sourceFileKey`.
   - Call `StorageService.getPrivateSignedUrl(sourceFileKey, 600)`.
   - Return `{ url: signedUrl, mimeType: sourceMime }`.
2. Test: Request preview for uploaded JPG → returns valid signed URL.
3. Test: Request preview for uploaded PDF → returns valid signed URL.

**Exit Criteria**: Preview API returns working signed URLs for all supported file types.

---

### Step 6: Restaurant Review UI (2 days)

1. Create `/dashboard/inventory/receipts/upload` page:
   - Drag-and-drop or file picker.
   - File type validation (JPG, PNG, PDF).
   - File size validation (< 25MB).
   - Upload to `/api/die/upload` with `documentType: 'SUPPLIER_INVOICE'`.
   - Show progress: Uploading → Processing → Ready.
   - On ready, redirect to review page.

2. Create `/dashboard/inventory/receipts/review/[id]` page:
   - Fetch document via `/api/die/documents/[id]`.
   - Fetch preview via `/api/die/documents/[id]/preview`.
   - Left column: document preview with zoom/rotate.
   - Right column: header summary (supplier, invoice#, date, total) + line items table.
   - Line items table columns: #, Product (from receipt), Qty, Unit, Price, Total, Inventory Match (dropdown), State (auto/confirm/unmatched).
   - Inline editing for quantity, unit, product match.
   - Footer: summary counts + "Add to Inventory" button.
   - On apply: POST to `/api/inventory/receipts/apply`.
   - Show confirmation modal with before/after stock levels.
   - Show success toast on completion.

3. Mobile-responsive layout.

**Exit Criteria**: Upload → Review → Apply flow works end-to-end on desktop and mobile.

---

### Step 7: QA & Hardening (0.5 days)

1. Test with 5 real receipts (mix of JPG, PNG, PDF).
2. Test edge cases: duplicate upload, unit mismatch, quantity outlier, low confidence.
3. Test mobile flow.
4. Fix any bugs found.
5. Verify demo script works.

**Exit Criteria**: All acceptance tests pass; demo script completes successfully.

---

## 5. Acceptance Tests

### Test 1: Upload JPG Receipt

| Attribute | Value |
|-----------|-------|
| **Precondition** | Restaurant has inventory items created |
| **Action** | Upload a JPG receipt image |
| **Expected Behavior** | File uploads, extraction completes within 30s, review page shows extracted data |
| **Pass Criteria** | Status transitions: UPLOADED → EXTRACTED → INTELLIGENCE_DONE → REVIEW_REQUIRED; at least 1 header field and 1 line item extracted |
| **Fail Criteria** | Upload fails, extraction times out, or no data extracted |

---

### Test 2: Upload PDF Receipt

| Attribute | Value |
|-----------|-------|
| **Precondition** | At least one OCR provider supports PDF |
| **Action** | Upload a 1-page PDF receipt |
| **Expected Behavior** | File uploads, extraction completes, review page shows extracted data |
| **Pass Criteria** | At least 1 header field and 1 line item extracted from PDF |
| **Fail Criteria** | Extraction returns empty fields/lines |

---

### Test 3: Low-Confidence Extraction

| Attribute | Value |
|-----------|-------|
| **Precondition** | Upload a blurry or low-quality receipt image |
| **Action** | Complete extraction |
| **Expected Behavior** | Extraction completes with low confidence scores; review screen shows warning banner |
| **Pass Criteria** | `confidenceOverall < 0.6` triggers "Low-quality scan" banner; user can still review and edit |
| **Fail Criteria** | No warning shown; user proceeds without awareness of quality issue |

---

### Test 4: Unit Mismatch

| Attribute | Value |
|-----------|-------|
| **Precondition** | Inventory item "Tomatoes" has unit "kg"; receipt shows "5 liters" |
| **Action** | Attempt to apply receipt |
| **Expected Behavior** | Apply rejected with 400 error; error message identifies unit mismatch |
| **Pass Criteria** | Response includes `{ error: "Unit mismatch", items: [{ itemId, extractedUnit: "l", inventoryUnit: "kg" }] }` |
| **Fail Criteria** | Apply succeeds; inventory corrupted with wrong unit |

---

### Test 5: Quantity Outlier

| Attribute | Value |
|-----------|-------|
| **Precondition** | Receipt shows quantity 1,500 kg |
| **Action** | Review extraction |
| **Expected Behavior** | Warning flag shown: "Large quantity detected"; user can confirm or edit |
| **Pass Criteria** | Warning visible; apply allowed after user confirmation |
| **Fail Criteria** | No warning shown; or apply blocked without option to confirm |

---

### Test 6: Quantity Bounds Violation

| Attribute | Value |
|-----------|-------|
| **Precondition** | Receipt shows quantity 15,000 kg (exceeds 10,000 limit) |
| **Action** | Attempt to apply receipt |
| **Expected Behavior** | Apply rejected with 400 error |
| **Pass Criteria** | Response includes `{ error: "Quantity exceeds maximum", items: [{ itemId, quantity: 15000, max: 10000 }] }` |
| **Fail Criteria** | Apply succeeds with invalid quantity |

---

### Test 7: Duplicate Receipt

| Attribute | Value |
|-----------|-------|
| **Precondition** | Receipt already uploaded (same file hash) |
| **Action** | Upload same receipt again |
| **Expected Behavior** | Upload returns existing document ID; no duplicate created |
| **Pass Criteria** | Response: `{ scanJobId: <existing>, scannedDocumentId: <existing>, status: <current> }` |
| **Fail Criteria** | Duplicate ScanJob created |

---

### Test 8: Approval Workflow

| Attribute | Value |
|-----------|-------|
| **Precondition** | Document in REVIEW_REQUIRED state |
| **Action** | Click "Add to Inventory" |
| **Expected Behavior** | Confirmation modal shows; on confirm, apply succeeds; document status becomes APPLIED |
| **Pass Criteria** | `lifecycleState` = APPLIED; `DocumentEventTimeline` entry created with stage "application" |
| **Fail Criteria** | Apply fails; or status not updated |

---

### Test 9: Inventory Update

| Attribute | Value |
|-----------|-------|
| **Precondition** | Inventory item "Tomatoes" has currentStock = 50 kg |
| **Action** | Apply receipt with Tomatoes +10 kg |
| **Expected Behavior** | currentStock becomes 60 kg |
| **Pass Criteria** | `InventoryItem.currentStock` = 60; `InventoryUpdate` record exists with type "ADD", quantity 10 |
| **Fail Criteria** | Stock not updated; or no audit record |

---

### Test 10: Audit Trail Verification

| Attribute | Value |
|-----------|-------|
| **Precondition** | Receipt applied successfully |
| **Action** | Query `InventoryUpdate` and `DocumentEventTimeline` |
| **Expected Behavior** | Audit records exist for all applied items and lifecycle transitions |
| **Pass Criteria** | `InventoryUpdate` count = number of applied line items; `DocumentEventTimeline` includes APPLIED event |
| **Fail Criteria** | Missing audit records |

---

### Test 11: Worker Retry & DLQ

| Attribute | Value |
|-----------|-------|
| **Precondition** | OCR provider returns error |
| **Action** | Upload receipt; provider fails 3 times |
| **Expected Behavior** | Job retries 3 times; moves to DLQ; alert delivered |
| **Pass Criteria** | Job in `die_extract_dlq`; alert sent via `AlertDeliveryService` |
| **Fail Criteria** | Job stuck; no DLQ entry; no alert |

---

## 6. Release Gate

### OCR V1 CANNOT Launch If:

- PDF extraction fails for all providers (no PDF support)
- Unit validation is not enforced (inventory corruption risk)
- `InventoryUpdate` records are not created on apply (no audit trail)
- Document preview does not display actual receipt (trust failure)
- Redis is not provisioned (workers cannot run)
- Any acceptance test fails

### OCR V1 MAY Launch When:

- All 4 P0 blockers are resolved
- All 11 acceptance tests pass
- Demo script completes successfully in under 90 seconds
- At least one OCR provider (Azure DI or OpenAI with PDF support) is configured and working
- Redis is provisioned and workers are running
- 5 real receipts have been tested successfully

---

## 7. Demo Validation Script

**Duration**: 2 minutes  
**Objective**: Create the strongest possible "wow" moment for restaurant pilot customers.

### Setup (Before Demo)

1. Create restaurant account via Setup Wizard.
2. Create 8 inventory items:
   - Tomatoes (kg)
   - Onions (kg)
   - Rice (kg)
   - Cooking Oil (l)
   - Coca-Cola 500ml (pcs)
   - Chicken (kg)
   - Flour (kg)
   - Sugar (kg)
3. Create 1 supplier: "Fresh Produce Ltd"
4. Have a sample receipt ready (PDF or photo) containing 5-6 of the above items.

### Demo Flow

**0:00 - 0:10 | Introduction**

> "Let me show you how ImboniServe eliminates manual inventory entry."

**0:10 - 0:25 | Upload**

1. Navigate to Inventory → Upload Receipt.
2. Drag and drop the sample receipt.
3. Show progress: "Uploading... Extracting... Analyzing..."

> "Just drop your supplier receipt — we handle the rest."

**0:25 - 0:50 | Review**

1. Review screen opens automatically.
2. Point to document preview on left.
3. Point to extracted data on right.
4. Highlight auto-matched items (green checkmarks).
5. Show one item that needs confirmation (yellow).
6. Select the correct product from dropdown.

> "Our AI reads every line. Green means auto-matched. Yellow means please confirm. You're always in control."

**0:50 - 1:10 | Approve**

1. Click "Add to Inventory".
2. Confirmation modal appears showing before/after stock levels.
3. Click "Confirm".
4. Success toast: "Inventory updated! 6 items added."

> "One click. Done. No typing. No mistakes."

**1:10 - 1:30 | Verify**

1. Navigate to Inventory dashboard.
2. Show updated stock levels for Tomatoes, Onions, etc.
3. Click into one item; show the InventoryUpdate record.

> "Every change is tracked. Full audit trail. Always know what came in and when."

**1:30 - 1:50 | Differentiation**

> "Most POS systems make you type every line. We read the receipt for you. Even if the names aren't exact, we learn your supplier's naming over time. No risk — you always approve before anything changes."

**1:50 - 2:00 | Close**

> "That's receipt to inventory in under a minute. Want to try it with your own receipts?"

### Demo Success Criteria

- Total time: < 90 seconds (excluding setup)
- Auto-match rate: ≥ 60% of line items
- Zero errors during demo
- Visible "wow" reaction from viewer

---

## 8. Signatures

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Chief Product Officer | | | |
| Principal Systems Engineer | | | |
| OCR Product Owner | | | |
| Deployment Readiness Gatekeeper | | | |

---

**END OF EXECUTION CONTRACT**
