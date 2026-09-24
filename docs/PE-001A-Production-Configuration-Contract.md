# PE-001A Production Configuration Contract

| Field | Value |
|---|---|
| Date | 2026-08-10 |
| Rule | No secret values. Only required variables, purpose, environment, and validation rules. |

## Configuration Contract

### Critical (Platform will not function without these)

| Variable | Purpose | Environment | Validation | Fail-Closed? |
|---|---|---|---|---|
| DATABASE_URL | PostgreSQL connection (pooler) | Production | Must start with `postgresql://` | env-validator throws |
| DIRECT_URL | PostgreSQL connection (direct, migrations) | Production | Must start with `postgresql://` | env-validator throws |
| NEXTAUTH_URL | Production URL | Production | Must start with `http` | next.config.js fallback to imboniserve.com |
| NEXTAUTH_SECRET | NextAuth JWT signing | Production | Min 32 chars | env-validator throws + PE-001A fail-closed |
| IMBONI_QR_SECRET | QR code HMAC signing | Production | Must be set | PE-001A fail-closed (throws in production) |
| TRIAL_HASH_SECRET | Trial eligibility hashing | Production | Must be set | PE-001A fail-closed (throws in production) |
| CRON_SECRET | Cron job authentication | Production | Must be set | All cron endpoints fail-closed |
| NODE_ENV | Environment flag | Production | Must be `production` | Required for all fail-closed guards |
| ALLOW_LEGACY_CREDENTIALS | Legacy auth bypass | Production | Must be `false` | Double-guarded (flag + NODE_ENV) |
| APP_URL | Application base URL | Production | Must be `https://imboniserve.com` | Used for callbacks/links |

### Payment Gateway — InTouch (if PAYMENTS_PROVIDER=intouch)

| Variable | Purpose | Validation | Fail-Closed? |
|---|---|---|---|
| INTOUCH_API_URL | API endpoint | Defaults to production URL | Safe default |
| INTOUCH_USERNAME | Account username | env-validator requires | env-validator throws |
| INTOUCH_ACCOUNT_NO | Account number | env-validator requires | env-validator throws |
| INTOUCH_PARTNER_PASSWORD | Partner password | env-validator requires (or INTOUCH_PASSWORD) | env-validator throws |
| INTOUCH_WEBHOOK_USERNAME | Webhook Basic Auth username | env-validator requires | env-validator throws |
| INTOUCH_WEBHOOK_PASSWORD | Webhook Basic Auth password | env-validator requires | env-validator throws |
| INTOUCH_CALLBACK_URL | Webhook URL | Defaults to ${APP_URL}/api/webhooks/intouch | Safe default |

### Payment Gateway — IremboPay Service (if used)

| Variable | Purpose | Validation | Fail-Closed? |
|---|---|---|---|
| IREMBOPAY_API_BASE | API base URL | Must be set in production | PE-001A fail-closed (throws) |
| IREMBOPAY_SECRET_KEY | Service secret key | env-validator requires | env-validator throws |
| IREMBOPAY_PUBLIC_KEY | Service public key | env-validator requires | env-validator throws |
| IREMBOPAY_PAYMENT_ACCOUNT | Payment account | env-validator requires | env-validator throws |
| IREMBOPAY_PAYMENT_ITEM_CODE | Payment item code | env-validator requires | env-validator throws |

### Payment Gateway — IremboPay Provider (if used)

| Variable | Purpose | Validation | Fail-Closed? |
|---|---|---|---|
| IREMBOPAY_API_URL | Provider API URL | Defaults to production URL | Safe default |
| IREMBOPAY_MERCHANT_ID | Merchant ID | env-validator requires | env-validator throws |
| IREMBOPAY_API_KEY | API key | env-validator requires | env-validator throws |
| IREMBOPAY_API_SECRET | API secret | env-validator requires | env-validator throws |

### Payment Gateway — MTN MoMo (DEPRECATED, if direct integration used)

| Variable | Purpose | Validation | Fail-Closed? |
|---|---|---|---|
| MTN_MOMO_ENVIRONMENT | sandbox/production | Must be set in production | PE-001A fail-closed (throws) |
| MTN_MOMO_SUBSCRIPTION_KEY | Subscription key | Required if direct MTN | Service throws on use |
| MTN_MOMO_API_USER | API user | Required if direct MTN | Service throws on use |
| MTN_MOMO_API_KEY | API key | Required if direct MTN | Service throws on use |

### Messaging — Twilio

| Variable | Purpose | Validation | Fail-Closed? |
|---|---|---|---|
| TWILIO_ACCOUNT_SID | Account ID | Optional (if WhatsApp/SMS) | Feature disabled if missing |
| TWILIO_AUTH_TOKEN | Auth token | Optional (if WhatsApp/SMS) | Feature disabled if missing |
| TWILIO_WHATSAPP_NUMBER | WhatsApp sender | Optional (if WhatsApp) | Feature disabled if missing |
| TWILIO_PHONE_NUMBER | SMS sender | Optional (if SMS) | Feature disabled if missing |

### Messaging — SMTP

