# FOUNDER LAUNCH OPERATIONS
## OPERATIONAL HANDBOOK: REPOSITORY TO FIRST PAYING CUSTOMER

**Created:** 2026-07-06  
**Revised:** 2026-07-07  
**Purpose:** Guide Founder from repository to first paying customer  
**Audience:** Founder with no DevOps experience  
**Format:** Capability-based execution manual

---

## CURRENT STATUS

**Repository State:** 🔴 **NOT READY FOR PRODUCTION**

**Engineering Blockers:** 3 CRITICAL
1. Supabase migration pending
2. GitHub synchronization required
3. Build memory failure

**Founder Action:** ⚪ **WAIT** for Engineering to complete Phase A

**Next Phase:** Phase B — Founder Approval (after Engineering completion)

---

## RELEASE PIPELINE OVERVIEW

The path to first paying customer follows a verified 6-phase pipeline:

| Phase | Name | Owner | Status |
|-------|------|-------|--------|
| A | Engineering Completion | Engineering | 🔴 IN PROGRESS |
| B | Founder Approval | Founder | ⚪ PENDING |
| C | Founder Acceptance Testing | Founder | ⚪ PENDING |
| D | Payment Certification | Shared | ⚪ PENDING |
| E | Pilot Launch | Founder | ⚪ PENDING |
| F | First Paying Customer | Founder | ⚪ PENDING |

**Progress:** Phase A (Engineering Completion)

---

## PHASE A — ENGINEERING COMPLETION

**Objective:** Resolve all verified engineering blockers

**Owner:** Engineering

**Founder Role:** Wait and prepare parallel work

### Engineering Tasks

1. **Apply Supabase Migration** (5 minutes)
   ```bash
   npx prisma migrate deploy
   npx prisma migrate status
   ```
   Expected: "Database schema is up to date!"

2. **Push Commits to GitHub** (1 minute)
   ```bash
   git push origin release/v1.0.0-rc1
   ```
   Expected: 3 commits pushed successfully

3. **Fix Build Memory Issue** (2-4 hours)
   - Convert heavy dashboard pages to server-side rendering
   - Target pages: CEO dashboard, CFO dashboard, DIE operations
   - Verify build completes: `npm run build` (356/356 pages)

4. **Re-run Verification**
   - Verify Supabase migration status
   - Verify GitHub synchronization
   - Verify build success

5. **Generate Certification**
   - Create `RC1_RELEASE_CERTIFICATION.md`
   - Declare: **Release Candidate RC1 — FROZEN**

### Founder Parallel Work (While Waiting)

**Payment Gateway Applications:**
- ✅ Apply for InTouch production API access
  - URL: https://www.intouchpay.co.rw/
  - Expected approval time: 3-5 business days
  - Request: Production API credentials

- ✅ Apply for IremboPay production API access
  - URL: https://irembo.com/irembopay/
  - Expected approval time: 3-5 business days
  - Request: Production merchant credentials

**Pilot Preparation:**
- ✅ Prepare list of 1-3 potential pilot restaurants
- ✅ Draft onboarding script
- ✅ Review this handbook

### Exit Criteria

- ✅ Supabase migration applied
- ✅ GitHub synchronized
- ✅ Build succeeds (356/356 pages)
- ✅ `RC1_RELEASE_CERTIFICATION.md` generated
- ✅ Engineering declares: **RC1 — FROZEN**

**Next Phase:** Phase B — Founder Approval

---

## PHASE B — FOUNDER APPROVAL

**Objective:** Founder reviews and approves RC1 freeze

**Owner:** Founder

**Prerequisites:** Phase A complete

### Founder Tasks

1. **Review Certification**
   - Open `RC1_RELEASE_CERTIFICATION.md`
   - Verify all engineering blockers resolved
   - Verify build status: SUCCESS
   - Verify database status: UP TO DATE
   - Verify GitHub status: SYNCHRONIZED

2. **Approve RC1 Freeze**
   - If certification is satisfactory, approve RC1 freeze
   - Document approval decision
   - Acknowledge feature development is locked

3. **Understand Freeze Rules**
   - ✅ No new features
   - ✅ No architectural changes
   - ✅ No IAS work
   - ✅ No optimization
   - ✅ Only launch-critical bug fixes allowed

### Exit Criteria

- ✅ Founder has reviewed `RC1_RELEASE_CERTIFICATION.md`
- ✅ Founder approves RC1 freeze
- ✅ RC1 officially frozen

**Next Phase:** Phase C — Founder Acceptance Testing

---

## PHASE C — FOUNDER ACCEPTANCE TESTING

