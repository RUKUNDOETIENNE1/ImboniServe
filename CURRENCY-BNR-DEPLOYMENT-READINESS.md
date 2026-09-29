# CURRENCY-BNR DEPLOYMENT READINESS

**Repository:** `C:\Dev\ImboniResto`
**Branch:** `main`
**HEAD:** `7bcd1db0b2050054c27bba597296741c334122af`
**Scope:** Secret hygiene + production deployment checklist for the Currency/BNR workstream.
**No code modified. Nothing staged, committed, or pushed.**

This report intentionally never contains the actual BNR API key value.

---

## 1. Secret Verification Results

| Check | Method | Result |
|-------|--------|--------|
| `.env.example` diff | `git diff -- .env.example` | Only `BNR_API_KEY=""` placeholder added. No secret. |
| All tracked files | `git grep -F <key>` | **0 matches** |
| Unstaged tracked diffs | `git diff` scan | **0 matches** |
| All untracked files | file-content scan | **0 matches** |
| Git history (all commits) | `git log --all -S<key>` | **0 matches** — key never entered history |
| `.env` gitignored | `git check-ignore` | `.gitignore:27` covers `.env`; `.gitignore:28` covers `.env*.local` |
| Key storage location | — | `.env` only (`BNR_API_KEY=...`), gitignored |

**Verdict: PASS.** The actual key exists in exactly one place: the local gitignored `.env` file. It is absent from `.env.example`, all tracked files, all untracked files, all reports, all tests, and all of git history.

**Note:** `.env.example` was re-edited in the IDE mid-session with the real key and was corrected again. The current committed diff is clean, but **re-run `git diff -- .env.example` immediately before any `git add`** to confirm it has not been reintroduced.

## 2. Production Environment Variable — Action Required

The single variable the implementation **requires** in production is:

```
BNR_API_KEY
```

- Sent by the BNR client as the `X-API-KEY` header (never in the URL, never logged).
- **Vercel → Project Settings → Environment Variables → Production** must contain `BNR_API_KEY` set to the real secret value.
- Copy the value from the local `.env` file or your secure secret store. It is not reproduced anywhere in this report or in Git.
- Also set it for **Preview** if you want BNR sync to run in preview deployments (optional).
- Missing `BNR_API_KEY` fails closed: `BnrClientConfigurationError` is thrown at request time before any request is sent.

## 3. Full Environment-Variable Checklist

| Name | Required? | Purpose | Safe default | Secret? |
|------|-----------|---------|--------------|---------|
| `BNR_API_KEY` | **Yes** (for BNR sync) | `X-API-KEY` auth header value | none — supply real key | **YES** |
| `CRON_SECRET` | **Yes** (already required by all cron endpoints) | Bearer auth on `/api/cron/*` incl. `bnr-sync` | none — existing shared secret | **YES** |
| `BNR_SYNC_ENABLED` | Yes (to activate) | Feature gate; cron returns `skipped` when not `"true"` | `"false"` | No |
| `BNR_API_BASE_URL` | Optional | BNR endpoint base URL | `https://fxrates.bnr.rw/ExchangeRate` | No |
| `BNR_TIMEOUT_MS` | Optional | HTTP timeout for BNR requests | `30000` | No |
| `BNR_QUOTATION_MODE` | Optional | Rate direction override | `RWF_PER_UNIT_OF_CURRENCY` (verified 2026-09-21) | No |
| `FX_MAX_RATE_AGE_HOURS` | Optional | Staleness window, display/reporting | `168` | No |
| `FX_MAX_PAYMENT_RATE_AGE_HOURS` | Optional | Staleness window, payment conversions | `48` | No |
| `FX_RATE_TYPE_PAYMENT` | Optional | Rate type for payment conversions | `AVERAGE` (pending accounting decision) | No |
| `FX_RATE_TYPE_DISPLAY` | Optional | Rate type for display/rates API | `AVERAGE` | No |
| `FX_RATE_TYPE_REFUND` | Optional | Rate type for refunds | `AVERAGE` | No |
| `FX_RATE_TYPE_REPORTING` | Optional | Rate type for reporting | `AVERAGE` | No |
| `REDIS_URL` | Optional (existing) | Enables Redis cron lock; in-memory fallback otherwise | existing | YES (existing) |

