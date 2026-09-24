# VERCEL-002 — Build Path Analysis

**Date:** 2026-08-19
**Mission:** VERCEL-002 — Forensic Deployment Failure Investigation & Safe Remediation

---

## 1. Build Commands in Use

### Vercel build command (`vercel.json`)

```json
"buildCommand": "npx prisma generate && next build"
```

### `package.json` scripts

| Script | Command |
|---|---|
| `build` | `prisma generate && cross-env NODE_OPTIONS=--max-old-space-size=8192 NEXT_TELEMETRY_DISABLED=1 next build` |
| `build:local` | `prisma generate && cross-env BUILD_PROFILE=local NODE_OPTIONS=--max-old-space-size=8192 NEXT_TELEMETRY_DISABLED=1 next build` |
| `build:ci` | `prisma generate && cross-env BUILD_PROFILE=ci NODE_OPTIONS=--max-old-space-size=12288 NEXT_TELEMETRY_DISABLED=1 next build` |
| `vercel-build` | `prisma generate && npm run build` (runs prisma generate twice — not used by Vercel since `vercel.json` overrides) |
| `postinstall` | `prisma generate` |

### Effective Vercel build sequence

1. `postinstall` hook: `prisma generate` (runs after dependency install)
2. `buildCommand` from `vercel.json`: `npx prisma generate && next build`
   - `npx prisma generate` (redundant with postinstall, but harmless)
   - `next build`

**Order:** Prisma generation happens BEFORE `next build`. Environment validation happens DURING `next build` (when `next.config.js` is loaded). So validation runs AFTER Prisma generation, not before.

---

## 2. When Environment Validation Runs

### Trigger point

`next.config.js` lines 1-10:

```javascript
if (process.env.NODE_ENV !== 'test' && !process.env.SKIP_ENV_VALIDATION) {
  try {
    require('./src/lib/env-validator').validateEnv()
  } catch (error) {
    console.error('\n⚠ Environment validation failed:')
    console.error(error.message)
    process.exit(1)
  }
}
```

### When this executes

`next.config.js` is loaded by Next.js at the very start of `next build` (and `next dev`, `next start`). The validation block runs **synchronously at module-load time**, before any webpack compilation begins.

### What `require('./src/lib/env-validator')` resolves to

**Confirmed via `require.resolve()`:**

```
require.resolve('./src/lib/env-validator')
→ C:\Dev\ImboniResto\src\lib\env-validator.js
```

Node's CommonJS module resolution tries extensions in order: `.js`, `.json`, `.node`. It does **NOT** try `.ts` unless `ts-node` is registered (it is not, in the Vercel build environment or in `next build`). Therefore `env-validator.js` is loaded, **not** `env-validator.ts`.

This is explicitly acknowledged in the `eefe4bc` commit message (2026-07-27):
> "Changed the NEXTAUTH_URL format check in both env-validator.js (the file actually loaded by next.config.js via require()) and env-validator.ts (kept consistent for direct imports)..."

---

## 3. Build-Time vs Runtime Requirements

### What `env-validator.js` (actually loaded) requires

**In production (`NODE_ENV=production` — which is what Vercel sets for `next build`):**

| Variable | Required at build? | Required at runtime? | Notes |
|---|---|---|---|
| `DATABASE_URL` | YES (by .js) | YES | Build does not connect to DB, but validator demands it. Prisma generate does not need it. |
| `NEXTAUTH_SECRET` | YES (by .js) | YES | Not needed to compile. Runtime security requirement. |
| `IREMBOPAY_PUBLIC_KEY` | **YES (by .js)** | Only if provider=irembo | **STALE** — .js hard-requires regardless of provider. |
| `IREMBOPAY_SECRET_KEY` | **YES (by .js)** | Only if provider=irembo | **STALE** |
| `IREMBOPAY_PAYMENT_ACCOUNT` | **YES (by .js)** | Only if provider=irembo | **STALE** |
| `IREMBOPAY_PAYMENT_ITEM_CODE` | **YES (by .js)** | Only if provider=irembo | **STALE** |
| `NEXTAUTH_URL` | No (warned only) | YES | Handled by `next.config.js` env fallback to `VERCEL_URL`. |
| `INTOUCH_*` | NO (by .js) | YES if provider=intouch | .js does NOT check these at all. .ts does. |

### Architectural assessment

**Is build-time payment credential validation appropriate?**

No. Payment credentials (`IREMBOPAY_*`, `INTOUCH_*`) are **runtime** requirements. The build (`next build`) does not connect to payment providers. It does not need these secrets to compile TypeScript, bundle JavaScript, or generate Prisma client code. Requiring them at build time:

1. Couples deployment success to runtime secret availability.
2. Forces all deployment environments (preview, production) to have provider credentials even when the provider is not active.
3. Creates the exact failure mode seen in VERCEL-002: a correct environment cleanup (removing inactive provider credentials) breaks the build.

**However**, the mission constraint is to NOT change production architecture. The existing architecture validates at build time. The smallest safe fix preserves this architecture while correcting the stale logic.

### What `env-validator.ts` (source of truth, NOT loaded at build) requires

The `.ts` file has the **correct** provider-conditional logic:

```typescript
const provider = (process.env.PAYMENTS_PROVIDER || 'intouch').toLowerCase()
if (provider === 'intouch') {
  // require INTOUCH_*
} else if (provider === 'irembo') {
  // require IREMBOPAY_*
}
```

