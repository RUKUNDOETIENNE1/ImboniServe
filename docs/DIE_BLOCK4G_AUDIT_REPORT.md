# DIE Block 4G Audit Report

## Architecture

Block 4G adds a consolidation layer on top of Blocks 4A-4F:

- canonical lifecycle enforcement via `DocumentLifecycleState`
- observability timeline via `DocumentEventTimeline`
- replay service for stage replay and full replay
- repair service for stuck documents
- consistency service for cross-block invariants
- worker orchestration hooks for automatic lifecycle progression

Key files:

- <ref_file file="c:\Dev\ImboniResto\prisma\schema.prisma" />
- <ref_file file="c:\Dev\ImboniResto\src\lib\die\orchestrator\worker-start.ts" />
- <ref_file file="c:\Dev\ImboniResto\src\lib\die\services\document-lifecycle.service.ts" />
- <ref_file file="c:\Dev\ImboniResto\src\lib\die\services\document-replay.service.ts" />
- <ref_file file="c:\Dev\ImboniResto\src\lib\die\services\system-repair.service.ts" />
- <ref_file file="c:\Dev\ImboniResto\src\lib\die\services\system-consistency.service.ts" />

## Dependencies

- Prisma + PostgreSQL
- NextAuth session auth
- BullMQ queues and Redis locks
- Existing DIE services:
  - Supplier matching
  - Product matching
  - Procurement reconciliation
  - Anomaly detection

## Orchestration Flow

1. Upload creates `ScanJob`, `ScannedDocument`, and an initial `DocumentEventTimeline` row.
2. Extraction worker promotes raw data and transitions lifecycle to `EXTRACTED`.
3. Intelligence/matching/reconciliation/anomaly stages update lifecycle and append timeline rows.
4. Replay service can re-run from a safe checkpoint.
5. Repair service detects stale documents and replays from the last valid checkpoint.
6. Consistency service validates invariants across lifecycle, timeline, links, reconciliation, anomalies, and logs.

## Verification Scope

Verified with:

- Prisma schema validation
- TypeScript compile
- Block 4C/4D/4E/4F validation suites
- Block 4G validation suite
- perf/security preflight checks

## Known Risks

- Prisma migration history still contains legacy drift entries from earlier interrupted migrations.
- `prisma migrate status` reports a legacy migration-file anomaly even though runtime schema checks and validations pass.
- Redis lock release was hardened to avoid `eval`; lock safety is best-effort on the final cleanup path.
