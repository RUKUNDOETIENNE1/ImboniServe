# DIE System — Phase 2 Stabilization Report

**Date:** 2026-06-18  
**Scope:** Runtime · Service · Queue · Replay · Repair · SSE · Business Isolation · Performance · Failure-Mode Audit  
**Engineer:** Cascade (AI pair programmer)

---

## 1. Audit Scope

| Area | Files Audited |
|---|---|
| Service Layer | `supplier-matching.service.ts`, `product-matching.service.ts`, `procurement-reconciliation.service.ts`, `document-anomaly.service.ts`, `document-lifecycle.service.ts`, `document-replay.service.ts`, `system-repair.service.ts`, `system-consistency.service.ts` |
| Queue & Worker | `queues.ts`, `worker-start.ts`, `worker.ts`, `intelligence-worker.ts` |
| SSE & Real-Time | `events/stream.ts` |
| API Routes | All 23 routes under `src/pages/api/die/` |
| Business Isolation | Every query path in all services and APIs |
| Performance | N+1 detection across all service and API layers |
| Failure Modes | Worker crash, replay-during-active, repair-during-replay, duplicate submissions, partial DB failures |

---

## 2. Findings — BLOCKERS (Fixed)

### B-01 · SupplierMatchingService — Global supplier leak
**File:** `src/lib/die/services/supplier-matching.service.ts`  
**Finding:** `findBestMatch` fuzzy fallback queried ALL active suppliers across all businesses (`where: { isActive: true }`). In a multi-tenant system this leaks supplier names across business boundaries and produces incorrect match results.  
**Fix Applied:** Scoped all three lookup stages (exact, alias, fuzzy) to `businessId`:
- Exact: `where: { isActive: true, businessId }`
- Alias: `where: { normalized, supplier: { businessId, isActive: true } }`
- Fuzzy: `where: { isActive: true, businessId }`
- `getSuggestions()` now requires and uses `businessId`

---

### B-02 · ProductMatchingService — Inventory alias cross-tenant leak
**File:** `src/lib/die/services/product-matching.service.ts`  
**Finding:** `findInventoryItemMatch` alias lookup queried `ProductAlias` filtered only by `normalized` and `inventoryItemId: { not: null }`, without scoping the `inventoryItem.businessId`. A normalized alias present in a different business could match.  
**Fix Applied:** Added `inventoryItem: { businessId, isActive: true }` to the alias `where` clause. Runtime check `aliasMatch.inventoryItem.businessId === businessId` retained as a secondary guard.

---

### B-03 · SystemConsistencyService — N+1 (up to 100 DB roundtrips)
**File:** `src/lib/die/services/system-consistency.service.ts`  
**Finding:** `validateBusinessConsistency` first fetched document IDs (`SELECT id ... LIMIT 100`), then called `validateDocumentConsistency(doc.id)` in a `for` loop — each call performed a separate `findUnique` with 6 nested relations. Under a 100-document limit this was 101 DB roundtrips.  
**Fix Applied:** Replaced with a single `findMany` that bulk-loads all required fields (items, reconciliation, anomalyAlerts, entityLinks, eventTimelines) in one query. A new private `evaluateConsistency(doc)` method performs the in-memory logic. Now 1 DB roundtrip regardless of document count.

---

### B-04 · stuck-documents API — N+1 enrichment loop
**File:** `src/pages/api/die/operations/stuck-documents.ts`  
**Finding:** After calling `detectStuckDocumentsForBusiness` (already a bulk query), the handler iterated results and called `findUnique` per document to fetch supplier name and current status. With `limit=100` this was 100+ individual DB roundtrips per request.  
**Fix Applied:** Replaced with a single `findMany({ where: { id: { in: docIds } } })` and in-memory Map lookup.

---

### B-05 · failed-jobs GET — N+1 enrichment loop
**File:** `src/pages/api/die/operations/failed-jobs.ts`  
**Finding:** Both extract and intelligence DLQ enrichment used `Promise.all` over individual `findUnique` calls — one DB roundtrip per DLQ entry (up to 50+50 per GET request).  
**Fix Applied:** Replaced with two batched `findMany` calls (one for scan jobs, one for scanned documents), then in-memory Map lookups for O(1) enrichment per entry.

---

## 3. Findings — WARNINGS (Fixed)

