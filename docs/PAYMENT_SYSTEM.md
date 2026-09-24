# Payment & Subscription System Documentation

## Overview

Imboni Serve implements a **provider-abstracted payment architecture** that supports multiple payment gateways through a unified interface. The subscription engine is completely decoupled from payment providers, making it easy to add new providers without changing subscription logic.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Unified Checkout API                      │
│         /api/subscriptions/initiate-payment                  │
│         /api/subscriptions/verify-payment                    │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼────┐            ┌────▼────┐
    │ InTouch │            │ IremboPay│
    │Provider │            │ Provider │
    │(MoMo)   │            │ (Cards)  │
    └────┬────┘            └────┬────┘
         │                       │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │  Subscription Engine  │
         │  (Provider-agnostic)  │
         └───────────────────────┘
```

---

## Payment Providers

### 1. InTouch (MTN & Airtel Mobile Money)

**Status:** ✅ Implemented

**Supported Operations:**
- Payment initiation
- Payment verification
- Webhook handling
- Transaction status check

**Environment Variables:**
```bash
INTOUCH_API_URL="https://www.intouchpay.co.rw/api"
INTOUCH_USERNAME="your-username"
INTOUCH_ACCOUNT_NO="your-account-number"
INTOUCH_PASSWORD="your-password"
INTOUCH_WEBHOOK_SECRET="your-webhook-secret"  # Optional
```

**API Endpoints:**
- Initiate: `POST /api/subscriptions/initiate-payment`
- Verify: `POST /api/subscriptions/verify-payment`
- Webhook: `POST /api/webhooks/intouch`

**Testing:**
Use InTouch sandbox credentials for development. Contact InTouch support for sandbox access.

---

### 2. IremboPay (Card Payments)

**Status:** 🚧 Planned (Interface ready)

**Will Support:**
- Visa
- Mastercard
- Other card networks

**Environment Variables:**
```bash
IREMBOPAY_PUBLIC_KEY=""
IREMBOPAY_SECRET_KEY=""
IREMBOPAY_PAYMENT_ACCOUNT=""
IREMBOPAY_PAYMENT_ITEM_CODE=""
IREMBOPAY_API_BASE="https://api.irembopay.com"
```

---

## Subscription States

```
TRIAL          → Free trial period, full access
ACTIVE         → Subscription paid and valid
GRACE_PERIOD   → Expired but temporary access remains (3 days)
EXPIRED        → Subscription ended, access restricted
SUSPENDED      → Manually suspended (fraud/compliance)
CANCELLED      → User cancelled renewal
```

---

## Payment Flow

### 1. Initiate Payment

**Request:**
```typescript
POST /api/subscriptions/initiate-payment
{
  "planId": "plan_xxx",
  "billingCycle": "MONTHLY",  // MONTHLY | QUARTERLY | SEMI_ANNUAL | ANNUAL
  "paymentMethod": "MOBILE_MONEY_MTN",  // or MOBILE_MONEY_AIRTEL
  "customerPhone": "+250788123456",
  "customerEmail": "user@example.com",
  "customerName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "txn_xxx",
  "orderId": "SUB-xxx-1234567890",
  "providerReference": "IMBONI-xxx-1234567890",
  "message": "Payment initiated. Please complete payment on your phone."
}
```

### 2. Verify Payment

**Request:**
```typescript
POST /api/subscriptions/verify-payment
{
  "transactionId": "txn_xxx"
}
```

**Response (Success):**
```json
{
  "success": true,
  "status": "COMPLETED",
  "message": "Payment successful. Subscription activated.",
  "subscriptionId": "sub_xxx",
  "subscription": { ... }
}
```

**Response (Processing):**
```json
{
  "success": false,
  "status": "PROCESSING",
  "message": "Payment is still processing. Please check again shortly."
}
```

### 3. Webhook Processing

InTouch sends payment notifications to:
```
POST https://imboniserve.com/api/webhooks/intouch
```

The webhook handler:
1. Validates signature (if configured)
2. Updates transaction status
3. Activates subscription if payment successful
4. Returns 200 to acknowledge receipt

---

## Subscription Lifecycle

### Activation

When a payment is successful:
1. Transaction status → `COMPLETED`
2. Subscription created with state `ACTIVE`
3. Business plan updated
4. Audit log created
5. Receipt/invoice generated

### Renewal

Automatic renewal reminders sent at:
- 7 days before expiry
- 3 days before expiry
- 1 day before expiry
- Expiry day
- 3 days after expiry
- 7 days after expiry

**Cron Job:**
```
POST /api/cron/subscription-reminders
Header: x-cron-secret: <CRON_SECRET>
```

Run daily via Vercel Cron or external scheduler.

### Expiry Handling

**Cron Job:**
```
POST /api/cron/process-expired-subscriptions
```

Moves subscriptions through states:
- `ACTIVE` → `GRACE_PERIOD` (3 days)
- `GRACE_PERIOD` → `EXPIRED` (after grace period)

---

## Adding a New Payment Provider

### 1. Create Provider Class

```typescript
// src/lib/payments/providers/newprovider.provider.ts
import { IPaymentProvider, PaymentProviderType } from '../types'

export class NewProvider implements IPaymentProvider {
  readonly name = PaymentProviderType.NEW_PROVIDER

