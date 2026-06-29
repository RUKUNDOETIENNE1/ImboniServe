# Operational Readiness — Recalculation (Phase 0.8D)

Date: June 22, 2026
Basis: Validated findings (Phase 0.8B-V) + Implemented fixes (Phase 0.8C) + Verified protections (Phase 0.8D)
Excluded: All prior audit noise

---

## Current Score (Recalibrated)

Component scores (0–100):
- Environment Governance: 85
- Payment Governance: 75
- Webhook Governance: 85
- Queue Governance: 78
- Scheduler Governance: 80

Weighted Overall: 81/100 (Production Readiness)

Rationale:
- + Webhook security hardening (InTouch HMAC + Basic Auth), idempotency on both providers
- + Reconciliation and DLQ alerting added
- + Env documentation for WhatsApp; env coverage otherwise stable
- ± Queue health improved with DLQ alerts; first-failure alerts still console-only
- − Pending user config for InTouch webhook credentials (see Blockers/Deferred)

---

## Blockers (Must Address)

- InTouch webhook credentials missing in production `.env`:
  - `INTOUCH_WEBHOOK_USERNAME`
  - `INTOUCH_WEBHOOK_PASSWORD`

Status: External/user action required (non-code). Does not block code deploys but blocks live payment webhook auth.

---

## Deferred Items (Tracked in Registry)

See `docs/DEFERRED_WORK_REGISTRY.md` for full list. Key items:
- Payment testing (InTouch sandbox, IremboPay live, end-to-end flows)
- Production configuration for InTouch webhook credentials
- Future monitoring (watchdog jobs, anomaly detection, advanced observability)

---

## Recommendation — GO / CAUTION / NO-GO

- Recommendation: GO with Monitoring (CAUTION)
- Score: 81/100
- Preconditions:
  - Configure InTouch webhook credentials in production before live payment callbacks
  - Ensure at least one alert channel is enabled (Slack or Email) in production

---

## Evidence Map

- Webhook Security
  - InTouch: `src/pages/api/webhooks/intouch.ts` — Basic Auth + HMAC validation + idempotency
  - IremboPay: `src/pages/api/webhooks/irembopay.ts` — Signature validation + idempotency
- Cron Alerting
  - `reconciliation.ts`, `tap-leave-reconcile.ts`, `addon-renewals.ts` — Alert on failure
- DLQ Handling + Alerting
  - `worker.ts`, `intelligence-worker.ts`, `worker-start.ts` — Enqueue to DLQ after retries, emit alert with context
- Alert Delivery Service
  - `src/lib/services/alert-delivery.service.ts` — Email + Slack, safe no-op if channel not configured

---

## Next Suggested Checks (Non-blocking)

- Add warn-level alert on first worker failure (not just DLQ) to improve MTTR
- At boot, log a strong warning if both `ALERT_EMAIL_TO` and `SLACK_WEBHOOK_URL` are empty
- Optional: nightly watchdog summary (DLQ counts, cron success/failure tallies)