This is the logic that SHOULD be in the `.js` file but is not.

---

## 4. The `next.config.js` env Block (NEXTAUTH_URL handling)

```javascript
env: {
  NEXTAUTH_URL: (process.env.NEXTAUTH_URL || '').trim()
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
    || 'https://imboniserve.com',
},
```

This:
1. Trims whitespace from `NEXTAUTH_URL` if set.
2. Falls back to `https://<VERCEL_URL>` for Vercel preview deployments.
3. Falls back to `https://imboniserve.com` as last resort.

**This block is correct and is NOT the cause of the failure.** The NEXTAUTH_URL warning ("is set but does not start with http or https") is a **warning only** in both `.js` and `.ts` validators — it does not throw. It is unrelated to the build failure.

---

## 5. Sentry Build Path

### Configuration

- `next.config.js` wraps config with `withSentryConfig` **only** when `SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN` is set (lines 211-226).
- `sentry.server.config.ts` and `sentry.client.config.ts` exist (standard `@sentry/nextjs`).
- No `instrumentation.ts` (project uses pages router, not required).

### Sentry warnings assessment

| Warning | Blocking? | Related to failure? |
|---|---|---|
| `sentry.server.config.ts` reminder | No — informational | No |
| Missing global error handler / instrumentation | No — pages router doesn't need it | No |

**Sentry is NOT involved in the deployment failure.** This was also confirmed in VERCEL-001.

---

## 6. Build Failure Causal Chain

```
Vercel build starts
  → NODE_ENV=production
  → vercel.json buildCommand: npx prisma generate && next build
    → prisma generate (succeeds — no env vars needed)
    → next build
      → Next.js loads next.config.js
        → line 2: NODE_ENV !== 'test' && !SKIP_ENV_VALIDATION  → true
        → line 4: require('./src/lib/env-validator').validateEnv()
          → Node resolves to env-validator.js (NOT .ts)
          → env-validator.js: isProd = true
          → requiredProd = [DATABASE_URL, NEXTAUTH_SECRET, IREMBOPAY_PUBLIC_KEY, IREMBOPAY_SECRET_KEY, IREMBOPAY_PAYMENT_ACCOUNT, IREMBOPAY_PAYMENT_ITEM_CODE]
          → IREMBOPAY_* missing in Vercel production env (removed during InTouch migration)
          → missing.length > 0 → throw Error("Missing required environment variables (production): IREMBOPAY_...")
        → catch block: console.error(error.message)
        → process.exit(1)
      → Build exits with code 1
  → Vercel deployment fails
```

---

## 7. Local Reproduction

### Test 1: Confirm .js is loaded, not .ts

```
$ node -e "console.log(require.resolve('./src/lib/env-validator'))"
→ C:\Dev\ImboniResto\src\lib\env-validator.js
```

### Test 2: Reproduce the exact failure (NODE_ENV=production, IREMBOPAY_* missing)

```
$ node -e "process.env.NODE_ENV='production';
  delete process.env.IREMBOPAY_PUBLIC_KEY;
  delete process.env.IREMBOPAY_SECRET_KEY;
  delete process.env.IREMBOPAY_PAYMENT_ACCOUNT;
  delete process.env.IREMBOPAY_PAYMENT_ITEM_CODE;
  process.env.DATABASE_URL='postgresql://x:x@localhost/x';
  process.env.NEXTAUTH_SECRET='a'.repeat(32);
  try { require('./src/lib/env-validator').validateEnv() }
  catch(e) { console.error('CAUGHT:', e.message) }"

→ CAUGHT: Missing required environment variables (production):
    - IREMBOPAY_PUBLIC_KEY
    - IREMBOPAY_SECRET_KEY
    - IREMBOPAY_PAYMENT_ACCOUNT
    - IREMBOPAY_PAYMENT_ITEM_CODE
```

**The exact Vercel failure is reproduced locally.** The `.js` validator throws when `IREMBOPAY_*` is missing in production mode, regardless of `PAYMENTS_PROVIDER`.

### Test 3: Confirm .ts is NOT loaded at build time

Grep for imports of `env-validator` in `src/`:
- `src/pages/api/auth/resend-otp.ts` — comment reference only ("NEXTAUTH_SECRET is required by env-validator")
- `src/lib/services/auth-otp.service.ts` — comment reference only
- **Zero `import` or `require` statements** of `env-validator` in application code.

The `.ts` file is not imported by any runtime module. It is effectively dead code at build time and runtime. The `.js` file is the only validator that executes.

---

## 8. Build Path Conclusion

| Question | Answer |
|---|---|
| What exact build command ran on Vercel? | `npx prisma generate && next build` (from `vercel.json`) |
| Does validation happen before or after Prisma generate? | After — validation runs when `next.config.js` loads during `next build`. |
| Which validator file executes? | `env-validator.js` (confirmed via `require.resolve`). |
| Is the `.ts` validator loaded at build? | No. |
| Is the `.ts` validator imported at runtime? | No — zero import statements found. |
| Is NEXTAUTH_URL involved in the failure? | No — it is a warning only in both files. |
| Is Sentry involved in the failure? | No. |
| Is the failure reproducible locally? | Yes — exact error reproduced. |
| Is build-time payment credential validation architecturally appropriate? | No — but the fix preserves existing architecture per mission constraints. |
