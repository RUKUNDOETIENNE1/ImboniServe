# Deferred Work Registry

Purpose: Maintain a permanent, living record of intentionally postponed work. Future phases must consult this registry before proposing work. Do not allow deferred items to disappear between sessions.

Updated: June 22, 2026
Owner: Engineering Ops

---

## Payment Testing (Deferred)

- InTouch sandbox validation
  - Configure `INTOUCH_WEBHOOK_USERNAME` and `INTOUCH_WEBHOOK_PASSWORD` in production
  - Exercise Basic Auth-protected webhook with valid credentials
  - Validate HMAC behavior (optional/defense-in-depth), confirm correct 401s on bad signature
- IremboPay validation
  - Configure provider-side callbacks
  - Send signed callbacks and confirm signature validation + idempotency
- End-to-end payment flow testing
  - Full happy-path and failure-path runs across initiation → callback → ledger/billing events → reconciliation

## Production Configuration (Deferred)

- InTouch webhook credentials
  - `INTOUCH_WEBHOOK_USERNAME`
  - `INTOUCH_WEBHOOK_PASSWORD`

## Future Monitoring (Deferred)

- Watchdog jobs
  - Periodic DLQ backlog scanner with summary alert
  - Cron success/failure daily digest
- Payment anomaly detection
  - Spikes in failures, long-tail pending states, abnormal gateway response codes
- Advanced observability
  - Standardize alert routing (Slack + Email) with environment self-check at boot
  - Optional: escalate repeated failures (cooldown + severity bump)

---

## Governance Rules

- Every postponed task must be added here immediately.
- Each future phase must review this registry before planning or execution.
- Items may be reclassified only after verification or implementation.
- Keep entries terse, actionable, and linked to owning team.
