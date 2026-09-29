# VERCEL-002C — Guardian Scheduler Options

**Date:** 2026-08-19
**Mission:** VERCEL-002C — Guardian Scheduler & Deployment Compatibility

---

## 1. Current Guardian Scheduling Architecture (Forensic Findings)

### 1.1 Two Scheduling Mechanisms Exist

**Mechanism A: In-process scheduler (`src/lib/cron.ts`)**

```
CronService.scheduleGuardianEvaluation()
  → setInterval(tick, 2 * 60 * 1000)   // every 2 minutes
  → 30-second offset from Promise Engine tick
  → tick calls:
      GuardianService.evaluateActiveSignals()  // detect new cases from WARNING/CRITICAL promises
      GuardianService.verifyActiveCases()       // verify active cases → resolve/escalate
```

Guarding conditions in `CronService.start()`:
- `CRON_WORKER !== 'true'` → skip (requires explicit opt-in)
- `VERCEL === '1'` → skip (never runs on Vercel)
- `NODE_ENV !== 'production'` → skip (module-level check)

**Status on Vercel:** SKIPPED (`VERCEL === '1'`).
**Status on Railway worker:** Would run IF `CRON_WORKER=true`, BUT `worker-start.ts` does NOT import `cron.ts`, so CronService is never started on Railway.

**Mechanism B: Vercel cron (`vercel.json`)**

```json
{ "path": "/api/cron/guardian", "schedule": "*/2 * * * *" }
```

Calls `/api/cron/guardian` which runs the same two methods. Authenticated via `CRON_SECRET` Bearer token.

**Status:** REJECTED by Vercel Hobby plan (sub-daily cron not allowed). This is the root cause of VERCEL-002B.

### 1.2 Promise Engine Is the Upstream — Also Needs Frequent Evaluation

```
Promise Engine (evaluateActivePromises)
  → evaluates ON_TRACK/WARNING/CRITICAL promises
  → transitions states (ON_TRACK → WARNING → CRITICAL)
  → produces WARNING/CRITICAL signals
    → Guardian (evaluateActiveSignals)
      → detects cases from WARNING/CRITICAL promises
      → intervenes, verifies, learns
```

**Promise Engine evaluation is ONLY in the in-process scheduler** (`schedulePromiseEvaluation()`, every 2 minutes). There is NO Vercel cron and NO API route for Promise Engine evaluation.

This means: even if Guardian's Vercel cron worked, Guardian would have no signals to process because Promise Engine isn't evaluating promises to produce WARNING/CRITICAL states.

### 1.3 Existing Infrastructure Available

| Infrastructure | Evidence | Status |
|---|---|---|
| Vercel (Hobby) | Deployed, hosting imboniserve.com | Active, but deployment broken |
| Railway worker | `Dockerfile.worker`, `worker-start.ts` with Railway comments | Code exists; deployment status unverified |
| Upstash Redis | `REDIS_URL` in env-validator, used by BullMQ, rate limiting, cache, watchdog | Code references it; Vercel env status unverified |
| GitHub repo | `RUKUNDOETIENNE1/ImboniServe` | Active, receiving pushes |
| `CRON_SECRET` | Used by all 18 cron API endpoints | In Vercel environment (verified in VERCEL-002A) |
| `cronAuth` middleware | `src/lib/middleware/cronAuth.ts` — Bearer token, x-cron-secret, query param | Available for reuse |
| Redis lock pattern | `document-replay.service.ts` — `SET key token EX ttl NX` | Available for reuse |
| Heart Pulse events | 10 Guardian event types already cataloged | Available for observability |

### 1.4 Guardian Idempotency (Already Implemented)

| Protection | Mechanism | Location |
|---|---|---|
| Duplicate case creation | Unique constraint on `idempotencyKey = guardian:case:${promiseId}:${signalType}` | `detect()` |
| P2002 handling | Catches unique constraint violation, returns null | `detect()` |
| Notification dedup | 15-minute window (`GUARDIAN_NOTIFICATION_DEDUP_MINUTES`) | `intervene()` |
| Batch limit | 200 promises/cases per tick (`GUARDIAN_BATCH_LIMIT`) | `evaluateActiveSignals()`, `verifyActiveCases()` |
| Error isolation | Per-promise/per-case try-catch, one failure doesn't stop others | Both methods |

