# PE-001 External Services Configuration Report

| Field | Value |
|---|---|
| Date | 2026-08-10 |
| Scope | All external services required for production |

## 1. Upstash (Redis)

| Item | Current (Dev) | Production Required |
|---|---|---|
| Instance | enabling-camel-117300 | NEW dedicated instance |
| Protocol | rediss:// (TLS) | rediss:// (TLS) |
| Usage | BullMQ queues (die_extract, die_intelligence), rate limiting, cache | Same |
| Code | src/lib/services/cache.service.ts, src/lib/die/queue/queues.ts | Same |
| Health check | /api/admin/queue/health | Same |
| Fallback | `redis://localhost:6379` if REDIS_URL not set (line 32 of cache.service.ts) | Must NOT fall back — REDIS_URL must be set |
| Dead letter queues | extractDLQ, intelligenceDLQ | Same |
| Concurrency | 5 jobs | Same |
| Rate limit | 10 jobs per 1000ms | Same |
| Retry | 3 attempts, exponential backoff | Same |

**FOUNDER ACTION:** Create production Upstash instance, set REDIS_URL in Vercel env vars.

## 2. Pusher (Realtime)

| Item | Current (Dev) | Production Required |
|---|---|---|
| App ID | 2119445 | NEW dedicated app |
| Cluster | ap2 (Asia Pacific 2) | eu (recommended for Rwanda) |
| Code | src/lib/pusher-server.ts | Same |
| Usage | Order events, kitchen events, operational events | Same |
| CSP | Allowed in Content-Security-Policy | Same |
| Client config | NEXT_PUBLIC_PUSHER_KEY, NEXT_PUBLIC_PUSHER_CLUSTER | Same (production values) |

**FOUNDER ACTION:** Create production Pusher app (eu cluster), set PUSHER_APP_ID/KEY/SECRET/CLUSTER in Vercel env vars.

## 3. Sentry (Monitoring)

| Item | Current | Production Required |
|---|---|---|
| SENTRY_DSN | NOT SET | Production DSN |
| NEXT_PUBLIC_SENTRY_DSN | NOT SET | Production DSN |
| SENTRY_ENVIRONMENT | NOT SET | "production" |
| SENTRY_TRACES_SAMPLE_RATE | NOT SET (defaults to 0) | 0.1 (10% sampling) |
| SENTRY_SKIP_UPLOAD | true | false (enable source map upload) or true (if no SENTRY_AUTH_TOKEN) |
| Server config | sentry.server.config.ts | Same |
| Client config | sentry.client.config.ts | Same |
| Edge config | NOT FOUND | Consider creating sentry.edge.config.ts |
| Integration | @sentry/nextjs (conditional on DSN in next.config.js) | Same |
| Alert routing | NOT CONFIGURED | Configure in Sentry dashboard |

**FOUNDER ACTION:** Create Sentry project, set DSN + environment + sample rate, configure alert routing (email + Slack).

## 4. Twilio (WhatsApp + SMS)

| Item | Current | Production Required |
|---|---|---|
| TWILIO_ACCOUNT_SID | Set | Same (verify production account) |
| TWILIO_AUTH_TOKEN | Set | Same (verify production account) |
| TWILIO_WHATSAPP_NUMBER | Set | Production WhatsApp Business number |
| TWILIO_PHONE_NUMBER | Set | Production SMS number |
| WhatsApp channel | BROKEN (error 63007) | Must be configured and verified |
| Webhook | src/pages/api/webhooks/twilio/whatsapp.ts | Same (production URL) |
| OTP templates | Unknown | Must be approved by Twilio/WhatsApp |
| Fallback | Email-only OTP when WhatsApp fails | Same (but WhatsApp should work in production) |

### Twilio Error 63007 Analysis

Error: "Twilio could not find a Channel with the specified From address"

This means the WhatsApp Business API channel is not properly configured. Required steps:
1. Register a WhatsApp Business number with Twilio
2. Get the number approved for WhatsApp Business API
3. Create and approve OTP template messages
4. Set TWILIO_WHATSAPP_NUMBER to the approved WhatsApp sender
5. Test OTP delivery end-to-end

**FOUNDER ACTION:** Configure Twilio WhatsApp Business channel, approve OTP templates, test delivery.

## 5. SMTP (Email)

| Item | Current | Production Required |
|---|---|---|
| SMTP_HOST | smtp.gmail.com | Production email service (SendGrid/SES/Postmark) |
| SMTP_PORT | 465 | Per provider recommendation |
| SMTP_USER | Set (personal Gmail) | Production service account |
| SMTP_PASSWORD | Set | Production service password |
| SMTP_SECURE | NOT SET | true |
| SMTP_FROM | "Imboni Serve <steve.aimviews@gmail.com>" | "ImboniServe <noreply@imboniserve.com>" |
| ALERT_EMAIL_TO | NOT SET | ops@imboniserve.com (or founder email) |
| SUPPORT_EMAIL | Set | support@imboniserve.com |
| SLACK_WEBHOOK_URL | NOT SET | Slack incoming webhook URL |

### Email Service Recommendation

