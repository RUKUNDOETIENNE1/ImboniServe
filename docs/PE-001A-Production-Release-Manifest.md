# PE-001A Production Release Manifest

| Field | Value |
|---|---|
| Date | 2026-08-10 |
| Release branch | main |
| Base commit | 1b7f324cf01a57ca47bf2c8e5d12b29f19742354 |

## Intended Release Branch

`main` — the repository's primary branch, connected to Vercel auto-deploy.

## Intended Release Commit

The release candidate commit will be created after all PE-001A changes are committed. The commit SHA will be recorded in PE-001A-Final-Release-Candidate-Report.md after the commit is made.

## Included Features/Remediations

| Feature/Remediation | Phase | Files |
|---|---|---|
| GPV-D009 Tax Configuration Sync | GPV-001 | settings.ts, country-config.ts, tax.service.ts, ebm-formatter.ts |
| GPV-D011 Close-Day Reservation Query | GPV-001 | close-day.ts |
| GPV-D012 Reservation Lifecycle | GPV-001 | reservations/[id].ts |
| GPV-D013 BigInt Serialization | GPV-001 | prisma.ts, setup.ts |
| GPV-D010 Financial Truth Chain | GPV-001 | payment-completion.service.ts, financial-truth.service.ts |
| OEC-001B Security Remediation | OEC-001B | csrf.ts, svg-sanitizer.ts |
| OEC-001C-F Reliability Remediation | OEC-001C-F | Multiple service files |
| OEC-001G Trust Remediation | OEC-001G | Multiple service files |
| OEC-001H Cross-System Simulation | OEC-001H | Multiple files |
| CR-001A Confidence Conditions | CR-001A | Multiple files |
| GR-001A Global Architecture Remediation | GR-001A | phone.ts, country-config.ts, timezone.ts |
| EOS-001A Executive Operating System | EOS-001A | 90 executive component/page/API files |
| PE-001A Security: QR/JWT Secret Fail-Closed | PE-001A | qr-token.service.ts |
| PE-001A Security: Trial Hash Secret Fail-Closed | PE-001A | trial-eligibility.service.ts |
| PE-001A Security: Auth OTP Secret Fail-Closed | PE-001A | auth-otp.service.ts, resend-otp.ts |
| PE-001A Security: Crypto-Secure OTP Generation | PE-001A | otp.service.ts, otp/request.ts |
| PE-001A Security: Payment Sandbox Fail-Closed | PE-001A | irembopay.service.ts, mtn-momo.service.ts |
| PE-001A Security: Cron Auth Bypass Fixes | PE-001A | referral-lifecycle.ts, reservation-reminders.ts, subscription-reminders.ts, invite-maintenance.ts |
| PE-001A Tests | PE-001A | 3 new test files (19 new tests) |

## Excluded Changes

| Category | Count | Reason | Disposition |
|---|---|---|---|
| Dev verification scripts | 40 | GPV/PR-001 verification tools, not production code | Separate commit or .gitignore |
| Test output files | 3 | Temporary output captures | .gitignore |

## Migrations Included

| Migration | Status | Phase |
|---|---|---|
| All 29 applied migrations | Applied (dev DB) | Multiple phases |
| 0 pending migrations | — | — |

No new migrations created in PE-001A. All schema changes were already applied during prior phases.

## Security Changes Included

| Change | File | Risk Mitigated |
|---|---|---|
| Fail-closed QR secret | qr-token.service.ts | Default QR signing secret in production |
| Fail-closed JWT secret | qr-token.service.ts | Default JWT signing secret in production |
| Fail-closed trial hash secret | trial-eligibility.service.ts | Empty trial hash secret in production |
| Fail-closed auth OTP secret | auth-otp.service.ts, resend-otp.ts | Empty OTP hashing secret in production |
| Crypto-secure OTP generation | otp.service.ts, otp/request.ts | Predictable OTP codes |
| Fail-closed IremboPay API base | irembopay.service.ts | Sandbox API default in production |
| Fail-closed MTN MoMo environment | mtn-momo.service.ts | Sandbox default in production |
| Cron auth bypass fix (referral) | referral-lifecycle.ts | Unauthenticated cron access |
| Cron auth bypass fix (reservation) | reservation-reminders.ts | Unauthenticated cron access |
| Cron auth standardization | subscription-reminders.ts, invite-maintenance.ts | Inconsistent auth pattern |

## Configuration Changes Included

| Change | File | Impact |
|---|---|---|
| .env.example updates | .env.example | Documents required env vars (no secrets) |

## Known Limitations

1. **15 pre-existing test failures** — not caused by PE-001A (playwright, DOM, edge-case tests)
2. **7 founder decisions required** — infrastructure decisions, not engineering issues
3. **No production environment yet** — release candidate is ready, but production infrastructure must be created
4. **3 cron jobs need scheduling** — reservation-reminders, subscription-reminders, monthly-usage-reset

## Tests Required

| Test Suite | Command | Expected Result |
|---|---|---|
| Reliability + Security | `npx jest --testPathPattern="tests/reliability\|tests/security"` | 464 pass |
| GPV regression | Included in reliability suite | All D009-D013 pass |
| Financial truth chain | Included in reliability suite | All pass |
| Production build | `npm run build` | Success |

## Deployment Prerequisites

1. Founder makes 7 infrastructure decisions (D1-D7)
2. Production Supabase project created
3. Production Vercel project created
4. All production env vars configured
5. DNS configured for imboniserve.com
6. Migrations applied to production DB
7. This release candidate committed and pushed