  async createPayment(request: PaymentInitiationRequest): Promise<PaymentInitiationResponse> {
    // Implementation
  }

  async verifyPayment(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
    // Implementation
  }

  async handleWebhook(payload: any, signature?: string): Promise<WebhookPayload> {
    // Implementation
  }

  async validateWebhook(payload: any, signature?: string): Promise<WebhookValidationResult> {
    // Implementation
  }

  async getTransactionStatus(transactionId: string): Promise<PaymentVerificationResponse> {
    // Implementation
  }
}
```

### 2. Register in Factory

```typescript
// src/lib/payments/providers/index.ts
import { NewProvider } from './newprovider.provider'

export class PaymentProviderFactory {
  static getProvider(type: PaymentProviderType): IPaymentProvider {
    switch (type) {
      case PaymentProviderType.INTOUCH:
        return new InTouchProvider()
      case PaymentProviderType.NEW_PROVIDER:
        return new NewProvider()
      // ...
    }
  }
}
```

### 3. Add Webhook Handler

```typescript
// src/pages/api/webhooks/newprovider.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const provider = new NewProvider()
  const webhookPayload = await provider.handleWebhook(req.body, signature)
  // Process webhook...
}
```

**No changes needed to:**
- Subscription engine
- Checkout API routes
- Database schema
- Frontend UI

---

## Transaction Management

All transactions stored in `PaymentTransaction` model:

```prisma
model PaymentTransaction {
  id                       String
  businessId               String
  invoiceNumber            String
  transactionId            String
  referenceId              String?
  amountCents              Int
  currency                 String
  gateway                  PaymentGateway
  paymentMethod            PaymentMethod
  status                   PaymentStatus
  paidAt                   DateTime?
  webhookVerified          Boolean
  rawRequest               Json?
  rawCallback              Json?
  rawStatus                Json?
  subscriptionId           String?
  // ...
}
```

**Statuses:**
- `PENDING` - Initial state
- `INITIATED` - Payment request sent to provider
- `PROCESSING` - Provider processing payment
- `COMPLETED` - Payment successful
- `FAILED` - Payment failed
- `CANCELLED` - Payment cancelled
- `REFUNDED` - Payment refunded

---

## Audit Trail

Every billing event is logged:

```typescript
enum AuditEventType {
  SUBSCRIPTION_CREATED
  SUBSCRIPTION_RENEWED
  SUBSCRIPTION_CANCELLED
  SUBSCRIPTION_SUSPENDED
  SUBSCRIPTION_EXPIRED
  PAYMENT_RECEIVED
  PAYMENT_FAILED
  REFUND_ISSUED
  ACCOUNT_SUSPENDED
}
```

Stored in `ActivityLog` model with:
- Event type
- Business ID
- Subscription ID
- Transaction ID
- User ID
- Metadata
- Timestamp

**Audit records are never deleted.**

---

## Security

### Webhook Validation

InTouch webhooks validated via HMAC signature:

```typescript
const computedSignature = crypto
  .createHmac('sha256', INTOUCH_WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex')

if (computedSignature !== signature) {
  return { valid: false, error: 'Invalid signature' }
}
```

### Idempotency

Duplicate webhooks prevented via:
- `webhookVerified` flag
- Transaction status check
- Timestamp validation

### Cron Job Protection

All cron endpoints require secret:

```typescript
const cronSecret = req.headers['x-cron-secret']
if (cronSecret !== process.env.CRON_SECRET) {
  return res.status(401).json({ error: 'Unauthorized' })
}
```

---

## Testing

### Local Testing

1. Set InTouch sandbox credentials in `.env.local`
2. Use ngrok to expose webhook endpoint:
   ```bash
   ngrok http 3000
   ```
3. Configure webhook URL in InTouch dashboard:
   ```
   https://your-ngrok-url.ngrok.io/api/webhooks/intouch
   ```
4. Test payment flow with sandbox phone numbers

### Vercel Testing

1. Deploy to Vercel
2. Set environment variables in Vercel dashboard
3. Configure webhook URL:
   ```
   https://imboniserve.com/api/webhooks/intouch
   ```
4. Test with real/sandbox credentials

---

## Future Enhancements

### Planned Features

- **Refund Support** - Full/partial refunds via provider API
- **Recurring Payments** - Automatic charge for renewals
- **Multiple Currencies** - USD, EUR support
- **Marketplace Payments** - Split payments for suppliers
- **Revenue Sharing** - Commission management
- **Corporate Billing** - Multi-branch group billing
- **Invoicing System** - PDF generation and storage

### Future Providers

- MTN MoMo Direct
- Airtel Money Direct
- Stripe
- Flutterwave
- PayPal
- Bank integrations

---

## Support

For payment integration issues:
- InTouch: support@intouchpay.co.rw
- IremboPay: support@irembopay.com
- Imboni Serve: support@imboniserve.com

---

## Changelog

### v1.0.0 (2026-05-31)
- ✅ Provider abstraction layer
- ✅ InTouch integration (MTN/Airtel MoMo)
- ✅ Subscription engine
- ✅ Renewal reminders
- ✅ Webhook handling
- ✅ Audit trail
- 🚧 IremboPay integration (planned)
