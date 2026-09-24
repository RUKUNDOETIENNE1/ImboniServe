# VERCEL-001 — Deployment Build Failure Forensic Remediation Report

**Date:** 2026-08-16  
**Status:** ✅ Resolved  
**Exposing commit:** `f999c09` (CONTENT-002 — editorial growth platform phase a)  
**Fix location:** `next.config.js` — webpack externals for native binary packages  

---

## 1. Root Cause

The Vercel build failed with:

```
Module parse failed: Cannot parse JSON: Expected double-quoted property name in JSON
at position 245 (line 13 column 1) while parsing '{
    "include": [
        "index.js",
 '
```

**Exact file being parsed:** `node_modules/@ffprobe-installer/ffprobe/tsconfig.json`

This file contains TypeScript compiler configuration with comments and/or trailing commas that are valid in tsconfig.json (TypeScript's own parser) but **invalid as strict JSON** for webpack's `JsonParser`.

### Why webpack tried to parse it

The `@ffprobe-installer/ffprobe` package uses `require.context()` to locate platform-specific binaries. When webpack encounters this, it scans the package directory and attempts to parse every file — including `tsconfig.json` — as a JSON module. Since the file contains TypeScript-specific syntax (comments, trailing commas), webpack's strict JSON parser fails.

### Import chain that triggered the failure

```
src/pages/blog/[slug].tsx          (CONTENT-002 — new page)
  → src/lib/content/detail-page.tsx    (CONTENT-002 — new module)
    → src/lib/content/platform-media.service.ts (CONTENT-002 — new module)
      → src/lib/services/storage.service.ts     (pre-existing — since initial commit)
        → @ffprobe-installer/ffprobe            (pre-existing — native binary installer)
          → webpack scans directory → hits tsconfig.json → JSON parse failure
```

---

## 2. Reproduction

Running `npx next build` locally reproduced the exact error:

```
Module parse failed: Cannot parse JSON: Expected double-quoted property name in JSON
at position 245 (line 13 column 1) while parsing '{ "include": [ "index.js", '
Import trace for requested module:
./node_modules/@ffprobe-installer/ffprobe/tsconfig.json
./node_modules/@ffprobe-installer/ffprobe/ sync ^.*\/.*$
./node_modules/@ffprobe-installer/ffprobe/index.js
./src/lib/services/storage.service.ts
./src/lib/content/platform-media.service.ts
./src/lib/content/detail-page.tsx
```

A secondary error also surfaced:

```
Module build failed: UnhandledSchemeError: Reading from "node:fs" is not handled by plugins
```

Both errors originate from the same root cause: webpack attempting to bundle native binary installer packages that should only run in Node.js at runtime.

---

## 3. Fix Applied

**File:** `next.config.js`  
**Lines:** 119-130  

Added webpack externals configuration to prevent bundling of native binary installer packages:

```javascript
const nativeBinaryPackages = {
  '@ffprobe-installer/ffprobe': 'commonjs @ffprobe-installer/ffprobe',
  '@ffmpeg-installer/ffmpeg': 'commonjs @ffmpeg-installer/ffmpeg',
}
config.externals = config.externals || []
if (Array.isArray(config.externals)) {
  config.externals.push(nativeBinaryPackages)
}
```

This tells webpack to treat these packages as CommonJS `require()` calls at runtime rather than attempting to bundle them. The packages provide binary paths (`ffprobeInstaller.path`, `ffmpegInstaller.path`) that are only needed at runtime on the server.

### Why `commonjs` prefix

The first attempt used plain string externals (e.g., `'@ffprobe-installer/ffprobe'`), which caused webpack to generate `module.exports = @ffprobe-installer/ffprobe` — invalid JavaScript syntax. The `commonjs` prefix tells webpack to generate `module.exports = require("@ffprobe-installer/ffprobe")` instead.

---

## 4. NEXTAUTH_URL Configuration

**Status:** Already properly handled — no changes needed.

### Current configuration

`next.config.js` (lines 85-89):
```javascript
env: {
  NEXTAUTH_URL: (process.env.NEXTAUTH_URL || '').trim()
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
    || 'https://imboniserve.com',
},
```

This:
1. Trims whitespace from `NEXTAUTH_URL` if set
2. Falls back to `https://<VERCEL_URL>` for Vercel preview deployments
3. Falls back to the production domain as last resort

`src/lib/env-validator.ts` (lines 149-155):
```typescript
if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.startsWith('http')) {
  console.warn('⚠️  NEXTAUTH_URL is set but does not start with http or https. It will be ignored at runtime.')
}
```

This warns (does not throw) if `NEXTAUTH_URL` is set without `http://` or `https://` prefix, preventing build failures for a non-secret value that isn't required to compile.

### Vercel environment variable guidance

Ensure `NEXTAUTH_URL` in Vercel project settings is set to `https://imboniserve.com` (production) or left unset for preview deployments (the `VERCEL_URL` fallback handles previews).

---

## 5. Sentry Configuration Assessment

**Status:** Adequate — no changes needed.

### Configuration inventory

| File | Purpose | Status |
|------|---------|--------|
| `sentry.server.config.ts` | Server-side Sentry init | Active — `@sentry/nextjs` standard |
| `sentry.client.config.ts` | Client-side Sentry init | Active — `@sentry/nextjs` standard |
| `src/lib/monitoring/sentry.server.ts` | Server init with DSN guard | Active — conditional on `SENTRY_DSN` |
| `src/lib/monitoring/sentry.client.ts` | Client init with consent | Active — conditional on `NEXT_PUBLIC_SENTRY_DSN` + consent |
| `src/lib/sentry.ts` | Centralized error tracking stub | Deferred — Sentry init commented out (post-v1) |
| `next.config.js` | `withSentryConfig` wrapper | Conditional — only when `SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN` is set |

### Warnings assessment

- **"sentry.server.config.ts" warning**: This is `@sentry/nextjs` reminding about the config file. It **exists** and is properly loaded. Non-blocking.
- **"Missing global error handler"**: This warning appears when Sentry SDK expects an `instrumentation.ts` file (Next.js 13+ app router). This project uses **pages router**, so `instrumentation.ts` is not required. Non-blocking.
- **`withSentryConfig` options**: `silent: true` suppresses noisy build output. `widenClientFileUpload` and `transpileClientSDK` are standard options.

### Conclusion

Sentry configuration is properly guarded — it only activates when DSN environment variables are present. The warnings are informational and do not affect build or runtime. No remediation required.

---

## 6. CONTENT-002 Regression Check

**Question:** Did CONTENT-002 cause, expose, or is it unrelated to the failure?

**Answer:** CONTENT-002 **exposed** a latent issue.

### Evidence

1. `src/lib/services/storage.service.ts` with its `@ffprobe-installer/ffprobe` import existed since the **initial commit** (`d6e6ab2`).
2. No prior page imported `storage.service.ts` through a server-side webpack-bundled path that triggered the `require.context()` scan.
3. CONTENT-002 added `src/lib/content/detail-page.tsx` → `src/lib/content/platform-media.service.ts` → `storage.service.ts`, creating the first webpack-traced import chain to the ffprobe package.
4. The ffprobe package's `require.context()` triggered webpack to scan its directory, hitting the malformed `tsconfig.json`.

### Conclusion

The bug was **latent** — present since the initial commit but never triggered because no bundled page imported the ffprobe chain. CONTENT-002 did not introduce the bug; it created the import path that exposed it.

---

## 7. Build Verification

| Check | Result |
|-------|--------|
| `npx next build` | ✅ Exit code 0 — 392 pages generated |
| Content unit tests (`tests/content/`) | ✅ 58/58 passed |
| Regression test (`tests/build/native-binary-externals.test.ts`) | ✅ 4/4 passed |
| Prisma schema | ✅ Valid (build includes `npx prisma generate`) |
| TypeScript | ⚠️ Pre-existing errors in unrelated test files (not in production code) |

---

## 8. Regression Test

Added `tests/build/native-binary-externals.test.ts` to verify that `next.config.js` continues to mark native binary packages as webpack externals.

Tests verify:
- `@ffprobe-installer/ffprobe` is listed as external with `commonjs` prefix
- `@ffmpeg-installer/ffmpeg` is listed as external with `commonjs` prefix
- Externals are pushed into `config.externals` array

---

## 9. Files Changed

| File | Change |
|------|--------|
| `next.config.js` | Added webpack externals for native binary packages |
| `tests/build/native-binary-externals.test.ts` | New regression test |

---

## 10. Forensic Questions Answered

1. **What was the exact malformed JSON source?** — `node_modules/@ffprobe-installer/ffprobe/tsconfig.json`
2. **Why was webpack parsing it?** — `require.context()` in the package caused webpack to scan all files in the directory
3. **What import chain triggered it?** — `detail-page.tsx → platform-media.service.ts → storage.service.ts → @ffprobe-installer/ffprobe`
4. **Was it caused by CONTENT-002?** — No, it was exposed by CONTENT-002. The ffprobe import existed since the initial commit.
5. **What was the fix?** — Mark `@ffprobe-installer/ffprobe` and `@ffmpeg-installer/ffmpeg` as webpack externals with `commonjs` prefix
6. **Does the build pass now?** — Yes, exit code 0, all 392 pages generated
7. **Is NEXTAUTH_URL properly configured?** — Yes, `next.config.js` trims and falls back to `VERCEL_URL` then production domain
8. **Are Sentry warnings blocking?** — No, they are informational. Config files exist and are properly guarded.
9. **Were any production infrastructure changes made?** — No, only `next.config.js` webpack config and a test file
10. **Were any dependencies upgraded?** — No
11. **Is there a regression test?** — Yes, `tests/build/native-binary-externals.test.ts` (4 tests, all passing)
12. **Is the project ready for Vercel deployment?** — Yes, the build passes locally with the same build command (`npx prisma generate && next build`) used by Vercel
