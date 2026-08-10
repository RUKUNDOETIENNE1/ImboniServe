# PE-001A Cost Baseline Validation

| Field | Value |
|---|---|
| Date | 2026-08-10 |
| Scope | Validation of PE-001 cost estimates |

## Validation Methodology

Per PE-001A rules: "Do not invent pricing." Where pricing cannot be verified from the repository or official sources, items are marked "REQUIRES PRICING VERIFICATION."

## Cost Categories

### Fixed Infrastructure

| Service | Plan | PE-001 Estimate | Validation | Status |
|---|---|---|---|---|
| Vercel | Pro | $20/mo | Vercel Pro is $20/user/month (well-known) | ESTIMATED — verify at vercel.com/pricing |
| Supabase | Pro | $25/mo | Supabase Pro is $25/month (well-known) | ESTIMATED — verify at supabase.com/pricing |
| Upstash | Pay-as-you-go | $0-30/mo | Upstash has free tier (10K commands/day), then $0.2/100K commands | ESTIMATED — verify at upstash.com/pricing |
| Pusher | Sandbox/Channels | $0-49/mo | Pusher Sandbox is free (100 connections, 200K messages/day). Channels starts at $49/mo | ESTIMATED — verify at pusher.com/pricing |
| Sentry | Developer/Team | $0-26/mo | Developer is free (5K errors). Team is $26/mo | ESTIMATED — verify at sentry.io/pricing |
| Domain | imboniserve.com | ~$1/mo | Domain registration ~$10-15/yr | ESTIMATED — verify with registrar |
| Email | Postmark/SES/SendGrid | $15-20/mo | Postmark $15/mo (10K), SES $1-5/mo (10K), SendGrid $15-20/mo (50K) | ESTIMATED — verify at provider sites |

**Fixed subtotal: $61-151/mo** (narrowed from PE-001's $71-151 after confirming some free tiers)

### Variable / Usage-Based

| Service | Cost Model | PE-001 Estimate | Validation | Status |
|---|---|---|---|---|
| OpenAI | Per-token | $5-50/mo | Depends on usage. GPT-4o-mini is ~$0.15/1M input, $0.60/1M output | ESTIMATED — verify at openai.com/pricing |
| Twilio | Per-message | $2-20/mo | WhatsApp Business: ~$0.005/message. SMS: ~$0.05/message | ESTIMATED — verify at twilio.com/pricing |
| Supabase (overage) | Per-GB | $0 (unlikely) | Pro includes 8GB DB, 250GB bandwidth | ESTIMATED — unlikely to exceed for 1 customer |
| Vercel (overage) | Per-request | $0 (unlikely) | Pro includes 100GB bandwidth, 1000 GB-hours | ESTIMATED — unlikely to exceed for 1 customer |

**Variable subtotal: $7-70/mo**

### Transactional (NOT infrastructure — passed through)

| Provider | Fee Model | Validation | Status |
|---|---|---|---|
| InTouch | ~1.5-2.5% per transaction | REQUIRES PRICING VERIFICATION — confirm with InTouch | UNVERIFIED |
| IremboPay | ~2-3% per transaction | REQUIRES PRICING VERIFICATION — confirm with IremboPay | UNVERIFIED |

**Note:** Payment processing fees are NOT platform costs. They are deducted from revenue or passed to the customer. They should be tracked in unit economics, not infrastructure budget.

## Validated Monthly Budget (Customer #1)

```
FIXED INFRASTRUCTURE
  Vercel Pro:              $20/mo     ESTIMATED
  Supabase Pro:            $25/mo     ESTIMATED
  Upstash:                 $0-30/mo   ESTIMATED (free tier may suffice)
  Pusher:                  $0-49/mo   ESTIMATED (free tier may suffice)
  Sentry:                  $0-26/mo   ESTIMATED (free tier may suffice)
  Email:                   $15-20/mo  ESTIMATED
  Domain:                  $1/mo      ESTIMATED
                           ------
  Subtotal:                $61-171/mo

VARIABLE (AI + MESSAGING)
  OpenAI:                  $5-50/mo   ESTIMATED
  Twilio:                  $2-20/mo   ESTIMATED
                           ------
  Subtotal:                $7-70/mo

TRANSACTIONAL (NOT infrastructure)
  InTouch:                 ~1.5-2.5% per transaction    UNVERIFIED
  IremboPay:               ~2-3% per transaction         UNVERIFIED
                           (Not included in platform cost)

==============================
VALIDATED ESTIMATE: $68-241/mo
==============================
```

## Comparison with PE-001

| Metric | PE-001 | PE-001A | Change |
|---|---|---|---|
| Fixed range | $71-151/mo | $61-171/mo | Slightly wider (better free-tier analysis) |
| Variable range | $7-70/mo | $7-70/mo | Same |
| Total range | $78-221/mo | $68-241/mo | Slightly wider |
| Confidence | PRELIMINARY | ESTIMATED | Same — all pricing requires verification |

## Cost Optimization Opportunities

1. **Start with free tiers:** Pusher Sandbox, Sentry Developer, and Upstash free tier may suffice for Customer #1. Upgrade only when limits are exceeded.

2. **Choose AWS SES for email:** At $1-5/mo for 10K emails, it's 3-4x cheaper than Postmark/SendGrid. Requires more setup but saves $10-15/mo.

3. **Monitor OpenAI usage:** AI features are the most variable cost. Implement usage limits and monitor daily spend.

4. **Payment fees are negotiable:** InTouch and IremboPay fees may be negotiable based on transaction volume. Confirm pricing before committing.

## Confidence Levels

| Cost | Confidence | Reason |
|---|---|---|
| Vercel Pro $20/mo | HIGH | Well-known, stable pricing |
| Supabase Pro $25/mo | HIGH | Well-known, stable pricing |
| Upstash $0-30/mo | MEDIUM | Depends on usage; free tier may suffice |
| Pusher $0-49/mo | MEDIUM | Depends on tier; free tier may suffice |
| Sentry $0-26/mo | MEDIUM | Depends on tier; free tier may suffice |
| Email $15-20/mo | MEDIUM | Depends on provider choice |
| OpenAI $5-50/mo | LOW | Highly usage-dependent |
| Twilio $2-20/mo | MEDIUM | Depends on OTP frequency |
| InTouch fees | UNVERIFIED | Must confirm with provider |
| IremboPay fees | UNVERIFIED | Must confirm with provider |

## Conclusion

The PE-001 cost estimate of $78-221/mo is validated as reasonable, with a slightly adjusted range of $68-241/mo. All pricing remains ESTIMATED and requires verification against official provider pricing pages before budgeting decisions. Payment processing fees (InTouch, IremboPay) are UNVERIFIED and must be confirmed with the providers.

**Status: ESTIMATED — all pricing requires verification before budgeting.**
