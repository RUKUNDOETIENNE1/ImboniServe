# OCR V1 Implementation Readiness Audit

**Repo**: ImboniResto (ImboniServe)

**Date**: 2026-06-25

**Role**: Principal Engineer / Staff Backend Architect / Release Readiness Reviewer

**Purpose**: Validate OCR V1 implementation feasibility **against the current codebase** (build-readiness audit). This is **not** a product review and does **not** change approved scope.

**Approved inputs** (already present in workspace):
- OCR_V1_PRODUCTION_DESIGN.md
- OCR_V1_DATA_FLOW.md
- OCR_V1_REVIEW_SCREEN_SPEC.md
- OCR_V1_INVENTORY_INTEGRATION_SPEC.md
- OCR_V1_SUPPLIER_MEMORY_DESIGN.md
- OCR_V1_DEMO_WOW_VALIDATION.md
- OCR_V1_RISK_ASSESSMENT.md
- OCR_V1_BUILD_ESTIMATE.md

---

## 1) Component Readiness Matrix

Legend:
- **READY**: Implementable immediately using existing infrastructure as-is.
- **PARTIAL**: Exists but requires modification or a wrapper layer.
- **MISSING**: Must be created.

| Component | Status | Evidence (repo reality) | Notes / What’s required (within V1 scope) |
|---|---:|---|---|
| Invoice upload pipeline | **READY** | `src/pages/api/die/upload.ts` implements multipart upload, SHA-256 dedupe, ScanJob + ScannedDocument creation, enqueue extract queue. | Upload supports `image/jpeg`, `image/png`, `image/webp`, `application/pdf`. |
| OCR service (providers) | **PARTIAL** | Provider chain exists: `src/lib/die/provider/index.ts`, `src/lib/die/provider/azure.ts`, `src/lib/die/provider/openai.ts`. | **P0**: OpenAI provider returns an empty placeholder for PDFs (no extraction). PDF support is therefore **dependent on Azure DI being configured**, or OpenAI PDF handling must be implemented. Also OpenAI extraction accepts empty JSON without enforcing “usable extraction”. |
| Document storage | **PARTIAL** | `src/lib/services/storage.service.ts` supports `uploadPrivateDocument` + `downloadPrivate` + `getPrivateSignedUrl`. | Storage exists, but there is **no API endpoint** that returns a signed URL or streams the private document for preview. Current DIE review UI shows a placeholder, not the real document preview. |
| Extraction pipeline | **READY** | BullMQ queue + worker exists: `src/lib/die/queue/queues.ts`, `src/lib/die/orchestrator/worker-start.ts` (and `worker.ts`). Extract writes ExtractionPayload + ExtractedDocument* tables + ScannedDocumentItem placeholders. | End-to-end extraction + intelligence queues are implemented with retries + DLQ support. |
| Supplier matching | **READY** | `src/lib/die/services/supplier-matching.service.ts` + `SupplierAlias` model in `prisma/schema.prisma`. Integrated in `worker-start.ts` Stage 5. | Deterministic exact/alias/fuzzy matching + alias learning already present (business-scoped). |
| Product matching | **READY** | `src/lib/die/services/product-matching.service.ts` + `ProductAlias` model in `prisma/schema.prisma`. Integrated in `worker-start.ts` Stage 6. | Deterministic exact/alias/fuzzy matching + alias learning already present (business-scoped). |
| Human review workflow | **PARTIAL** | Backend lifecycle endpoints exist: `src/pages/api/die/documents/[id]/index.ts`, `/approve.ts`, `/reject.ts`, `/apply.ts`. Existing UI: `src/pages/dashboard/die/review/[id].tsx` (workbench). | Restaurant-facing routes in spec (`/dashboard/inventory/receipts/*`) are **MISSING**. Existing DIE review page is **read-only for line items** and does not implement the V1 restaurant editing/selection workflow. Document preview is currently a placeholder. |
| Inventory update workflow | **PARTIAL** | Existing apply endpoint: `src/pages/api/die/documents/[id]/apply.ts` increments `InventoryItem.currentStock`. Inventory audit pathway exists separately: `src/lib/services/inventory.service.ts` + `src/pages/api/inventory/updates.ts` create `InventoryUpdate`. | **P0**: DIE apply does **not** create `InventoryUpdate` records and does **not** enforce OCR V1 guardrails (unit normalization, strict unit match, quantity bounds). V1 needs an apply wrapper (or modify existing apply) that uses InventoryService-like audit and validations. |
| Duplicate invoice protection | **READY** | Upload dedupe check in `src/pages/api/die/upload.ts`. DB uniqueness: `ScanJob @@unique([sourceHash, businessId])` in `prisma/schema.prisma`. | Duplicate detection is enforced at API and DB levels for the uploaded source file hash per business. |
| Audit logging | **PARTIAL** | Document audit trail exists: `DocumentEventTimeline` + `DocumentProcessingLog` created in upload + workers + lifecycle transitions (`src/lib/die/services/document-lifecycle.service.ts`). Inventory audit exists via `InventoryUpdate` (see above). | **P0**: Receipt apply path must create InventoryUpdate per line item to meet V1 “full audit trail” guardrail. |
| Error handling | **PARTIAL** | Workers have retries + DLQ (`queues.ts`, `worker-start.ts`). Upload has try/catch. Provider chain fallback exists. | **P0/P1** risk: OpenAI PDF is stubbed; OpenAI can also produce empty/invalid JSON without forcing a “fail → fallback”. For production readiness, extraction should fail fast if unusable. |

