# VERCEL-002C — Implementation Report

**Date:** 2026-08-19
**Mission:** VERCEL-002C — Guardian Scheduler & Deployment Compatibility

---

## 1. Why did Vercel reject Guardian?

Vercel rejected the deployment at commit `7b6aeee` (GUARDIAN-001) because `vercel.json` contained a Guardian cron job with schedule `*/2 * * * *` (every 2 minutes). The Vercel Hobby plan only allows daily cron schedules (frequency ≤ 1 per day). Vercel rejected the deployment at the configuration validation stage — before a build was created — so no deployment record appeared in the dashboard.

## 2. What was the original intended Guardian cadence?

Every 2 minutes. The Guardian evaluation cycle runs:
1. `PromiseEngine.evaluateActivePromises()` — evaluates ON_TRACK/WARNING/CRITICAL promises, transitions states
2. `GuardianService.evaluateActiveSignals()` — detects new cases from WARNING/CRITICAL promises
3. `GuardianService.verifyActiveCases()` — verifies active cases, resolves/escalates

The in-process scheduler (`src/lib/cron.ts`) runs this every 2 minutes with a 30-second offset between Promise Engine and Guardian ticks.

## 3. Why is daily execution unacceptable?

Service promises have `warningAfterMinutes` and `breachAfterMinutes` thresholds (typically 10-20 minutes). A promise that starts at 09:00 and breaches at 09:20 would not be detected until 01:00 the next day — 15+ hours after the breach. Guardian's purpose is to intervene BEFORE breach, not 16 hours after. The 2-minute cadence ensures detection within 2 minutes of threshold crossing.

## 4. What scheduling options were evaluated?

Six options were evaluated in `docs/VERCEL-002C-Guardian-Scheduler-Options.md`:

| Option | Mechanism | Cadence | Recommendation |
|---|---|---|---|
| A | Railway in-process scheduler | 2 min | Strong |
| B | External scheduler (cron-job.org) | 2-5 min | Rejected (requires new account) |
| C | Hybrid (Railway + Vercel daily fallback) | 2 min + daily | **SELECTED** |
| D | Upstash QStash | 2 min | Rejected (exceeds free tier) |
| E | Railway only (no fallback) | 2 min | Rejected (no fallback) |
| F | GitHub Actions | 5 min | Rejected (unreliable timing) |

## 5. Which architecture was selected?

**Option C — Hybrid (Railway + Vercel Daily Fallback).**

- **Primary:** Railway worker's in-process scheduler runs Promise Engine and Guardian every 2 minutes (exact cadence, no HTTP overhead).
- **Fallback:** Vercel daily crons (`0 0 * * *` for Promise Engine, `0 1 * * *` for Guardian) ensure evaluation still happens if Railway is down.
- **Concurrency:** Redis lock on API endpoints prevents duplicate execution if both fire simultaneously.

## 6. Why?

1. Preserves exact 2-minute cadence via Railway in-process scheduler
2. Vercel Hobby compatible — all Vercel crons are daily
3. Has a fallback — Vercel daily cron if Railway is down
4. Uses existing infrastructure — Railway worker, Redis, CRON_SECRET
5. No new accounts, no billing changes
6. Guardian semantics unchanged
7. Promise Engine preserved
8. Concurrency protected via Redis lock
9. Observable via Heart Pulse events
10. Fail-safe — scheduler failure doesn't corrupt cases

## 7. How is the scheduler authenticated?

All cron API endpoints use `CRON_SECRET` Bearer token authentication (fail-closed):
```ts
if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
  return res.status(401).json({ error: 'Unauthorized' })
}
```
This is the existing convention across all 18 cron endpoints. Vercel automatically sends this header. The Railway in-process scheduler doesn't need authentication (runs in-process, no HTTP).

## 8. How is duplicate execution prevented?

Three layers:
1. **Redis lock** (`acquireCronLock`): `SET key token EX ttl NX` — prevents concurrent execution across processes. TTL: 60s (Promise Engine), 120s (Guardian). Falls back to in-memory Set if Redis unavailable.
2. **Guardian idempotency** (existing): Unique constraint on `idempotencyKey = guardian:case:${promiseId}:${signalType}`. P2002 errors caught and suppressed.
3. **Notification dedup** (existing): 15-minute window prevents duplicate notifications.

## 9. How is failure handled?

