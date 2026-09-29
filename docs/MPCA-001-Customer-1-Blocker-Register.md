# MPCA-001 Customer #1 Blocker Register

| Field | Value |
|---|---|
| Audit Date | 2026-08-12 |
| Purpose | ONLY things that actually prevent responsible Customer #1 onboarding |

## Principle

This register is intentionally minimal. It contains only blockers — not improvements, not enhancements, not long-term items. Each blocker must be resolved before Customer #1 can responsibly go live.

---

## Blockers

### BLK-001: Production environment does not exist

| Field | Value |
|---|---|
| ID | BLK-001 |
| Why | No production Vercel, Supabase, Redis, Pusher, Sentry, SMTP, or payment infrastructure has been established |
| Evidence | docs/PE-001-Production-Readiness-Matrix.md — 0 components VERIFIED, 19 FOUNDER ACTION REQUIRED |
| Action | Founder makes 7 decisions (D1-D7); establish production infrastructure |
| Verification Required | Production environment smoke test: signup → login → create order → process payment → verify dashboard → close day |

### BLK-002: Vercel deployment not verified

| Field | Value |
|---|---|
| ID | BLK-002 |
| Why | Build succeeds locally but no evidence of successful production deployment |
| Evidence | "should now succeed" is not verified evidence; Vercel not accessible from audit |
| Action | Deploy to Vercel; verify build completes; verify runtime; verify DNS/SSL |
| Verification Required | Successful Vercel build + homepage loads + auth flow works |

### BLK-003: Production secrets not configured

| Field | Value |
|---|---|
| ID | BLK-003 |
| Why | Fail-closed security code will throw in production without proper secrets |
| Evidence | NEXTAUTH_SECRET, IMBONI_QR_SECRET, TRIAL_HASH_SECRET, CRON_SECRET must be set |
| Action | Generate cryptographically secure secrets; set in Vercel environment variables |
| Verification Required | Application starts without SECURITY FATAL errors |

### BLK-004: InTouch webhook does not create ledger entries

| Field | Value |
|---|---|
| ID | BLK-004 |
| Why | Sales paid via InTouch may not get FinancialLedgerEntry records, breaking financial reporting |
| Evidence | src/pages/api/webhooks/intouch.ts does not call PaymentCompletionService.onPaymentSuccess |
| Action | Add PaymentCompletionService.onPaymentSuccess call to InTouch webhook for sales |
| Verification Required | Payment via InTouch → ledger entry created → dashboard shows revenue |

### BLK-005: Payment provider not confirmed

| Field | Value |
|---|---|
| ID | BLK-005 |
| Why | IremboPay integration approach (Set A vs Set B) not confirmed; InTouch webhook auth not configured |
| Evidence | docs/PE-001A-Founder-Production-Decision-Record.md D2; INTOUCH_WEBHOOK_USERNAME/PASSWORD NOT SET |
| Action | Founder confirms IremboPay Set A; configure InTouch webhook auth credentials |
| Verification Required | Test payment flows end-to-end in production |

### BLK-006: Backup and recovery not established

| Field | Value |
|---|---|
| ID | BLK-006 |
| Why | No production database backup exists; customer data is at risk |
| Evidence | docs/PE-001-Backup-Recovery-Readiness.md; no backup test performed |
| Action | Establish production Supabase (Pro tier includes daily backups + 7-day PITR); test recovery |
| Verification Required | Backup exists; recovery test succeeds |

---

## NOT Blockers (Explicitly Excluded)

The following are NOT Customer #1 blockers:

| Item | Why Not a Blocker |
|---|---|
| Promise Engine | Enhancement; not required for basic operation. Commit and test post-onboarding. |
| Service Replay | Enhancement; not required for basic operation. |
| GR-016 regressions | Customer #1 is in Rwanda; hardcoded defaults work for Rwanda. |
| DGS-001B/C | Backend cosmetic refactoring; no customer impact. |
| 7 unscheduled crons | Reservation/subscription reminders are useful but not safety-critical. |
| Monitoring (Sentry/Slack) | Important for operations but doesn't prevent onboarding. |
| WhatsApp broken | SMS and email alternatives exist for OTP. |
| Dashboard stats data source | Inconsistency between dashboards; fixable post-onboarding. |
| Referral code auth | Important but not safety-critical for initial onboarding. |
| Reconciliation ledger check | Important but not blocking first customer. |
| Pending order warning | Important but staff can manually check. |
| Business commission test bug | Test-only issue; production logic is correct. |
| Service Replay flaky test | Test-only issue. |
| Connection pool | May cause intermittent errors but not a hard blocker. |

---

## Summary

**6 blockers** prevent responsible Customer #1 onboarding:

1. **BLK-001:** Production environment (founder action)
2. **BLK-002:** Vercel deployment verification (founder + engineering)
3. **BLK-003:** Production secrets (founder)
4. **BLK-004:** InTouch webhook ledger gap (engineering)
5. **BLK-005:** Payment provider confirmation (founder)
6. **BLK-006:** Backup and recovery (founder)

**4 require founder action. 1 requires engineering. 1 requires both.**
