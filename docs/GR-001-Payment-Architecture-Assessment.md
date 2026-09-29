# GR-001 — Payment Architecture Assessment

**Phase:** GR-001 — Global Readiness & Localization Certification
**Date:** 2026-08-07
**Status:** Complete

---

## Executive Summary

**Risk Level:** LOW for architecture; MEDIUM for implementation completeness.

The payment architecture is the strongest area of global readiness. A well-designed `IPaymentProvider` interface with a factory pattern supports clean addition of new providers. 7 provider types are defined, including future providers (Stripe, Flutterwave, Pesapal). The architecture welcomes new payment providers without requiring redesign.

---

## 1. Provider Abstraction (✅ Excellent)

### 1.1 IPaymentProvider Interface
```typescript
// src/lib/payments/types.ts lines 120-152
export interface IPaymentProvider {
  readonly name: PaymentProviderType
  createPayment(request: PaymentInitiationRequest): Promise<PaymentInitiationResponse>
  verifyPayment(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse>
  handleWebhook(payload: any, signature?: string): Promise<WebhookPayload>
  validateWebhook(payload: any, signature?: string): Promise<WebhookValidationResult>
  getTransactionStatus(transactionId: string): Promise<PaymentVerificationResponse>
  refundPayment?(transactionId: string, amount?: number): Promise<PaymentInitiationResponse>
}
```
A clean, provider-agnostic interface that all payment providers must implement. Supports payment initiation, verification, webhook handling, and refunds.

### 1.2 PaymentProviderFactory
```typescript
// src/lib/payments/providers/index.ts
export class PaymentProviderFactory {
  static getProvider(type: PaymentProviderType): IPaymentProvider {
    switch (type) {
      case PaymentProviderType.INTOUCH: provider = new InTouchProvider(); break
      case PaymentProviderType.IREMBO_PAY: provider = new IremboPayProvider(); break
      // Future providers commented out
      default: throw new Error(`Payment provider ${type} not implemented`)
    }
  }
}
```
Factory pattern with caching. New providers are added by:
1. Adding enum value to `PaymentProviderType`
2. Creating a new provider class implementing `IPaymentProvider`
3. Adding a case to the factory switch
4. Adding env var validation in `env-validator.ts`

### 1.3 PaymentProviderType Enum
```typescript
// src/lib/payments/types.ts lines 24-32
export enum PaymentProviderType {
  INTOUCH = 'INTOUCH',
  IREMBO_PAY = 'IREMBO_PAY',
  MTN_DIRECT = 'MTN_DIRECT',
  AIRTEL_DIRECT = 'AIRTEL_DIRECT',
  PESAPAL = 'PESAPAL',
  STRIPE = 'STRIPE',
  FLUTTERWAVE = 'FLUTTERWAVE',
}
```
7 provider types defined. 2 implemented (InTouch, IremboPay). 5 reserved for future (MTN Direct, Airtel Direct, Pesapal, Stripe, Flutterwave).

### 1.4 Payment Method Types
```typescript
// src/lib/payments/types.ts lines 34-40
export enum PaymentMethodType {
  MOBILE_MONEY_MTN = 'MOBILE_MONEY_MTN',
  MOBILE_MONEY_AIRTEL = 'MOBILE_MONEY_AIRTEL',
  CARD_VISA = 'CARD_VISA',
  CARD_MASTERCARD = 'CARD_MASTERCARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
}
```
Comprehensive payment method types covering mobile money, cards, and bank transfers.

### 1.5 Prisma PaymentMethod Enum
```prisma
// prisma/schema.prisma lines 2206-2216
enum PaymentMethod {
  CASH
  MTN_MOBILE_MONEY
  AIRTEL_MONEY
  CARD
  PESAPAL_CARD
  BANK_TRANSFER
  OTHER
  WEB
  MOMO_PUSH
}
```
9 payment methods supported in the database.

---

## 2. Provider Selection (✅ Good)

### 2.1 Environment Variable Selection
```typescript
// src/lib/env-validator.ts lines 77-112
const provider = (process.env.PAYMENTS_PROVIDER || 'intouch').toLowerCase()
if (provider === 'intouch') {
  const intouchRequired = ['INTOUCH_API_URL', 'INTOUCH_USERNAME', ...]
} else if (provider === 'irembo') {
  const iremboPayRequired = ['IREMBOPAY_SECRET_KEY', 'IREMBOPAY_PUBLIC_KEY', ...]
}
```
Provider selection via environment variable with conditional validation. This allows different deployments to use different providers.

### 2.2 Webhook Handling
```typescript
// src/lib/payments/types.ts lines 97-107
export interface WebhookPayload {
  provider: PaymentProviderType
  transactionId: string
  providerReference?: string
  status: TransactionStatus
  amount?: number
  currency?: string
  timestamp: Date
  signature?: string
  rawPayload: any
}
```
Provider-agnostic webhook payload. Each provider's webhook handler converts provider-specific payloads to this unified format.

---

## 3. Implementation Status