| Variable | Purpose | Validation | Fail-Closed? |
|---|---|---|---|
| SMTP_HOST | Email server host | Optional (if email) | Feature disabled if missing |
| SMTP_PORT | Email server port | Optional (if email) | Defaults to 587 |
| SMTP_USER | Email username | Optional (if email) | Feature disabled if missing |
| SMTP_PASSWORD | Email password | Optional (if email) | Feature disabled if missing |
| SMTP_SECURE | TLS toggle | Recommended `true` for production | Defaults to false (warn) |
| SMTP_FROM | Sender address | Optional (if email) | Defaults to noreply@imboni.rw |

### Infrastructure — Redis

| Variable | Purpose | Validation | Fail-Closed? |
|---|---|---|---|
| REDIS_URL | Redis connection (TLS) | Optional | Defaults to localhost (dev only) |

### Infrastructure — Pusher

| Variable | Purpose | Validation | Fail-Closed? |
|---|---|---|---|
| PUSHER_APP_ID | App ID | Optional | Feature disabled if missing |
| PUSHER_KEY | Server key | Optional | Feature disabled if missing |
| PUSHER_SECRET | Server secret | Optional | Feature disabled if missing |
| PUSHER_CLUSTER | Cluster region | Optional | Feature disabled if missing |
| NEXT_PUBLIC_PUSHER_KEY | Client key (public) | Optional | Feature disabled if missing |
| NEXT_PUBLIC_PUSHER_CLUSTER | Client cluster (public) | Optional | Feature disabled if missing |

### Monitoring — Sentry

| Variable | Purpose | Validation | Fail-Closed? |
|---|---|---|---|
| SENTRY_DSN | Server error tracking | Optional | No errors captured if missing |
| NEXT_PUBLIC_SENTRY_DSN | Client error tracking | Optional | No errors captured if missing |
| SENTRY_ENVIRONMENT | Environment label | Optional | Defaults to NODE_ENV |
| SENTRY_TRACES_SAMPLE_RATE | Performance sampling | Optional | Defaults to 0 (no tracing) |

### AI — OpenAI

| Variable | Purpose | Validation | Fail-Closed? |
|---|---|---|---|
| OPENAI_API_KEY | OpenAI API key | Optional | AI features disabled if missing |
| OPENAI_MODEL_PRIMARY | Primary model | Optional | Defaults to configured model |
| OPENAI_MODEL_FALLBACK | Fallback model | Optional | No fallback if missing |

### Storage — Supabase

| Variable | Purpose | Validation | Fail-Closed? |
|---|---|---|---|
| SUPABASE_STORAGE_URL | Storage URL | Optional | Storage disabled if missing |
| SUPABASE_STORAGE_KEY | Service role key | Optional | Storage disabled if missing |

### Alerts

| Variable | Purpose | Validation | Fail-Closed? |
|---|---|---|---|
| SLACK_WEBHOOK_URL | Slack alert webhook | Optional | No Slack alerts if missing |
| ALERT_EMAIL_TO | Alert email recipient | Optional | No email alerts if missing |
| SUPPORT_EMAIL | Support email | Optional | Defaults to configured email |

### Feature Configuration

| Variable | Purpose | Production Value | Validation |
|---|---|---|---|
| KITCHEN_CONSUMPTION_ENGINE_MODE | Inventory consumption | `off` | Optional |
| FEATURE_FLAG_AUTO_CHECK_ENABLED | Auto-check feature | `true` | Optional |
| AI_CREDITS_ENABLED | AI credit system | `true` | Optional |
| CRON_WORKER | Self-hosted cron worker | `false` (Vercel cron) | Optional |
| LOG_LEVEL | Logging verbosity | `info` | Optional |

## Validation Rules Summary

### Fail-Closed (throws in production if missing)

| Variable | Guard Location |
|---|---|
| NEXTAUTH_SECRET | env-validator + qr-token.service.ts + auth-otp.service.ts + resend-otp.ts |
| IMBONI_QR_SECRET | qr-token.service.ts |
| TRIAL_HASH_SECRET | trial-eligibility.service.ts |
| CRON_SECRET | All 16 cron endpoints |
| IREMBOPAY_API_BASE | irembopay.service.ts |
| MTN_MOMO_ENVIRONMENT | mtn-momo.service.ts |

### Validated at Startup (env-validator)

| Variable | Validation |
|---|---|
| DATABASE_URL | Must start with `postgresql://` |
| DIRECT_URL | Must be set |
| NEXTAUTH_SECRET | Min 32 chars |
| INTOUCH_* (if provider=intouch) | All required vars must be set |
| IREMBOPAY_* (if provider=irembo) | All required vars must be set |

### Safe Defaults (production-safe)

| Variable | Default | Safe? |
|---|---|---|
| INTOUCH_API_URL | `https://www.intouchpay.co.rw/api` | YES — production URL |
| IREMBOPAY_API_URL | `https://api.irembo.com` | YES — production URL |
| NEXTAUTH_URL | `https://imboniserve.com` | YES — production domain |

## Conclusion

The production configuration contract defines all required environment variables, their validation rules, and fail-closed behavior. 6 critical secrets now fail-closed in production (throwing explicit errors rather than silently using defaults). The env-validator provides startup validation for required variables. All payment sandbox defaults have been eliminated for production.
