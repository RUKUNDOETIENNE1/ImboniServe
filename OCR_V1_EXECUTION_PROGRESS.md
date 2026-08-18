# OCR V1 Execution Progress (Sprint Contract)

**Project**: ImboniServe — OCR V1 (Restaurant Inventory Intake)  
**Start Date**: 2026-06-25  
**Owner**: Execution Team (Backend + Frontend + Reliability + QA)

## Release Goal (Locked)
Restaurant uploads a receipt (PDF/JPG/PNG) → OCR extracts supplier + line items → user reviews with preview + warnings → user clicks Approve → inventory updates automatically → full audit trail exists.

---

## Sprint Plan (7 Days)

### Day 1 — Redis / Worker / Queue Validation (IN PROGRESS)
- [x] Redis connectivity validated (`REDIS_URL`)
- [x] DIE worker starts cleanly (`npm run die:worker`)
- [x] Queue retry behavior verified (forced failure job → 3 attempts)
- [~] DLQ behavior verified (job moved). Alert delivery **pending** (requires configured channels)
- [ ] Baseline acceptance tests executed (image + existing pipeline)

### Day 2 — P0-1 PDF Extraction (PENDING)
- [ ] Implement reliable PDF extraction path (Azure DI and/or OpenAI PDF)
- [ ] Acceptance Test: Upload PDF → extract → review

### Day 3 — P0-2 Inventory Safety Layer (PENDING)
- [ ] Unit normalization
- [ ] Quantity validation + outlier detection
- [ ] Price validation
- [ ] Apply validation
- [ ] InventoryUpdate creation

### Day 4 — P0-3 Document Preview (PENDING)
- [ ] Secure preview endpoint (PDF + image)
- [ ] Preview integrated into review UI

### Day 5 — Restaurant OCR Review Screen (PENDING)
- [ ] Review UI with confidence + warnings
- [ ] Approve / Reject flow

### Day 6 — End-to-End Integration (PENDING)
- [ ] Upload → Extract → Review → Approve → Inventory update → Audit trail

### Day 7 — Hardening / Final QA / Release Validation (PENDING)
- [ ] Edge cases
- [ ] Bug fixes
- [ ] Final release gate verification

---

## P0 Blockers Status

| Blocker | Status | Evidence |
|---|---|---|
| P0-1 PDF Extraction | NOT STARTED | OpenAI PDF path currently stubbed; PDF requires Azure DI or new implementation |
| P0-2 Inventory Safety Layer | NOT STARTED | Current apply path lacks unit/qty/price guardrails + InventoryUpdate |
| P0-3 Document Preview | NOT STARTED | Review preview is placeholder; no preview endpoint exposed |
| P0-4 Redis / Worker Validation | IN PROGRESS | Worker started and connected to Redis + Prisma; retry + DLQ verified |

---

## Acceptance Tests (Required)

1. Upload image receipt → extraction succeeds
2. Upload PDF receipt → extraction succeeds
3. Low confidence extraction → warning displayed; approval required
4. Quantity anomaly → blocked or warning
5. Unit mismatch → warning + manual confirmation
6. Apply extraction → inventory updated + InventoryUpdate created + audit preserved
7. Worker failure → retry; no data loss
8. Duplicate submission → no duplicate inventory updates

---

## Execution Log (Evidence)

### 2026-06-25

- Repo state captured (branch + recent commits).  
  Evidence: `git log -5 --oneline` shows recent DIE hardening commits.

- Worker start validated (sanitized logs):
  - `[DIE-Workers] Redis connected via Upstash`
  - `[DIE-Workers] Prisma connected to database`
  - `[DIE-Extract] Worker initialized` + `[DIE-Intel] Worker initialized`

- Queue health check validated:
  - `checkQueueHealth()` → `{ status: 'healthy' }`

- Retry + DLQ behavior validated (forced failure job):
  - Extract job failed with `ScanJob not found`
  - After 3 attempts: `[DIE-Extract] Job 1 moved to DLQ after 3 attempts`
  - DLQ inspection: `getFailedJobs(5)` returns job id `1` with failedReason `ScanJob not found`

Open items (Day 1):
- Confirm DLQ alert delivery end-to-end (Slack/email channel configured)
- Run baseline “successful extraction” acceptance test with a known-good image receipt

---

## Remaining Blockers / Issues

- None recorded yet (execution just started)

---

## Current Release Decision

**Status**: **NOT READY**  
**Reason**: P0 blockers not yet completed.

---