### 3.1 Implemented Providers
| Provider | Status | Currency | Countries |
|----------|--------|----------|-----------|
| InTouch | ✅ Implemented | RWF only | Rwanda (MTN, Airtel) |
| IremboPay | ✅ Implemented | RWF only | Rwanda (Visa, Mastercard) |

### 3.2 Reserved Providers
| Provider | Status | Target Markets |
|----------|--------|----------------|
| MTN_DIRECT | ⚠️ Defined, not implemented | Pan-Africa |
| AIRTEL_DIRECT | ⚠️ Defined, not implemented | Pan-Africa |
| PESAPAL | ⚠️ Defined, not implemented | East Africa |
| STRIPE | ⚠️ Defined, not implemented | Global |
| FLUTTERWAVE | ⚠️ Defined, not implemented | Pan-Africa |

### 3.3 MTN Direct Environment Variables
```bash
# .env.example lines 187-190
MTN_MOMO_API_URL="https://sandbox.momodeveloper.mtn.com"
MTN_MOMO_ENVIRONMENT="sandbox"
MTN_MOMO_API_KEY=""
MTN_MOMO_SUBSCRIPTION_KEY=""
```
MTN MoMo environment variables exist and `MTN_MOMO_CURRENCY` is configurable (defaults to RWF). The service class exists (`mtn-momo.service.ts`) but is not registered in the factory.

---

## 4. Legacy Service Issue (⚠️ Migration Incomplete)

### 4.1 Deprecated InTouchService
```typescript
// src/lib/services/intouch.service.ts lines 6-14
/**
 * ⚠️ DEPRECATED: This service is legacy and should NOT be used in new code.
 * Use PaymentProviderFactory.getProvider(PaymentProviderType.INTOUCH) instead.
 * This file remains for backward compatibility during migration only.
 */
```

### 4.2 Legacy Imports Still Present
```typescript
// src/lib/services/tap-leave-finalization.service.ts line 5
import { InTouchService } from '@/lib/services/intouch.service'
```
Some services still import the deprecated InTouchService directly instead of using the factory.

---

## 5. Currency Limitations in Providers (⚠️ Provider Constraint)

### 5.1 InTouch
```typescript
// src/lib/payments/providers/intouch.provider.ts line 275
currency: 'RWF',
```
InTouch is configured for RWF. This is a provider limitation — InTouch processes payments in RWF.

### 5.2 IremboPay
```typescript
// src/pages/api/payments/irembo/initiate-momo.ts line 46
if (transaction.currency !== 'RWF') {
  // reject
}
```
IremboPay explicitly rejects non-RWF transactions.

### 5.3 Architecture Implication
The provider abstraction is correct, but the current providers only support RWF. For international expansion, new providers (Stripe, Flutterwave, Pesapal) would be added that support other currencies. The architecture does not need to change — only new provider implementations need to be added.

---

## 6. Subscription Engine (✅ Good)

```typescript
// src/lib/payments/subscription.engine.ts
// Manages subscription lifecycle: TRIAL → ACTIVE → GRACE_PERIOD → EXPIRED → SUSPENDED → CANCELLED
```
Subscription engine is provider-agnostic and supports the full subscription lifecycle.

---

## 7. Architecture Classification

| Finding | Classification |
|---------|---------------|
| IPaymentProvider interface | Already Global |
| PaymentProviderFactory | Already Global |
| 7 provider types defined | Already Global |
| Provider-agnostic webhook payload | Already Global |
| Subscription engine | Already Global |
| PaymentMethod enum (9 methods) | Already Global |
| MTN_MOMO_CURRENCY configurable | Already Global |
| InTouch/IremboPay RWF-only | Rwanda-Specific by Design |
| Legacy InTouchService still imported | Future Evolution |
| MTN_DIRECT not implemented | Future Evolution |
| No provider-to-country mapping | Future Evolution |

---

## 8. Recommendations

### Immediate Actions (Before International Expansion)
1. Complete migration from deprecated InTouchService to PaymentProviderFactory in all services
2. Add currency validation per provider — reject currencies not supported by the selected provider with a clear error message
3. Read business.currency in payment initiation instead of hardcoding 'RWF'

### Before International Expansion
4. Implement MTN_DIRECT provider (env vars already exist, service class exists)
5. Add provider-to-country mapping — determine available providers based on business country
6. Implement Stripe provider for global card payments
7. Implement Flutterwave or Pesapal for pan-African payments

### Post-Growth Evolution
8. Implement provider fallback chain — if primary provider fails, try secondary
9. Add multi-currency settlement — allow businesses to receive payments in one currency and settle in another
10. Implement provider-specific feature detection (e.g., some providers support refunds, others don't)
11. Add provider health monitoring — track provider uptime and response times

---

## 9. Architecture Score

| Criterion | Score | Notes |
|-----------|-------|-------|
| Provider abstraction | 9/10 | Excellent interface design |
| Extensibility | 9/10 | New providers can be added cleanly |
| Implementation completeness | 5/10 | Only 2 of 7 providers implemented |
| Currency flexibility | 4/10 | Current providers are RWF-only |
| Migration completeness | 6/10 | Legacy services still imported |
| **Overall** | **7/10** | Architecture is ready; implementation needs work |
