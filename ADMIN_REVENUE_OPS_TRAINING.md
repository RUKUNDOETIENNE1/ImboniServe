# Admin Training Guide — Revenue Operations

Audience: Admins and Finance Ops  
Time to read: 10 minutes

---

## 1) Overview

The Revenue Operations Layer manages marketer onboarding, commissions, wallets, payouts, events, and alerts. It is isolated from legacy systems and operates via event-driven services with a full audit log.

Core screens:
- Marketer Dashboard: /dashboard/marketer (for marketers)
- Admin Payout Control: /admin/payout-control (for admins)

---

## 2) Payout Queue — Approve/Reject

Where: Admin → Payout Control → Payout Queue tab

- Each row is a payout request with: marketer, amount, method, risk score, and status.
- Click Approve to move status to APPROVED.
- Click Reject to decline; you will be prompted for a reason.

Best practices:
- Prioritize HIGH or CRITICAL risk items for review.
- Verify marketer history: payouts count, risk score trends.
- Reject if multiple risk flags are present (velocity, spikes, patterns).

---

## 3) Risk Scores and Alerts

Where: Admin → Payout Control → Alerts tab

Risk score 0–100 (Levels):
- LOW (0–24): Green — generally safe
- MEDIUM (25–49): Yellow — monitor
- HIGH (50–74): Orange — likely risk
- CRITICAL (75–100): Red — urgent review

Alert types:
- payout_failed: Payment provider failure
- high_risk_payout: Risk-based alert for admin attention
- suspicious_pattern: Detected anomaly

Actions:
- Investigate marketer history on Marketers tab
- Reject payout and optionally Suspend marketer

---

## 4) Auto-Approval Rules (Low-Risk Fast Track)

Auto-approval is applied at request time when ALL conditions below are met:
- Risk score ≤ 24
- AND (amount ≤ 50,000 RWF OR marketer has ≥ 5 successful payouts)

Notes:
- Auto-approval sets status to APPROVED but does not auto-pay.
- Event: PAYOUT_AUTO_APPROVED is recorded for audit.
- You can still reject later before processing.

---

## 5) Processing Payouts

The system integrates with MTN/Airtel MoMo. Approved payouts transition to PROCESSING and then either PAID or FAILED.

If PAID:
- Wallet locked funds are deducted
- Event PAYOUT_PAID emitted
- Marketer receives email confirmation

If FAILED:
- Funds returned to available balance
- Alert created + event emitted
- Marketer receives failure email

---

## 6) Email Notifications

Automatically sent to marketers:
- Payout requested (Pending approval)
- Payout approved
- Payout rejected
- Payout completed (Paid)
- Weekly earnings summary (optional batch)

Admins receive high-risk payout alerts if configured.

---

## 7) Exports and Reporting

Marketer Dashboard
- Referred Businesses → Export CSV
- Payout History → Export CSV

Admin Control Panel
- Event Stream → Export CSV
- Marketers → Export CSV

Use these CSVs for reconciliation and analytics.

---

## 8) Suspending a Marketer

Where: Admin → Payout Control → Marketers tab

- Click Suspend → Provide reason → Confirm
- The marketer can no longer request payouts
- Event recorded for audit; alerts may be created

---

## 9) Runbooks (Incidents)

Payout failures spike:
- Check Alerts tab for PAYOUT_FAILED
- Inspect provider response
- Retry or contact provider if systemic

Wallet balance anomaly:
- Stop processing payouts
- Run reconciliation script
- Investigate recent wallet transitions

Fraud spike:
- Tighten thresholds temporarily
- Review top risk accounts
- Suspend if necessary

---

## 10) FAQ

Q: When do commissions become withdrawable?
A: After validation and lock period (7 days) they move to available balance.

Q: Can I override an auto-approved payout?
A: Yes. Before processing, you can still reject it.

Q: Where are logs?
A: All financial actions emit RevenueEvent entries. Alerts are listed under Alerts tab.

Q: How do emails work in staging?
A: Configure SMTP_* env vars. In dev without SMTP, emails are logged only.

---

Contact: ops@imboni.rw / engineering@imboni.rw
