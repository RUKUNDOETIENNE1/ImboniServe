# DIE Block 5A — Operational Monitoring Dashboard Readiness Report

## 1. Scope

Block 5A Phase 1 delivers the **DIE Operations Command Center**:

- Operational monitoring page: `/dashboard/die/operations`
- Business-isolated operational APIs under `/api/die/operations/*`
- Enhanced SSE stream for real-time operational updates
- Validation suite: `scripts/_die_block5a_validation.ts`

## 2. Architecture Overview

### 2.1 High-level diagram

```mermaid
flowchart LR
  UI[Operations Dashboard
/dashboard/die/operations] -->|HTTP JSON| OPS[Operations APIs
/api/die/operations/*]
  UI -->|SSE| SSE[/api/die/events/stream]

  OPS --> Prisma[(Postgres via Prisma)]
  SSE --> Prisma

  OPS --> Redis[(Redis / BullMQ)]

  subgraph Workers
    EX[Extraction Worker
die_extract]
    IN[Intelligence Worker
die_intelligence]
  end

  Redis --> EX
  Redis --> IN
  EX --> Prisma
  IN --> Prisma
```

### 2.2 Data flow

- **System Health**
  - Redis health: `checkQueueHealth()` (PING)
  - Worker heartbeat: derived from `DocumentProcessingLog` events (business-scoped)

- **Queue Health**
  - Business-scoped queue snapshot derived from DB lifecycle/status counters.
  - DLQ counts derived by inspecting DLQ job payloads and filtering to the current business.

- **Failed Jobs**
  - Failed extraction & intelligence DLQ entries are enumerated.
  - Returned jobs are **filtered to current business**.

- **Stuck Documents**
  - `SystemRepairService.detectStuckDocumentsForBusiness()` returns business-only candidates.
  - `SystemRepairService.repairDocument()` triggers a safe replay + consistency check.

- **Replay Operations**
  - `DocumentReplayService.replayFromStage()` and `fullReplay()` invoked via API.

- **Consistency Health**
  - `SystemConsistencyService.validateBusinessConsistency(businessId)` provides reports.

- **Live Events**
  - SSE stream emits business-scoped counts + most recent processing logs.

## 3. Endpoint Inventory

### 3.1 Operations APIs

- `GET /api/die/operations/health`
  - Uses `resolveBusinessContext()`
  - Business-scoped processing logs via `scanJob.businessId`

- `GET /api/die/operations/queues`
  - Uses `resolveBusinessContext()`
  - Business-scoped pipeline counters
  - DLQ counts filtered to the current business

- `GET /api/die/operations/failed-jobs`
  - Uses `resolveBusinessContext()`
  - Returns only jobs linked to the current business

- `POST /api/die/operations/failed-jobs`
  - Uses `resolveBusinessContext()`
  - **Extraction failures**: re-enqueue extraction job idempotently (jobId = scanJobId)
  - **Intelligence failures**: trigger `DocumentReplayService.replayFromStage(..., EXTRACTED)`

- `GET /api/die/operations/stuck-documents`
  - Uses `resolveBusinessContext()`
  - Uses `SystemRepairService.detectStuckDocumentsForBusiness()`

- `POST /api/die/operations/repair`
  - Uses `resolveBusinessContext()`
  - Requires document to belong to current business
  - Runs `SystemRepairService.repairDocument()`

- `POST /api/die/operations/replay`
  - Uses `resolveBusinessContext()`
  - Requires document to belong to current business
  - Runs `DocumentReplayService.replayFromStage()` or `fullReplay()`

- `GET /api/die/operations/consistency`
  - Uses `resolveBusinessContext()`
  - Runs `SystemConsistencyService.validateBusinessConsistency()`

### 3.2 SSE

- `GET /api/die/events/stream`
  - Uses `resolveBusinessContext()`
  - Emits business-scoped counts + recent processing logs

## 4. Security Model

All operations endpoints:

- Require authentication via `resolveBusinessContext()`.
- Enforce **business isolation** at query level (or filter before returning).
- Return `403` or `404` appropriately for cross-business requests.

## 5. Operational Workflow

### 5.1 Standard ops loop

1. Open `/dashboard/die/operations`.
2. Confirm **System Health** (Redis, SSE connectivity, last heartbeat).
3. Review **Queue Health** and DLQ counts.
4. If failures exist:
   - Use **Failed Jobs → Retry** (safe re-enqueue for extraction; replay for intelligence).
5. If stuck docs exist:
   - Use **Repair** (checkpoint + replay + consistency).
   - Use **Replay** as a targeted reprocessing tool.
6. Validate **Consistency Health** to confirm systemic correctness.
7. Use **Live Events** panel for realtime operational awareness.

## 6. Monitoring Strategy

- SSE provides near-real-time operational telemetry.
- A 5-second polling fallback is used only when SSE is disconnected.
- DLQ inspection is limited and filtered to business-owned documents.

## 7. Deployment Checklist

- Confirm `REDIS_URL` configured for worker runtime.
- Confirm DB connectivity (`DATABASE_URL`).
- Run:
  - `npx prisma validate`
  - `npx tsc --noEmit --skipLibCheck`
  - `npx tsx scripts/_die_block5a_validation.ts`

## 8. Rollback Plan

- Rollback is code-only:
  - Revert dashboard page `src/pages/dashboard/die/operations.tsx`
  - Revert operations APIs under `src/pages/api/die/operations/*`
  - Revert SSE changes in `src/pages/api/die/events/stream.ts`

No schema changes are introduced by Block 5A Phase 1.