---

## 2) Build Blockers (P0 / P1 / P2)

### P0 — Critical blockers (must be resolved/locked before implementation can be considered executable)

1) **PDF extraction is not implemented for OpenAI provider**
   - Reality: `src/lib/die/provider/openai.ts` returns empty `fields`/`lines` for PDFs.
   - Impact: OCR V1’s “PDF supported” claim is only true if **Azure DI is configured and healthy**.
   - Resolution required: Either (a) lock **Azure DI as required dependency for PDF**, or (b) implement PDF handling for OpenAI (e.g., rasterize pages → image extraction) so OpenAI can support PDFs.

2) **Receipt apply path does not meet V1 guardrails (audit + validation)**
   - Reality: `src/pages/api/die/documents/[id]/apply.ts` increments stock but does **not** create `InventoryUpdate` and does **not** validate units/quantity bounds.
   - Impact: Violates approved V1 “Prevent corruption + full audit trail” requirements.
   - Resolution required: Implement V1 apply wrapper (`POST /api/inventory/receipts/apply`) or update apply logic to:
     - enforce quantity bounds
     - normalize units and strict-match to inventory unit
     - record `InventoryUpdate` entries per applied line (atomic transaction)
     - keep document idempotency (`APPLIED` guard) and lifecycle event timeline.

3) **Document preview delivery for review UI is not implemented**
   - Reality: storage supports private docs, but no API serves a signed URL/stream; current DIE UI shows placeholder preview.
   - Impact: Approved review spec requires preview (image/PDF) for human verification.
   - Resolution required: add a minimal API to retrieve a signed URL (Supabase) or securely stream the private file.

4) **Worker runtime hard dependency: REDIS_URL**
   - Reality: workers and queues throw at startup if `REDIS_URL` is not set (`src/lib/die/queue/queues.ts`, `worker-start.ts`).
   - Impact: Without Redis, extraction/intelligence will not run.
   - Resolution required: confirm environment has Redis (Upstash) configured for the pilot.

### P1 — High-risk assumptions (not necessarily blockers, but must be explicitly acknowledged + tested)

1) **OpenAI extraction output schema is weakly constrained**
   - Reality: OpenAI system prompt is minimal; field naming may vary.
   - Impact: Supplier matching stage relies on presence of header field names like `supplier/vendor/...` in ExtractedDocumentHeaderField, which may not appear consistently.
   - Mitigation: tighten the OpenAI prompt to return a stable schema/field names OR add a normalization pass before supplier matching.

