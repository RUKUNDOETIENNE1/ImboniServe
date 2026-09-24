# PR-001 Customer #1 Production Activation Checklist

| Field | Value |
|---|---|
| Created | 2026-08-09 |
| Status | **🔴 NOT READY — Production environment not established** |
| Verification Scope | Dev workstation only; real Supabase DB (dkhnocretmzpskadqhlq, eu-west-1) |
| Governance | PR-001 does not authorize activation. Stop for founder authorization. |

## Status Legend

| Status | Meaning |
|---|---|
| VERIFIED | Genuinely tested from current environment with evidence |
| CONFIGURED-BUT-NOT-VERIFIED | Config/keys present in .env but not tested end-to-end |
| NOT CONFIGURED | Required config is absent |
| NOT ACCESSIBLE | Cannot be verified from current workstation |
| FOUNDER-ACTION-REQUIRED | Requires founder decision, credential, or action |
| BLOCKED | Cannot proceed until dependency is resolved |
| NOT APPLICABLE | Does not apply to current scope |

---

## 1. Customer Configuration Record

| # | Item | Status | Evidence |
|---|---|---|---|
| 1.1 | Real Customer #1 business record | NOT CONFIGURED | No real Customer #1 exists in DB. 3 test businesses only (Nyama Cafe Kigali, ICTHubs, GPV Test Restaurant). All are test data. |
| 1.2 | Business identity (legal name, display name) | FOUNDER-ACTION-REQUIRED | Founder must provide real Customer #1 identity |
| 1.3 | Geography (country, city, address) | FOUNDER-ACTION-REQUIRED | Founder must confirm. DB defaults: RW, Kigali, Africa/Kigali, RWF, en |
| 1.4 | Currency | CONFIGURED-BUT-NOT-VERIFIED | DB default RWF. Founder must confirm for Customer #1. |
| 1.5 | Timezone | CONFIGURED-BUT-NOT-VERIFIED | DB default Africa/Kigali. Founder must confirm. |
| 1.6 | Locale / language | CONFIGURED-BUT-NOT-VERIFIED | DB default en. Founder must confirm. |
| 1.7 | Phone country configuration | FOUNDER-ACTION-REQUIRED | Founder must confirm. |

## 2. Tax Configuration

| # | Item | Status | Evidence |
|---|---|---|---|
| 2.1 | Tax type applicable to Customer #1 | FOUNDER-ACTION-REQUIRED | Founder must confirm with customer. DB shows VAT 18% for GPV Test Restaurant. |
| 2.2 | Tax rate | FOUNDER-ACTION-REQUIRED | Founder must confirm. Code supports configurable rates. |
| 2.3 | Tax-inclusive vs tax-exclusive | FOUNDER-ACTION-REQUIRED | Existing businesses have taxMode=EXCLUSIVE; GPV Test Restaurant TaxConfiguration has isInclusive=true (contradiction). Founder must confirm customer's actual pricing model. |
| 2.4 | Service charge applicability | FOUNDER-ACTION-REQUIRED | Founder must confirm. |
| 2.5 | Financial chain code path | VERIFIED | Code exists: payment-completion.service.ts writes FinancialLedgerEntry on payment completion. close-day.ts aggregates for Z-Report. dashboard/stats.ts reads revenue. |

## 3. Production Infrastructure