**Objective:** Founder validates production application as a real customer

**Owner:** Founder

**Prerequisites:** Phase B complete (RC1 frozen)

### Test Environment

**URL:** Production deployment (after Vercel configuration)

**Test Account:** Create a real test restaurant account

### Test Areas

#### 1. Authentication
- ✅ Sign up with new account
- ✅ Log in with credentials
- ✅ Log out
- ✅ Password reset flow
- ✅ Session persistence

#### 2. Dashboard
- ✅ CEO Dashboard loads
- ✅ CFO Dashboard loads
- ✅ Operations Dashboard loads
- ✅ Data displays correctly
- ✅ No errors in console

#### 3. Restaurant Setup
- ✅ Business profile creation
- ✅ Business settings configuration
- ✅ Currency: RWF
- ✅ Timezone: Africa/Kigali
- ✅ Contact information

#### 4. Menu Management
- ✅ Create menu categories
- ✅ Add menu items
- ✅ Set prices
- ✅ Upload item images
- ✅ Enable/disable items

#### 5. Inventory Management
- ✅ Add inventory items
- ✅ Record stock updates
- ✅ View inventory levels
- ✅ Track inventory history

#### 6. Orders
- ✅ Create manual order
- ✅ Modify order
- ✅ Fulfill order
- ✅ View order history
- ✅ Order status updates

#### 7. QR Ordering
- ✅ Generate QR code
- ✅ Scan QR code (customer view)
- ✅ Browse menu
- ✅ Add items to cart
- ✅ Submit order
- ✅ Order appears in kitchen

#### 8. Kitchen Operations
- ✅ View incoming orders
- ✅ Update order status
- ✅ Mark items complete
- ✅ Kitchen display updates

#### 9. Commercial Truth
- ✅ Subscription status displays
- ✅ Feature gating works
- ✅ Pricing displays correctly
- ✅ Entitlements enforced

#### 10. Overall UX
- ✅ Navigation works
- ✅ Performance acceptable
- ✅ No critical errors
- ✅ Mobile responsive

### Issue Recording

**Record ONLY launch-critical issues:**
- Issues that prevent core workflows
- Issues that cause data loss
- Issues that prevent customer usage
- Issues that cause payment failures

**Do NOT record:**
- Minor UI issues
- Feature requests
- Performance optimizations
- Nice-to-have improvements

### Exit Criteria

- ✅ All test areas validated
- ✅ Launch-critical issues resolved
- ✅ Founder approves to proceed

**Next Phase:** Phase D — Payment Certification

---

## PHASE D — PAYMENT CERTIFICATION

**Objective:** Complete production payment verification

**Owner:** Shared (Founder + Engineering)

**Prerequisites:** Phase C complete, Payment gateway approvals received

### InTouch Configuration

**Founder Tasks:**

1. **Obtain Production Credentials**
   - From InTouch support, obtain:
     - `INTOUCH_USERNAME`
     - `INTOUCH_ACCOUNT_NO`
     - `INTOUCH_PARTNER_PASSWORD`
     - `INTOUCH_WEBHOOK_USERNAME`
     - `INTOUCH_WEBHOOK_PASSWORD`

2. **Configure Vercel Environment Variables**
   - Open Vercel Dashboard → Project → Settings → Environment Variables
   - Add Production variables:
     ```
     INTOUCH_API_URL=https://www.intouchpay.co.rw/api
     INTOUCH_USERNAME=<from InTouch>
     INTOUCH_ACCOUNT_NO=<from InTouch>
     INTOUCH_PARTNER_PASSWORD=<from InTouch>
     INTOUCH_PASSWORD=<same as INTOUCH_PARTNER_PASSWORD>
     INTOUCH_WEBHOOK_USERNAME=<from InTouch>
     INTOUCH_WEBHOOK_PASSWORD=<from InTouch>
     INTOUCH_CALLBACK_URL=https://imboniserve.com/api/webhooks/intouch
     PAYMENTS_PROVIDER=intouch
     ```

3. **Redeploy Production**
   - Trigger redeploy from Vercel Dashboard

**Engineering Tasks:**

1. **Verify Webhook Endpoint**
   - Confirm `/api/webhooks/intouch` is accessible
   - Confirm webhook authentication works

2. **Monitor First Test Payment**
   - Watch logs during test payment
   - Verify callback received
   - Verify database updated

**Verification Steps:**

1. **Sandbox Payment Test**
   - Initiate low-value mobile money payment
   - Verify payment request sent to InTouch
   - Verify callback received
   - Verify database updated
   - Verify UI reflects payment status

2. **Production Approval**
   - Request InTouch production approval
   - Complete any required verification steps

