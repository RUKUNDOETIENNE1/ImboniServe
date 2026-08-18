# PAY-001 — Customer #1 Payment Readiness Assessment

**Document:** PAY-001-Customer-1-Payment-Readiness-Assessment.md
**Phase:** PAY-001 — Sandbox Payment & Provider Verification
**Date:** 2026-08-13
**Status:** ENGINEERING READY — PRODUCTION ACTIVATION NOT AUTHORIZED

---

## 1. Purpose

Assess whether the ImboniServe payment path is ready for Customer #1 activation from an engineering perspective. This assessment does NOT authorize production deployment.

---

## 2. Engineering Readiness

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Payment architecture reviewed | ✅ READY | Forensic review of all payment components |
| InTouch provider implemented | ✅ READY | InTouchProvider with createPayment, handleWebhook, validateWebhook |
| Payment initiation API | ✅ READY | POST /api/payments/intouch/initiate with rate limiting, business context |
| Webhook handler hardened | ✅ READY | Basic Auth mandatory, HMAC optional, PII redaction, business isolation, amount validation |
| PaymentCompletionService canonical | ✅ READY | Atomic Sale + PaymentTransaction + FinancialLedgerEntry, idempotent |
| Status polling fallback | ✅ READY | GET /api/payments/intouch/status/[id] with business ownership check |
| Manual confirmation (CASH) | ✅ READY | POST /api/orders/[id]/confirm-payment with allowed methods |
| Financial truth chain | ✅ READY | Sale = Payment = Ledger = Dashboard = Close-Day = Executive (variance = 0) |
| Idempotency | ✅ READY | updateMany guards, P2002 handling, webhookVerified flag, idempotencyKey |
| Failure handling | ✅ READY | FAILED payment ≠ REVENUE, no false ledger entries |
| Business isolation | ✅ READY | All queries scoped by businessId, webhook checks sale.businessId |
| Currency handling | ✅ READY | Business currency respected, RWF default, not hardcoded |
| Fee structure | ✅ READY | 5% customer-facing, 3% gateway, 2% platform margin, net to business |
| Settlement intelligence | ✅ READY | MPCA-001B integration, non-blocking, SETTLEMENT_UNKNOWN |
| Regression | ✅ READY | 654 tests pass, 0 regressions |
| Build | ✅ READY | Production build succeeds, all payment routes compile |

---

## 3. What Is NOT Authorized

This certification does NOT authorize:

- ❌ Production deployment
- ❌ Customer #1 activation
- ❌ Production payment processing
- ❌ Production webhook configuration
- ❌ Production InTouch credentials
- ❌ Production settlement/withdrawal claims

The existing production blockers remain in effect.

---

## 4. Founder Action Required

Before founder-led sandbox testing can proceed, the following must be resolved:

1. **INTOUCH_WEBHOOK_USERNAME** — MISSING from .env → webhook returns 503
2. **INTOUCH_WEBHOOK_PASSWORD** — MISSING from .env → webhook returns 503
3. **PAYMENTS_PROVIDER** — Set to "irembo" in .env, should be "intouch" for InTouch testing
4. **Test phone number** — A phone number registered for MTN/Airtel Mobile Money with sufficient balance
5. **Webhook URL accessibility** — InTouch must be able to reach the webhook URL (localhost requires ngrok or similar tunnel)

---

## 5. Dependencies for Production Activation

Before the payment path can be activated in production:

1. **Production InTouch credentials** — Separate from sandbox/test credentials
2. **Production webhook URL** — Publicly accessible HTTPS endpoint
3. **Production webhook auth** — Strong username/password for Basic Auth
4. **Production database** — Migration applied to production PostgreSQL
5. **Production Pusher/Heart Pulse** — Real-time payment confirmations
6. **Production Sentry/observability** — Error monitoring for payment failures
7. **InTouch KYC/onboarding** — Merchant account approval for production
8. **Settlement/withdrawal verification** — Currently UNKNOWN, requires InTouch support confirmation
9. **Fee verification** — Actual gateway fee must be confirmed with InTouch
10. **Currency confirmation** — Confirm InTouch supports the business's currency

---

## 6. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Webhook not received | MEDIUM | HIGH | Status polling fallback, 30s timeout |
| Duplicate webhook | LOW | MEDIUM | Idempotency guards, webhookVerified flag |
| Amount mismatch | LOW | HIGH | Webhook validates sale.total === txn.amount |
| Business isolation breach | LOW | HIGH | Webhook checks sale.businessId === txn.businessId |
| False revenue from failed payment | LOW | HIGH | onPaymentFailure does NOT create ledger entry |
| Ledger creation failure | LOW | HIGH | Atomic transaction rolls back Sale COMPLETED |
| InTouch API downtime | MEDIUM | MEDIUM | Timeout handling, retry via webhook |
| Sandbox vs production behavior | HIGH | MEDIUM | No production claims from sandbox testing |

---

## 7. Recommendation

**Engineering certification: YELLOW**

The payment architecture is engineering-complete and verified through 51 automated tests. However, the webhook authentication credentials are not configured, and live sandbox testing has not been performed. The engineering work is ready for founder-led sandbox testing once the FOUNDER-ACTION-REQUIRED items are resolved.

---

## 8. Certification

The payment path is **ENGINEERING READY** for founder-led sandbox testing. Production activation is a separate decision that requires resolving existing production blockers and completing live sandbox verification.
