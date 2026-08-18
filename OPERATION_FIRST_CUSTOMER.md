# FOUNDER OPERATIONS RUNBOOK
## ImboniServe — First Paying Customer

**Last verified:** 2026-07-07  
**Mode:** Execution only. This document assumes the repository is already production-ready. Completed engineering work, blocker history, IAS milestones, and timeline estimates are intentionally omitted.

Follow this document top-to-bottom. Do not skip a capability.

---

## Launch Progress Dashboard

| # | Capability | Status | Done when |
|---|---|---|---|
| 1 | Production foundation | Pending | Domain, auth, database, and storage are live |
| 2 | Payments | Pending | InTouch and IremboPay both return successful test payments |
| 3 | Communications | Pending | Email and support contact paths work |
| 4 | Monitoring & recovery | Pending | Redis, Sentry, cron, and health checks work |
| 5 | First customer onboarding | Pending | First customer account is live and paid |

---

## Capability 1 — Production Foundation

### Objective
Make the production site reachable on the correct domain with working authentication, PostgreSQL, and file storage.

### Founder Tasks
1. Open **Vercel Dashboard**: https://vercel.com/dashboard.
2. Open the ImboniServe project → **Settings** → **Domains**.
3. Add the production domain `imboniserve.com`. If Vercel shows DNS instructions, complete them at your domain registrar and wait until the domain is verified.
4. In the same Vercel project, open **Settings** → **Environment Variables**.
5. Add these **Production** environment variables:
   - `NEXTAUTH_URL=https://imboniserve.com`
   - `APP_URL=https://imboniserve.com`
   - `NEXTAUTH_SECRET=<generate with openssl rand -hex 32>`
   - `TRIAL_HASH_SECRET=<generate with openssl rand -hex 32>`
   - `IMBONI_QR_SECRET=<generate with openssl rand -hex 32>`
   - `ALLOW_LEGACY_CREDENTIALS=false`
   - `STORAGE_PROVIDER=supabase`
   - `SUPABASE_STORAGE_BUCKET=media-uploads`
   - `DATABASE_URL=<Supabase pooled connection string>`
   - `DIRECT_URL=<Supabase direct connection string>`
   - `SUPABASE_STORAGE_URL=<Supabase project URL>`
   - `SUPABASE_STORAGE_KEY=<Supabase service-role key>`
6. Open **Supabase Dashboard**: https://supabase.com/dashboard/sign-in.
7. Create or open the production project.
8. Go to **Project Settings** → **Database** → **Connection string**.
   - Copy the **pooled** PostgreSQL URI into `DATABASE_URL`.
   - Copy the **direct** PostgreSQL URI into `DIRECT_URL`.
9. Go to **Storage** → **Create bucket** and create a public bucket named `media-uploads`.
10. Go to **Project Settings** → **API** and copy the project URL and service-role key into `SUPABASE_STORAGE_URL` and `SUPABASE_STORAGE_KEY`.
11. Return to Vercel and trigger a **Redeploy** from the latest production deployment.

### Engineering Tasks (if any)
- None. If the redeploy fails, inspect the Vercel deployment logs and correct the environment variables.

### Verification Steps
1. Open `https://imboniserve.com` in a browser and confirm the site loads over HTTPS.
2. Open `https://imboniserve.com/api/health` and confirm the app responds.
3. Open `https://imboniserve.com/api/health/ready` and confirm the response is `ready`.
4. Open `https://imboniserve.com/login` and confirm the login page loads.

### Exit Criteria
- Production domain resolves correctly.
- Database readiness check returns `ready`.
- Authentication pages load successfully.
- Storage settings are saved in Vercel and Supabase.

---

## Capability 2 — Payments

### Objective
Accept mobile money through InTouch and card payments through IremboPay.

### Founder Tasks
1. Open **InTouch Pay**: https://www.intouchpay.co.rw/.
2. If you need the API reference, open: https://www.intouchpay.co.rw/http-api.
3. Request production API access and obtain these values from InTouch:
   - `INTOUCH_USERNAME`
   - `INTOUCH_ACCOUNT_NO`
   - `INTOUCH_PARTNER_PASSWORD`
   - `INTOUCH_WEBHOOK_USERNAME`
   - `INTOUCH_WEBHOOK_PASSWORD`
