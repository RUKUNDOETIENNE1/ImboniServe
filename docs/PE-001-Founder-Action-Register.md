# PE-001 Founder Action Register

| Field | Value |
|---|---|
| Date | 2026-08-10 |
| Purpose | Complete list of founder actions required to establish the production environment |

## Critical Decisions (Require Founder Input Before Any Action)

| # | Decision | Context | Options | Impact |
|---|---|---|---|---|
| D1 | **Production Supabase project** | Current dev project has test data | (A) Create dedicated production project [RECOMMENDED] (B) Promote current project with risk acceptance | A: Clean separation, $25/mo. B: Test data in prod, risky. |
| D2 | **IremboPay integration** | Two credential sets exist (Service vs Provider) | (A) Service only (B) Provider only (C) Both | Determines which env vars to configure |
| D3 | **MTN MoMo direct** | Sandbox, deprecated, routed via InTouch | (A) NOT REQUIRED (use InTouch) (B) Required (configure production) | Determines if MTN_MOMO_* env vars needed |
| D4 | **Production email service** | Currently personal Gmail | (A) SendGrid (B) AWS SES (C) Postmark (D) Keep Gmail temporarily | Determines SMTP configuration |
| D5 | **Production domain** | imboniserve.com (from code) | Confirm imboniserve.com OR specify different domain | Determines DNS + Vercel config |
| D6 | **Pusher cluster** | Currently ap2 (Asia Pacific) | (A) Switch to eu (closer to Rwanda) (B) Keep ap2 | Determines production Pusher app config |
| D7 | **Vercel billing** | No Vercel project accessible | Founder must create Vercel account + project | $20/mo for Pro tier |

## Founder Actions (Sequential — In Order)

### Phase 1: Decisions (Before Any Infrastructure Work)

| # | Action | Decision Reference | Blocks |
|---|---|---|---|
| 1 | Confirm production Supabase project strategy | D1 | All DB work |
| 2 | Confirm IremboPay integration (Service vs Provider) | D2 | Payment config |
| 3 | Confirm MTN MoMo requirement | D3 | Payment config |
| 4 | Choose production email service | D4 | SMTP config |
| 5 | Confirm production domain | D5 | DNS + Vercel |
| 6 | Confirm Pusher cluster preference | D6 | Pusher config |

### Phase 2: Code & Release Preparation

| # | Action | Detail | Blocks |
|---|---|---|---|
| 7 | Review 442 uncommitted changes | Ensure no unintended modifications | Deployment |
| 8 | Commit GPV-001 remediation changes | 6 defect fixes (country-config, settings, close-day, reservations, prisma, setup) | Deployment |
| 9 | Commit all documentation | GPV/PR-001/PE-001 docs | Deployment |
| 10 | Commit all test files | Regression tests for D009/D011/D012/D013 | Deployment |
| 11 | Run full regression suite | `npm test` — 403 tests must pass | Deployment |
| 12 | Run production build | `npm run build` — must succeed | Deployment |
| 13 | Identify release commit SHA | The exact commit to deploy | Deployment |

### Phase 3: Infrastructure Creation

| # | Action | Detail | Blocks |
|---|---|---|---|
| 14 | Create production Supabase project | Pro tier ($25/mo), eu-west-1, enable backups + PITR | DB |
| 15 | Create production Upstash Redis instance | Separate from dev | Redis |
| 16 | Create production Pusher app | eu cluster (if confirmed), separate from dev | Realtime |
| 17 | Create Sentry project | Set DSN, environment=production, alert routing | Monitoring |
| 18 | Create Vercel project | Connect to GitHub repo, set production branch=main | Hosting |
| 19 | Configure DNS for imboniserve.com | Point to Vercel | Domain |
| 20 | Set up production email service | Create account, verify sender domain | Email |
| 21 | Configure Twilio WhatsApp Business | Fix error 63007, approve OTP templates | WhatsApp |

### Phase 4: Environment Configuration

| # | Action | Detail | Blocks |
|---|---|---|---|
| 22 | Apply migrations to production DB | `npx prisma migrate deploy` against production | DB |
| 23 | Verify production DB is clean | 0 businesses, 0 users, all tables present | DB |
| 24 | Create production subscription plans | Run `scripts/updatePlans.ts` or manual SQL | DB |
| 25 | Set all Vercel env vars | See PE-001-Production-Secret-Inventory.md | Deployment |
| 26 | Set NODE_ENV=production | In Vercel env vars | Deployment |
| 27 | Set ALLOW_LEGACY_CREDENTIALS=false | In Vercel env vars | Security |
| 28 | Set NEXTAUTH_URL=https://imboniserve.com | In Vercel env vars | Auth |
| 29 | Set APP_URL=https://imboniserve.com | In Vercel env vars | App |
| 30 | Regenerate all auth secrets | NEXTAUTH_SECRET, TRIAL_HASH_SECRET, IMBONI_QR_SECRET, CRON_SECRET | Security |
| 31 | Set production DB URLs | DATABASE_URL, DIRECT_URL → production Supabase | DB |
| 32 | Set production Redis URL | REDIS_URL → production Upstash | Redis |
| 33 | Set production Pusher credentials | PUSHER_APP_ID/KEY/SECRET/CLUSTER → production app | Realtime |
| 34 | Set Sentry DSN + environment | SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN, SENTRY_ENVIRONMENT | Monitoring |
| 35 | Set SMTP credentials | SMTP_HOST/PORT/USER/PASSWORD/SECURE/FROM → production email | Email |
| 36 | Set InTouch production credentials + webhook auth | INTOUCH_*, INTOUCH_WEBHOOK_USERNAME/PASSWORD | Payments |
| 37 | Set IremboPay production credentials | Per decision D2 (Service and/or Provider set) | Payments |
| 38 | Set alert routing | SLACK_WEBHOOK_URL, ALERT_EMAIL_TO | Monitoring |
| 39 | Set LOG_LEVEL=info | In Vercel env vars | Logging |
| 40 | Add missing cron jobs to vercel.json | At minimum: reservation-reminders, subscription-reminders | Cron |

### Phase 5: Verification (After Deployment)

| # | Action | Detail | Blocks |
|---|---|---|---|
| 41 | Deploy to Vercel | Push release commit to main | — |
| 42 | Verify production URL loads | https://imboniserve.com | — |
| 43 | Verify HTTPS + SSL | Check certificate | — |
| 44 | Verify Sentry receives events | Trigger controlled test error | — |
| 45 | Verify email OTP delivery | End-to-end test | — |
| 46 | Verify WhatsApp OTP delivery | End-to-end test | — |
| 47 | Verify Supabase backup configuration | Check dashboard | — |
| 48 | Verify cron jobs executing | Check Vercel cron logs | — |
| 49 | Verify health endpoints | /api/die/operations/health etc. | — |
| 50 | Perform or document recovery test | Safe recovery test or "configured but not tested" | — |

## Summary

| Category | Count |
|---|---|
| Critical decisions | 7 |
| Code/release actions | 7 |
| Infrastructure creation | 8 |
| Environment configuration | 19 |
| Verification actions | 10 |
| **Total founder actions** | **51** |

## Stop Conditions

Per PE-001 rules, STOP and ask the founder if:
- Infrastructure ownership is unknown (which account/project/domain)
- Database architecture decision is needed (dedicated vs reuse)
- Payment provider requirement is unclear
- Tax configuration is unknown (customer-specific)
- Production domain has not been selected
- Paid provider requires founder approval before activation
- Actual production credentials are unavailable
- Destructive operation could affect the existing GPV environment

**None of these actions should be performed without explicit founder authorization.**
