# PE-001A Secret Fallback Audit

| Field | Value |
|---|---|
| Date | 2026-08-10 |
| Scope | Repository-wide audit of src/ for secret fallbacks and hardcoded credentials |

## Audit Methodology

Searched src/ directory (excluding tests/, scripts/, docs/) for:
- Environment variables with string literal fallbacks (`process.env.X || 'default'`)
- JWT/HMAC/crypto operations with fallback keys
- Webhook/payment/auth secrets with fallback defaults
- `Math.random()` used for security-sensitive operations
- Authentication bypass patterns

## Complete Findings

### CRITICAL (2) — FIXED

| # | File | Line | Finding | Status |
|---|---|---|---|---|
| 1 | qr-token.service.ts | 10 | `IMBONI_QR_SECRET \|\| 'default-qr-secret-change-in-production'` | FIXED — fail-closed |
| 2 | qr-token.service.ts | 11 | `NEXTAUTH_SECRET \|\| 'default-jwt-secret'` | FIXED — fail-closed |

### HIGH (7) — FIXED (5) / DOCUMENTED (2)

| # | File | Line | Finding | Status |
|---|---|---|---|---|
| 3 | trial-eligibility.service.ts | 24, 29 | `TRIAL_HASH_SECRET \|\| ''` | FIXED — fail-closed |
| 4 | auth-otp.service.ts | 26, 31 | `NEXTAUTH_SECRET \|\| ''` | FIXED — fail-closed |
| 5 | resend-otp.ts | 29 | `NEXTAUTH_SECRET \|\| ''` | FIXED — fail-closed |
| 6 | irembopay.provider.ts | 93-94 | `IREMBOPAY_API_KEY \|\| ''`, `IREMBOPAY_API_SECRET \|\| ''` | DOCUMENTED — empty string causes API error, not silent sandbox. env-validator requires these. |
| 7 | intouch.provider.ts | 68 | `INTOUCH_PARTNER_PASSWORD \|\| INTOUCH_PASSWORD \|\| ''` | DOCUMENTED — same as above. |
| 8 | intouch.service.ts | 50 | `INTOUCH_PASSWORD \|\| INTOUCH_PARTNER_PASSWORD \|\| ''` | DOCUMENTED — same as above. |
| 9 | irembopay.service.ts | 56 | `IREMBOPAY_API_BASE \|\| 'https://api.sandbox.irembopay.com'` | FIXED — fail-closed |

### MEDIUM (2) — FIXED (1) / DOCUMENTED (1)

| # | File | Line | Finding | Status |
|---|---|---|---|---|
| 10 | otp.service.ts | 12 | `Math.random()` for OTP generation | FIXED — `crypto.randomInt()` |
| 11 | otp/request.ts | 48 | `Math.random()` for OTP generation | FIXED — `crypto.randomInt()` |
| 12 | trial-eligibility.service.ts | 177-179 | `CAPTCHA_TEST_TOKEN \|\| ''` | DOCUMENTED — only active when `CAPTCHA_TEST_MODE === 'true'` |

### LOW / INTENTIONAL (15) — NO ACTION

| # | File | Finding | Classification |
|---|---|---|---|
| 13 | mtn-momo.service.ts | `MTN_MOMO_CURRENCY \|\| 'RWF'` | Intentional config default |
| 14 | mtn-momo.service.ts | `MTN_MOMO_TARGET_ENVIRONMENT \|\| 'mtnrwanda'` | Intentional config default |
| 15 | irembopay.service.ts | `IREMBOPAY_API_VERSION \|\| '2'` | Intentional config default |
| 16 | whatsapp-cloud.service.ts | `WHATSAPP_API_VERSION \|\| 'v18.0'` | Intentional config default |
| 17 | revenue-notification.service.ts | `SMTP_PORT \|\| '587'` | Intentional config default |
| 18 | revenue-notification.service.ts | `SMTP_FROM \|\| 'Imboni Serve <noreply@imboni.rw>'` | Intentional config default |
| 19 | receipt-generator.service.ts | `APP_URL \|\| 'https://imboni.rw'` | Intentional config default |
| 20 | index.tsx | `NEXT_PUBLIC_DISPLAY_CURRENCY \|\| 'RWF'` | Intentional public config |
| 21 | index.tsx | `NEXT_PUBLIC_SUPPORT_WHATSAPP_URL \|\| 'https://wa.me/...'` | Intentional public config |
| 22 | watchdog services | `NODE_ENV \|\| 'development'` | Intentional config default |
| 23 | tap-and-leave.ts | Dev payment simulation | Guarded by `NODE_ENV !== 'production'` |
| 24 | permission.middleware.ts | OWNER bypass for bootstrap | Intentional business logic |
| 25 | withSubscriptionCheck.ts | ADMIN/OWNER exempt from check | Intentional business logic |
| 26 | commercial-policy.ts | Admin bypass for support | Intentional business logic |

### FALSE POSITIVES (3)

| # | Files | Pattern | Classification |
|---|---|---|---|
| 27 | locales/*.json | "password", "token", "secret" | UI translation strings |
| 28 | pages/*.tsx | `type="password"` | HTML form input types |
| 29 | api/qr/*.ts | "token", "password" | Database column names |

### Math.random() for Non-Security Purposes (12) — NO ACTION

| File | Purpose | Risk |
|---|---|---|
| order/index.tsx | A/B testing visitor ID | None |
| multi-location-intelligence/report-builder.ts | Report ID | None |
| menu-intelligence/report-builder.ts | Report ID | None |
| kitchen-intelligence/report-builder.ts | Report ID | None |
| ai-copilot/service.ts | Conversation/message IDs | None |
| credit-consumption-engine.service.ts | Request ID | None |
| document-replay.service.ts | Redis lock token | Low (lock token, not auth) |
| session/initialize.ts | Session temp ID | None |
| kitchen-intelligence/report-builder.ts | Mock data | None |
| dashboard/die/analytics.tsx | Mock data | None |
| sales.service.ts | Order numbers | Low (timestamp-prefixed) |
| commission.service.ts | Invoice numbers | Low (timestamp-prefixed) |

## Summary

| Severity | Found | Fixed | Documented | False Positive |
|---|---|---|---|---|
| CRITICAL | 2 | 2 | 0 | 0 |
| HIGH | 7 | 5 | 2 | 0 |
| MEDIUM | 2 | 1 | 1 | 0 |
| LOW/Intentional | 15 | 0 | 15 | 0 |
| False Positive | 3 | 0 | 0 | 3 |
| Non-security Math.random | 12 | 0 | 12 | 0 |
| **Total** | **41** | **8** | **30** | **3** |

## Positive Security Observations

1. No hardcoded API keys (sk-, pk-, AIza, AKIA patterns) found
2. No credentials in connection strings
3. NEXTAUTH_SECRET validated for minimum length (32 chars) by env-validator
4. Cron endpoints use Bearer token authentication (now standardized)
5. Webhook signature verification implemented for IremboPay and WhatsApp
6. Payment simulation properly guarded by NODE_ENV
7. Auth OTP service already uses `crypto.randomInt()` (good practice, now replicated to OTP service)
8. WhatsApp webhook verification is fail-closed (returns false if app secret missing)