4. In **Vercel Dashboard** → **Settings** → **Environment Variables**, add:
   - `INTOUCH_API_URL=https://www.intouchpay.co.rw/api`
   - `INTOUCH_USERNAME=<from InTouch>`
   - `INTOUCH_ACCOUNT_NO=<from InTouch>`
   - `INTOUCH_PARTNER_PASSWORD=<from InTouch>`
   - `INTOUCH_PASSWORD=<same value as INTOUCH_PARTNER_PASSWORD>`
   - `INTOUCH_WEBHOOK_USERNAME=<from InTouch>`
   - `INTOUCH_WEBHOOK_PASSWORD=<from InTouch>`
   - `INTOUCH_CALLBACK_URL=https://imboniserve.com/api/webhooks/intouch`
5. Open **IremboPay**: https://irembo.com/irembopay/.
6. Open the API docs if you need the integration details: https://irembopay.gitbook.io/irembopay-api-docs.
7. Request production merchant access and obtain these values from IremboPay:
   - `IREMBOPAY_MERCHANT_ID`
   - `IREMBOPAY_API_KEY`
   - `IREMBOPAY_API_SECRET`
   - `IREMBOPAY_PAYMENT_ITEM_CODE`
8. In **Vercel Dashboard** → **Settings** → **Environment Variables**, add:
   - `IREMBOPAY_API_URL=https://api.irembo.com`
   - `IREMBOPAY_MERCHANT_ID=<from IremboPay>`
   - `IREMBOPAY_API_KEY=<from IremboPay>`
   - `IREMBOPAY_API_SECRET=<from IremboPay>`
   - `IREMBOPAY_PAYMENT_ACCOUNT=LOYALTECH-RWF`
   - `IREMBOPAY_PAYMENT_ITEM_CODE=<from IremboPay>`
   - `IREMBOPAY_CALLBACK_URL=https://imboniserve.com/api/webhooks/irembopay`
   - `IREMBOPAY_RETURN_URL=https://imboniserve.com/billing/payment-result`
   - `PAYMENTS_PROVIDER=intouch`
9. Redeploy the production site from Vercel.

### Engineering Tasks (if any)
- None. If a payment callback fails, inspect the webhook logs and the provider credentials first.

### Verification Steps
1. Open `https://imboniserve.com/api/admin/payments/health` and confirm the payment health check is healthy.
2. Open `https://imboniserve.com/admin/payments/operations` after logging in and confirm the gateway status is visible.
3. Run one low-value InTouch payment through the live flow and confirm the webhook updates the transaction.
4. Run one low-value IremboPay card payment through the live flow and confirm the callback updates the transaction.

### Exit Criteria
- InTouch can create and confirm a real payment.
- IremboPay can create and confirm a real payment.
- Payment results appear in the payment operations view.

---

## Capability 3 — Communications

### Objective
Make sure customers can receive emails and reach support without friction.

### Founder Tasks
1. Open the **Google App Passwords** page: https://myaccount.google.com/apppasswords.
2. Create an app password for the mailbox you will use as the support sender.
3. In **Vercel Dashboard** → **Settings** → **Environment Variables**, add:
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=465`
   - `SMTP_USER=<your support mailbox>`
   - `SMTP_PASSWORD=<Google app password>`
   - `SMTP_SECURE=true`
   - `SMTP_FROM=Imboni Serve <noreply@imboniserve.com>`
   - `SUPPORT_EMAIL=support@imboniserve.com`
   - `ALERT_EMAIL_TO=ops@imboniserve.com`
   - `NEXT_PUBLIC_SUPPORT_WHATSAPP_URL=https://wa.me/<your-number>`
   - `NEXT_PUBLIC_DISPLAY_CURRENCY=RWF`
4. If you want in-app chat before launch, open **Crisp**: https://app.crisp.chat/ and copy the Website ID into `NEXT_PUBLIC_CRISP_WEBSITE_ID`. If you do not want chat yet, skip this step.
5. Redeploy the production site from Vercel.

### Engineering Tasks (if any)
- None. If mail does not send, verify the Gmail app password and sender address first.

### Verification Steps
1. Use `https://imboniserve.com/forgot-password` and send a password reset email to your own inbox.
2. Open the email in your inbox and confirm it arrived from the address in `SMTP_FROM`.
3. Click the support email link in the app and confirm it opens your mail client with `SUPPORT_EMAIL`.
4. Click the WhatsApp support link and confirm it opens the correct chat.

### Exit Criteria
- Password reset email is delivered successfully.
- Support email and support WhatsApp both work.
- The customer has one reliable way to reach you immediately.

---

## Capability 4 — Monitoring & Recovery

### Objective
Know when the system is failing, queue work is stuck, or scheduled jobs are not running.

