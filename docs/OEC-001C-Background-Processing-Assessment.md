# OEC-001C Background Processing Assessment

## Area 2: Background Processing

---

## 1. BullMQ Workers

### Worker Architecture
- **Unified Worker** (`worker-start.ts`): Runs both extraction and intelligence workers in a single process (recommended)
- **Legacy Workers**: `worker.ts` (extract only), `intelligence-worker.ts` (intelligence only) — appear to be legacy

### Queue Configuration

| Queue | Purpose | Concurrency | Rate Limit | Attempts | Backoff |
|-------|---------|-------------|------------|----------|---------|
| die_extract | OCR extraction | 5 | 10/sec | 3 | Exponential (2s) |
| die_intelligence | Post-extraction intelligence | 3 | 5/sec | 3 | Exponential (3s) |

### Job Cleanup
- `removeOnComplete: 1000` — Keeps last 1000 completed jobs
- `removeOnFail: 2000` — Keeps last 2000 failed jobs

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Worker concurrency | ✅ | Configured per queue |
| Rate limiting | ✅ | Prevents provider overload |
| Job cleanup | ✅ | Automatic cleanup of old jobs |
| Graceful shutdown | ✅ | SIGTERM/SIGINT handlers |

---

## 2. Scheduled Jobs

### Vercel Cron Jobs (9)
| Endpoint | Schedule | Max Duration |
|----------|----------|-------------|
| /api/cron/addon-renewals | Daily 2:00 UTC | Default |
| /api/cron/reconciliation | Daily 3:00 UTC | 300s |
| /api/cron/tap-leave-sweep | Daily 4:00 UTC | 120s |
| /api/cron/tap-leave-reconcile | Daily 5:00 UTC | 120s |
| /api/cron/summary-daily | Daily 6:00 UTC | Default |
| /api/cron/watchdog-payment | Daily 7:00 UTC | Default |
| /api/cron/watchdog-customer | Daily 8:00 UTC | Default |
| /api/cron/watchdog-revenue | Daily 9:00 UTC | Default |
| /api/cron/watchdog-subscription | Daily 10:00 UTC | Default |

### In-Process Cron Jobs (16+)
- **Activation**: Only runs if `CRON_WORKER=true` AND not on Vercel
- **Pattern**: `setInterval` based scheduling
- **Jobs**: Daily reports, stock alerts, backups, affiliate approvals, insight generation, feature flag checks, reconciliation, QR order release, Tap&Leave reconciliation, reservation no-show forfeits, autopilot features, trial status updates, content publishing, trending notifications

### Worker-Embedded Scheduled Job
- **System Repair Service**: Runs every 5 minutes within the DIE worker
- **Purpose**: Detects and repairs stuck documents (threshold: 30 minutes, batch: 100)

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Vercel cron configuration | ✅ | 9 cron jobs with extended timeouts |
| In-process cron | ⚠️ | Not suitable for production (identified in OEC-001B) |
| Stuck job recovery | ✅ | SystemRepairService every 5 minutes |
| Cron authentication | ✅ | CRON_SECRET required |

---

## 3. Retry Behavior

### BullMQ Retry Configuration
- **Attempts**: 3 (both queues)
- **Backoff**: Exponential (2s for extract, 3s for intelligence)
- **DLQ movement**: After 3 failed attempts, job moved to DLQ

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Automatic retry | ✅ | 3 attempts with exponential backoff |
| Configurable backoff | ✅ | Different delays per queue |
| Manual retry | ✅ | DLQ retry API at /api/die/operations/failed-jobs |
| Retry alerting | ✅ | AlertDeliveryService on permanent failure |

---

## 4. Dead-Letter Handling

### DLQ Implementation
- **Queues**: `die_extract_dlq`, `die_intelligence_dlq`
- **DLQ content**: Job data, error message, failed timestamp, attempt count
- **Inspection**: `getFailedJobs()` and `getFailedIntelligenceJobs()` functions
- **Retry API**: `/api/die/operations/failed-jobs` for manual retry
- **Monitoring**: QueueWatchdogService checks DLQ counts

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Dead letter queue | ✅ | Dedicated DLQ for both queues |
| DLQ inspection | ✅ | API and functions available |
| DLQ retry | ✅ | Manual retry via API |
| DLQ monitoring | ✅ | QueueWatchdogService |
| DLQ cleanup | ⚠️ | No TTL — jobs accumulate indefinitely (REL-MED-005) |

---

## 5. Duplicate Execution Prevention

### Job-Level Idempotency
- **Extraction**: Uses `jobId: scanJob.id` — BullMQ deduplicates by jobId
- **Intelligence**: Uses `jobId: scannedDocumentId` — BullMQ deduplicates by jobId
- **Upload-level**: SHA-256 hash of file content prevents duplicate uploads

### Replay Locks
- **Redis-based distributed lock** with TTL (1800s default)
- **In-memory fallback** if Redis unavailable
- **Purpose**: Prevents concurrent replays of same document

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Job deduplication | ✅ | BullMQ jobId-based |
| Upload deduplication | ✅ | SHA-256 hash |
| Replay locks | ✅ | Redis-based with fallback |

---

## 6. Idempotency

### Strong Idempotency
- **Payment completion**: `updateMany` with status guards
- **Billing ledger**: Idempotency key with unique constraint
- **Ticket events**: `idempotencyKey` with unique constraint
- **Tap & Leave finalization**: Checks `finalizedAt` before processing

### Fixed in OEC-001C
- **Commission creation**: ✅ Now checks for existing commission by invoiceId (REL-CRIT-002)
- **Payout processing**: ✅ Now atomic via $transaction (REL-CRIT-001)

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Payment idempotency | ✅ | Strong — updateMany guards |
| Commission idempotency | ✅ | Fixed in OEC-001C |
| Payout atomicity | ✅ | Fixed in OEC-001C |
| Ledger idempotency | ✅ | Unique constraint on idempotencyKey |
| Ticket event idempotency | ✅ | Unique constraint on idempotencyKey |

---

## 7. Queue Health

### Health Check Endpoints
| Endpoint | Checks |
|----------|--------|
| /api/admin/queue/health | Redis ping test |
| /api/admin/queue/metrics | Processed, failed, active counts |
| /api/admin/queue/dlq | Failed jobs inspection |
| /api/die/operations/health | Queue health + recent docs + anomalies + heartbeats |

### Queue Watchdog Service
- **DLQ events**: WARN if 1-3, ERROR if >3
- **Backlog growth**: WARN if >100, ERROR if >500
- **Queue stall**: CRITICAL if active >0 but waiting queue large
- **Metrics**: Redis-based tracking (active, processed, failed)

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Health check endpoint | ✅ | Redis ping |
| Metrics tracking | ✅ | Redis-based counters |
| DLQ monitoring | ✅ | Watchdog with alerting |
| Backlog monitoring | ✅ | Watchdog with thresholds |
| Stall detection | ✅ | Watchdog with critical alerts |
| Latency metrics | ⚠️ | Not tracked (REL-LOW-012) |

---

## Overall Background Processing Score: 8.0/10 — Strong

**Strengths**: BullMQ with DLQ, retries, idempotency, watchdog monitoring, stuck job recovery  
**Gaps**: DLQ cleanup, in-process cron not production-suitable, no latency metrics
