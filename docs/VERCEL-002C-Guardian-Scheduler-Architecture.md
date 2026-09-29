# VERCEL-002C — Guardian Scheduler Architecture

**Date:** 2026-08-19
**Mission:** VERCEL-002C — Guardian Scheduler & Deployment Compatibility
**Status:** AUTHORITATIVE DECISION

---

## 1. Selected Architecture: Option C — Hybrid (Railway + Vercel Daily Fallback)

### 1.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ RAILWAY WORKER (worker-start.ts)                                │
│                                                                 │
│  DIE BullMQ Workers (existing)                                  │
│  + CronService.start() (NEW: import '@/lib/cron')               │
│    ├── schedulePromiseEvaluation()  → every 2 min              │
│    └── scheduleGuardianEvaluation() → every 2 min (30s offset) │
│                                                                 │
│  PRIMARY SCHEDULER — 2-minute cadence                           │
│  Env: CRON_WORKER=true, NODE_ENV=production, VERCEL unset      │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ GUARDIAN SERVICE (in-process, no HTTP)                          │
│  PromiseEngine.evaluateActivePromises()                         │
│    → transitions ON_TRACK → WARNING → CRITICAL                 │
│  GuardianService.evaluateActiveSignals()                        │
│    → detects cases from WARNING/CRITICAL promises              │
│  GuardianService.verifyActiveCases()                            │
│    → verifies active cases → resolve/escalate                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ VERCEL (Hobby Plan)                                             │
│                                                                 │
│  vercel.json crons (ALL DAILY — Hobby-compatible):              │
│    /api/cron/promise-evaluation  → 0 0 * * * (daily midnight)  │
│    /api/cron/guardian            → 0 1 * * * (daily 01:00)     │
│    (9 other existing daily crons unchanged)                     │
│                                                                 │
│  FALLBACK SCHEDULER — daily cadence if Railway is down          │
│  Each endpoint: Redis lock + CRON_SECRET auth                  │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ API ENDPOINTS (authenticated, concurrency-protected)            │
│  /api/cron/promise-evaluation  (NEW)                            │
│    → CRON_SECRET Bearer auth                                    │
│    → Redis lock (60s TTL)                                       │
│    → PromiseEngine.evaluateActivePromises()                     │
│    → Heart Pulse event                                          │
│  /api/cron/guardian (EXISTING, enhanced)                        │
│    → CRON_SECRET Bearer auth (already implemented)              │
│    → Redis lock (120s TTL) (NEW)                                │
│    → GuardianService.evaluateActiveSignals()                    │
│    → GuardianService.verifyActiveCases()                        │
│    → Heart Pulse event (NEW)                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Design Decisions

| Decision | Rationale |
|---|---|
| Railway worker is PRIMARY scheduler | Already has `Dockerfile.worker`, `worker-start.ts`, Redis connection. In-process scheduler runs at exact 2-minute cadence with no HTTP overhead. |
| Vercel daily crons are FALLBACK | If Railway is down, Guardian still evaluates daily. Degraded but functional. Hobby-compatible. |
| Redis lock on API endpoints | Prevents duplicate execution if Railway in-process + Vercel daily cron fire simultaneously. Also protects against external scheduler retries. |
| New `/api/cron/promise-evaluation` route | Promise Engine needs its own API endpoint for Vercel daily cron fallback. Currently only runs in-process. |
| Heart Pulse scheduler events | Observability: "When did Guardian last run?" "Did it evaluate active cases?" |
| Guardian semantics UNCHANGED | No changes to detect, understand, decide, intervene, verify, learn, resolve. |
| Promise Engine UNCHANGED | No changes to evaluateActivePromises, state transitions, threshold logic. |

---

## 2. Component Changes

### 2.1 `vercel.json` — Remove invalid cron, add daily fallbacks

**Before:**
```json
{
  "path": "/api/cron/guardian",
  "schedule": "*/2 * * * *"
}
```

**After:**
```json
{
  "path": "/api/cron/promise-evaluation",
  "schedule": "0 0 * * *"
},
{
  "path": "/api/cron/guardian",
  "schedule": "0 1 * * *"
}
```