| # | Item | Status | Evidence |
|---|---|---|---|
| 3.1 | Production Supabase connection | NOT ACCESSIBLE | Current .env points to dkhnocretmzpskadqhlq (dev/test project, eu-west-1). No separate production project configured. .env.production does not exist. |
| 3.2 | All migrations applied | VERIFIED | 29 migrations applied, 0 truly pending/failed. 6 old rolled-back migrations (historical, not blocking). |
| 3.3 | Prisma schema compatible | VERIFIED | 198 tables in public schema. All key models present (Business, User, Sale, FinancialLedgerEntry, Reservation, Table, TaxConfiguration, etc.). Prisma client connects and queries successfully. |
| 3.4 | No accidental dev DB connection | BLOCKED | Current env IS the dev DB. Production DB not established. |
| 3.5 | Production Vercel deployment | NOT ACCESSIBLE | No Vercel deployment accessible from this workstation. vercel.json exists with build config. |
| 3.6 | Production domain + HTTPS | NOT ACCESSIBLE | NEXTAUTH_URL=http://localhost:3000, APP_URL=http://localhost:3000. No production domain configured. |
| 3.7 | No development URLs in customer workflows | BLOCKED | Current env uses localhost. Production URLs not established. |
| 3.8 | Upstash Redis (production) | CONFIGURED-BUT-NOT-VERIFIED | REDIS_URL set (enabling-camel-117300.upstash.io). Same instance used during dev. Not verified as production-isolated. |
| 3.9 | Pusher (production) | CONFIGURED-BUT-NOT-VERIFIED | PUSHER_APP_ID/KEY/SECRET/CLUSTER set (cluster=ap2). Not verified as production-isolated. pusher-server.ts exists. |
| 3.10 | Sentry (production) | NOT CONFIGURED | SENTRY_DSN NOT SET. NEXT_PUBLIC_SENTRY_DSN NOT SET. SENTRY_ENVIRONMENT NOT SET. SENTRY_SKIP_UPLOAD=true. Sentry code files exist but DSN absent = monitoring non-functional. |
| 3.11 | Cron jobs (code presence) | VERIFIED | All 9 cron endpoints exist in src/pages/api/cron/. vercel.json defines schedules. |
| 3.12 | Cron jobs (production execution) | NOT ACCESSIBLE | Cannot verify Vercel Cron execution from workstation. CRON_SECRET is set. |

## 4. Authentication & Messaging

| # | Item | Status | Evidence |
|---|---|---|---|
| 4.1 | Auth/MFA code paths | VERIFIED | pre-login.ts, verify-mfa-otp.ts, otp.service.ts, email.service.ts, whatsapp.service.ts all exist. NextAuth configured via [...nextauth].ts. |
| 4.2 | Email OTP config | CONFIGURED-BUT-NOT-VERIFIED | SMTP_HOST=smtp.gmail.com, SMTP_PORT=465, SMTP_USER set. SMTP_SECURE NOT SET (template requires "true" for production). Not verified end-to-end from production. |
| 4.3 | Email OTP delivery | CONFIGURED-BUT-NOT-VERIFIED | GPV e2e tests retrieved OTP from DB (email delivery not relied upon). Production delivery unverified. |
| 4.4 | WhatsApp OTP config | CONFIGURED-BUT-NOT-VERIFIED | TWILIO_WHATSAPP_NUMBER set. TWILIO_ACCOUNT_SID/AUTH_TOKEN set. |
| 4.5 | WhatsApp OTP delivery | BLOCKED | GPV e2e tests show Twilio error 63007: "could not find a Channel with the specified From address". WhatsApp channel not functional. |
| 4.6 | Full MFA cycle (production) | NOT ACCESSIBLE | Cannot verify against production environment. Dev e2e verified via DB OTP retrieval. |

## 5. Customer Account & Roles

| # | Item | Status | Evidence |
|---|---|---|---|
| 5.1 | Owner/administrator account | FOUNDER-ACTION-REQUIRED | No real Customer #1 owner exists. Test users only. |
| 5.2 | Manager account | FOUNDER-ACTION-REQUIRED | No real Customer #1 manager exists. |
| 5.3 | Operational staff accounts | FOUNDER-ACTION-REQUIRED | No real Customer #1 staff exists. |
| 5.4 | Kitchen/waiter roles | VERIFIED (code) | Role system exists: OWNER, CASHIER, KITCHEN_MANAGER confirmed in DB. Code supports role-based access. |
| 5.5 | Business isolation | VERIFIED (code) | All queries filter by businessId. 5 test users all have businessId. 0 users with NULL businessId. |

## 6. Business Setup

