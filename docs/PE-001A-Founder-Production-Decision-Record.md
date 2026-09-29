# PE-001A Founder Production Decision Record

| Field | Value |
|---|---|
| Date | 2026-08-10 |
| Purpose | Document the 7 decisions required before production infrastructure establishment |

## D1 — Production Supabase

### Recommendation: Dedicated production Supabase project

### Rationale

| Factor | Dedicated Project | Promote Dev Project |
|---|---|---|
| Data integrity | Clean — no test data | Test data mixed with production |
| Backup isolation | Production backups only | Dev + prod in same backups |
| Access control | Restricted to production | Shared with dev access |
| Migration safety | Dev experiments don't affect prod | Dev migrations risk prod schema |
| Performance | Dev load doesn't impact prod | Dev tests impact prod queries |
| Compliance | Customer data has prod-grade controls | Test data in same compliance scope |
| Recovery | Clean recovery point | Recovery includes test data |

### Cost

Supabase Pro tier: $25/month (includes daily backups + 7-day PITR)

### Decision Required

- [ ] Approve dedicated production Supabase project ($25/mo)
- [ ] OR explicitly accept risks of promoting dev project

**FOUNDER ACTION REQUIRED — cannot create Supabase project without founder access.**

---

## D2 — IremboPay Integration

### Investigation Findings

The codebase has TWO different IremboPay integrations:

#### Set A: IremboPay Service (irembopay.service.ts)
- **Env vars:** IREMBOPAY_SECRET_KEY, IREMBOPAY_PUBLIC_KEY, IREMBOPAY_PAYMENT_ACCOUNT, IREMBOPAY_PAYMENT_ITEM_CODE, IREMBOPAY_API_BASE
- **API base:** https://api.irembopay.com (configured in .env)
- **Purpose:** Invoice creation + MoMo push (invoice-based payments)
- **Webhook:** /api/payments/irembo/webhook.ts (HMAC signature verification)
- **Current state:** Credentials SET in .env, API base set to production URL
- **Used by:** Subscription payments, addon purchases, credit purchases

#### Set B: IremboPay Provider (irembopay.provider.ts)
- **Env vars:** IREMBOPAY_MERCHANT_ID, IREMBOPAY_API_KEY, IREMBOPAY_API_SECRET, IREMBOPAY_API_URL
- **API base:** https://api.irembo.com (default)
- **Purpose:** Payment gateway abstraction (Visa/Mastercard)
- **Webhook:** /api/webhooks/irembopay.ts (returns 410 Gone, redirects to Set A webhook)
- **Current state:** Credentials NOT SET in .env
- **Used by:** PaymentProviderFactory for CARD_VISA/CARD_MASTERCARD

### Analysis

Set A (Service) is the ACTIVE integration — it has credentials, a working webhook, and is used by subscription/addon/credit payment flows. Set B (Provider) is a payment gateway abstraction that is registered in the factory but has no credentials configured.

### Recommendation

1. **For Customer #1:** Use Set A (Service) — it's already configured and working
2. **If card payments are needed:** Obtain Set B credentials from IremboPay and configure them
3. **The env-validator requires BOTH sets when PAYMENTS_PROVIDER=irembo** — this should be reviewed

### Decision Required

- [ ] Confirm Set A (Service) is the primary IremboPay integration for Customer #1
- [ ] Determine if Set B (Provider) credentials are needed for card payments
- [ ] If Set B is not needed, consider updating env-validator to not require Set B

**FOUNDER ACTION REQUIRED — must confirm which IremboPay credentials to use and obtain any missing credentials.**

---

## D3 — MTN MoMo Direct

### Investigation Findings

- Direct MTN MoMo integration exists in `mtn-momo.service.ts` (DEPRECATED)
- The active payment routing sends MTN MoMo payments through InTouch (aggregator)
- The provider factory does NOT have a direct MTN MoMo provider
- `MTN_MOMO_ENVIRONMENT` is set to `sandbox` in .env

### Analysis

Direct MTN MoMo adds complexity without clear benefit for Customer #1:
- InTouch already handles MTN MoMo as an aggregator
- Direct integration requires separate MTN developer account, subscription key, API user/key
- Direct integration is DEPRECATED in the codebase

### Recommendation

**NOT REQUIRED for Customer #1.** Use InTouch as the MTN MoMo aggregator. Document direct MTN MoMo as NOT REQUIRED and do not configure MTN_MOMO_* env vars in production.

### Decision Required

- [ ] Confirm direct MTN MoMo is NOT REQUIRED for Customer #1
- [ ] OR specify if direct MTN MoMo is needed and why

---

## D4 — Production Email

### Current State

- SMTP_HOST: smtp.gmail.com (personal Gmail)
- SMTP_FROM: "Imboni Serve <steve.aimviews@gmail.com>" (personal Gmail)
- SMTP_SECURE: NOT SET
- Limitation: Gmail consumer = ~500 emails/day, personal sender, not production-grade