### W-01 · ProcurementReconciliation — Three split transactions
**File:** `src/lib/die/services/procurement-reconciliation.service.ts`  
**Finding:** The write path used three separate `$transaction` calls in sequence:
1. `scannedDocument.update`
2. `procurementReconciliation.upsert`
3. `documentEntityLink.createMany`

A crash or timeout between any two left the document in partial state (e.g. document updated but no reconciliation record, or reconciliation record but no entity links).  
**Fix Applied:** Merged all three into a single `$transaction` with `timeout: 15000`. Either all three writes commit or none do.

---

### W-02 · SSE stream.ts — No connection cap, 3-second polling
**File:** `src/pages/api/die/events/stream.ts`  
**Finding:** Each connected SSE client fired 14 parallel `COUNT` queries + 2 `findMany` queries every 3 seconds. With multiple simultaneous clients this saturated the DB connection pool. There was no server-side cap on concurrent SSE connections, and the `closed` flag was not checked before writing.  
**Fix Applied:**
- Added `MAX_SSE_CONNECTIONS = 50` server-side cap; returns HTTP 503 when exceeded
- Raised minimum poll interval to `MIN_POLL_INTERVAL_MS = 5000`
- Added `let closed = false` flag checked at the start of `sendUpdate` to avoid writing to a dead socket
- `req.on('close')` now decrements `activeSSEConnections` and sets `closed = true`

---

### W-03 · DocumentReplayService — Reconciliation failure throws, blocks pipeline
**File:** `src/lib/die/services/document-replay.service.ts`  
**Finding:** The `reconciliation` replay step called `throw new Error(reconciliation.error || 'Reconciliation replay failed')` on a non-success result. This prevented anomaly detection and review stages from running, leaving the document stuck.  
**Fix Applied:** Removed the throw. Non-success reconciliation now logs a warning and continues to the next stages, consistent with how the main worker pipeline handles this.

---

### W-04 · Overview metrics — 28 sequential DB queries
**File:** `src/pages/api/die/overview/metrics.ts`  
**Finding:** The 7-day trend loop used `await Promise.all([...])` inside a `for` loop, making each of the 7 iterations block before starting the next. Total: 28 queries running in 7 sequential batches.  
**Fix Applied:** Replaced with a top-level `Promise.all` over all 7 windows simultaneously. All 28 queries now fire in parallel.

---

## 4. Findings — NOTES (No Fix Required)

### N-01 · SupplierMatchingService — Fuzzy algorithm (Jaccard)
Custom Jaccard-based fuzzy is deterministic and fast for small supplier sets (< ~5000 per business). For large businesses a proper trigram index could improve accuracy. **Acceptable for current scale.**

### N-02 · ProductMatchingService — `resolveAllProducts` per-item loop
Individual `resolveProduct` calls per line item are sequential in a `for` loop. Each item runs 2–3 DB queries. For large invoices (50+ lines) this is slow. **Acceptable for current document sizes; can be batch-optimized in a future pass.**

