# PE-001 Security Baseline Report

| Field | Value |
|---|---|
| Date | 2026-08-10 |
| Scope | Repository-wide security audit (src/ directory) |

## Security Findings Summary

| Severity | Count | Status |
|---|---|---|
| CRITICAL | 2 | REQUIRE FIX before production |
| HIGH | 9 | REQUIRE CONFIGURATION before production |
| MEDIUM | 3 | REVIEW + ensure production env vars set |
| LOW | 1 | DOCUMENT |
| SAFE/INTENTIONAL | ~85 | No action needed |

## CRITICAL Findings

### C1: Default QR Secret (qr-token.service.ts line 10)

```typescript
const QR_SECRET = process.env.IMBONI_QR_SECRET || 'default-qr-secret-change-in-production'
```

**Risk:** If IMBONI_QR_SECRET is not set in production, QR tokens are signed with a publicly known secret. Anyone can forge QR tokens.

**Classification:** Code-level risk — the fallback default is a known string in the repository.

**Production Action:** IMBONI_QR_SECRET MUST be set in production env vars. Additionally, consider modifying the code to throw an error in production if the secret is not set (rather than falling back to a default).

### C2: Default JWT Secret (qr-token.service.ts line 11)

```typescript
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'default-jwt-secret'
```

**Risk:** If NEXTAUTH_SECRET is not set, JWT tokens are signed with a publicly known secret. Session tokens can be forged.

**Classification:** Code-level risk — the fallback default is a known string.

**Note:** The env-validator (src/lib/env-validator.ts) requires NEXTAUTH_SECRET and will throw if it's missing. However, the qr-token.service.ts has its own fallback that bypasses the validator.

**Production Action:** NEXTAUTH_SECRET MUST be set in production env vars (already required by env-validator). Consider removing the fallback default in qr-token.service.ts.

## HIGH Findings

### H1-H5: Payment Sandbox Defaults (5 locations)

| File | Line | Default |
|---|---|---|
| src/lib/services/mtn-momo.service.ts | 50 | `process.env.MTN_MOMO_ENVIRONMENT \|\| 'sandbox'` |
| src/lib/services/mtn-momo.service.ts | 58-60 | sandbox URL vs production URL |
| src/lib/services/irembopay.service.ts | 56 | `process.env.IREMBOPAY_API_BASE \|\| 'https://api.sandbox.irembopay.com'` |
| src/lib/services/momo.service.ts | 79-80 | sandbox URL + environment |
| src/lib/services/momo.service.ts | 239-240 | sandbox URL + environment |

**Risk:** If payment env vars are not set, the system defaults to sandbox mode. Real payments would be processed in sandbox (test mode), which could confuse customers and operators.

**Classification:** Code-level risk — defaults to sandbox rather than failing.

**Production Action:** All payment env vars MUST be explicitly set in production. Consider modifying code to throw in production if payment env vars are not set.

### H6-H9: Payment Service Sandbox Defaults (4 locations in payment.service.ts)

| File | Line | Default |
|---|---|---|
| src/lib/services/payment.service.ts | 103 | sandbox MTN MoMo URL |
| src/lib/services/payment.service.ts | 110 | sandbox X-Target-Environment |
| src/lib/services/payment.service.ts | 255 | sandbox MTN MoMo URL |
| src/lib/services/payment.service.ts | 259 | sandbox X-Target-Environment |

**Risk:** Same as H1-H5 — defaults to sandbox if env vars not set.

**Production Action:** Set all MTN_MOMO_* env vars in production, OR confirm MTN MoMo is NOT REQUIRED and remove/ignore these code paths.

## MEDIUM Findings

### M1: Payment Simulation Mode (checkout/tap-and-leave.ts lines 163-169)

```typescript
const simulate = (req.query?.simulate === '1' || (req.body && req.body.simulate === true))
if (process.env.NODE_ENV !== 'production' && simulate) {
  // Bypasses InTouch payment gateway
}
```

**Risk:** In non-production, payments can be simulated (bypassing the real gateway). This is properly guarded by `NODE_ENV !== 'production'`.

**Classification:** Intentional dev feature, properly guarded.

**Production Action:** Ensure NODE_ENV=production in production env. The guard is sufficient.

### M2: Development-Only Endpoint (dev/bootstrap-tap-leave.ts lines 13-15)

```typescript
if (process.env.NODE_ENV === 'production') {
  return res.status(403).json(errorResponse('Forbidden in production'))
}
```

**Risk:** Dev bootstrap endpoint exists but is properly blocked in production.

**Classification:** Intentional dev feature, properly guarded.

**Production Action:** Ensure NODE_ENV=production. The guard is sufficient.

### M3: Legacy Credentials Auth Provider (auth/[...nextauth].ts line 150)

```typescript
if (process.env.ALLOW_LEGACY_CREDENTIALS === 'true' && process.env.NODE_ENV !== 'production')
```

**Risk:** Legacy credential bypass is guarded by BOTH ALLOW_LEGACY_CREDENTIALS=true AND non-production NODE_ENV. Double-guarded.