| # | Item | Status | Evidence |
|---|---|---|---|
| 6.1 | Business profile | FOUNDER-ACTION-REQUIRED | No real Customer #1 business exists. |
| 6.2 | Tables (physical) | FOUNDER-ACTION-REQUIRED | GPV Test Restaurant has 1 table (test). Others have 0. Real tables must be created by founder. |
| 6.3 | QR codes | FOUNDER-ACTION-REQUIRED | 0 QrCode records for all businesses. Must be generated. |
| 6.4 | Menu (categories, items, prices) | FOUNDER-ACTION-REQUIRED | GPV Test Restaurant has 1 menu item (test). Nyama Cafe has 4 (test). Real menu must be loaded. |
| 6.5 | Menu tax behavior | FOUNDER-ACTION-REQUIRED | Tax behavior depends on tax config decision (item 2.3). |

## 7. QR Activation

| # | Item | Status | Evidence |
|---|---|---|---|
| 7.1 | Generate production QR codes | FOUNDER-ACTION-REQUIRED | 0 QrCode records in DB. IMBONI_QR_SECRET is set. Code exists for generation. |
| 7.2 | Scan with real mobile device | NOT ACCESSIBLE | Cannot perform mobile QR scan from workstation. |
| 7.3 | Verify correct business/table | NOT ACCESSIBLE | Requires real QR codes + mobile device. |
| 7.4 | Verify no development URL | BLOCKED | Current env uses localhost. Production domain not established. |

## 8. Payment Activation

| # | Item | Status | Evidence |
|---|---|---|---|
| 8.1 | Payment provider config | CONFIGURED-BUT-NOT-VERIFIED | PAYMENTS_PROVIDER=irembo. IremboPay API base = https://api.irembopay.com (production URL). Credentials set. InTouch credentials also set. MTN_MOMO_ENVIRONMENT=sandbox. |
| 8.2 | Production credentials | FOUNDER-ACTION-REQUIRED | Cannot verify if IremboPay credentials are production or test. Founder must confirm. |
| 8.3 | Currency correct | CONFIGURED-BUT-NOT-VERIFIED | IREMBOPAY_PAYMENT_ACCOUNT=LOYALTECH-RWF. Currency appears to be RWF. |
| 8.4 | Payment completion → Sale → Ledger | VERIFIED (code) | payment-completion.service.ts creates FinancialLedgerEntry on payment completion. GPV e2e verified 4 sales, 3 ledger entries, 4 payments for GPV Test Restaurant. |
| 8.5 | Real transaction test | NOT ACCESSIBLE | Cannot safely perform real payment transaction from dev environment. |
| 8.6 | Webhook callbacks | CONFIGURED-BUT-NOT-VERIFIED | intouch.ts webhook (13504 bytes), irembopay.ts webhook (710 bytes) exist. Not verified against production endpoints. |

## 9. End-to-End Smoke Test

| # | Item | Status | Evidence |
|---|---|---|---|
| 9.1 | Controlled production transaction | BLOCKED | No production environment. No real Customer #1. Cannot perform. |
| 9.2 | Full chain (QR→Order→Kitchen→Payment→Sale→Ledger→Dashboard→Z-Report) | BLOCKED | Requires production environment + real Customer #1 + real QR + real payment. |

## 10. Financial Truth Verification

| # | Item | Status | Evidence |
|---|---|---|---|
| 10.1 | Zero-variance reconciliation | BLOCKED | Cannot verify without production smoke transaction. GPV previously demonstrated zero variance in dev. |

## 11. Reservation Smoke Test

| # | Item | Status | Evidence |
|---|---|---|---|
| 11.1 | Reservation lifecycle | VERIFIED (dev e2e) | GPV-D012 e2e: 24 PASS, 0 FAIL. Create→Confirm→Table RESERVED→Complete→Table AVAILABLE verified. |
| 11.2 | Production reservation path | NOT ACCESSIBLE | Cannot verify against production. |

## 12. Kitchen Smoke Test

| # | Item | Status | Evidence |
|---|---|---|---|
| 12.1 | Kitchen notification | VERIFIED (code) | Kitchen code paths exist. GPV e2e verified order flow. |
| 12.2 | Production kitchen workflow | NOT ACCESSIBLE | Cannot verify against production. |

## 13. Inventory Smoke Test