### IremboPay Configuration

**Founder Tasks:**

1. **Obtain Production Credentials**
   - From IremboPay, obtain:
     - `IREMBOPAY_MERCHANT_ID`
     - `IREMBOPAY_API_KEY`
     - `IREMBOPAY_API_SECRET`
     - `IREMBOPAY_PAYMENT_ITEM_CODE`

2. **Configure Vercel Environment Variables**
   - Add Production variables:
     ```
     IREMBOPAY_API_URL=https://api.irembo.com
     IREMBOPAY_MERCHANT_ID=<from IremboPay>
     IREMBOPAY_API_KEY=<from IremboPay>
     IREMBOPAY_API_SECRET=<from IremboPay>
     IREMBOPAY_PAYMENT_ACCOUNT=LOYALTECH-RWF
     IREMBOPAY_PAYMENT_ITEM_CODE=<from IremboPay>
     IREMBOPAY_CALLBACK_URL=https://imboniserve.com/api/webhooks/irembopay
     IREMBOPAY_RETURN_URL=https://imboniserve.com/billing/payment-result
     ```

3. **Redeploy Production**

**Engineering Tasks:**

1. **Verify Webhook Endpoint**
   - Confirm `/api/webhooks/irembopay` is accessible
   - Confirm webhook authentication works

2. **Monitor First Test Payment**
   - Watch logs during test payment
   - Verify callback received
   - Verify database updated

**Verification Steps:**

1. **Card Payment Test**
   - Initiate low-value card payment
   - Verify payment request sent to IremboPay
   - Verify callback received
   - Verify database updated
   - Verify UI reflects payment status

### End-to-End Payment Flow

**Test Complete Flow:**

1. Customer initiates payment
2. Payment gateway processes payment
3. Callback received at webhook endpoint
4. Database updated with payment status
5. UI updated to reflect payment
6. Confirmation sent to customer

**Verify:**
- ✅ Payment initiated successfully
- ✅ Callback received within 30 seconds
- ✅ Database transaction created
- ✅ Subscription activated (if applicable)
- ✅ Features unlocked (if applicable)
- ✅ Confirmation email sent

### Exit Criteria

- ✅ InTouch production credentials configured
- ✅ IremboPay production credentials configured
- ✅ Sandbox payments successful
- ✅ Production approvals obtained
- ✅ End-to-end payment flow verified
- ✅ Webhook handlers verified

**Next Phase:** Phase E — Pilot Launch

---

## PHASE E — PILOT LAUNCH

**Objective:** Deploy production and onboard pilot restaurant

**Owner:** Founder

**Prerequisites:** Phases C and D complete

### Production Deployment

**Verify Production Readiness:**
- ✅ Acceptance Testing complete
- ✅ Payment Certification complete
- ✅ All launch-critical issues resolved
- ✅ Monitoring configured
- ✅ Support channels ready

**Production Checklist:**
- ✅ Domain: imboniserve.com configured
- ✅ SSL: HTTPS working
- ✅ Database: Supabase connected
- ✅ Storage: Supabase storage configured
- ✅ Redis: Upstash connected
- ✅ Email: SMTP configured
- ✅ Payments: InTouch + IremboPay configured
- ✅ Monitoring: Sentry configured
- ✅ Cron jobs: Scheduled and running

### Pilot Restaurant Selection

**Criteria:**
- Restaurant owner is tech-savvy
- Restaurant is willing to provide feedback
- Restaurant has moderate order volume
- Restaurant is geographically accessible
- Restaurant owner is available for support calls

**Select:** 1-3 pilot restaurants

### Pilot Onboarding

**Onboarding Call:**
1. Explain ImboniServe value proposition
2. Walk through signup process
3. Guide through restaurant setup
4. Demonstrate menu creation
5. Show order management
6. Explain QR ordering
7. Demonstrate kitchen operations
8. Answer questions
9. Schedule follow-up call

**Onboarding Checklist:**
- ✅ Restaurant account created
- ✅ Business profile complete
- ✅ Menu items added
- ✅ QR code generated
- ✅ First test order placed
- ✅ Kitchen display configured
- ✅ Owner trained on core workflows

### Pilot Monitoring

**Daily Monitoring:**
- ✅ Check pilot restaurant usage
- ✅ Review error logs
- ✅ Monitor payment transactions
- ✅ Check for support requests

**Weekly Feedback Call:**
- What's working well?
- What's confusing?
- What's broken?
- What's missing?
- Would you pay for this?

**Issue Resolution:**
- Fix launch-critical issues immediately
- Record non-critical issues for post-launch
- Communicate fixes to pilot restaurant

