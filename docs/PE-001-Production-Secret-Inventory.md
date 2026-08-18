# PE-001 Production Secret Inventory

| Field | Value |
|---|---|
| Date | 2026-08-10 |
| Rule | Categories and requirements ONLY. No secret values are recorded in this document. |

## Secret Categories

### 1. Authentication Secrets

| Secret | Purpose | Required | Generation | Current State |
|---|---|---|---|---|
| NEXTAUTH_SECRET | NextAuth JWT signing | Yes | `openssl rand -hex 32` (min 32 chars) | Set in dev .env — MUST be regenerated for production |
| TRIAL_HASH_SECRET | Trial eligibility hashing | Yes | `openssl rand -hex 64` | Set in dev .env — MUST be regenerated for production |
| IMBONI_QR_SECRET | QR code HMAC signing | Yes | `openssl rand -hex 32` | Set in dev .env — MUST be regenerated for production |
| CRON_SECRET | Cron job authentication | Yes | `openssl rand -hex 32` | Set in dev .env — MUST be regenerated for production |

**CRITICAL SECURITY FINDING:** `src/lib/services/qr-token.service.ts` lines 10-11 have hardcoded fallback defaults:
- `IMBONI_QR_SECRET` defaults to `'default-qr-secret-change-in-production'`
- `NEXTAUTH_SECRET` defaults to `'default-jwt-secret'`
These must NEVER be relied upon in production. The env-validator requires NEXTAUTH_SECRET but does not require IMBONI_QR_SECRET.

### 2. Database Secrets

| Secret | Purpose | Required | Current State |
|---|---|---|---|
| DATABASE_URL | PostgreSQL connection (pooler) | Yes | Set (dev Supabase project) — production project must be created |
| DIRECT_URL | PostgreSQL connection (direct, for migrations) | Yes | Set (dev Supabase project) — production project must be created |

### 3. Redis Secrets

| Secret | Purpose | Required | Current State |
|---|---|---|---|
| REDIS_URL | Upstash Redis connection (TLS) | Yes | Set (dev Upstash instance) — production instance must be created |

### 4. Pusher Secrets

| Secret | Purpose | Required | Current State |
|---|---|---|---|
| PUSHER_APP_ID | Pusher application ID | Yes | Set (dev app) — production app must be created |
| PUSHER_KEY | Pusher server key | Yes | Set (dev app) |
| PUSHER_SECRET | Pusher server secret | Yes | Set (dev app) |
| NEXT_PUBLIC_PUSHER_KEY | Pusher client key (public, not secret) | Yes | Set |
| NEXT_PUBLIC_PUSHER_CLUSTER | Pusher cluster (public) | Yes | Set (ap2 — consider eu for production) |

### 5. Sentry Secrets

| Secret | Purpose | Required | Current State |
|---|---|---|---|
| SENTRY_DSN | Server-side error tracking DSN | Yes | NOT SET — must be created |
| NEXT_PUBLIC_SENTRY_DSN | Client-side error tracking DSN | Yes | NOT SET — must be created |
| SENTRY_ENVIRONMENT | Environment label | Yes | NOT SET — must be "production" |
| SENTRY_TRACES_SAMPLE_RATE | Performance sampling rate | Recommended | NOT SET — recommend 0.1 |
| SENTRY_AUTH_TOKEN | Source map upload (CI) | Optional | NOT SET — SENTRY_SKIP_UPLOAD=true |

### 6. Twilio Secrets

| Secret | Purpose | Required | Current State |
|---|---|---|---|
| TWILIO_ACCOUNT_SID | Twilio account ID | Yes (if WhatsApp/SMS) | Set |
| TWILIO_AUTH_TOKEN | Twilio auth token | Yes (if WhatsApp/SMS) | Set |
| TWILIO_WHATSAPP_NUMBER | WhatsApp sender | Yes (if WhatsApp) | Set — but WhatsApp channel broken (error 63007) |
| TWILIO_PHONE_NUMBER | SMS sender | Yes (if SMS) | Set |