2) **Review state timing edge**
   - Reality: backend approval requires lifecycle `REVIEW_REQUIRED`/`ANALYZED`, but UI logic may allow approve during `INTELLIGENCE_DONE` (transient).
   - Impact: occasional 409 “Cannot approve …” if UI fetches during the brief intermediate state.
   - Mitigation: restaurant review UI should gate actions on `lifecycleState` (or poll until `REVIEW_REQUIRED`).

3) **Storage environment assumptions**
   - Reality: `StorageService.getPrivateSignedUrl` returns `''` when Supabase is not configured.
   - Impact: preview can silently fail in dev/staging if env is incomplete.
   - Mitigation: ensure pilot env has Supabase creds or implement a secure server-stream fallback.

### P2 — Nice-to-have / optional hardening

1) **Applied fingerprint table**
   - Spec mentions optional `AppliedFingerprint` uniqueness guard. Current lifecycle idempotency is already present (`APPLIED` short-circuit).
   - Treat as optional unless retries/duplicate POSTs are a known issue.

2) **Repo hygiene / release stability risk**
   - Current working tree contains many modified files and many untracked docs; this can complicate a clean OCR V1 release branch.
   - Not a product blocker, but a release readiness concern.

---

## 3) Missing Pieces (concrete, scope-aligned)

**Backend (API) — missing endpoints for restaurant layer**
- `GET /api/inventory/receipts/[id]` (transform from DIE doc shape to restaurant-friendly contract)
- `GET /api/inventory/receipts` (if required by the approved plan; production design lists it)
- `POST /api/inventory/receipts/apply` (wrapper implementing validations + InventoryUpdate audit + lifecycle transition)
- Document preview access endpoint (signed URL or streaming) for the review screen

**Frontend — missing routes**
- `/dashboard/inventory/receipts/upload`
- `/dashboard/inventory/receipts/review/[id]`

**Services / logic — missing**
- Unit normalization + strict validation service (critical V1 guardrail)

**Schema changes**
- None required for core OCR V1 data flow: ScanJob/ScannedDocument/Items/Alias tables already exist; ScanJob has a dedupe unique index.

---

## 4) Estimate Validation (7.5 engineering days)

**Assessment**: **Realistic (but becomes optimistic if Azure DI is not guaranteed for PDFs)**.

Rationale (repo reality):
- Major infrastructure already exists (upload, queues, extraction, intelligence, matching, lifecycle).
- However, the restaurant-facing UI + API wrapper layer is largely **not present**, and the apply path must be upgraded to meet V1 guardrails.
- The largest hidden risk is **PDF extraction** when Azure DI is unavailable.

**Revised estimate (conditional):**
- **If Azure DI is guaranteed for PDF in pilot env** (and we accept OpenAI as image-only): **~7–8 days** remains plausible.
- **If we must support PDF without relying on Azure DI** (implement OpenAI PDF handling): **~9–10 days**.

---

## 5) Go / No-Go Decision

**Decision**: **GO (Conditional)**

**Conditions to proceed safely (P0):**
1) Explicitly lock PDF strategy (Azure DI required vs implement OpenAI PDF support).
2) Implement receipt apply wrapper with unit + quantity guardrails and InventoryUpdate audit.
3) Implement secure document preview delivery for review UI.
4) Confirm Redis is provisioned and workers are running for the pilot.

---

## 6) Execution Contract Readiness Verdict

**Verdict**: **READY FOR EXECUTION CONTRACT**

The execution contract can be generated immediately **as long as it encodes the P0 prerequisites as explicit execution dependencies**, especially:
- PDF extraction dependency (Azure DI required unless OpenAI PDF support is implemented)
- Receipt apply guardrails + audit requirements (InventoryUpdate + unit validation + idempotency)
- Document preview delivery mechanism
- Required runtime dependencies (`REDIS_URL`, OCR provider keys, storage credentials)