### Exit Criteria

- ✅ Pilot restaurant operational
- ✅ Daily usage confirmed (orders, payments, kitchen)
- ✅ Positive feedback received
- ✅ No critical bugs
- ✅ Pilot restaurant willing to become paying customer

**Next Phase:** Phase F — First Paying Customer

---

## PHASE F — FIRST PAYING CUSTOMER

**Objective:** Achieve first revenue milestone

**Owner:** Founder

**Prerequisites:** Phase E complete (successful pilot)

### Go/No-Go Decision

**Review Pilot Results:**
- Pilot restaurant usage: Daily? Weekly?
- Pilot restaurant feedback: Positive? Negative?
- Critical bugs: Resolved? Outstanding?
- Payment flow: Working? Reliable?
- Overall stability: Production-ready?

**Decision:**
- ✅ **GO** — Proceed to first paying customer
- 🔴 **NO-GO** — Extend pilot, fix issues, re-evaluate

### First Customer Onboarding

**If GO:**

1. **Convert Pilot to Paying Customer**
   - Offer pilot restaurant first customer discount (optional)
   - Guide through subscription payment
   - Verify payment successful
   - Verify subscription activated
   - Verify features unlocked

2. **First Payment Verification**
   - Payment initiated by customer
   - Payment processed successfully
   - Callback received
   - Database updated
   - Subscription status: ACTIVE
   - Customer confirmation sent

3. **Post-Payment Monitoring**
   - Monitor first 24 hours closely
   - Verify all features working
   - Verify no payment issues
   - Verify customer satisfaction

### Milestone Achievement

**First Paying Customer Achieved When:**
- ✅ First customer successfully onboarded
- ✅ First successful production payment received
- ✅ Subscription active and verified
- ✅ Platform operating successfully in production
- ✅ Customer satisfied and using platform daily

**Deliverable:**
- **OPERATION: FIRST CUSTOMER — COMPLETE**

---

## CAPABILITY REFERENCE

### Capability 1: Production Infrastructure

**Objective:** Production site operational on imboniserve.com

**Vercel Configuration:**
1. Open Vercel Dashboard: https://vercel.com/dashboard
2. Create project from GitHub repository
3. Configure production branch: `release/v1.0.0-rc1`
4. Add domain: `imboniserve.com`
5. Configure DNS (follow Vercel instructions)
6. Wait for SSL certificate provisioning

**Supabase Configuration:**
1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Create production project
3. Go to Settings → Database → Connection string
4. Copy pooled connection string → `DATABASE_URL`
5. Copy direct connection string → `DIRECT_URL`
6. Go to Storage → Create bucket: `media-uploads` (public)
7. Go to Settings → API
8. Copy project URL → `SUPABASE_STORAGE_URL`
9. Copy service-role key → `SUPABASE_STORAGE_KEY`

**Vercel Environment Variables:**
```
# Core
NEXTAUTH_URL=https://imboniserve.com
APP_URL=https://imboniserve.com
NEXTAUTH_SECRET=<generate with: openssl rand -hex 32>
TRIAL_HASH_SECRET=<generate with: openssl rand -hex 32>
IMBONI_QR_SECRET=<generate with: openssl rand -hex 32>

# Database
DATABASE_URL=<Supabase pooled connection>
DIRECT_URL=<Supabase direct connection>

# Storage
STORAGE_PROVIDER=supabase
SUPABASE_STORAGE_BUCKET=media-uploads
SUPABASE_STORAGE_URL=<Supabase project URL>
SUPABASE_STORAGE_KEY=<Supabase service-role key>

# Redis
REDIS_URL=<Upstash Redis connection string>

# OpenAI
OPENAI_API_KEY=<OpenAI API key>
OPENAI_MODEL_PRIMARY=gpt-4o-mini
OPENAI_MODEL_FALLBACK=gpt-4-turbo

# Monitoring
SENTRY_DSN=<Sentry DSN>
NEXT_PUBLIC_SENTRY_DSN=<Sentry DSN>
SENTRY_ENVIRONMENT=production

# Cron
CRON_SECRET=<generate with: openssl rand -hex 32>
CRON_WORKER=false

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=<Gmail address>
SMTP_PASSWORD=<Gmail app password>
SMTP_SECURE=true
SMTP_FROM=Imboni Serve <noreply@imboniserve.com>
SUPPORT_EMAIL=support@imboniserve.com

# Display
NEXT_PUBLIC_DISPLAY_CURRENCY=RWF
```