All crons in vercel.json are now daily (`0 N * * *`). Hobby-compatible.

### 2.2 `src/lib/die/orchestrator/worker-start.ts` — Add CronService import

**Add at top:**
```ts
import '@/lib/cron'  // Starts CronService in-process (CRON_WORKER=true, VERCEL unset)
```

This activates the existing `schedulePromiseEvaluation()` and `scheduleGuardianEvaluation()` on the Railway worker. The `CronService.start()` method already checks `CRON_WORKER !== 'true'` → skip, and `VERCEL === '1'` → skip. On Railway with `CRON_WORKER=true` and `VERCEL` unset, both checks pass and the 2-minute ticks start.

### 2.3 `src/pages/api/cron/promise-evaluation.ts` — NEW API route

```ts
// Authenticated via CRON_SECRET Bearer token
// Redis lock (60s TTL) prevents concurrent execution
// Calls PromiseEngine.evaluateActivePromises()
// Publishes Heart Pulse event for observability
```

### 2.4 `src/pages/api/cron/guardian.ts` — Enhanced with Redis lock + Heart Pulse

**Existing:** CRON_SECRET Bearer auth, calls evaluateActiveSignals + verifyActiveCases.
**Added:** Redis lock (120s TTL), Heart Pulse scheduler event.

### 2.5 `src/lib/scheduler/cron-lock.ts` — NEW shared lock utility

Redis-based lock using existing `REDIS_URL`. Falls back to in-memory lock if Redis unavailable (same pattern as `document-replay.service.ts`).

```ts
async function acquireCronLock(name: string, ttlSeconds: number): Promise<CronLock | null>
// Returns null if lock is held (skip execution)
// Returns CronLock with release() if acquired
```

### 2.6 `src/lib/heart-pulse/event-catalog.ts` — Add scheduler event types

```ts
SCHEDULER_TICK: 'scheduler.tick',
SCHEDULER_SKIP: 'scheduler.skip',
SCHEDULER_ERROR: 'scheduler.error',
```

---

## 3. Authentication

### 3.1 Existing Convention (Reused)

All cron endpoints use `CRON_SECRET` Bearer token:
```ts
const cronSecret = process.env.CRON_SECRET
const authHeader = req.headers.authorization
if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
  return res.status(401).json({ error: 'Unauthorized' })
}
```

This is the standard pattern across all 18 existing cron endpoints. The new `/api/cron/promise-evaluation` follows the same pattern.

### 3.2 Fail-Closed Behavior

- If `CRON_SECRET` is not set → 401 Unauthorized (fail closed)
- If `Authorization` header doesn't match → 401 Unauthorized
- No bypass, no fallback to query param (unlike `cronAuth.ts` which has query param fallback — the Guardian and Promise Engine endpoints use the stricter direct Bearer check)

### 3.3 Vercel Cron Authentication

Vercel automatically sends `Authorization: Bearer ${CRON_SECRET}` header when calling cron endpoints. The `CRON_SECRET` environment variable must be set in Vercel. It is already present (verified in VERCEL-002A).

---

## 4. Concurrency / Duplicate Execution Protection

### 4.1 Redis Lock

```ts
// In cron endpoint handler:
const lock = await acquireCronLock('guardian-evaluation', 120)
if (!lock) {
  // Another execution is in progress — skip
  log.info('Guardian cron skipped (lock held)')
  return res.status(200).json({ success: true, skipped: true, reason: 'lock_held' })
}
try {
  // ... evaluation logic ...
} finally {
  await lock.release()
}
```

### 4.2 Lock TTL

| Endpoint | TTL | Rationale |
|---|---|---|
| `/api/cron/promise-evaluation` | 60s | Promise evaluation is fast (DB queries + state transitions) |
| `/api/cron/guardian` | 120s | Guardian evaluation includes notification dispatch (WhatsApp, Slack) |

### 4.3 Fallback: In-Memory Lock

If `REDIS_URL` is not set, falls back to in-memory Set-based lock (same pattern as `document-replay.service.ts`). This is per-process only, but sufficient for single-instance deployments.

