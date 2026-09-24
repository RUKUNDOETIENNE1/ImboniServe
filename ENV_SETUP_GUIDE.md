# 🚀 Imboni Serve Environment Setup Guide
**Complete Step-by-Step Guide for Non-Programmers**

This guide will help you set up all the required services and API keys for your Imboni Serve application. Follow each section carefully, and you'll have everything configured in no time!

---

## 📋 Table of Contents
1. [Database Setup](#1-database-setup)
2. [Authentication (NextAuth)](#2-authentication-nextauth)
3. [Email Service (SMTP)](#3-email-service-smtp)
4. [Twilio (SMS & WhatsApp)](#4-twilio-sms--whatsapp)
5. [Payment Gateways](#5-payment-gateways)
   - [InTouch Mobile Money](#intouch-mobile-money-primary)
   - [IremboPay (Cards)](#irembopay-cards-fallback)
6. [Pusher (Real-time Features)](#6-pusher-real-time-features)
7. [Supabase Storage (File Uploads)](#7-supabase-storage-file-uploads)
8. [Sentry (Error Monitoring)](#8-sentry-error-monitoring)
9. [OpenAI (AI Features)](#9-openai-ai-features)
10. [Optional Services](#10-optional-services)
11. [Final Steps & Verification](#11-final-steps--verification)

---

## 1. 🗄️ Database Setup

**What it's for:** Stores all your application data (users, orders, inventory, etc.)

### Steps:
1. **Already configured!** Your `.env.example` has a default PostgreSQL connection string.
2. If you're using a hosted database (like Supabase, Railway, or Render):
   - Copy your database connection URL
   - Replace the `DATABASE_URL` value in your `.env` file

**Example:**
```bash
DATABASE_URL="postgresql://username:password@host:5432/database_name"
```

**✅ Skip this if:** You're using the default local PostgreSQL setup.

---

## 2. 🔐 Authentication (NextAuth)

**What it's for:** Secure user login and session management

### Steps:
1. **Generate a secret key:**
   - **Windows:** Open PowerShell and run:
     ```powershell
     [System.Guid]::NewGuid().ToString("N")
     ```
   - **Mac/Linux:** Open Terminal and run:
     ```bash
     openssl rand -hex 32
     ```
   - Copy the output

2. **Update your `.env` file:**
   ```bash
   NEXTAUTH_SECRET="paste_your_generated_secret_here"
   NEXTAUTH_URL="http://localhost:3000"  # Change to your domain in production
   ```

**✅ You're done!** No external service needed.

---

## 3. 📧 Email Service (SMTP)

**What it's for:** Sending emails (login codes, invoices, alerts)

### Option A: Using Gmail (Recommended for beginners)

1. **Enable 2-Step Verification:**
   - Go to: https://myaccount.google.com/security
   - Click "2-Step Verification" and follow the setup

2. **Generate an App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Imboni Serve"
   - Click "Generate"
   - **Copy the 16-character password** (you won't see it again!)

3. **Update your `.env` file:**
   ```bash
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASSWORD="your-16-char-app-password"
   SMTP_FROM="noreply@imboniserve.com"
   SUPPORT_EMAIL="support@imboniserve.com"
   ```

### Option B: Using SendGrid or Mailgun
- **SendGrid:** https://sendgrid.com → Get API Key → Use SMTP settings
- **Mailgun:** https://mailgun.com → Get SMTP credentials

**✅ Test it:** Try logging in with email OTP after setup.

---

## 4. 📱 Twilio (SMS & WhatsApp)

**What it's for:** Sending SMS and WhatsApp messages to customers

### Steps:

1. **Sign up for Twilio:**
   - Go to: https://www.twilio.com/try-twilio
   - Create a free account (you'll get $15 credit)

2. **Get your credentials:**
   - After signup, you'll see your **Account SID** and **Auth Token** on the dashboard
   - Copy both values

3. **Get a phone number:**
   - In Twilio Console, go to: **Phone Numbers** → **Buy a Number**
   - Choose a number with SMS capability
   - Copy the phone number (format: +1234567890)

4. **Set up WhatsApp (optional):**
   - Go to: **Messaging** → **Try it Out** → **Send a WhatsApp message**
   - Follow the instructions to join the sandbox
   - You'll get a sandbox number like: `whatsapp:+14155238886`

5. **Update your `.env` file:**
   ```bash
   TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   TWILIO_AUTH_TOKEN="your_auth_token_here"
   TWILIO_PHONE_NUMBER="+1234567890"  # Your Twilio number
   TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"  # Sandbox number
   ```

**✅ Test it:** Send a test SMS from your app.

---

## 5. 💳 Payment Gateways

### InTouch Mobile Money (Primary)

**What it's for:** Accept MTN Mobile Money and Airtel Money payments in Rwanda

### Steps:

1. **Contact InTouch:**
   - Website: https://www.intouchpay.co.rw
   - Email: support@intouchpay.co.rw
   - Request API access for your business

2. **You'll receive:**
   - Username
   - Account Number
   - Partner Password

3. **Update your `.env` file:**
   ```bash
   INTOUCH_API_URL="https://www.intouchpay.co.rw/api"
   INTOUCH_USERNAME="your_username"
   INTOUCH_ACCOUNT_NO="your_account_number"
   INTOUCH_PASSWORD="your_partner_password"
   ```

**⚠️ Important:** Remove any leading/trailing spaces from the username!

---

### IremboPay (Cards - Fallback)

**What it's for:** Accept credit/debit card payments

### Steps:

1. **Contact IremboPay:**
   - Website: https://www.irembopay.com
   - Reach out to their technical team for API access

2. **You'll receive:**
   - Public Key
   - Secret Key
   - Payment Account ID
   - Payment Item Code

3. **Update your `.env` file:**
   ```bash
   IREMBOPAY_PUBLIC_KEY="your_public_key"
   IREMBOPAY_SECRET_KEY="your_secret_key"
   IREMBOPAY_PAYMENT_ACCOUNT="LOYALTECH-RWF"
   IREMBOPAY_PAYMENT_ITEM_CODE="PC-xxxxxxxxx"
   IREMBOPAY_API_BASE="https://api.irembopay.com"  # Use sandbox URL for testing
   ```

**✅ Test it:** Make a small test payment in sandbox mode.

---

## 6. 🔄 Pusher (Real-time Features)

**What it's for:** Live updates (chat messages, notifications, order status)

### Steps:

1. **Sign up for Pusher:**
   - Go to: https://dashboard.pusher.com/accounts/sign_up
   - Create a free account

2. **Create a Channels app:**
   - Click "Create app"
   - Name: "Imboni Serve"
   - Cluster: Choose closest to your users (e.g., `eu` for Europe, `ap1` for Asia)
   - Click "Create app"

3. **Get your credentials:**
   - Go to "App Keys" tab
   - Copy: **app_id**, **key**, **secret**, and **cluster**

4. **Update your `.env` file:**
   ```bash
   PUSHER_APP_ID="123456"
   PUSHER_KEY="your_key_here"
   PUSHER_SECRET="your_secret_here"
   PUSHER_CLUSTER="eu"
   
   # Client-side (same values)
   NEXT_PUBLIC_PUSHER_KEY="your_key_here"
   NEXT_PUBLIC_PUSHER_CLUSTER="eu"
   ```

**✅ Test it:** Open support chat in two browser windows and send a message—it should appear instantly in both!

---

## 7. 📁 Supabase Storage (File Uploads)

**What it's for:** Store uploaded images, videos, and documents

### Steps:

1. **Sign up for Supabase:**
   - Go to: https://supabase.com
   - Click "Start your project" and create a free account

2. **Create a new project:**
   - Click "New Project"
   - Name: "Imboni Serve"
   - Database Password: (save this somewhere safe!)
   - Region: Choose closest to your users
   - Click "Create new project" (takes ~2 minutes)

3. **Get your API credentials:**
   - Go to: **Project Settings** (gear icon) → **API**
   - Copy:
     - **URL** (e.g., `https://xxxxx.supabase.co`)
     - **service_role key** (NOT the anon key!)

4. **Create a storage bucket:**
   - Go to: **Storage** (left sidebar)
   - Click "Create a new bucket"
   - Name: `media-uploads`
   - Make it **Public**
   - Click "Create bucket"

5. **Update your `.env` file:**
   ```bash
   STORAGE_PROVIDER="supabase"  # Change from "local" to "supabase"
   SUPABASE_STORAGE_URL="https://xxxxx.supabase.co"
   SUPABASE_STORAGE_KEY="your_service_role_key_here"
   SUPABASE_STORAGE_BUCKET="media-uploads"
   ```

**✅ Test it:** Upload an image in the support chat—it should be stored in Supabase!

**💡 Tip:** Use `STORAGE_PROVIDER="local"` during development to save files locally.

---

## 8. 🐛 Sentry (Error Monitoring)

**What it's for:** Track errors and performance issues in your app

### Steps:

1. **Sign up for Sentry:**
   - Go to: https://sentry.io/signup
   - Create a free account (free tier is generous!)

2. **Create a new project:**
   - Click "Create Project"
   - Platform: **Next.js**
   - Alert frequency: Choose your preference
   - Name: "Imboni Serve"
   - Click "Create Project"

3. **Get your DSN:**
   - After creation, you'll see your **DSN** (looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)
   - Copy it

4. **Update your `.env` file:**
   ```bash
   SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
   NEXT_PUBLIC_SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"  # Same value
   SENTRY_ENVIRONMENT="development"  # Change to "production" when deploying
   SENTRY_TRACES_SAMPLE_RATE="0.1"  # Track 10% of requests
   ```

**✅ Test it:** Trigger a test error in your app and check the Sentry dashboard.

---

## 9. 🤖 OpenAI (AI Features)

**What it's for:** AI-powered business insights, menu suggestions, and smart recommendations

### Steps:

1. **Sign up for OpenAI:**
   - Go to: https://platform.openai.com/signup
   - Create an account

2. **Add payment method:**
   - Go to: **Settings** → **Billing**
   - Add a credit card (you'll get $5 free credit)

3. **Create an API key:**
   - Go to: **API Keys** (left sidebar)
   - Click "Create new secret key"
   - Name: "Imboni Serve"
   - Copy the key (starts with `sk-proj-` or `sk-`)
   - **⚠️ Save it now—you won't see it again!**

4. **Update your `.env` file:**
   ```bash
   OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

**✅ Test it:** Use the AI Business Insights feature in your dashboard.

**💡 Cost:** Very affordable—typically $0.10-$1.00 per month for small businesses.

---

## 10. 🔧 Optional Services

### Redis (Job Queue)
**Skip this unless you need background job processing.**

If needed:
- Install Redis locally: https://redis.io/download
- Or use a hosted service: https://upstash.com (free tier available)

```bash
REDIS_URL="redis://localhost:6379"
```

---

## 11. ✅ Final Steps & Verification

### 1. Copy `.env.example` to `.env`
```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Mac/Linux
cp .env.example .env
```

### 2. Fill in all the values
- Go through each section above
- Replace placeholder values with your actual credentials
- **Never commit your `.env` file to Git!**

### 3. Verify your setup

**Quick checklist:**
- [ ] Database connects successfully
- [ ] Can log in with email OTP
- [ ] SMS/WhatsApp messages send
- [ ] Test payment goes through (use sandbox!)
- [ ] Real-time chat updates work
- [ ] File uploads work
- [ ] Errors appear in Sentry dashboard
- [ ] AI features respond

### 4. Deploy to production

**For Vercel:**
1. Go to: https://vercel.com
2. Import your GitHub repository
3. Go to: **Settings** → **Environment Variables**
4. Add ALL your environment variables (copy from `.env`)
5. **Important:** Mark server-only secrets as "Server" only:
   - `NEXTAUTH_SECRET`
   - `SMTP_PASSWORD`
   - `SUPABASE_STORAGE_KEY`
   - `SENTRY_DSN` (server)
   - `PUSHER_SECRET`
   - `INTOUCH_PASSWORD`
   - `IREMBOPAY_SECRET_KEY`
   - `OPENAI_API_KEY`
6. Redeploy your app

**For other platforms:**
- Add environment variables in your hosting platform's dashboard
- Follow their specific deployment guides

---

## ⏰ Scheduled Jobs (Cron)

**What it's for:** Automated background tasks — nightly reconciliation, Tap & Leave payment sweeps, stock alerts, report generation.

### Required variables

```bash
# Secret token that Vercel sends with every cron request.
# Generate with: openssl rand -hex 32
CRON_SECRET="your-random-secret-here"

# Set to "true" ONLY when running a dedicated long-running Node process (non-Vercel).
# On Vercel this must be unset (or "false") — jobs are triggered via HTTP cron routes.
CRON_WORKER="false"
```

### Vercel deployment
Cron jobs are configured in `vercel.json`. On Vercel Pro they fire automatically:
| Route | Schedule | Purpose |
|---|---|---|
| `/api/cron/reconciliation` | `0 0 * * *` | Nightly payment reconciliation (00:00 UTC = 02:00 CAT) |
| `/api/cron/tap-leave-sweep` | `0 * * * *` | Recover missed Tap & Leave finalizations (hourly) |
| `/api/cron/tap-leave-reconcile` | `0 * * * *` | Poll pending InTouch transactions (hourly) |
| `/api/cron/monthly-usage-reset` | `0 0 1 * *` | Reset monthly usage counters |
| `/api/cron/addon-renewals` | `0 2 * * *` | Process add-on subscription renewals |

> **Note:** Vercel Hobby plan supports a minimum interval of 1 day. Upgrade to Pro for hourly/sub-hourly jobs.

### Self-hosted / Railway
Set `CRON_WORKER=true` in your environment and ensure the long-running Node process is started (it calls `CronService.start()` in-process).

---

## 🆘 Need Help?

**Common Issues:**

1. **"SMTP authentication failed"**
   - Make sure you're using an App Password, not your regular password
   - Check that 2-Step Verification is enabled

2. **"Pusher connection failed"**
   - Verify your cluster is correct (eu, us2, ap1, etc.)
   - Make sure both server and client keys are set

3. **"Payment failed"**
   - Check you're using the correct API URL (sandbox vs production)
   - Verify all credentials have no extra spaces

4. **"File upload failed"**
   - Make sure the Supabase bucket is public
   - Verify you're using the service_role key, not anon key

**Still stuck?**
- Check the error in Sentry dashboard
- Review the application logs
- Contact support: support@imboniserve.com

---

## 🎉 You're All Set!

Congratulations! Your Imboni Serve application is now fully configured with all the necessary services. 

**Next steps:**
1. Test all features thoroughly
2. Set up your business profile
3. Add your menu items
4. Start accepting orders!

**Security reminder:**
- Never share your `.env` file
- Never commit secrets to Git
- Use strong, unique passwords
- Enable 2FA on all services
- Regularly rotate API keys

---

**Last updated:** April 2026  
**Questions?** Email: support@imboniserve.com