**Verification:**
- ✅ `https://imboniserve.com` loads
- ✅ `https://imboniserve.com/api/health` returns healthy
- ✅ `https://imboniserve.com/api/health/ready` returns ready
- ✅ `https://imboniserve.com/login` loads

---

### Capability 2: Email Configuration

**Gmail App Password:**
1. Open: https://myaccount.google.com/apppasswords
2. Create app password for "ImboniServe"
3. Copy password → `SMTP_PASSWORD` in Vercel

**Verification:**
1. Go to `https://imboniserve.com/forgot-password`
2. Enter your email
3. Check inbox for password reset email
4. Verify email received from `noreply@imboniserve.com`

---

### Capability 3: Monitoring Configuration

**Upstash Redis:**
1. Open: https://console.upstash.com/
2. Create Redis database
3. Copy connection string → `REDIS_URL` in Vercel

**Sentry:**
1. Open: https://sentry.io/
2. Create production project
3. Copy DSN → `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` in Vercel

**Verification:**
- ✅ `https://imboniserve.com/api/health` returns healthy
- ✅ `https://imboniserve.com/api/admin/queue/health` returns healthy
- ✅ Sentry receives test event

---

### Capability 4: Cron Jobs

**Configuration:**
- Already configured in `vercel.json`
- Automatically deployed with production

**Verification:**
```bash
# Test one cron endpoint
curl -H "Authorization: Bearer <CRON_SECRET>" https://imboniserve.com/api/cron/watchdog-payment
```

**Expected:** HTTP 200 OK

**Cron Jobs:**
1. `/api/cron/addon-renewals` - Daily at 2 AM
2. `/api/cron/reconciliation` - Daily at 3 AM
3. `/api/cron/tap-leave-sweep` - Hourly
4. `/api/cron/tap-leave-reconcile` - Every 10 minutes
5. `/api/cron/watchdog-payment` - Every 15 minutes
6. `/api/cron/watchdog-customer` - Every 6 hours
7. `/api/cron/watchdog-revenue` - Every 6 hours
8. `/api/cron/watchdog-subscription` - Every 6 hours
9. `/api/cron/summary-daily` - Daily at 6 AM

---

## TROUBLESHOOTING

### Build Fails on Vercel

**Symptom:** Vercel deployment fails during build

**Check:**
1. Verify `DATABASE_URL` and `DIRECT_URL` are set
2. Verify Prisma can connect to database
3. Check Vercel build logs for specific error

**Fix:**
- If Prisma error: Verify database credentials
- If memory error: Contact Engineering (should be fixed in Phase A)
- If TypeScript error: Contact Engineering

### Payment Callback Not Received

**Symptom:** Payment initiated but webhook not called

**Check:**
1. Verify webhook URL is correct in payment gateway dashboard
2. Verify webhook endpoint is accessible: `curl https://imboniserve.com/api/webhooks/intouch`
3. Check Vercel function logs for webhook calls

**Fix:**
- If 404: Verify webhook URL spelling
- If 401: Verify webhook authentication credentials
- If 500: Check Vercel function logs for error

### Email Not Sending

**Symptom:** Password reset email not received

**Check:**
1. Verify `SMTP_*` variables are set correctly
2. Verify Gmail app password is correct
3. Check spam folder

**Fix:**
- If authentication error: Regenerate Gmail app password
- If connection error: Verify SMTP settings
- If blocked: Check Gmail security settings

### Cron Jobs Not Running

**Symptom:** Scheduled tasks not executing

**Check:**
1. Verify `CRON_SECRET` is set
2. Verify cron jobs appear in Vercel Dashboard → Cron
3. Check Vercel function logs for cron executions

**Fix:**
- If not listed: Verify `vercel.json` is committed and deployed
- If failing: Check function logs for error
- If unauthorized: Verify `CRON_SECRET` matches

---

## SUPPORT RESOURCES

### Documentation
- `RC1_RELEASE_VERIFICATION_REPORT.md` - Engineering verification results
- `SUPABASE_PRODUCTION_VERIFICATION.md` - Database verification details
- `REPOSITORY_VERIFICATION.md` - Git verification details
- `VERCEL_RELEASE_VERIFICATION.md` - Build verification details

### External Resources
- Vercel Documentation: https://vercel.com/docs
- Supabase Documentation: https://supabase.com/docs
- InTouch API: https://www.intouchpay.co.rw/http-api
- IremboPay API: https://irembopay.gitbook.io/irembopay-api-docs

### Engineering Support
- For launch-critical issues only
- Document issue clearly before escalating
- Include error messages and logs

---

**Handbook Owner:** Founder  
**Last Updated:** 2026-07-07  
**Current Phase:** Phase A — Engineering Completion

---

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
