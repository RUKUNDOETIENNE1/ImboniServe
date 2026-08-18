# PE-001A Payment Sandbox Audit

| Field | Value |
|---|---|
| Date | 2026-08-10 |
| Scope | All payment sandbox default locations in src/ |

## Audit Findings (9 locations)

### Active Services (FIXED)

| # | File | Line | Default | Fix | Tests |
|---|---|---|---|---|---|
| 1 | irembopay.service.ts | 56 | `IREMBOPAY_API_BASE \|\| 'https://api.sandbox.irembopay.com'` | Fail-closed IIFE: throws in production if not set | 3 tests |
| 2 | mtn-momo.service.ts | 50 | `MTN_MOMO_ENVIRONMENT \|\| 'sandbox'` | Fail-closed IIFE: throws in production if not set | 3 tests |

### Deprecated Services (DOCUMENTED — not modified)

| # | File | Line | Default | Status | Reason |
|---|---|---|---|---|---|
| 3 | momo.service.ts | 79 | `MTN_MOMO_API_URL \|\| 'https://sandbox.momodeveloper.mtn.com'` | DOCUMENTED | DEPRECATED — routing via InTouch |
| 4 | momo.service.ts | 80 | `MTN_MOMO_ENVIRONMENT \|\| 'sandbox'` | DOCUMENTED | DEPRECATED — routing via InTouch |
| 5 | momo.service.ts | 239 | `MTN_MOMO_API_URL \|\| 'https://sandbox.momodeveloper.mtn.com'` | DOCUMENTED | DEPRECATED — routing via InTouch |
| 6 | momo.service.ts | 240 | `MTN_MOMO_ENVIRONMENT \|\| 'sandbox'` | DOCUMENTED | DEPRECATED — routing via InTouch |
| 7 | payment.service.ts | 103 | `MTN_MOMO_API_URL \|\| 'https://sandbox.momodeveloper.mtn.com'` | DOCUMENTED | DEPRECATED — routing via InTouch |
| 8 | payment.service.ts | 110 | `MTN_MOMO_ENVIRONMENT \|\| 'sandbox'` | DOCUMENTED | DEPRECATED — routing via InTouch |
| 9 | payment.service.ts | 255, 259 | Sandbox URL + environment defaults | DOCUMENTED | DEPRECATED — routing via InTouch |

## Active Provider Analysis

### InTouch Provider (intouch.provider.ts)

| Env Var | Default | Production Behavior |
|---|---|---|
| INTOUCH_API_URL | `https://www.intouchpay.co.rw/api` | Production URL (safe default) |
| INTOUCH_USERNAME | `''` | Empty → API error (fail-closed via API) |
| INTOUCH_ACCOUNT_NO | `''` | Empty → API error (fail-closed via API) |
| INTOUCH_PARTNER_PASSWORD | `''` | Empty → API error (fail-closed via API) |

**Assessment:** Active provider defaults to production URL. Empty credentials cause API errors, not silent sandbox. Safe.

### IremboPay Provider (irembopay.provider.ts)

| Env Var | Default | Production Behavior |
|---|---|---|
| IREMBOPAY_API_URL | `https://api.irembo.com` | Production URL (safe default) |
| IREMBOPAY_MERCHANT_ID | `''` | Empty → API error (fail-closed via API) |
| IREMBOPAY_API_KEY | `''` | Empty → API error (fail-closed via API) |
| IREMBOPAY_API_SECRET | `''` | Empty → API error (fail-closed via API) |

**Assessment:** Active provider defaults to production URL. Empty credentials cause API errors, not silent sandbox. Safe.

## Production Behavior

### After PE-001A Fixes

```
Production startup
  ↓
irembopay.service.ts loads
  ↓
IREMBOPAY_API_BASE not set?
  YES → THROW: "SECURITY FATAL: IREMBOPAY_API_BASE is not set in production"
  NO  → Use configured production URL
  ↓
mtn-momo.service.ts loads (if used)
  ↓
MTN_MOMO_ENVIRONMENT not set?
  YES → THROW: "SECURITY FATAL: MTN_MOMO_ENVIRONMENT is not set in production"
  NO  → Use configured environment
```

### Before PE-001A (Vulnerable)

```
Production startup
  ↓
irembopay.service.ts loads
  ↓
IREMBOPAY_API_BASE not set?
  YES → Silently use https://api.sandbox.irembopay.com (SANDBOX!)
  ↓
Real payments processed against sandbox → MONEY LOST
```

## Test Results

| Test File | Tests | Result |
|---|---|---|
| pe-001a-payment-sandbox.test.ts | 8 | ALL PASS |

## Recommendation for Deprecated Services

The deprecated services (momo.service.ts, payment.service.ts) should be removed in a future cleanup phase. They are not used by the active provider factory. Until removal, they are documented as DEPRECATED and should not be called in production.

## Conclusion

2 active service sandbox defaults fixed with fail-closed guards. 7 deprecated service defaults documented (not modified — routing via InTouch). 8 regression tests added. Production cannot silently use sandbox payment configuration.