### 4.4 Existing Idempotency (Unchanged)

| Protection | Mechanism |
|---|---|
| Duplicate case creation | Unique constraint on `idempotencyKey` |
| P2002 handling | Caught and suppressed |
| Notification dedup | 15-minute window |
| Batch limit | 200 per tick |

The Redis lock is an ADDITIONAL layer on top of these existing protections, not a replacement.

---

## 5. Observability

### 5.1 Heart Pulse Events

| Event | When | Payload |
|---|---|---|
| `scheduler.tick` | After each successful evaluation | `{ source: 'railway' \| 'vercel-cron', duration, signalsProcessed, casesVerified }` |
| `scheduler.skip` | When lock is held (skip) | `{ source, reason: 'lock_held' }` |
| `scheduler.error` | When evaluation throws | `{ source, error }` |

### 5.2 Log Output

Every tick logs:
```
[Guardian] Cron tick — source=railway, signalsProcessed=3, casesVerified=12, durationMs=450
[PromiseEngine] Cron tick — source=railway, evaluated=45, transitions=2, durationMs=120
```

### 5.3 Answering "When did Guardian last run?"

Check Heart Pulse events for `scheduler.tick` events. The payload includes `source` (railway vs vercel-cron), `duration`, and counts.

If Heart Pulse is not available, check application logs for `[Guardian] Cron tick` entries.

---

## 6. Failure Behavior

### 6.1 Scheduler Fails to Fire

| Scenario | Impact | Recovery |
|---|---|---|
| Railway worker down | No 2-min ticks; Vercel daily cron still runs | Railway restarts automatically |
| Vercel deployment fails | No daily fallback; Railway still runs 2-min ticks | Fix Vercel deployment (this mission) |
| Both down | Guardian stops evaluating | Cases remain in their current state; no corruption |
| Redis down | Lock falls back to in-memory; evaluation still runs | Redis provider restores service |

### 6.2 Evaluation Fails Mid-Execution

| Scenario | Impact | Recovery |
|---|---|---|
| DB query fails | Error logged, tick returns 0, next tick retries | Transient DB issues resolve |
| Notification dispatch fails | Error caught per-case (error isolation), case still processed | Notification retry on next tick (dedup window prevents spam) |
| Heart Pulse publish fails | Non-fatal (`.catch()`), evaluation continues | Heart Pulse provider restores |
| Lock release fails | Lock expires after TTL (60-120s) | Next tick can acquire lock after TTL |

### 6.3 What NEVER Happens

- Guardian cases are NOT corrupted by scheduler failure
- Promise Engine state is NOT corrupted
- Duplicate interventions are NOT created (idempotency + dedup + lock)
- Cases are NOT falsely marked fulfilled or recovered
- False learning signals are NOT created

---

## 7. Guardian Semantics — Unchanged

| Component | Changed? | Notes |
|---|---|---|
| `GuardianService.detect()` | No | Same idempotency key, same unique constraint |
| `GuardianService.understand()` | No | Same context gathering |
| `GuardianService.decide()` | No | Same decision policy |
| `GuardianService.intervene()` | No | Same notification dispatch, same dedup |
| `GuardianService.verify()` | No | Same verification logic |
| `GuardianService.resolveCase()` | No | Same resolution, same Heart Pulse events |
| `GuardianService.evaluateActiveSignals()` | No | Same query, same batch limit, same error isolation |
| `GuardianService.verifyActiveCases()` | No | Same query, same batch limit, same error isolation |
| `GuardianDecisionPolicy` | No | Same thresholds, same levels |
| `GuardianContextGatherer` | No | Same context snapshot |
| `GuardianResponsibilityRouter` | No | same routing |
| GuardianCase lifecycle | No | Same states, same transitions |
| GuardianIntervention semantics | No | Same creation, same dispatch |
| GuardianLearningSignal semantics | No | Same creation |

---

## 8. Promise Engine — Unchanged