| Provider | Pros | Cons | Est. Cost |
|---|---|---|---|
| SendGrid | Industry standard, good deliverability | Can be expensive at scale | $15-20/mo (50K emails) |
| AWS SES | Cheapest at scale, reliable | More setup complexity | $1-5/mo (10K emails) |
| Postmark | Best deliverability, easy setup | Smaller ecosystem | $15/mo (10K emails) |
| Gmail (current) | Free, already configured | 500/day limit, personal account, not production-grade | Free |

**FOUNDER ACTION:** Choose and configure a production email service, set SMTP_* env vars, set SMTP_SECURE=true.

## 6. InTouch (Mobile Money Aggregator)

| Item | Current | Production Required |
|---|---|---|
| INTOUCH_API_URL | https://www.intouchpay.co.rw/api | Same |
| INTOUCH_USERNAME | Set | Verify production credentials |
| INTOUCH_ACCOUNT_NO | Set | Verify production credentials |
| INTOUCH_PASSWORD | Set | Verify production credentials |
| INTOUCH_PARTNER_PASSWORD | NOT SET | Set (preferred over INTOUCH_PASSWORD) |
| INTOUCH_WEBHOOK_USERNAME | NOT SET | MUST SET — required for webhook Basic Auth |
| INTOUCH_WEBHOOK_PASSWORD | NOT SET | MUST SET — required for webhook Basic Auth |
| INTOUCH_CALLBACK_URL | NOT SET | Set to https://imboniserve.com/api/webhooks/intouch |
| Webhook code | src/pages/api/webhooks/intouch.ts (Basic Auth + HMAC) | Same |
| Provider code | src/lib/payments/providers/intouch.provider.ts | Same |
| Routing | MTN MoMo + Airtel Money → InTouch | Same |

**FOUNDER ACTION:** Verify InTouch production credentials, set webhook auth, configure callback URL.

## 7. IremboPay (Card Payments)

### CRITICAL: Two Different Credential Sets

| Integration | Env Vars | API URL | Current State |
|---|---|---|---|
| Service (invoice API) | IREMBOPAY_SECRET_KEY, IREMBOPAY_PUBLIC_KEY, IREMBOPAY_PAYMENT_ACCOUNT, IREMBOPAY_PAYMENT_ITEM_CODE, IREMBOPAY_API_BASE | https://api.irembopay.com | SET in .env |
| Provider (gateway API) | IREMBOPAY_MERCHANT_ID, IREMBOPAY_API_KEY, IREMBOPAY_API_SECRET, IREMBOPAY_API_URL | https://api.irembo.com | NOT SET |

| Item | Current | Production Required |
|---|---|---|
| Webhook (canonical) | src/pages/api/payments/irembo/webhook.ts (HMAC) | Same (production URL) |
| Webhook (legacy) | src/pages/api/webhooks/irembo.ts (410 Gone redirect) | Same |
| Routing | Visa/Mastercard → IremboPay | Same |
| Env validator | Requires BOTH sets when PAYMENTS_PROVIDER=irembo | Must resolve which set is needed |

**FOUNDER ACTION:** Confirm which IremboPay integration is active for Customer #1, obtain production credentials for the active integration, set all required env vars.

## 8. MTN MoMo (Direct — DEPRECATED)

| Item | Current | Production Required |
|---|---|---|
| MTN_MOMO_ENVIRONMENT | sandbox | production (if required) |
| MTN_MOMO_API_URL | sandbox URL | production URL (if required) |
| Status | DEPRECATED — routed via InTouch | FOUNDER DECISION: Required or not? |
| Direct code | src/lib/services/mtn-momo.service.ts | Same (if required) |

**FOUNDER DECISION:** Is direct MTN MoMo required for Customer #1, or is InTouch (aggregator) sufficient? If not required, document as NOT REQUIRED and remove from production env.

## 9. OpenAI (AI)

| Item | Current | Production Required |
|---|---|---|
| OPENAI_API_KEY | Set (166 chars) | Verify production key + billing |
| OPENAI_MODEL_PRIMARY | Set | Same |
| OPENAI_MODEL_FALLBACK | Set | Same |
| Cost tracking | OPENAI_COST_INPUT_PER_1K_USD, OPENAI_COST_OUTPUT_PER_1K_USD set | Same |
| Usage | Menu suggestions, business scanner, DIE, executive intelligence | Same |

**FOUNDER ACTION:** Verify OpenAI production API key, confirm billing account is production (not trial).

## 10. Supabase Storage

| Item | Current | Production Required |
|---|---|---|
| SUPABASE_STORAGE_URL | https://dkhnocretmzpskadqhlq.supabase.co | Production project URL |
| SUPABASE_STORAGE_KEY | Set (221 chars, service role) | Production project key |
| Bucket | Set | Production bucket |
| Usage | Menu images, media uploads | Same |

**FOUNDER ACTION:** Configure production Supabase Storage bucket in the production Supabase project.

## Conclusion

10 external services identified. All have code-level support. None have production-isolated configuration. The founder must create/configure production instances for each service and set the corresponding environment variables in Vercel.

**Status: FOUNDER ACTION REQUIRED — All external services need production configuration.**
