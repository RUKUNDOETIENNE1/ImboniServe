# AI Credits Platform — Architecture

## Overview

The AI Credits Platform is the economic engine of the Hospitality AI Platform. It centralizes AI credit management across all present and future AI capabilities, ensuring every AI operation is metered, auditable, and financially transparent.

## Core Philosophy

- **A subscription answers:** "What software can the business access?"
- **AI Credits answer:** "How much AI intelligence can the business consume?"

These are independent concerns. A customer can upgrade either one independently.

## Architecture Diagram

```
Hospitality AI Platform
        │
        ▼

  AI Credits Platform
        │
  ┌─────┴──────────────────────────────────┐
  │                                        │
  ▼                                        ▼

Credit Wallet                    Consumption Engine
  │                                        │
  ▼                                        ▼

Credit Ledger                    Feature Cost Registry
  │                                        │
  └──────────────┬─────────────────────────┘
                 ▼

          Credit Policies
                 │
                 ▼

          Billing Integration
                 │
                 ▼

        Analytics Dashboard
```

## Service Layer

All services live in `src/lib/services/credits/`:

| Service | File | Responsibility |
|---------|------|----------------|
| Credit Wallet | `credit-wallet.service.ts` | Wallet CRUD, balance tracking, monthly allocation renewal |
| Credit Ledger | `credit-ledger.service.ts` | Immutable transaction history, search, pagination |
| Feature Cost Registry | `feature-cost-registry.service.ts` | Configurable per-feature credit costs |
| Consumption Engine | `credit-consumption-engine.service.ts` | Reserve → Execute → Commit/Release lifecycle |
| Credit Policy | `credit-policy.service.ts` | Data-driven rules (limits, expiry, restrictions) |
| Credit Purchase | `credit-purchase.service.ts` | Credit packages, fulfillment, bonus grants, revocations |
| Credit Analytics | `credit-analytics.service.ts` | Business-level and platform-level analytics |

## Database Models

All models are defined in `prisma/schema.prisma`:

| Model | Purpose |
|-------|---------|
| `AICreditWallet` | One per business — tracks balance, reserved, allocation, purchased, bonus |
| `AICreditLedgerEntry` | Immutable record of every credit movement |
| `AICreditReservation` | Holds credits during async AI operations |
| `AIFeatureCost` | Configurable cost per AI feature |
| `AICreditPackage` | Purchasable credit bundles |
| `AICreditPolicy` | Data-driven policy rules |

## Consumption Lifecycle

Every AI request follows this lifecycle:

1. **Request** AI operation
2. **Determine** required credits (from Feature Cost Registry)
3. **Verify** sufficient balance
4. **Reserve** credits (creates a PENDING reservation)
5. **Execute** AI operation
6. **Commit** (success → deduct credits) or **Release** (failure → return credits)
7. **Record** transaction in the ledger

**Failed AI operations NEVER consume credits.**

## Integration Patterns

### Legacy Adapter (Backward Compatible)

Existing code imports from `ai-credit.service.ts` which now delegates to the new platform:

```typescript
import { checkAICredits, consumeAICredits, AIFeature } from '@/lib/services/ai-credit.service';
```

### New Code (Direct Platform Access)

```typescript
import { executeWithCredits, checkCredits, getOrCreateWallet } from '@/lib/services/credits';

// Full lifecycle wrapper
const { result, creditsConsumed, balanceAfter } = await executeWithCredits(
  businessId,
  'scanner',
  async () => await callOpenAI(prompt),
  { userId, operationName: 'Business scan' }
);
```

### Manual Reserve/Commit/Release

```typescript
import { reserveCredits, commitReservation, releaseReservation } from '@/lib/services/credits';

// Step 1: Reserve
const reservation = await reserveCredits(businessId, 'site_builder', { userId });

try {
  // Step 2: Execute AI operation
  const result = await performAIOperation();

  // Step 3a: Commit on success
  await commitReservation(reservation.requestId, { tokensUsed, costUSD });
} catch (error) {
  // Step 3b: Release on failure
  await releaseReservation(reservation.requestId, error.message);
  throw error;
}
```

## API Surface

### Business Endpoints (`/api/credits/`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/credits/balance` | GET | Get wallet balance and metadata |
| `/api/credits/usage` | GET | Get usage analytics (30-day default) |
| `/api/credits/history` | GET | Get paginated ledger history |
| `/api/credits/packages` | GET | List purchasable credit packages |
| `/api/credits/purchase` | POST | Initiate credit purchase via IremboPay |

### Admin Endpoints (`/api/credits/admin/`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/credits/admin/wallets` | GET | List all business wallets |
| `/api/credits/admin/adjust` | POST | Grant or revoke credits |
| `/api/credits/admin/ledger` | GET | Search ledger across all businesses |
| `/api/credits/admin/feature-costs` | GET/POST/PUT | Manage feature costs |
| `/api/credits/admin/policies` | GET/POST/PUT | Manage credit policies |
| `/api/credits/admin/analytics` | GET | Platform-wide analytics |

## Design Principles

- **Centralized:** Single platform for all AI credit operations
- **Auditable:** Immutable ledger is the source of truth
- **Transparent:** Every credit movement is traceable
- **Extensible:** New AI features register costs without code changes
- **Provider-independent:** Not tied to any AI provider's billing
- **Fair:** Failed operations never consume credits
- **Secure:** Admin-only operations, idempotent transactions
- **Observable:** Full analytics at business and platform level
