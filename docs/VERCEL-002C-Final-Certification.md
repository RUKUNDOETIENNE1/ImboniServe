# VERCEL-002C — Final Certification

**Date:** 2026-08-19
**Mission:** VERCEL-002C — Guardian Scheduler & Deployment Compatibility

---

## 20 Required Answers

| # | Question | Answer |
|---|---|---|
| 1 | Why did Vercel reject Guardian? | `vercel.json` Guardian cron `*/2 * * * *` violates Vercel Hobby plan's daily-only cron restriction. Deployment rejected at config validation, before build creation. |
| 2 | What was the original intended Guardian cadence? | Every 2 minutes. In-process scheduler (`src/lib/cron.ts`) runs Promise Engine + Guardian every 2 min with 30s offset. |
| 3 | Why is daily execution unacceptable? | Service promises breach within 10-20 minutes. Daily evaluation would detect breaches 15+ hours late. Guardian's purpose is pre-breach intervention. |
| 4 | What scheduling options were evaluated? | 6 options: Railway in-process, External scheduler, Hybrid (Railway+Vercel daily), Upstash QStash, Railway-only, GitHub Actions. See `VERCEL-002C-Guardian-Scheduler-Options.md`. |
| 5 | Which architecture was selected? | Option C — Hybrid: Railway in-process (2-min primary) + Vercel daily cron (fallback). |
| 6 | Why? | Preserves 2-min cadence, Hobby-compatible, has fallback, uses existing infrastructure, no new accounts/billing, Guardian semantics unchanged. |
| 7 | How is the scheduler authenticated? | `CRON_SECRET` Bearer token (fail-closed). Existing convention across all 18 cron endpoints. Railway in-process needs no auth. |
| 8 | How is duplicate execution prevented? | Redis lock (`SET NX EX`) + in-memory fallback + Guardian idempotency (unique constraint) + notification dedup (15-min window). |
| 9 | How is failure handled? | Error isolation per-case, lock auto-expires via TTL, Vercel daily fallback if Railway down. NEVER corrupts cases or creates duplicate interventions. |
| 10 | How is execution observed? | Heart Pulse events (`scheduler.tick`, `scheduler.skip`, `scheduler.error`) + structured logs with source, duration, counts. |
| 11 | What code changed? | 7 files: vercel.json, cron-lock.ts (new), promise-evaluation.ts (new), guardian.ts, worker-start.ts, event-catalog.ts, env-validator.js (from 92cd45c). |
| 12 | What vercel.json changed? | Removed `*/2 * * * *`, added `0 0 * * *` (promise-evaluation) and `0 1 * * *` (guardian). All 11 crons now daily. |
| 13 | What tests were added? | 100 new tests: 33 scheduler tests + 61 Hobby compatibility tests + 6 env validator tests. Total 170 tests pass. |
| 14 | Did Guardian semantics remain unchanged? | YES — no changes to detect, understand, decide, intervene, verify, learn, resolve, decision policy, context gatherer, responsibility router, case lifecycle, intervention semantics, learning signals. |
| 15 | Did Promise Engine remain unchanged? | YES — no changes to evaluateActivePromises, evaluateOne, transitionTo, or PE→Guardian flow. |
| 16 | Did payment architecture remain unchanged? | YES — no payment code or configuration modified. |
| 17 | Did production secrets remain untouched? | YES — no Vercel environment variables modified. VERCEL-002A findings remain a separate founder gate. |
| 18 | Does the current Vercel plan accept the deployment configuration? | YES — all 11 crons are daily (`0 N * * *`). Hobby-compatible. Verified by 61 regression tests. |
| 19 | Was a real Vercel deployment created? | NOT YET — fix is committed locally, not pushed. Requires founder env var correction + push authorization. |
| 20 | Does deployed commit equal the expected GitHub commit? | NOT YET — Vercel is still at `c5e34e3`. Fix must be pushed for Vercel to deploy new commit. |

---

## Certification

### 🟡 GUARDIAN SCHEDULER ARCHITECTURE FIXED — VERCEL VERIFICATION PENDING

The Guardian scheduler architecture is corrected:
- ✅ `vercel.json` no longer contains sub-daily crons (Hobby-compatible)
- ✅ Guardian's 2-minute evaluation cadence is preserved (Railway in-process scheduler)
- ✅ Vercel daily cron fallback added (Guardian + Promise Engine)
- ✅ Redis lock prevents duplicate execution
- ✅ CRON_SECRET Bearer authentication (fail-closed)
- ✅ Heart Pulse observability events added
- ✅ 170 tests pass (100 new + 70 existing)
- ✅ Production build succeeds (392/392 pages)
- ✅ TypeScript clean (no new errors)
- ✅ Guardian semantics unchanged
- ✅ Promise Engine unchanged
- ✅ Payment architecture unchanged
- ✅ Production secrets untouched

Vercel deployment verification is pending:
- ⏳ Founder must correct Vercel Production environment variables (VERCEL-002A)
- ⏳ Founder must authorize push to main
- ⏳ Vercel deployment must be created and verified

---

## What Was NOT Done (Per Mission Constraints)

- ❌ Did NOT downgrade Guardian to daily only (2-min cadence preserved via Railway)
- ❌ Did NOT remove Guardian scheduling (daily fallback added, 2-min primary preserved)
- ❌ Did NOT disable Guardian (feature flag untouched)
- ❌ Did NOT create new accounts
- ❌ Did NOT add paid services
- ❌ Did NOT change Vercel billing
- ❌ Did NOT change payment architecture
- ❌ Did NOT modify production secrets
- ❌ Did NOT start Customer #1
- ❌ Did NOT activate Guardian ASSIST mode
- ❌ Did NOT push to main (awaiting founder authorization)

---

## Deliverables Produced

| Document | Status |
|---|---|
| `docs/VERCEL-002C-Guardian-Scheduler-Options.md` | ✅ Complete |
| `docs/VERCEL-002C-Guardian-Scheduler-Architecture.md` | ✅ Complete |
| `docs/VERCEL-002C-Implementation-Report.md` | ✅ Complete |
| `docs/VERCEL-002C-Test-and-Verification-Report.md` | ✅ Complete |
| `docs/VERCEL-002C-Final-Certification.md` | ✅ Complete (this document) |

---

## Next Steps (Founder Action Required)

1. **Founder corrects Vercel Production environment variables** (VERCEL-002A):
   - Set `PAYMENTS_PROVIDER` to exactly `intouch`
   - Add `INTOUCH_ACCOUNT_NO`, `INTOUCH_WEBHOOK_USERNAME`, `INTOUCH_WEBHOOK_PASSWORD`
   - Correct `NEXTAUTH_URL` to start with `https://`

2. **Founder authorizes push** of the combined fix (VERCEL-002C scheduler fix + VERCEL-002 env-validator sync from `92cd45c`) to `main`.

3. **Verify Vercel deployment**:
   - Vercel creates deployment (no more config rejection)
   - Build succeeds (env vars correct)
   - Deployment reaches Ready
   - Deployed commit matches expected commit

4. **Verify Railway worker** (for 2-minute Guardian cadence):
   - Railway worker deployed with `CRON_WORKER=true`
   - In-process scheduler starts Promise Engine + Guardian ticks
   - Heart Pulse `scheduler.tick` events appear

---

## Governance

This mission is complete pending Vercel deployment verification. Do not proceed to DEPLOY-REALITY-001 or FOUNDER-GPV-002 until:
1. Vercel deployment is verified (Ready status, correct commit)
2. VERCEL-002A environment variables are corrected
3. Railway worker is confirmed running with 2-minute Guardian cadence