**Missing:** No concurrency lock to prevent overlapping execution if two scheduler triggers fire simultaneously.

---

## 2. What Exactly Must Happen Every ~2 Minutes

### 2.1 The Evaluation Cycle

Every ~2 minutes, TWO things must happen:

1. **Promise Engine evaluation** (`evaluateActivePromises()`):
   - Query all promises in `ON_TRACK`, `WARNING`, `CRITICAL` states (batch limit 200)
   - For each promise, evaluate elapsed time against thresholds
   - Transition states if thresholds crossed (ON_TRACK → WARNING → CRITICAL)
   - Publish Heart Pulse events on transitions

2. **Guardian evaluation** (`evaluateActiveSignals()` + `verifyActiveCases()`):
   - Query all promises in `WARNING`, `CRITICAL` states (batch limit 200)
   - For each, check Guardian mode (OFF/SHADOW/ASSIST)
   - If not OFF, process signal: detect → understand → decide → intervene
   - Query all active Guardian cases (DETECTED through VERIFYING, batch limit 200)
   - For each, verify: check if promise recovered, breached, or still active
   - Resolve cases as appropriate

### 2.2 Cadence Requirement

| Question | Answer |
|---|---|
| Every Guardian case evaluated every 2 min? | No — only ACTIVE cases (DETECTED through VERIFYING) and WARNING/CRITICAL promises |
| Only active cases? | Yes — resolved/breached/cleared cases are not re-evaluated |
| Only Promise Engine risks? | Yes — Guardian detects from WARNING/CRITICAL promise states |
| Batch evaluation? | Yes — batch limit 200 per tick |
| Minimum required cadence? | ~2 minutes for timely intervention before breach |
| Is daily acceptable? | NO — a service promise may breach within minutes, not hours. Daily evaluation would miss the vast majority of breach windows. |

### 2.3 Why Daily Is Unacceptable

Service promises have `warningAfterMinutes` and `breachAfterMinutes` thresholds. A typical promise might warn at 10 minutes and breach at 20 minutes. With daily evaluation:
- A promise that starts at 09:00 and breaches at 09:20 would not be detected until 01:00 the next day
- That's 15 hours and 40 minutes after the breach
- Guardian's entire purpose is to intervene BEFORE breach, not 16 hours after

The 2-minute cadence ensures Guardian detects warnings within 2 minutes of the threshold crossing, leaving adequate time for intervention before breach.

---

## 3. Options Evaluated

### Option A: In-process scheduler on Railway worker

**Mechanism:** Add `import '@/lib/cron'` to `worker-start.ts`. Set `CRON_WORKER=true` on Railway. The existing `CronService.scheduleGuardianEvaluation()` and `schedulePromiseEvaluation()` run every 2 minutes.

| Criterion | Value |
|---|---|
| Cadence | 2 minutes (exact) |
| Reliability | High — Railway keeps worker running; setInterval is reliable |
| Security | No external API exposure — evaluation runs in-process |
| Cost | $0 — uses existing Railway worker (if deployed) |
| Complexity | Minimal — one import line + one env var |
| Vercel compatibility | ✅ Removes invalid cron from vercel.json; Vercel deploys normally |
| Guardian semantics | Unchanged — same code path as originally designed |
| Promise Engine | Preserved — runs in same process, same cadence |
| Concurrency risk | Low — only one worker process; but needs lock if scaled |
| Deployment dependency | Requires Railway worker to be deployed and running |

**Risk:** If Railway worker is not deployed, Guardian gets no frequent evaluation. Need a fallback.

### Option B: External scheduler invoking protected API