### 7. SMTP Secrets

| Secret | Purpose | Required | Current State |
|---|---|---|---|
| SMTP_HOST | Email server host | Yes | smtp.gmail.com (personal — production should use dedicated service) |
| SMTP_PORT | Email server port | Yes | 465 |
| SMTP_USER | Email account username | Yes | Set (personal Gmail) |
| SMTP_PASSWORD | Email account password | Yes | Set |
| SMTP_SECURE | TLS/SSL toggle | Yes | NOT SET — must be "true" for production |
| SMTP_FROM | Sender email address | Yes | "Imboni Serve <steve.aimviews@gmail.com>" — production should use branded domain |
| ALERT_EMAIL_TO | Alert email recipient | Recommended | NOT SET |
| SUPPORT_EMAIL | Support email | Recommended | Set |

### 8. InTouch Secrets

| Secret | Purpose | Required | Current State |
|---|---|---|---|
| INTOUCH_USERNAME | Account username | Yes (if InTouch) | Set |
| INTOUCH_ACCOUNT_NO | Account number | Yes (if InTouch) | Set |
| INTOUCH_PASSWORD | Partner password | Yes (if InTouch) | Set |
| INTOUCH_PARTNER_PASSWORD | Partner password (preferred) | Yes (if InTouch) | NOT SET (INTOUCH_PASSWORD used as alias) |
| INTOUCH_WEBHOOK_USERNAME | Webhook Basic Auth username | Yes (if InTouch) | NOT SET — must be set for production |
| INTOUCH_WEBHOOK_PASSWORD | Webhook Basic Auth password | Yes (if InTouch) | NOT SET — must be set for production |
| INTOUCH_CALLBACK_URL | Webhook URL | Yes (if InTouch) | NOT SET (defaults to ${APP_URL}/api/webhooks/intouch) |

### 9. IremboPay Secrets — TWO SETS

**CRITICAL:** IremboPay has two different credential sets for different API integrations.

#### Set A: IremboPay Service (invoice API)

