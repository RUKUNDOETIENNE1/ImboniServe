# DIE Block 4G — System Consolidation Layer Readiness Report

**Status:** READY FOR PRODUCTION
**Date:** 2026-06-16

## What Changed

Block 4G adds a canonical lifecycle layer, replay engine, self-healing repair loop, consistency validator, and timeline-based observability across the DIE pipeline.

### Migration Summary

- Added `DocumentLifecycleState` enum to Prisma schema
- Added `lifecycleState` to `ScannedDocument`
- Added `DocumentEventTimeline` table with indexes on `scannedDocumentId` and `stage`
- Backfilled existing documents from legacy `DocumentStatus` values into canonical lifecycle states

### New Services

- `src/lib/die/services/document-lifecycle.service.ts`
  - strict state machine
  - atomic transitions
  - timeline writes
  - legacy status mapping
- `src/lib/die/services/document-intelligence.service.ts`
  - reusable intelligence replay helper
- `src/lib/die/services/document-replay.service.ts`
  - `safeReplayGuard`
  - `replayFromStage`
  - `fullReplay`
- `src/lib/die/services/system-repair.service.ts`
  - stuck-document detection
  - document repair
  - scheduled repair job
- `src/lib/die/services/system-consistency.service.ts`
  - cross-block consistency validation

### Worker Changes

- `src/lib/die/orchestrator/worker-start.ts`
  - writes canonical lifecycle transitions after extraction/matching/reconciliation/anomaly stages
  - writes timeline events for each transition
  - starts the scheduled repair job
  - stops the repair job on shutdown

### API Changes

- `src/pages/api/die/upload.ts`
  - creates canonical document skeleton at upload time
  - writes upload timeline entry
- `src/pages/api/die/documents/[id]/approve.ts`
- `src/pages/api/die/documents/[id]/reject.ts`
- `src/pages/api/die/documents/[id]/apply.ts`
  - now use canonical lifecycle transitions
- `src/pages/api/die/documents/[id]/status.ts`
  - now exposes `lifecycleState`

### Validation

- Block 4G validation suite: `scripts/_die_block4g_validation.ts`
- Result: **15/15 tests passed**

### Performance Notes

- Timeline writes are done in the same transaction as lifecycle transitions
- Repair batch is capped at **100 documents per run**
- Replay is lock-protected with Redis when available, with in-memory fallback
- Consistency checks and repair queries use bounded queries and no intentional N+1 loops

### Risks / Follow-Ups

- Replay from very early states still depends on the presence of extracted data; fully re-running OCR/extraction is intentionally out of scope for this block
- Repair scheduling is process-local unless the worker service is the active repair runner
- Existing legacy routes and dashboards still read `status`; they remain compatible because lifecycle transitions keep legacy status synchronized

## Acceptance Criteria

- [x] Strict lifecycle enforcement
- [x] Replay engine for partial + full replay
- [x] Repair engine for stuck documents
- [x] Timeline logs every stage transition
- [x] Cross-block consistency validator
- [x] No duplicate/corrupted states via guarded transitions
- [x] Validation suite passes 100%

**BLOCK 4G COMPLETE**