**Mechanism:** Use an external free cron service (cron-job.org, GitHub Actions, etc.) to call `/api/cron/guardian` and a new `/api/cron/promise-evaluation` endpoint every 2-5 minutes.

| Criterion | Value |
|---|---|
| Cadence | 2-5 minutes (depends on service; GitHub Actions min 5 min) |
| Reliability | Medium — external services can delay or miss runs |
| Security | ✅ Authenticated via `CRON_SECRET` Bearer token (already implemented) |
| Cost | $0 — free tiers available |
| Complexity | Low — just configure external service |
| Vercel compatibility | ✅ No Vercel cron needed |
| Guardian semantics | Unchanged — same API endpoint, same code |
| Promise Engine | Requires new API route (`/api/cron/promise-evaluation`) |
| Concurrency risk | Medium — external service might retry or fire duplicate requests |
| Deployment dependency | Requires external account setup (violates "do not create accounts") |

**Risk:** Mission constraint: "Do not create accounts." Setting up cron-job.org or similar requires a new account. GitHub Actions is available but has 5-minute minimum and unreliable timing.

### Option C: Vercel daily cron + Railway worker in-process scheduler (HYBRID)

**Mechanism:**
1. Remove `*/2 * * * *` from vercel.json
2. Add daily Guardian housekeeping cron (`0 1 * * *`) to vercel.json — Hobby-compatible
3. Add daily Promise Engine cron (`0 0 * * *`) to vercel.json — Hobby-compatible
4. Add `import '@/lib/cron'` to `worker-start.ts` — Railway runs 2-minute ticks
5. Create `/api/cron/promise-evaluation` API route — for external triggering if needed
6. Add Redis concurrency lock to both cron endpoints

| Criterion | Value |
|---|---|
| Cadence | 2 minutes (Railway) + daily fallback (Vercel) |
| Reliability | High — Railway primary + Vercel daily fallback |
| Security | ✅ Both endpoints authenticated via CRON_SECRET |
| Cost | $0 — uses existing Railway + Vercel |
| Complexity | Moderate — import + API route + Redis lock + daily crons |
| Vercel compatibility | ✅ All Vercel crons are daily (Hobby-compatible) |
| Guardian semantics | Unchanged — same service code, same evaluation methods |
| Promise Engine | Preserved — runs on Railway (2-min) + Vercel daily fallback |
| Concurrency risk | Low — Redis lock prevents duplicate execution |
| Deployment dependency | Railway worker for 2-min cadence; Vercel daily as fallback |

**Risk:** If Railway is not deployed, Guardian degrades to daily (not 2-minute). But daily is a functional fallback, and the founder can deploy the Railway worker.

### Option D: Upstash QStash

**Mechanism:** Use Upstash QStash (serverless scheduler) to call the API endpoints on a schedule.

| Criterion | Value |
|---|---|
| Cadence | Configurable (2 minutes possible) |
| Reliability | High — managed service |
| Security | ✅ QStash supports Bearer token auth |
| Cost | Free tier: 100 messages/day. 2-min cadence = 720 messages/day. Exceeds free tier. |
| Complexity | Moderate — QStash setup + API |
| Vercel compatibility | ✅ No Vercel cron needed |
| Guardian semantics | Unchanged |
| Promise Engine | Requires new API route |
| Concurrency risk | Low — QStash handles dedup |
| Deployment dependency | Requires Upstash account (may already have one for Redis) |

**Risk:** Free tier insufficient (100 messages/day vs 720 needed). Paid tier costs money. Mission constraint: "Do not change billing."

### Option E: Vercel-compatible architecture separating deployment from execution

**Mechanism:** Remove all Guardian-related cron from vercel.json. Guardian evaluation is triggered exclusively by the Railway worker's in-process scheduler. Vercel only handles the web application.

| Criterion | Value |
|---|---|
| Cadence | 2 minutes (Railway only) |
| Reliability | Medium — no fallback if Railway is down |
| Security | ✅ No external API exposure |
| Cost | $0 |
| Complexity | Minimal — just remove cron and add import |
| Vercel compatibility | ✅ No Guardian cron in vercel.json at all |
| Guardian semantics | Unchanged |
| Promise Engine | Preserved on Railway |
| Concurrency risk | Low — single worker |
| Deployment dependency | Fully dependent on Railway worker |

