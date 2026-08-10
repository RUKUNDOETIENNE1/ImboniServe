# PR-001 Payment Activation Verification

| Field | Value |
|---|---|
| Date | 2026-08-09 |
| Scope | Config presence + code path verification from dev workstation |

## Payment Provider Configuration

### Active Provider

| Item | Value | Status |
|---|---|---|
| PAYMENTS_PROVIDER | "irembo" | CONFIGURED |
| IREMBOPAY_API_BASE | https://api.irembopay.com | CONFIGURED (production URL) |
| IREMBOPAY_PUBLIC_KEY | Set (redacted) | CONFIGURED |
| IREMBOPAY_SECRET_KEY | Set (redacted) | CONFIGURED |
| IREMBOPAY_PAYMENT_ACCOUNT | LOYALTECH-RWF | CONFIGURED |
| IREMBOPAY_PAYMENT_ITEM_CODE | Set (redacted) | CONFIGURED |
| IREMBOPAY_API_VERSION | "2" | CONFIGURED |
| IREMBOPAY_WEBHOOK_TOLERANCE_SECONDS | "300" | CONFIGURED |

### InTouch (Mobile Money)

| Item | Value | Status |
|---|---|---|
| INTOUCH_API_URL | https://www.intouchpay.co.rw/api | CONFIGURED |
| INTOUCH_USERNAME | Set (redacted) | CONFIGURED |
| INTOUCH_ACCOUNT_NO | Set (redacted) | CONFIGURED |
| INTOUCH_PASSWORD | Set (redacted) | CONFIGURED |
| INTOUCH_WEBHOOK_USERNAME | NOT SET | NOT CONFIGURED |
| INTOUCH_WEBHOOK_PASSWORD | NOT SET | NOT CONFIGURED |

### MTN MoMo

| Item | Value | Status |
|---|---|---|
| MTN_MOMO_ENVIRONMENT | sandbox | CONFIGURED (SANDBOX — NOT PRODUCTION) |
| MTN_MOMO_API_URL | https://sandbox.momodeveloper.mtn.com | CONFIGURED (SANDBOX) |
| MTN_MOMO_API_KEY | Set (redacted) | CONFIGURED |
| MTN_MOMO_SUBSCRIPTION_KEY | Set (redacted) | CONFIGURED |

### Airtel Money

| Item | Status |
|---|---|
| AIRTEL_MONEY_API_KEY | Set (redacted) — CONFIGURED |
| AIRTEL_MONEY_API_URL | Set — CONFIGURED |
| airtel-money.service.ts | MISSING — code not found |

## Payment Code Paths

| File | Size | Status |
|---|---|---|
| src/lib/services/irembopay.service.ts | 6803 bytes | VERIFIED (exists) |
| src/lib/services/intouch.service.ts | 10343 bytes | VERIFIED (exists) |
| src/lib/services/mtn-momo.service.ts | 6070 bytes | VERIFIED (exists) |
| src/lib/services/airtel-money.service.ts | — | MISSING |
| src/lib/services/payment-provider.ts | — | MISSING |
| src/pages/api/webhooks/intouch.ts | 13504 bytes | VERIFIED (exists) |
| src/pages/api/webhooks/irembopay.ts | 710 bytes | VERIFIED (exists) |
| src/lib/services/payment-completion.service.ts | — | VERIFIED (exists) |

## Financial Chain (Code Path)

```
Payment completed
  → payment-completion.service.ts
  → Sale created (Sale table)
  → FinancialLedgerEntry created (FinancialLedgerEntry table)
  → Dashboard revenue updated (via Sale aggregation)
  → Z-Report updated (via close-day.ts aggregation)
```

### Financial Chain Verification (Dev)

| Link | Status | Evidence |
|---|---|---|
| Payment → Sale | VERIFIED (dev) | GPV Test Restaurant: 4 payments, 4 sales |
| Sale → Ledger | VERIFIED (dev) | GPV Test Restaurant: 4 sales, 3 ledger entries (1 sale may predate ledger) |
| Sale → Dashboard | VERIFIED (dev) | dashboard/stats.ts reads from Sale aggregation |
| Sale → Z-Report | VERIFIED (dev) | close-day.ts aggregates from Sale + FinancialLedgerEntry |
| Payment → Ledger | VERIFIED (code) | payment-completion.service.ts creates FinancialLedgerEntry at lines 117, 154 |

## Production Payment Verification

| Item | Status | Evidence |
|---|---|---|
| Production credentials (IremboPay) | FOUNDER-ACTION-REQUIRED | API base is production URL, but cannot verify if credentials are production or sandbox/test |
| Production credentials (InTouch) | FOUNDER-ACTION-REQUIRED | Credentials set, but webhook auth NOT configured |
| Production credentials (MTN MoMo) | NOT PRODUCTION | MTN_MOMO_ENVIRONMENT=sandbox |
| Currency correct | CONFIGURED-BUT-NOT-VERIFIED | IREMBOPAY_PAYMENT_ACCOUNT=LOYALTECH-RWF suggests RWF |
| Amount calculation | VERIFIED (code) | Code paths calculate amounts from menu prices + tax |
| Success callback | NOT VERIFIED | Webhook code exists but not tested against production |
| Failure callback | NOT VERIFIED | Webhook code exists but not tested against production |
| Real transaction test | NOT ACCESSIBLE | Cannot safely perform real payment from dev environment |

## Issues

1. **MTN MoMo is in sandbox mode** — `MTN_MOMO_ENVIRONMENT=sandbox`. Must be switched to production for real payments.

2. **InTouch webhook auth not configured** — `INTOUCH_WEBHOOK_USERNAME` and `INTOUCH_WEBHOOK_PASSWORD` are NOT SET. The .env.production.template requires these for webhook Basic Auth. Without them, InTouch webhooks may be unauthenticated.

3. **Airtel Money service code is missing** — `airtel-money.service.ts` does not exist, but `AIRTEL_MONEY_API_KEY` and `AIRTEL_MONEY_API_URL` are set in .env. This provider is configured but not implemented.

4. **IremboPay credentials unverified** — The API base URL is production (`https://api.irembopay.com`), but I cannot verify if the credentials are production-grade or test credentials. Founder must confirm.

5. **No real transaction test performed** — Per PR-001 rules: "If a provider cannot be safely tested with a real transaction, document that explicitly rather than pretending it passed." No real transaction test was performed.

## Conclusion

Payment code paths exist and the financial chain is verified in development. However:
1. **MTN MoMo is sandbox** — not production-ready
2. **InTouch webhook auth is missing** — security risk
3. **Airtel Money is not implemented** — configured but no code
4. **IremboPay credentials unverified** — founder must confirm production status
5. **No real transaction test** — cannot verify end-to-end payment from dev

**Status: 🔴 Payment NOT VERIFIED for production. Multiple configuration issues.**