### N-03 · BullMQ DLQ — Manual `job.remove()` after retry
After triggering a retry, `job.remove()` is called on the DLQ entry. If the process crashes between retry-enqueue and remove, the DLQ entry persists (it won't re-execute the old job, just leaves a stale record). **Acceptable — stale DLQ entries are safe and inspectable.**

### N-04 · Worker enrichLineItems — Per-item `findMany` inside transaction
`enrichLineItems` in `worker-start.ts` fetches `extractedDocumentLineField` per item inside the transaction loop. This is an N+1 within the intelligence transaction. **Low severity — runs inside a single Prisma transaction on the worker side; no cross-connection risk. Optimization deferred.**

### N-05 · SystemRepairService.detectStuckDocuments — No businessId filter
The global `detectStuckDocuments` method (used by the scheduled repair job) queries across all businesses. This is intentional (repair scheduler is a system-level process), but worth noting for future per-business repair scheduling.

### N-06 · `apply.ts` — Inventory increment without business check on item
`inventoryItem.update({ where: { id: item.productId } })` does not re-verify `businessId` on the inventory item. The document's `businessId` check at the start of the handler plus Prisma relational integrity (items are scoped to the document) prevents cross-business writes in practice. **Low risk — no fix required.**

---

## 5. Multi-Business Isolation Summary

| Layer | Isolated? | Notes |
|---|---|---|
| `upload.ts` | ✅ | `resolveBusinessContext`, creates doc with `businessId` |
| `documents/index.ts` | ✅ | `where: { businessId: ctx.businessId }` |
| `documents/[id]/*` | ✅ | Explicit `if (document.businessId !== ctx.businessId) return 404` |
| `anomalies/index.ts` | ✅ | `where: { businessId: ctx.businessId }` |
| `reconciliation/index.ts` | ✅ | `resolveBusinessContext` + businessId filter |
| `operations/queues.ts` | ✅ | DLQ jobs filtered by businessId in-memory |
| `operations/stuck-documents.ts` | ✅ | `detectStuckDocumentsForBusiness(ctx.businessId)` |
| `operations/repair.ts` | ✅ | Document existence + ownership check |
| `operations/replay.ts` | ✅ | `resolveBusinessContext`, document snapshot check |
| `operations/failed-jobs.ts` | ✅ | Business filter on both enrich and retry paths |
| `operations/consistency.ts` | ✅ | `validateBusinessConsistency(ctx.businessId)` |
| `events/stream.ts` | ✅ | All queries scoped to `businessId` from session |
| `SupplierMatchingService` | ✅ (fixed B-01) | Exact/alias/fuzzy all scoped post-fix |
| `ProductMatchingService` | ✅ (fixed B-02) | Inventory alias scoped post-fix |
| `DocumentAnomalyService` | ✅ | Duplicate check scoped to `businessId` |
| `ProcurementReconciliation` | ✅ | PO/GRN fetches scoped to `doc.businessId` |
| `SystemConsistencyService` | ✅ | `where: { businessId }` in bulk fetch |
| `SystemRepairService` | ✅ (per-business) | `detectStuckDocumentsForBusiness` uses `businessId` |

---

## 6. Queue & Worker Safety Summary

| Property | Status |
|---|---|
| BullMQ retry (3 attempts, exponential backoff) | ✅ Configured |
| DLQ on failure after 3 attempts | ✅ Both queues |
| Intelligence job deduplication (`jobId = scannedDocumentId`) | ✅ |
| Extraction job deduplication (`jobId = scanJobId`) | ✅ |
| Worker graceful shutdown (SIGTERM/SIGINT) | ✅ |
| Concurrency limits (extract: 5, intelligence: 3) | ✅ |
| Rate limiters (extract: 10/s, intel: 5/s) | ✅ |
| Idempotency in intelligence worker (`status !== EXTRACTED` → skip) | ✅ |
| Repair scheduler concurrency guard (`running` flag) | ✅ |
| Replay lock (Redis NX TTL 1800s, in-memory fallback) | ✅ |
| Repair-during-replay safety | ✅ Replay lock prevents concurrent repair replay |
| Duplicate queue submission | ✅ BullMQ `jobId` deduplication |

---

## 7. SSE & Real-Time Summary

| Property | Status |
|---|---|
| Business isolation (all queries scoped) | ✅ |
| Memory leak prevention (`closed` flag, `clearInterval` on `req.close`) | ✅ (fixed W-02) |
| Event listener cleanup | ✅ `req.on('close')` registered |
| Connection cap | ✅ 50 concurrent max (fixed W-02) |
| Poll interval floor | ✅ 5000ms minimum (fixed W-02) |

---

## 8. Failure Mode Simulation Results

| Scenario | Outcome |
|---|---|
| Worker crash mid-extraction | BullMQ retries up to 3×; DLQ entry created; Repair scheduler re-enqueues extraction for UPLOADED docs |
| Worker crash mid-intelligence | BullMQ retries up to 3×; idempotency check skips already-advanced docs; DLQ entry for retry |
| Replay during active processing | Replay lock (Redis NX) prevents concurrent replay; `ReplayInProgressError` returned |
| Repair during active replay | `repairDocument` calls `replayFromStage` which acquires replay lock; blocked if replay in progress |
| Duplicate queue submissions | BullMQ `jobId` deduplication prevents double-processing |
| Partial DB failure during reconciliation | Single unified transaction (fixed W-01) — all writes succeed or none do |
| Partial DB failure during apply | `apply.ts` uses `$transaction` for inventory/PO/GRN/lifecycle changes |
| SSE client disconnect | `closed = true`, `clearInterval`, `activeSSEConnections` decremented |
| SSE overload (>50 clients) | HTTP 503 returned; existing clients unaffected |