**Risk:** No fallback. If Railway is not deployed or goes down, Guardian stops entirely.

### Option F: GitHub Actions scheduled workflow

**Mechanism:** Add a GitHub Actions workflow with `schedule: cron: '*/5 * * * *'` that calls the API endpoints via curl with `CRON_SECRET` stored as a GitHub secret.

| Criterion | Value |
|---|---|
| Cadence | 5 minutes (GitHub Actions minimum) |
| Reliability | Low — GitHub Actions cron is frequently delayed by 10-30 minutes |
| Security | ✅ Uses GitHub Secrets for CRON_SECRET |
| Cost | $0 — free for public repos, 2000 min/month for private |
| Complexity | Low — one workflow file |
| Vercel compatibility | ✅ No Vercel cron needed |
| Guardian semantics | Unchanged |
| Promise Engine | Requires new API route |
| Concurrency risk | Low — GitHub Actions doesn't retry |
| Deployment dependency | Depends on GitHub Actions reliability |

**Risk:** 5-minute minimum (not 2-minute). GitHub Actions cron is notoriously unreliable for time-sensitive tasks. Not suitable for Guardian's operational requirement.

---

## 4. Comparison Matrix

| Option | Cadence | Reliability | Security | Cost | Complexity | Vercel Compatible | Recommendation |
|---|---|---|---|---|---|---|---|
| A: Railway in-process | 2 min | High | ✅ In-process | $0 | Minimal | ✅ | ✅ Strong |
| B: External scheduler | 2-5 min | Medium | ✅ Authenticated | $0 | Low | ✅ | ❌ Requires new account |
| C: Hybrid (Railway + Vercel daily) | 2 min + daily | High | ✅ Both auth | $0 | Moderate | ✅ | ✅ **BEST** |
| D: Upstash QStash | 2 min | High | ✅ | Paid | Moderate | ✅ | ❌ Exceeds free tier |
| E: Railway only | 2 min | Medium | ✅ | $0 | Minimal | ✅ | ⚠️ No fallback |
| F: GitHub Actions | 5 min | Low | ✅ | $0 | Low | ✅ | ❌ Unreliable timing |

---

## 5. Recommendation: Option C (Hybrid)

**Option C** is the best architecture because:

1. **Preserves 2-minute cadence** — Railway worker's in-process scheduler runs Promise Engine and Guardian every 2 minutes, exactly as designed.

2. **Vercel Hobby compatible** — All Vercel crons are daily (`0 N * * *`), which Hobby plan allows.

3. **Has a fallback** — If Railway worker is not deployed or goes down, Vercel daily crons ensure Guardian and Promise Engine still evaluate once per day (degraded but functional).

4. **Uses existing infrastructure** — Railway worker (`Dockerfile.worker`, `worker-start.ts`), Vercel cron, Redis for locks, `CRON_SECRET` for auth. No new accounts, no billing changes.

5. **Smallest safe change** — One import line in `worker-start.ts`, one new API route, Redis lock on cron endpoints, daily crons in vercel.json.

6. **Guardian semantics unchanged** — Same `evaluateActiveSignals()` and `verifyActiveCases()` methods, same decision policy, same intervention logic.

7. **Promise Engine preserved** — Runs in same process on Railway, same 2-minute cadence, same upstream signal flow.

8. **Concurrency protected** — Redis lock prevents duplicate execution if both Railway and Vercel daily cron fire simultaneously.

9. **Observable** — Heart Pulse events for scheduler ticks (last run, duration, cases evaluated).

10. **Fail-safe** — Scheduler failure doesn't corrupt cases, create duplicate interventions, or falsely resolve cases. Guardian's existing idempotency (unique constraints, dedup windows) plus the new Redis lock ensures safe failure.