**Classification:** Intentional dev feature, double-guarded.

**Production Action:** Set ALLOW_LEGACY_CREDENTIALS=false in production (belt and suspenders).

## LOW Findings

### L1: Client-Side Auth Debug Flag (login.tsx line 12)

```typescript
const AUTH_DEBUG = process.env.NEXT_PUBLIC_AUTH_DEBUG === 'true'
```

**Risk:** If NEXT_PUBLIC_AUTH_DEBUG is set to "true" in production, auth debug information is exposed to the client.

**Classification:** Requires explicit env var to activate.

**Production Action:** Do NOT set NEXT_PUBLIC_AUTH_DEBUG in production env vars.

## SAFE/Intentional Findings

### Localhost URL Fallbacks (7 locations)

All are conditional fallbacks (`process.env.APP_URL || 'http://localhost:3000'`). Safe if APP_URL and NEXTAUTH_URL are set in production.

| File | Line |
|---|---|
| src/lib/services/cache.service.ts | 32 |
| src/pages/api/support/conversations/index.ts | 102 |
| src/lib/services/slip-pdf-generator.service.ts | 6 |
| src/lib/services/table-invite.service.ts | 52 |
| src/pages/api/webhooks/twilio/whatsapp.ts | 18 |
| src/components/dashboard/DashboardQRButton.tsx | 14 |
| src/lib/services/qr-generator.service.ts | 4 |

**Production Action:** Set APP_URL and NEXTAUTH_URL to production domain in env vars.

### Puppeteer Sandbox Flags (5 locations)

`args: ['--no-sandbox', '--disable-setuid-sandbox']` — these are Puppeteer/Chrome browser sandbox flags, NOT payment sandbox flags. Safe and required for PDF generation in serverless environments.

### CORS

No wildcard CORS configurations found. Content-Security-Policy is strict in production mode.

### Rate Limiting

No rate limiting bypasses found. Rate limiting middleware exists (src/lib/middleware/withRateLimit.ts).

### Admin Commercial Bypass

`src/lib/commercial/commercial-policy.ts` lines 61-62: Admin users bypass commercial restrictions for support purposes. This is intentional and documented.

## Production Security Baseline Requirements

| # | Requirement | Status | Action |
|---|---|---|---|
| 1 | NODE_ENV=production | NOT SET | FOUNDER: Set in Vercel env vars |
| 2 | ALLOW_LEGACY_CREDENTIALS=false | true (WRONG) | FOUNDER: Set to false in Vercel env vars |
| 3 | NEXTAUTH_URL=https://imboniserve.com | localhost | FOUNDER: Set in Vercel env vars |
| 4 | APP_URL=https://imboniserve.com | localhost | FOUNDER: Set in Vercel env vars |
| 5 | NEXTAUTH_SECRET set (32+ chars) | Set (dev) | FOUNDER: Regenerate for production |
| 6 | IMBONI_QR_SECRET set | Set (dev) | FOUNDER: Regenerate for production |
| 7 | TRIAL_HASH_SECRET set | Set (dev) | FOUNDER: Regenerate for production |
| 8 | CRON_SECRET set | Set (dev) | FOUNDER: Regenerate for production |
| 9 | No localhost URLs in production | Conditional fallbacks | FOUNDER: Set APP_URL + NEXTAUTH_URL |
| 10 | No sandbox payment config | Defaults to sandbox | FOUNDER: Set all payment env vars |
| 11 | HTTPS enforced | Vercel-managed | Automatic with Vercel deployment |
| 12 | Secure cookies | next.config.js + middleware.ts | Verified in code |
| 13 | CSRF protection | src/lib/middleware/csrf.ts exists | Verified in code (new, untracked) |
| 14 | Webhook authentication | InTouch: Basic Auth + HMAC; IremboPay: HMAC | FOUNDER: Set webhook auth env vars |
| 15 | No hardcoded secrets | 2 CRITICAL fallback defaults | FOUNDER: Set env vars (consider code fix) |

## Security Middleware

| Component | File | Status |
|---|---|---|
| Auth middleware | src/lib/middleware/auth.middleware.ts | EXISTS (modified) |
| CSRF middleware | src/lib/middleware/csrf.ts | EXISTS (new, untracked) |
| Rate limiting | src/lib/middleware/withRateLimit.ts | EXISTS |
| Security headers | next.config.js (production) | EXISTS (strict CSP, HSTS) |
| Cookie security | src/middleware.ts | EXISTS (secure flags in production) |

## Conclusion

The codebase has strong security foundations (strict CSP, HSTS, CSRF middleware, rate limiting, webhook auth). However, 2 CRITICAL code-level risks (default secrets in qr-token.service.ts) and 9 HIGH risks (sandbox payment defaults) must be addressed before production deployment. All are mitigated by setting the correct production environment variables, but the code-level fallbacks should ideally be hardened to fail-fast in production.

**Status: 2 CRITICAL + 9 HIGH findings require action before production deployment.**
