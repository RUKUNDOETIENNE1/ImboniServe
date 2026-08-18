# AI Credit Ledger

## Overview

The AI Credit Ledger is the immutable, append-only source of truth for every credit movement in the platform. It records every allocation, purchase, consumption, refund, reservation, and adjustment with full audit context.

## Database Model

**Model:** `AICreditLedgerEntry` (defined in `prisma/schema.prisma`)

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Unique entry ID |
| `walletId` | String | FK to AICreditWallet |
| `businessId` | String | Business ID for direct queries |
| `entryType` | AICreditLedgerEntryType | Type of transaction |
| `feature` | String? | AI feature key (e.g., 'scanner') |
| `operation` | String? | Human-readable operation description |
| `credits` | Int | Positive for credits in, negative for credits out |
| `balanceBefore` | Int | Wallet balance before this entry |
| `balanceAfter` | Int | Wallet balance after this entry |
| `requestId` | String? | Correlates to AICreditReservation |
| `userId` | String? | User who triggered the operation |
| `aiProvider` | String? | AI provider used (e.g., 'openai') |
| `tokensUsed` | Int? | Token consumption if applicable |
| `costUSD` | Float? | Actual provider cost in USD |
| `metadata` | Json? | Additional context |
| `idempotencyKey` | String? @unique | Prevents duplicate entries |
| `createdAt` | DateTime | When the entry was recorded |

### Entry Types

| Type | Description | Credits Direction |
|------|-------------|-------------------|
| `ALLOCATION` | Monthly subscription credits granted | Positive |
| `PURCHASE` | One-time credit purchase | Positive |
| `BONUS` | Promotional or manual bonus | Positive |
| `CONSUMPTION` | Credits consumed by AI operation | Negative |
| `REFUND` | Credits refunded for failed operations | Positive |
| `RESERVATION` | Credits reserved pending operation | Zero (metadata only) |
| `RESERVATION_RELEASE` | Reservation released | Zero (metadata only) |
| `ADJUSTMENT` | Manual admin grant/revoke | Positive or Negative |
| `EXPIRY` | Credits expired per policy | Negative |

## Immutability

The ledger is **append-only**. No entries are ever modified or deleted. This ensures:

- Complete audit trail
- Financial traceability
- Regulatory compliance
- Fraud detection capability

## Idempotency

Every ledger entry can carry an `idempotencyKey` (unique constraint). This prevents duplicate entries when operations are retried:

- Reservation: `reserve_{requestId}`
- Commit: `commit_{requestId}`
- Release: `release_{requestId}`
- Purchase: `purchase_{transactionId}`

If a duplicate entry is attempted with the same key, the existing entry is returned without creating a new one.

## Service Interface

**File:** `src/lib/services/credits/credit-ledger.service.ts`

### Functions

```typescript
// Append a new entry (idempotent via idempotencyKey)
appendLedgerEntry(input: LedgerEntryInput): Promise<LedgerEntry | null>

// Get paginated ledger for a business
getBusinessLedger(businessId, opts?): Promise<{ entries, total, page, limit, pages }>

// Get entries by request/reservation ID
getLedgerByRequestId(requestId): Promise<LedgerEntry[]>

// Search across all businesses (admin)
searchLedger(opts): Promise<{ entries, total, page, limit, pages }>
```

## Indexes

| Index | Purpose |
|-------|---------|
| `walletId + createdAt` | Chronological wallet history |
| `businessId + createdAt` | Business-level queries |
| `entryType + createdAt` | Filter by type |
| `feature + createdAt` | Feature-level analytics |
| `requestId` | Correlate to reservations |
| `idempotencyKey` (unique) | Prevent duplicates |

## Querying

### Business Ledger

```typescript
const result = await getBusinessLedger(businessId, {
  page: 1,
  limit: 50,
  entryType: 'CONSUMPTION',
  feature: 'scanner',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
});
```

### Admin Search

```typescript
const result = await searchLedger({
  businessId: 'abc123',
  entryType: 'PURCHASE',
  page: 1,
  limit: 100,
});
```

## Balance Integrity

Every entry records `balanceBefore` and `balanceAfter`, enabling:

- **Reconstruction:** Wallet balance can be replayed from ledger entries
- **Verification:** `balanceAfter == balanceBefore + credits` for every entry
- **Reconciliation:** Independent verification of wallet balance against ledger
