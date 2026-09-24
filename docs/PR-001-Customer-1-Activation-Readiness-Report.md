# PR-001 Customer #1 Activation Readiness Report

| Field | Value |
|---|---|
| Date | 2026-08-09 |
| Verdict | **🔴 NOT READY — Production environment not established** |

## Executive Summary

PR-001 was executed from the current development workstation. The platform code is certified ready (GPV-001: 403 tests pass, build succeeds, all 6 defects remediated). However, **the production environment does not exist**, and several critical configuration items are missing or misconfigured.

The platform cannot be activated for Customer #1 until the founder establishes the production environment and resolves the identified blockers.

## What Is Ready

| Area | Status | Evidence |
|---|---|---|
| Platform code | VERIFIED | 403 regression tests pass, production build succeeds |
| Defect remediation | VERIFIED | All 6 GPV defects (D001, D009, D010, D011, D012, D013) remediated |
| Database schema | VERIFIED | 29 migrations applied, 198 tables, Prisma compatible |
| Code paths | VERIFIED | Auth/MFA, payments, close-day, reservations, financial chain, cron jobs all exist |
| Handover documentation | VERIFIED | 10 GLP-001 docs + 8 playbooks + 2 runbooks pre-existing |
| Financial chain (dev) | VERIFIED | Zero-variance reconciliation demonstrated in GPV-001 |
| Reservation lifecycle (dev) | VERIFIED | GPV-D012 e2e: 24 PASS, 0 FAIL |
| Z-Report (dev) | VERIFIED | GPV-D011 e2e: 18 PASS, 0 FAIL |
| BigInt serialization | VERIFIED | GPV-D013 fix confirmed |
| Tax config sync | VERIFIED | GPV-D009 fix confirmed (24 tests pass) |

## What Is Not Ready

| Area | Status | Blocker |
|---|---|---|
| Production environment | NOT ESTABLISHED | No Vercel deployment, no production domain, no .env.production |
| Sentry monitoring | NOT CONFIGURED | SENTRY_DSN not set — monitoring non-functional |
| WhatsApp OTP | BLOCKED | Twilio error 63007 — WhatsApp channel not configured |
| Production payments | NOT VERIFIED | MTN MoMo sandbox, InTouch webhook auth missing, credentials unverified |
| Email OTP (production) | NOT VERIFIED | SMTP_SECURE not set, sender identity is personal Gmail |
| Real Customer #1 | NOT CONFIGURED | No real customer business exists |
| Production QR codes | NOT GENERATED | 0 QrCode records in DB |
| Production smoke test | BLOCKED | No production environment |
| Financial reconciliation (prod) | BLOCKED | No production transaction |
| Backup/recovery | NOT VERIFIED | Cannot verify Supabase backup config |
| ALLOW_LEGACY_CREDENTIALS | MISCONFIGURED | Set to true (must be false in production) |

## Critical Blockers (Must Resolve Before Activation)

| # | Blocker | Impact | Action Required |
|---|---|---|---|
| 1 | No production environment | All production verification blocked | Founder: deploy to Vercel, configure production domain + HTTPS |
| 2 | SENTRY_DSN not set | Error monitoring non-functional | Founder: create Sentry project, set DSN |
| 3 | WhatsApp OTP broken (Twilio 63007) | Customer MFA via WhatsApp broken | Founder: configure Twilio WhatsApp channel |
| 4 | No real Customer #1 | Cannot configure/verify customer | Founder: identify and onboard real customer |
| 5 | .env.production missing | Production config not established | Founder: create .env.production from template |
| 6 | ALLOW_LEGACY_CREDENTIALS=true | Security risk | Founder: set to false in production |
| 7 | MTN_MOMO_ENVIRONMENT=sandbox | Payment provider not production | Founder: switch to production or confirm IremboPay-only |
| 8 | InTouch webhook auth missing | Webhook security risk | Founder: set INTOUCH_WEBHOOK_USERNAME/PASSWORD |
| 9 | SMTP_SECURE not set | Email delivery may fail | Founder: set SMTP_SECURE=true |
| 10 | No production QR codes | Customer cannot scan to order | Founder: generate QR codes for customer tables |

## Non-Blocking Items (Should Resolve But Not Activation-Blocking)

| Item | Recommendation |
|---|---|
| Pusher cluster=ap2 (not eu) | Confirm if intentional or switch to eu for Rwanda |
| SMTP_FROM uses personal Gmail | Switch to branded domain email |
| Airtel Money code missing | Remove env vars or implement service |
| TaxConfiguration missing for 2/3 businesses | Will be created on settings update (GPV-D009 fix) |
| Existing businesses have taxMode=EXCLUSIVE | Customer #1 should confirm their tax model |

## Founder Action List

### Phase 1: Establish Production Environment
1. Deploy to Vercel with production domain + HTTPS
2. Create .env.production from .env.production.template
3. Set all production credentials (DB, auth, payments, email, Twilio, Sentry, Pusher, Redis)
4. Set ALLOW_LEGACY_CREDENTIALS=false
5. Set SMTP_SECURE=true
6. Set SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN, SENTRY_ENVIRONMENT
7. Set MTN_MOMO_ENVIRONMENT=production (or confirm IremboPay-only)
8. Set INTOUCH_WEBHOOK_USERNAME and INTOUCH_WEBHOOK_PASSWORD
9. Set ALERT_EMAIL_TO and SLACK_WEBHOOK_URL

### Phase 2: Fix WhatsApp OTP
10. Configure Twilio WhatsApp Business channel (fix error 63007)
11. Register WhatsApp template messages for OTP delivery
12. Test WhatsApp OTP delivery end-to-end

### Phase 3: Create Customer #1
13. Identify real Customer #1
14. Create business record with real identity, geography, contact info
15. Confirm tax configuration with customer (inclusive vs exclusive)
16. Create user accounts (owner, manager, staff, kitchen)
17. Create physical tables with correct names/capacity
18. Load real menu (categories, items, prices, descriptions)
19. Generate production QR codes for each table

### Phase 4: Production Verification
20. Verify Sentry receives production events
21. Verify email OTP delivery end-to-end
22. Verify WhatsApp OTP delivery end-to-end
23. Perform controlled production payment test
24. Perform end-to-end smoke test (QR → order → kitchen → payment → ledger → dashboard → Z-report)
25. Verify financial reconciliation (variance = 0)
26. Verify reservation lifecycle in production
27. Verify close-day in production
28. Verify Supabase backup configuration
29. Perform recovery test (or document as "configured but not recovery-tested")

### Phase 5: Handover
30. Execute customer handover using GLP-001 documentation
31. Schedule first-week check-in
32. Activate 24/7 first-14-day observation

## Conclusion

The platform is code-ready and test-verified (GPV-001 certified). The production environment is not established. PR-001 has identified 10 critical blockers and 32 founder actions required before Customer #1 can be activated.

**Gate: 🔴 NOT READY — Production environment not established.**

PR-001 does not authorize Customer #1 activation. The founder must establish the production environment and resolve all critical blockers before re-running PR-001 verification.
