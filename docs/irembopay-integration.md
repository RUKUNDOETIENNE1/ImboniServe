# IremboPay Integration Guide

## Overview

IremboPay provider handles Visa and Mastercard payments through the IremboPay payment gateway. It follows the same provider abstraction pattern as InTouch, ensuring consistent subscription activation and billing event logging.

## Features

- ✅ Card payment initiation (Visa, Mastercard)
- ✅ Payment verification API
- ✅ Webhook handling with HMAC signature validation
- ✅ Automatic subscription activation on success
- ✅ BillingEvent ledger integration
- ✅ Audit logging
- ✅ Idempotent webhook processing
- ✅ Metadata capture for auditing
- 🔄 Refund API (placeholder for future implementation)

## Environment Configuration

```env
# IremboPay API Configuration
IREMBOPAY_API_URL=https://api.irembo.com
IREMBOPAY_MERCHANT_ID=your_merchant_id
IREMBOPAY_API_KEY=your_api_key
IREMBOPAY_API_SECRET=your_api_secret

# Webhook URLs
IREMBOPAY_CALLBACK_URL=https://your-domain.com/api/webhooks/irembopay
IREMBOPAY_RETURN_URL=https://your-domain.com/billing/payment-result

# For sandbox testing
# IREMBOPAY_API_URL=https://sandbox-api.irembo.com
```

## Payment Flow

1. **Initiation**: User selects card payment → System routes to IremboPay → Payment URL returned
2. **Customer Payment**: User enters card details on IremboPay hosted page
3. **Webhook**: IremboPay sends webhook → Signature validated → Transaction updated → Subscription activated
4. **Verification**: Frontend polls status or checks database

## Security

- HMAC-SHA256 signature validation on all webhooks
- Timing-safe signature comparison
- HTTPS required for all API calls
- Idempotent webhook processing

## Status Mapping

| IremboPay | System | Description |
|-----------|--------|-------------|
| success, completed, paid | SUCCESS | Payment completed |
| pending, processing | PROCESSING | In progress |
| failed, declined | FAILED | Payment failed |
| cancelled, expired | CANCELLED | Cancelled |
| refunded | REFUNDED | Refunded |

## Testing

```bash
# Run integration tests
npm run test:integration

# Collect validation artifacts
npx tsx scripts/intouch/collect-validation-artifacts.ts --id=<txId>
```

## Next Steps

See `docs/RELEASE-GATES.md` for IremboPay sandbox validation checklist.
