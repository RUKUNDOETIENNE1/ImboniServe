# PE-001A Security Remediation Report

| Field | Value |
|---|---|
| Date | 2026-08-10 |
| Scope | All security fixes applied in PE-001A |

## Remediation Summary

| # | Issue | Severity | Source | Fix | Verification |
|---|---|---|---|---|---|
| 1 | Default QR secret fallback | CRITICAL | PE-001 | `resolveSecret()` fail-closed in production | 7 regression tests |
| 2 | Default JWT secret fallback | CRITICAL | PE-001 | `resolveSecret()` fail-closed in production | 7 regression tests |
| 3 | Trial hash secret empty fallback | HIGH | PE-001A audit | `getTrialHashSecret()` fail-closed in production | 1 test + code review |
| 4 | Auth OTP secret empty fallback | HIGH | PE-001A audit | `getAuthSecret()` fail-closed in production | Code review |
| 5 | Resend OTP secret empty fallback | HIGH | PE-001A audit | Fail-closed guard added | Code review |
| 6 | OTP generation with Math.random() | MEDIUM | PE-001A audit | Replaced with `crypto.randomInt()` | Code review |
| 7 | IremboPay sandbox API default | HIGH | PE-001 | Fail-closed: throws if IREMBOPAY_API_BASE missing in production | 3 tests |
| 8 | MTN MoMo sandbox default | HIGH | PE-001 | Fail-closed: throws if MTN_MOMO_ENVIRONMENT missing in production | 3 tests |
| 9 | Cron auth bypass (referral-lifecycle) | CRITICAL | PE-001A cron audit | Changed `if (cronSecret && ...)` to `if (!cronSecret \|\| ...)` | Code review |
| 10 | Cron auth bypass (reservation-reminders) | CRITICAL | PE-001A cron audit | Standardized to Bearer auth, fail-closed | Code review |
| 11 | Cron auth non-standard (subscription-reminders) | HIGH | PE-001A cron audit | Standardized to Bearer auth, fail-closed | Code review |
| 12 | Cron auth non-standard (invite-maintenance) | HIGH | PE-001A cron audit | Standardized to Bearer auth, fail-closed | Code review |

## Detailed Fixes

### Fix 1-2: QR/JWT Secret Fail-Closed (qr-token.service.ts)

**Before:**
```typescript
const QR_SECRET = process.env.IMBONI_QR_SECRET || 'default-qr-secret-change-in-production';
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'default-jwt-secret';
```

**After:**
```typescript
function resolveSecret(envVar: string, devDefault: string, label: string): string {
  const value = process.env[envVar]
  if (value) return value
  if (isProduction) {
    throw new Error(`SECURITY FATAL: ${envVar} is not set in production...`)
  }
  console.warn(`⚠️  SECURITY WARNING: ${envVar} is not set...`)
  return devDefault
}
const QR_SECRET = resolveSecret('IMBONI_QR_SECRET', 'default-qr-secret-change-in-production', 'QR token')
const JWT_SECRET = resolveSecret('NEXTAUTH_SECRET', 'default-jwt-secret', 'JWT access token')
```

**Tests:** 7 tests in `tests/reliability/pe-001a-secret-fallback.test.ts`

### Fix 3: Trial Hash Secret Fail-Closed (trial-eligibility.service.ts)

**Before:**
```typescript
const secret = process.env.TRIAL_HASH_SECRET || ''
```

**After:**
```typescript
function getTrialHashSecret(): string {
  const v = process.env.TRIAL_HASH_SECRET
  if (v) return v
  if (_isProd) {
    throw new Error('SECURITY FATAL: TRIAL_HASH_SECRET is not set in production...')
  }
  return ''
}
```

### Fix 4-5: Auth OTP/Resend OTP Secret Fail-Closed

**Before:**
```typescript
crypto.createHash('sha256').update(otp + (process.env.NEXTAUTH_SECRET || '')).digest('hex')
```

**After:**
```typescript
function getAuthSecret(): string {
  const v = process.env.NEXTAUTH_SECRET
  if (v) return v
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SECURITY FATAL: NEXTAUTH_SECRET is not set...')
  }
  return ''
}
```

### Fix 6: Crypto-Secure OTP Generation

**Before:**
```typescript
const code = Math.floor(100000 + Math.random() * 900000).toString()
```

**After:**
```typescript
const code = crypto.randomInt(100000, 999999).toString()
```

### Fix 7-8: Payment Sandbox Fail-Closed

**IremboPay service:** Added IIFE that throws in production if `IREMBOPAY_API_BASE` is not set.

**MTN MoMo service:** Added IIFE that throws in production if `MTN_MOMO_ENVIRONMENT` is not set.

**Tests:** 8 tests in `tests/reliability/pe-001a-payment-sandbox.test.ts`

### Fix 9-12: Cron Auth Standardization

All 4 cron endpoints now use the standard pattern:
```typescript
const authHeader = req.headers.authorization
const expectedSecret = process.env.CRON_SECRET
if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
  return res.status(401).json({ error: 'Unauthorized' })
}
```

**Tests:** 4 tests in `tests/security/pe-001a-legacy-credentials.test.ts`

## Test Results

| Test File | Tests | Result |
|---|---|---|
| pe-001a-secret-fallback.test.ts | 7 | ALL PASS |
| pe-001a-payment-sandbox.test.ts | 8 | ALL PASS |
| pe-001a-legacy-credentials.test.ts | 4 | ALL PASS |
| **Total new tests** | **19** | **ALL PASS** |

## Items NOT Fixed (Intentional)

| Item | Reason |
|---|---|
| Payment provider empty string fallbacks (intouch.provider, irembopay.provider) | These are in the provider config layer, not the service layer. The providers default to empty strings which will cause API errors (not silent sandbox). The env-validator already requires these. |
| Math.random() for non-security IDs (report IDs, conversation IDs) | These are not security-sensitive. Timestamp + random is sufficient for uniqueness. |
| CAPTCHA test mode | Properly guarded by `CAPTCHA_TEST_MODE === 'true'` flag. |
| Dev payment simulation | Properly guarded by `NODE_ENV !== 'production'`. |

## Conclusion

12 security issues remediated. 19 regression tests added. All tests pass. Production build succeeds. No new regressions.
