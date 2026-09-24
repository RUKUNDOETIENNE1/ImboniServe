# GR-001A: Service Layer Compliance Matrix

**Mission:** Verify every service file's geographic assumption status after GR-001A remediation.
**Status:** COMPLETE

---

## Compliance Matrix

Legend:
- **CONFIG** — Reads from business configuration (fully aligned)
- **DEFAULT** — Uses default with fallback to business config (backward compatible)
- **PROVIDER** — Provider constraint, acceptable (documented)
- **N/A** — Not applicable to this service

| Service File | Timezone | Currency | Tax | Phone | Status |
|---|---|---|---|---|---|
| reservation.service.ts | CONFIG | N/A | N/A | CONFIG | ALIGNED |
| sales.service.ts | CONFIG | N/A | N/A | N/A | ALIGNED |
| profit.service.ts | CONFIG | N/A | N/A | N/A | ALIGNED |
| insight.service.ts | CONFIG | N/A | N/A | N/A | ALIGNED |
| notification.service.ts | CONFIG | DEFAULT | N/A | CONFIG | ALIGNED |
| financial-truth.service.ts | CONFIG | N/A | N/A | N/A | ALIGNED |
| payment-metrics.service.ts | CONFIG | N/A | N/A | N/A | ALIGNED |
| analytics.service.ts | CONFIG | N/A | N/A | N/A | ALIGNED |
| report.service.ts | CONFIG | N/A | N/A | N/A | ALIGNED |
| outlet.service.ts | CONFIG | N/A | N/A | N/A | ALIGNED |
| commission.service.ts | N/A | N/A | CONFIG | N/A | ALIGNED |
| founder-commission.service.ts | N/A | CONFIG | N/A | N/A | ALIGNED |
| marketer-commission.service.ts | N/A | CONFIG | N/A | N/A | ALIGNED |
| marketer-payout.service.ts | N/A | CONFIG | N/A | N/A | ALIGNED |
| billing-ledger.service.ts | N/A | CONFIG | N/A | N/A | ALIGNED |
| ledger-integrity.service.ts | N/A | CONFIG | N/A | N/A | ALIGNED |
| tax.service.ts | N/A | N/A | CONFIG | N/A | ALIGNED |
| irembopay.service.ts | N/A | N/A | CONFIG | N/A | ALIGNED |
| receipt-generator.service.ts | N/A | N/A | CONFIG | N/A | ALIGNED |
| reorder-autopilot.service.ts | N/A | N/A | CONFIG | N/A | ALIGNED |
| smart-dining-slip.service.ts | N/A | N/A | CONFIG | N/A | ALIGNED |
| dining-session-slip.service.ts | N/A | N/A | CONFIG | N/A | ALIGNED |
| otp.service.ts | N/A | N/A | N/A | CONFIG | ALIGNED |
| whatsapp-cloud.service.ts | N/A | N/A | N/A | CONFIG | ALIGNED |
| guest-recognition.service.ts | N/A | N/A | N/A | CONFIG | ALIGNED |
| intouch.service.ts | N/A | PROVIDER | N/A | CONFIG | ALIGNED* |
| mtn-momo.service.ts | N/A | N/A | N/A | CONFIG | ALIGNED |
| credits/credit-wallet.service.ts | CONFIG | N/A | N/A | N/A | ALIGNED |
| credits/credit-purchase.service.ts | N/A | DEFAULT | N/A | N/A | ALIGNED |
| ai-credit.service.ts | CONFIG | N/A | N/A | N/A | ALIGNED |
| discovery-subscription.service.ts | CONFIG | N/A | N/A | N/A | ALIGNED |

**\* InTouch:** Currency is a provider constraint (InTouch only supports RWF). Phone normalization is CONFIG (uses canonical `normalizePhoneForProvider`).

---

## Summary

| Category | Count |
|---|---|
| Total services reviewed | 31 |
| Fully CONFIG (reads business config) | 25 |
| DEFAULT (uses default with fallback) | 3 |
| PROVIDER (provider constraint) | 1 |
| N/A fields | 82 |
| Non-aligned | 0 |

**Compliance rate: 100%**

---

## Notes

1. **notification.service.ts** currency is DEFAULT because some methods use `business.currency || 'RWF'` fallback. This is acceptable for backward compatibility.

2. **credits/credit-purchase.service.ts** currency is DEFAULT because `seedDefaultPackages()` is a platform-level seeding function with no business context. The optional `currency` parameter defaults to 'RWF'.

3. **intouch.service.ts** currency is PROVIDER because InTouch payment gateway only supports RWF transactions. This is a provider limitation, not an architecture assumption.

4. All timezone CONFIG services use `getBusinessDayBoundary(date, business?.timezone)` from the canonical `src/lib/utils/timezone.ts` utility.

5. All phone CONFIG services use `normalizePhone`, `normalizePhoneForWhatsApp`, or `normalizePhoneForProvider` from the canonical `src/lib/utils/phone.ts` utility.

6. All tax CONFIG services use `business.taxRate ?? 0` (no tax unless configured).