Removed (no longer used — superseded generic auth abstraction): `BNR_AUTH_MODE`, `BNR_AUTH_HEADER_NAME`, `BNR_AUTH_HEADER_VALUE`, `BNR_AUTH_QUERY_PARAM_NAME`, `BNR_AUTH_QUERY_PARAM_VALUE`, and the misnamed `X-API-KEY` env entry (renamed to `BNR_API_KEY` in `.env`).

**Startup validation:** `src/lib/env-validator.ts` does not require `BNR_API_KEY` at boot — correct behavior, since the cron is feature-gated and the client fails closed at request time. No validator change needed.

## 4. Pending Database Migrations

Two additive migrations must be applied before enabling `BNR_SYNC_ENABLED` or deploying the new code:

| Migration | Content | Destructive? |
|-----------|---------|--------------|
| `prisma/migrations/20260920130000_currency_bnr_phase3/` | `SupportedCurrency`, `CurrencyExchangeRate` tables, enums, `PaymentTransaction` FX snapshot columns | No — additive |
| `prisma/migrations/20260921120000_currency_bnr_phase4/` | `CurrencyExchangeRate.revision` column + revision-aware unique index (replaces Phase-3 unique index) | No — additive |

**Applied status: UNVERIFIED.** The configured database (`aws-1-eu-west-1.pooler.supabase.com`, Supabase pooler) was unreachable from this environment, so `_prisma_migrations` could not be queried. Confirm with:

```sql
SELECT migration_name FROM _prisma_migrations
WHERE migration_name LIKE '%currency_bnr%';
```

**Apply procedure (do NOT run without a snapshot/backup):**
```bash
npx prisma migrate deploy
```

Note: `vercel.json` `buildCommand` is `npx prisma generate && next build` — it does **not** run `migrate deploy`. Migrations must be applied manually or via CI before the deployment that enables BNR sync.

## 5. Go-Live Checklist

1. [ ] Re-verify `git diff -- .env.example` shows no secret, then commit per the logical groups in `CURRENCY-BNR-PHASE-4-FINALIZATION.md`
2. [ ] Snapshot/backup the database
3. [ ] `npx prisma migrate deploy` — confirm both `currency_bnr` migrations finish
4. [ ] Vercel Production env: set `BNR_API_KEY` (real secret — manual step)
5. [ ] Vercel Production env: confirm `CRON_SECRET` is already set (required by all cron endpoints)
6. [ ] Optional: set `FX_RATE_TYPE_PAYMENT` once accounting confirms BUYING/SELLING vs AVERAGE
7. [ ] Deploy the build
8. [ ] Set `BNR_SYNC_ENABLED=true` (or manually trigger `/api/cron/bnr-sync` once with `Authorization: Bearer <CRON_SECRET>` to smoke-test)
9. [ ] Verify `CurrencyExchangeRate` rows appear with `source='BNR'`, `status='ACTIVE'`, `revision=0`
10. [ ] Verify ingestion logs show `fetched/inserted/skipped` counts and zero unexpected `rejected`

## 6. Failure Modes If Misconfigured

| Missing config | Result |
|----------------|--------|
| `BNR_API_KEY` unset | `BnrClientConfigurationError`; cron returns 500; **no rates ingested, no crash loop, fail-closed** |
| `CRON_SECRET` unset | All cron endpoints return 401 (existing fail-closed behavior) |
| `BNR_SYNC_ENABLED` unset/false | Cron endpoint returns `{skipped: true}` — harmless no-op |
| Migrations not applied | BNR sync 500s on missing table; payment conversions on new FX columns fail closed — **apply migrations before enabling** |
| `FX_RATE_TYPE_*` unset | Defaults to AVERAGE — documented, auditable default |

## 7. Secret Handling Statement

The BNR API key was never printed in this report, never written to any tracked file, and never committed to git history. It resides only in `.env` (gitignored) under `BNR_API_KEY`. The Vercel Production environment must be configured **manually** with that value — this is an intentional human step.