### Evaluation

| Provider | Reliability | Deliverability | Rwanda Usability | Domain Auth | Cost | API/SMTP | Simplicity |
|---|---|---|---|---|---|---|---|
| SendGrid | HIGH | HIGH | GOOD | YES | $15-20/mo (50K) | BOTH | HIGH |
| AWS SES | HIGH | HIGH | GOOD | YES | $1-5/mo (10K) | BOTH | MEDIUM |
| Postmark | HIGHEST | HIGHEST | GOOD | YES | $15/mo (10K) | BOTH | HIGHEST |
| Gmail (current) | MEDIUM | LOW (personal) | N/A | NO | Free | SMTP | HIGH |

### Recommendation

**Postmark** for best deliverability and simplicity, or **AWS SES** for lowest cost. Both support domain authentication (SPF/DKIM/DMARC) which is critical for email deliverability.

### Decision Required

- [ ] Choose production email provider
- [ ] Configure domain authentication (SPF/DKIM/DMARC for imboniserve.com)
- [ ] Set production SMTP_* env vars

**FOUNDER ACTION REQUIRED — must choose provider and create account.**

---

## D5 — Production Domain

### Current State

- `imboniserve.com` is referenced in next.config.js as the fallback NEXTAUTH_URL
- DNS configuration: UNKNOWN (not accessible from workstation)
- SSL: Vercel-managed (not yet deployed)

### Recommendation

Confirm `imboniserve.com` as the production domain. Configure DNS to point to Vercel.

### Decision Required

- [ ] Confirm imboniserve.com is the production domain
- [ ] OR specify a different domain
- [ ] Configure DNS A record / CNAME to Vercel

**FOUNDER ACTION REQUIRED — must own/control the domain and configure DNS.**

---

## D6 — Pusher Cluster

### Current State

- Current cluster: `ap2` (Asia Pacific 2 — Singapore)
- Code: src/lib/pusher-server.ts
- CSP: Pusher allowed in Content-Security-Policy

### Analysis

| Factor | ap2 (Singapore) | eu (Europe) |
|---|---|---|
| Latency to Rwanda | ~180ms | ~150ms |
| Pusher availability | GOOD | GOOD |
| Migration implications | None (current) | New app required |

### Recommendation

The latency difference between ap2 and eu for Rwanda is marginal (~30ms). The current ap2 cluster is functional. **Switching to eu is NOT technically necessary** — the decision should be based on whether a new Pusher app is being created for production isolation (which is recommended regardless).

If creating a new production Pusher app, use `eu` cluster (slightly closer to Rwanda). If keeping the current app, `ap2` is acceptable.

### Decision Required

- [ ] Create new production Pusher app (recommended for isolation)
- [ ] If yes, choose cluster: eu (recommended) or ap2 (current)
- [ ] If no, keep current ap2 app (accept shared dev/prod)

**FOUNDER ACTION REQUIRED — must create Pusher app if isolation is desired.**

---

## D7 — Vercel Billing

### Current State

- No Vercel project accessible from workstation
- No Vercel billing account verified
- Repository: https://github.com/RUKUNDOETIENNE1/ImboniServe.git

### Requirements

| Requirement | Reason |
|---|---|
| Vercel Pro tier ($20/mo) | Required for cron jobs, edge functions, higher limits |
| Project connected to GitHub repo | For auto-deploy on git push to main |
| Production branch: main | Standard deployment branch |
| All production env vars configured | See PE-001A-Production-Configuration-Contract.md |

### Recommendation

Create a Vercel Pro account, connect the GitHub repo, configure production env vars, set production domain.

### Decision Required

- [ ] Create/verify Vercel account
- [ ] Upgrade to Pro tier ($20/mo)
- [ ] Connect GitHub repo
- [ ] Configure production env vars
- [ ] Set production domain

**FOUNDER ACTION REQUIRED — must create Vercel account and configure billing.**

---

## Summary

| Decision | Recommendation | Cost Impact | Blocks |
|---|---|---|---|
| D1: Supabase | Dedicated production project | +$25/mo | DB, Storage |
| D2: IremboPay | Use Set A (Service), confirm Set B need | None | Payments |
| D3: MTN MoMo | NOT REQUIRED (use InTouch) | None | Payments |
| D4: Email | Postmark or AWS SES | +$15/mo | Email |
| D5: Domain | Confirm imboniserve.com | +$1/mo | DNS, Vercel |
| D6: Pusher | New eu app (if isolating) | +$0-49/mo | Realtime |
| D7: Vercel | Pro tier | +$20/mo | Hosting |

**All decisions are FOUNDER ACTION REQUIRED. None can be made by the engineering team.**