| Secret | Purpose | Required | Current State |
|---|---|---|---|
| IREMBOPAY_SECRET_KEY | Service secret key | Yes (if service used) | Set |
| IREMBOPAY_PUBLIC_KEY | Service public key | Yes (if service used) | Set |
| IREMBOPAY_PAYMENT_ACCOUNT | Payment account | Yes (if service used) | Set (LOYALTECH-RWF) |
| IREMBOPAY_PAYMENT_ITEM_CODE | Payment item code | Yes (if service used) | Set |
| IREMBOPAY_API_BASE | API base URL | Yes (if service used) | Set (https://api.irembopay.com) |
| IREMBOPAY_API_VERSION | API version | Yes (if service used) | Set ("2") |
| IREMBOPAY_WEBHOOK_TOLERANCE_SECONDS | Webhook timestamp tolerance | Optional | Set ("300") |

#### Set B: IremboPay Provider (payment gateway API)

| Secret | Purpose | Required | Current State |
|---|---|---|---|
| IREMBOPAY_MERCHANT_ID | Provider merchant ID | Yes (if provider used) | NOT SET |
| IREMBOPAY_API_KEY | Provider API key | Yes (if provider used) | NOT SET |
| IREMBOPAY_API_SECRET | Provider API secret | Yes (if provider used) | NOT SET |
| IREMBOPAY_API_URL | Provider API URL | Yes (if provider used) | NOT SET (defaults to https://api.irembo.com) |
| IREMBOPAY_CALLBACK_URL | Provider webhook URL | Yes (if provider used) | NOT SET (defaults to ${APP_URL}/api/webhooks/irembopay) |
| IREMBOPAY_RETURN_URL | Provider return URL | Yes (if provider used) | NOT SET (defaults to ${APP_URL}/billing/payment-result) |

**FOUNDER DECISION REQUIRED:** Which IremboPay integration is active for Customer #1? The env-validator requires BOTH sets when `PAYMENTS_PROVIDER=irembo`, but only Set A is currently configured.

### 10. MTN MoMo Secrets (Direct — DEPRECATED)

| Secret | Purpose | Required | Current State |
|---|---|---|---|
| MTN_MOMO_API_KEY | API key | Only if direct MTN | Set (sandbox) |
| MTN_MOMO_SUBSCRIPTION_KEY | Subscription key | Only if direct MTN | Set (sandbox) |
| MTN_MOMO_API_USER | API user | Only if direct MTN | NOT SET |
| MTN_MOMO_ENVIRONMENT | sandbox/production | Only if direct MTN | sandbox |
| MTN_MOMO_API_URL | API URL | Only if direct MTN | sandbox URL |

**FOUNDER DECISION REQUIRED:** Is direct MTN MoMo required for Customer #1, or is InTouch (aggregator) sufficient?

### 11. Airtel Money Secrets

| Secret | Purpose | Required | Current State |
|---|---|---|---|
| AIRTEL_MONEY_API_KEY | API key | Only if direct Airtel | Set |
| AIRTEL_MONEY_API_URL | API URL | Only if direct Airtel | Set (defaults to UAT URL) |
| AIRTEL_MONEY_CLIENT_ID | OAuth client ID | Only if direct Airtel | NOT SET |
| AIRTEL_MONEY_CLIENT_SECRET | OAuth client secret | Only if direct Airtel | NOT SET |

**Note:** Airtel Money is routed through InTouch in the active provider factory. Direct integration exists in legacy services but is not used by the provider factory.

### 12. OpenAI Secrets

| Secret | Purpose | Required | Current State |
|---|---|---|---|
| OPENAI_API_KEY | OpenAI API key | Yes | Set (166 chars) |
| OPENAI_MODEL_PRIMARY | Primary model | Yes | Set |
| OPENAI_MODEL_FALLBACK | Fallback model | Yes | Set |

### 13. Supabase Storage Secrets

| Secret | Purpose | Required | Current State |
|---|---|---|---|
| SUPABASE_STORAGE_URL | Storage URL | Yes | Set (dev project) |
| SUPABASE_STORAGE_KEY | Service role key | Yes | Set (221 chars) |

### 14. Webhook Secrets

| Secret | Purpose | Required | Current State |
|---|---|---|---|
| WHATSAPP_VERIFY_TOKEN | WhatsApp webhook verification | Only if Meta WhatsApp | NOT SET |
| WHATSAPP_APP_SECRET | WhatsApp webhook signature | Only if Meta WhatsApp | NOT SET |

### 15. Slack Alerts

| Secret | Purpose | Required | Current State |
|---|---|---|---|
| SLACK_WEBHOOK_URL | Slack alert webhook | Recommended | NOT SET |

## Secret Generation Commands (for production)

```bash
# Generate 32-char hex secrets
openssl rand -hex 32

# Generate 64-char hex secrets
openssl rand -hex 64
```

## Secret Management Rules

1. **Never commit production secrets to Git** — `.env.production` must be in `.gitignore`
2. **Never write secret values in documentation** — this document records categories only
3. **Store production secrets in Vercel environment variables** (encrypted at rest)
3. **Keep a backup in a password manager** — not in the repository
4. **Rotate secrets periodically** — at minimum every 90 days for Customer #1
5. **Never reuse dev secrets in production** — all secrets must be regenerated
6. **Never share secrets in chat, email, or screenshots**

## Conclusion

15 secret categories identified. 4 authentication secrets must be regenerated for production. Database, Redis, and Pusher secrets must point to production instances. Sentry secrets must be created. InTouch webhook auth must be configured. IremboPay provider credentials must be obtained. SMTP must be reconfigured for a production email service.