### Founder Tasks
1. Open **Upstash Console**: https://console.upstash.com/.
2. Create a Redis database.
3. Open the database details and copy the Redis connection string into `REDIS_URL` in **Vercel Dashboard** → **Settings** → **Environment Variables**.
4. Generate a random secret for cron authentication using `openssl rand -hex 32`.
5. Add these Vercel environment variables:
   - `CRON_SECRET=<generated secret>`
   - `CRON_WORKER=false`
   - `LOG_LEVEL=info`
6. Open **Sentry**: https://sentry.io/.
7. Create the production project and copy the DSN into these environment variables:
   - `SENTRY_DSN=<from Sentry>`
   - `NEXT_PUBLIC_SENTRY_DSN=<same DSN>`
   - `SENTRY_ENVIRONMENT=production`
   - `SENTRY_TRACES_SAMPLE_RATE=0.1`
8. Redeploy the production site from Vercel.

### Engineering Tasks (if any)
- None. If health checks fail, inspect Redis connectivity and the Sentry/Vercel deployment logs.

### Verification Steps
1. Open `https://imboniserve.com/api/health`.
2. Open `https://imboniserve.com/api/health/ready`.
3. Open `https://imboniserve.com/api/die/operations/health`.
4. Open `https://imboniserve.com/api/admin/queue/health`.
5. Open `https://imboniserve.com/api/admin/payments/health`.
6. From a terminal, call one cron endpoint with the secret, for example:
   - `curl -H "Authorization: Bearer <CRON_SECRET>" https://imboniserve.com/api/cron/watchdog-payment`
7. In Sentry, use the project’s test-event action if available and confirm the event appears.

### Exit Criteria
- Redis-backed features connect successfully.
- Cron routes authenticate with `CRON_SECRET`.
- Health endpoints return healthy status.
- Sentry is receiving events.

---

## Capability 5 — First Customer Onboarding

### Objective
Move one real restaurant from signup to active paid usage.

### Founder Tasks
1. Open `https://imboniserve.com/signup` in an incognito window.
2. Create the first customer account using the customer’s real business name, email, phone number, and password.
3. Open `https://imboniserve.com/login` and confirm the customer account can sign in.
4. Open `https://imboniserve.com/dashboard/settings` and confirm the business profile is correct:
   - Business name
   - Currency = `RWF`
   - Timezone = `Africa/Kigali`
   - Support email and support WhatsApp
5. Open `https://imboniserve.com/billing` and start the live subscription or payment flow using the provider configured in Capability 2.
6. After payment succeeds, open `https://imboniserve.com/admin/subscriptions` and confirm the subscription is active.
7. Record the customer name, payment reference, and activation date in your launch log.

### Engineering Tasks (if any)
- None. If onboarding fails, the problem is usually a missing environment variable or a bad payment callback.

### Verification Steps
1. The customer can log in successfully.
2. The customer can reach the billing flow.
3. The payment completes successfully.
4. Subscription status shows active in the admin view.
5. The customer can use the app without founder intervention.

### Exit Criteria
- One real customer is onboarded.
- One real payment has been captured.
- The customer is active and ready to use the platform.

---

## Ready for First Paying Customer

Do not launch until every item below is true.

- [ ] Production domain loads at `https://imboniserve.com`
- [ ] `https://imboniserve.com/api/health/ready` returns `ready`
- [ ] Supabase database is connected through `DATABASE_URL` and `DIRECT_URL`
- [ ] Supabase storage bucket `media-uploads` exists and uploads work
- [ ] `NEXTAUTH_URL`, `APP_URL`, and auth secrets are set in Vercel
- [ ] InTouch production credentials are configured and a test payment succeeds
- [ ] IremboPay production credentials are configured and a test payment succeeds
- [ ] Email from `SMTP_FROM` arrives in your inbox
- [ ] `SUPPORT_EMAIL` and `NEXT_PUBLIC_SUPPORT_WHATSAPP_URL` work
- [ ] `REDIS_URL` is set and queue/ops health checks are green
- [ ] `CRON_SECRET` is set and cron endpoints authenticate
- [ ] `SENTRY_DSN` is set and Sentry receives a test event
- [ ] First customer account is created at `https://imboniserve.com/signup`
- [ ] First customer can log in at `https://imboniserve.com/login`
- [ ] First live payment has been received
- [ ] Subscription is active in `https://imboniserve.com/admin/subscriptions`

When every box is checked, the first paying customer is live.