| # | Item | Status | Evidence |
|---|---|---|---|
| 13.1 | Inventory exists | VERIFIED (dev) | GPV Test Restaurant has 1 InventoryItem. |
| 13.2 | Stock adjustment | VERIFIED (code) | Inventory code paths exist. |
| 13.3 | Shadow mode documentation | FOUNDER-ACTION-REQUIRED | Founder must confirm whether consumption enforcement is active or shadow. |

## 14. Close-Day Smoke Test

| # | Item | Status | Evidence |
|---|---|---|---|
| 14.1 | Close-day code path | VERIFIED (code) | close-day.ts (14184 bytes) exists. GPV-D011 e2e: 18 PASS, 0 FAIL. Z-Report GET + close-day POST verified. |
| 14.2 | Production close-day | NOT ACCESSIBLE | Cannot verify against production. |

## 15. Monitoring Smoke Test

| # | Item | Status | Evidence |
|---|---|---|---|
| 15.1 | Sentry receives production events | NOT CONFIGURED | SENTRY_DSN NOT SET. Monitoring non-functional. |
| 15.2 | Alert routing | NOT CONFIGURED | No Sentry DSN, no SLACK_WEBHOOK_URL in .env. |
| 15.3 | Production log identification | NOT ACCESSIBLE | No production environment. |

## 16. Backup & Recovery

| # | Item | Status | Evidence |
|---|---|---|---|
| 16.1 | Supabase managed backup config | NOT ACCESSIBLE | Cannot verify Supabase backup configuration from workstation. |
| 16.2 | Recovery procedure documented | VERIFIED (doc) | runbooks/RB-001_DATABASE_RECOVERY.md exists. |
| 16.3 | Recovery tested | NOT ACCESSIBLE | Cannot perform recovery test. |

## 17. Founder Operational Handover

| # | Item | Status | Evidence |
|---|---|---|---|
| 17.1 | Founder ops guide | VERIFIED (doc) | GLP-001-Founder-Operations-Guide.md exists (10343 bytes). |
| 17.2 | Onboarding playbook | VERIFIED (doc) | GLP-001-Customer-Onboarding-Playbook.md exists (12513 bytes). |
| 17.3 | Customer comms kit | VERIFIED (doc) | GLP-001-Customer-Communication-Kit.md exists (10098 bytes). |
| 17.4 | Incident playbook | VERIFIED (doc) | playbook/PB-V7_INCIDENT_MANAGEMENT.md exists. |
| 17.5 | Production deployment runbook | VERIFIED (doc) | runbooks/RB-002_PRODUCTION_DEPLOYMENT.md exists. |
| 17.6 | Founder production access | FOUNDER-ACTION-REQUIRED | No production environment exists. Founder must establish. |

## 18. Customer Handover

| # | Item | Status | Evidence |
|---|---|---|---|
| 18.1 | Welcome communication | VERIFIED (doc) | GLP-001-Customer-Communication-Kit.md exists. |
| 18.2 | Login/MFA instructions | VERIFIED (doc) | GLP-001-Customer-Onboarding-Playbook.md exists. |
| 18.3 | Staff onboarding | VERIFIED (doc) | GLP-001-Customer-Success-Playbook.md exists. |
| 18.4 | First-week check-in schedule | VERIFIED (doc) | GLP-001-Customer-1-Success-Plan.md exists. |
| 18.5 | Actual customer handover execution | BLOCKED | No real Customer #1 exists. |

## 19. 24/7 First-14-Day Observation

| # | Item | Status | Evidence |
|---|---|---|---|
| 19.1 | Observation plan | VERIFIED (doc) | GLP-001-Customer-1-Success-Plan.md exists. |
| 19.2 | Observation activation | BLOCKED | No production environment. No real Customer #1. |

---

## Summary Counts

| Status | Count |
|---|---|
| VERIFIED | 14 |
| CONFIGURED-BUT-NOT-VERIFIED | 9 |
| NOT CONFIGURED | 4 |
| NOT ACCESSIBLE | 14 |
| FOUNDER-ACTION-REQUIRED | 15 |
| BLOCKED | 9 |
| NOT APPLICABLE | 0 |

**Bottom line: 4 NOT CONFIGURED + 9 BLOCKED + 14 NOT ACCESSIBLE = 27 items cannot be verified from this workstation. 15 items require founder action. The production environment does not exist.**