| Component | Changed? | Notes |
|---|---|---|
| `PromiseEngine.evaluateActivePromises()` | No | Same query, same batch limit, same error isolation |
| `PromiseEngine.evaluateOne()` | No | Same evaluation, same state transitions |
| `PromiseEngine.transitionTo()` | No | Same transition logic, same Heart Pulse events |
| Promise Engine → Guardian flow | No | Same: PE produces WARNING/CRITICAL → Guardian detects |

---

## 9. Payment Architecture — Unchanged

No payment code, payment provider configuration, or payment flow is modified. The only changes are to scheduling infrastructure.

---

## 10. Production Secrets — Untouched

No Vercel environment variables are modified. The VERCEL-002A findings (missing INTOUCH_*, malformed PAYMENTS_PROVIDER, malformed NEXTAUTH_URL) remain a separate founder configuration gate.

---

## 11. File Inventory

| File | Action | Description |
|---|---|---|
| `vercel.json` | MODIFY | Remove `*/2 * * * *`, add daily `0 0 * * *` and `0 1 * * *` |
| `src/lib/die/orchestrator/worker-start.ts` | MODIFY | Add `import '@/lib/cron'` |
| `src/pages/api/cron/promise-evaluation.ts` | CREATE | New Promise Engine cron API route |
| `src/pages/api/cron/guardian.ts` | MODIFY | Add Redis lock + Heart Pulse event |
| `src/lib/scheduler/cron-lock.ts` | CREATE | Shared Redis/in-memory lock utility |
| `src/lib/heart-pulse/event-catalog.ts` | MODIFY | Add scheduler event types |
| `src/lib/env-validator.js` | MODIFY (from 92cd45c) | Sync with env-validator.ts (provider-conditional) |
| `tests/build/env-validator-provider-conditional.test.ts` | EXISTS (from 92cd45c) | Regression test |
| `tests/scheduler/guardian-scheduler.test.ts` | CREATE | 15 scheduler test scenarios |
| `tests/build/vercel-cron-hobby-compatibility.test.ts` | CREATE | Verify no sub-daily crons in vercel.json |

---

## 12. Test Plan

| # | Scenario | Test |
|---|---|---|
| 1 | Normal scheduled execution | Mock CRON_SECRET, call endpoint, verify 200 + evaluation ran |
| 2 | Authenticated execution | Valid Bearer token → 200 |
| 3 | Unauthenticated execution rejection | No/invalid token → 401 |
| 4 | Duplicate trigger | Two concurrent calls → one runs, one skips (lock) |
| 5 | Overlapping trigger | Second call while first running → skip |
| 6 | Retry | Same call after lock TTL → runs again |
| 7 | Partial failure | One promise/case fails → others still processed |
| 8 | Multiple active cases | Batch of cases → all processed |
| 9 | No active cases | Empty result → 200, 0 processed |
| 10 | Terminal case | Resolved case → not re-evaluated |
| 11 | Stale case | Old case → still verified |
| 12 | Scheduler timeout | Lock TTL expires → next tick acquires lock |
| 13 | Idempotency | Duplicate signal → same case ID returned |
| 14 | Authorization | Different secrets → 401 |
| 15 | Business isolation | Business-scoped query → only that business's cases |
| 16 | vercel.json Hobby compatibility | All crons are daily (no `*/N` where N < 1440) |

---

## 13. Vercel Plan Compatibility Verification

After implementation, `vercel.json` will contain ONLY daily cron schedules:

```
0 0 * * *   — promise-evaluation (daily midnight)
0 1 * * *   — guardian (daily 01:00)
0 2 * * *   — addon-renewals (existing)
0 3 * * *   — reconciliation (existing)
0 4 * * *   — tap-leave-sweep (existing)
0 5 * * *   — tap-leave-reconcile (existing)
0 6 * * *   — summary-daily (existing)
0 7 * * *   — watchdog-payment (existing)
0 8 * * *   — watchdog-customer (existing)
0 9 * * *   — watchdog-revenue (existing)
0 10 * * *  — watchdog-subscription (existing)
```

All schedules run exactly once per day. Vercel Hobby plan permits this.

A regression test (`tests/build/vercel-cron-hobby-compatibility.test.ts`) will verify that no cron schedule in `vercel.json` runs more than once per day.