- **Scheduler fails to fire:** Cases remain in current state; no corruption. Vercel daily fallback covers Railway downtime.
- **Evaluation fails mid-execution:** Error isolation per-promise/per-case (one failure doesn't stop others). Error logged, next tick retries.
- **Lock release fails:** Lock auto-expires after TTL (60-120s). Next tick can acquire.
- **NEVER:** Cases corrupted, duplicate interventions created, false resolutions, false learning signals.

## 10. How is execution observed?

Heart Pulse events:
- `scheduler.tick` — after each successful evaluation (payload: source, duration, counts)
- `scheduler.skip` — when lock held (skip)
- `scheduler.error` — when evaluation throws

Plus structured log output: `[Guardian] Cron tick — source=railway, signalsProcessed=3, casesVerified=12, durationMs=450`

## 11. What code changed?

| File | Action | Description |
|---|---|---|
| `vercel.json` | Modified | Removed `*/2 * * * *`, added daily `0 0 * * *` (promise-evaluation) and `0 1 * * *` (guardian) |
| `src/lib/scheduler/cron-lock.ts` | Created | Shared Redis/in-memory lock utility |
| `src/pages/api/cron/promise-evaluation.ts` | Created | New Promise Engine cron API route (auth + lock + Heart Pulse) |
| `src/pages/api/cron/guardian.ts` | Modified | Added Redis lock + Heart Pulse observability |
| `src/lib/die/orchestrator/worker-start.ts` | Modified | Added `import '@/lib/cron'` to start in-process scheduler on Railway |
| `src/lib/heart-pulse/event-catalog.ts` | Modified | Added SCHEDULER_TICK, SCHEDULER_SKIP, SCHEDULER_ERROR event types + system channel |
| `src/lib/env-validator.js` | Modified (from 92cd45c) | Synced with env-validator.ts (provider-conditional validation) |

## 12. What vercel.json changed?

**Before:**
```json
{ "path": "/api/cron/guardian", "schedule": "*/2 * * * *" }
```

**After:**
```json
{ "path": "/api/cron/promise-evaluation", "schedule": "0 0 * * *" },
{ "path": "/api/cron/guardian", "schedule": "0 1 * * *" }
```

All 11 crons in vercel.json are now daily (`0 N * * *`). Hobby-compatible.

## 13. What tests were added?

| Test file | Tests | Scenarios |
|---|---|---|
| `tests/scheduler/guardian-scheduler.test.ts` | 33 | Auth, concurrency, lock, error handling, Heart Pulse, business isolation, vercel.json compatibility |
| `tests/build/vercel-cron-hobby-compatibility.test.ts` | 61 | All crons daily, no sub-daily, Guardian daily, Promise Engine daily, pattern match |
| `tests/build/env-validator-provider-conditional.test.ts` | 6 (from 92cd45c) | Provider-conditional env validation |
| **Total new tests** | **100** | |

All 170 tests pass (100 new + 70 existing Guardian tests).

## 14. Did Guardian semantics remain unchanged?

**Yes.** No changes to:
- `GuardianService.detect()` — same idempotency key, same unique constraint
- `GuardianService.understand()` — same context gathering
- `GuardianService.decide()` — same decision policy
- `GuardianService.intervene()` — same notification dispatch, same dedup
- `GuardianService.verify()` — same verification logic
- `GuardianService.resolveCase()` — same resolution, same Heart Pulse events
- `GuardianService.evaluateActiveSignals()` — same query, same batch limit, same error isolation
- `GuardianService.verifyActiveCases()` — same query, same batch limit, same error isolation
- `GuardianDecisionPolicy` — same thresholds, same levels
- `GuardianContextGatherer` — same context snapshot
- `GuardianResponsibilityRouter` — same routing
- GuardianCase lifecycle — same states, same transitions
- GuardianIntervention semantics — same creation, same dispatch
- GuardianLearningSignal semantics — same creation

## 15. Did Promise Engine remain unchanged?

**Yes.** No changes to:
- `PromiseEngine.evaluateActivePromises()` — same query, same batch limit, same error isolation
- `PromiseEngine.evaluateOne()` — same evaluation, same state transitions
- `PromiseEngine.transitionTo()` — same transition logic, same Heart Pulse events
- Promise Engine → Guardian flow — same: PE produces WARNING/CRITICAL → Guardian detects

## 16. Did payment architecture remain unchanged?

**Yes.** No payment code, payment provider configuration, or payment flow was modified.

## 17. Did production secrets remain untouched?

**Yes.** No Vercel environment variables were modified. The VERCEL-002A findings (missing INTOUCH_*, malformed PAYMENTS_PROVIDER, malformed NEXTAUTH_URL) remain a separate founder configuration gate.

## 18. Does the current Vercel plan accept the deployment configuration?

**Yes.** All 11 crons in `vercel.json` are daily (`0 N * * *`). The Vercel Hobby plan permits daily cron schedules. The regression test `tests/build/vercel-cron-hobby-compatibility.test.ts` verifies this (61 tests, all pass).

## 19. Was a real Vercel deployment created?

**Not yet.** The fix is committed locally but NOT pushed. Deployment verification requires:
1. Founder to correct Vercel Production environment variables (VERCEL-002A)
2. Founder to authorize the push
3. Push to main → Vercel creates deployment → build runs → verify Ready

## 20. Does deployed commit equal the expected GitHub commit?

**Not yet.** Vercel is still at `c5e34e3` (Aug 16). The fix must be pushed for Vercel to deploy the new commit.
