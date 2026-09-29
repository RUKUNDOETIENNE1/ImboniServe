# PE-001 Production Cost Baseline

| Field | Value |
|---|---|
| Date | 2026-08-10 |
| Status | **PRELIMINARY — Pricing verification required for several services** |

## Important Note

Per PE-001 rules: "Do not invent pricing." Where current pricing cannot be verified from the repository, this document marks the item as "PRICING VERIFICATION REQUIRED." Web research was not authorized for this document; pricing is based on general knowledge of provider pricing models and should be verified against official provider pricing pages before budgeting decisions.

## Infrastructure Costs

### Fixed Monthly Costs

| Service | Plan | Fixed Cost | Usage Driver | Est. Customer #1 Monthly | Confidence | Status |
|---|---|---|---|---|---|---|
| Vercel | Pro | $20/mo | Bandwidth, build minutes | $20/mo | HIGH | PRICING VERIFICATION REQUIRED |
| Supabase | Pro | $25/mo | Database size, bandwidth | $25/mo | HIGH | PRICING VERIFICATION REQUIRED |
| Upstash | Pay-as-you-go | $0 (free tier) → ~$10-30/mo | Redis commands, data size | ~$10/mo | MEDIUM | PRICING VERIFICATION REQUIRED |
| Pusher | Sandbox | $0 (free tier) → $49/mo (Channels) | Concurrent connections, messages | $0-49/mo | MEDIUM | PRICING VERIFICATION REQUIRED |
| Sentry | Developer (free) → Team | $0 → $26/mo | Events, team members | $0-26/mo | MEDIUM | PRICING VERIFICATION REQUIRED |
| Domain | imboniserve.com | ~$10-15/yr | Annual renewal | ~$1/mo | HIGH | PRICING VERIFICATION REQUIRED |
| Email (SendGrid) | Essentials | $15-20/mo | Email volume | $15-20/mo | MEDIUM | PRICING VERIFICATION REQUIRED |

**Subtotal Fixed: ~$71-151/mo**

### Variable / Usage-Based Costs

| Service | Cost Model | Usage Driver | Est. Customer #1 Monthly | Confidence | Status |
|---|---|---|---|---|---|
| OpenAI | Per-token | AI feature usage (menu suggestions, scanner, DIE) | $5-50/mo | LOW (depends on usage) | PRICING VERIFICATION REQUIRED |
| Twilio | Per-message | WhatsApp/SMS OTP delivery | $2-20/mo (depends on login frequency) | MEDIUM | PRICING VERIFICATION REQUIRED |
| Supabase (overage) | Per-GB | Database size over 8GB, bandwidth over 250GB | $0 (unlikely to exceed for 1 customer) | HIGH | PRICING VERIFICATION REQUIRED |
| Vercel (overage) | Per-request | Bandwidth over 100GB, function invocations | $0 (unlikely to exceed for 1 customer) | HIGH | PRICING VERIFICATION REQUIRED |

**Subtotal Variable: ~$7-70/mo**

### Transaction-Based Costs (Payment Processing Fees)

| Provider | Fee Model | Notes |
|---|---|---|
| InTouch | ~1.5-2.5% per transaction | PRICING VERIFICATION REQUIRED — confirm with InTouch |
| IremboPay | ~2-3% per transaction | PRICING VERIFICATION REQUIRED — confirm with IremboPay |
| MTN MoMo (direct) | ~1% per transaction | DEPRECATED — routed via InTouch |

**Note:** Payment processing fees are NOT infrastructure costs. They are passed through to the customer or deducted from revenue. They should be tracked separately in unit economics.

## Estimated Monthly Operating Budget (Customer #1)

```
INFRASTRUCTURE (Fixed)
  Vercel Pro:              $20/mo
  Supabase Pro:            $25/mo
  Upstash:                 $10/mo
  Pusher:                  $0-49/mo
  Sentry:                  $0-26/mo
  Email (SendGrid):        $15-20/mo
  Domain:                  $1/mo (amortized)
                           ------
  Subtotal:                $71-151/mo

AI (Variable)
  OpenAI:                  $5-50/mo
                           ------
  Subtotal:                $5-50/mo

MESSAGING (Variable)
  Twilio WhatsApp/SMS:     $2-20/mo
                           ------
  Subtotal:                $2-20/mo

PAYMENT PROCESSING (Transaction-based, NOT infrastructure)
  InTouch:                 ~1.5-2.5% per transaction
  IremboPay:               ~2-3% per transaction
                           ------
  (Not included in platform cost)

==============================
ESTIMATED MONTHLY PLATFORM COST: $78-221/mo
==============================
```

## Cost Optimization Notes

1. **Pusher:** Free Sandbox tier may suffice for Customer #1 (100 concurrent connections, 200K messages/day). Upgrade to Channels ($49/mo) only if limits are exceeded.

2. **Sentry:** Developer tier is free (5K errors/mo, 10K performance transactions/mo). Upgrade to Team ($26/mo) only if team access or higher limits are needed.

3. **Upstash:** Free tier (10K commands/day) may suffice for Customer #1. Pay-as-you-go above that (~$0.2 per 100K commands).

4. **Email:** If email volume is low (<100/day), Gmail SMTP could work temporarily. But production should use a dedicated service for deliverability and reliability.

5. **OpenAI:** Cost depends heavily on AI feature usage. Menu suggestions and DIE document extraction are the primary cost drivers. Consider implementing usage limits.

## Billing Owner

| Service | Billing Owner | Status |
|---|---|---|
| Vercel | FOUNDER ACTION REQUIRED | Must set up billing account |
| Supabase | FOUNDER ACTION REQUIRED | Must set up billing account |
| Upstash | FOUNDER ACTION REQUIRED | Must verify billing account |
| Pusher | FOUNDER ACTION REQUIRED | Must verify billing account |
| Sentry | FOUNDER ACTION REQUIRED | Must set up billing account |
| Email provider | FOUNDER ACTION REQUIRED | Must set up billing account |
| OpenAI | FOUNDER ACTION REQUIRED | Must verify billing account |
| Twilio | FOUNDER ACTION REQUIRED | Must verify billing account |
| Domain | FOUNDER ACTION REQUIRED | Must verify domain registration |
| InTouch | FOUNDER ACTION REQUIRED | Must verify billing arrangement |
| IremboPay | FOUNDER ACTION REQUIRED | Must verify billing arrangement |

## Confidence Levels

| Cost Category | Confidence | Reason |
|---|---|---|
| Vercel Pro | HIGH | Well-known pricing |
| Supabase Pro | HIGH | Well-known pricing |
| Upstash | MEDIUM | Pay-as-you-go, depends on usage |
| Pusher | MEDIUM | Depends on tier needed |
| Sentry | MEDIUM | Depends on tier needed |
| Email | MEDIUM | Depends on provider chosen |
| OpenAI | LOW | Highly usage-dependent |
| Twilio | MEDIUM | Depends on OTP frequency |
| Payment fees | LOW | Must confirm with providers |

## Conclusion

The estimated monthly platform cost for Customer #1 is approximately **$78-221/mo**, with the wide range reflecting uncertainty about which service tiers are needed and variable AI/messaging costs. All pricing should be verified against official provider pricing pages before making budgeting decisions.

**Status: PRELIMINARY — Pricing verification required for all services.**
