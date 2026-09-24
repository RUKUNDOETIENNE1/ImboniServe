# AI Credits Database Schema

## Overview

The AI Credits Platform adds 6 new models to the Prisma schema, along with 2 new enums. All models are defined in `prisma/schema.prisma`.

## Enums

### AICreditLedgerEntryType

```prisma
enum AICreditLedgerEntryType {
  ALLOCATION          // Monthly subscription credits granted
  PURCHASE            // One-time credit purchase
  BONUS               // Promotional / manual bonus
  CONSUMPTION         // Credits consumed by an AI operation
  REFUND              // Credits refunded for failed operations
  RESERVATION         // Credits reserved pending operation
  RESERVATION_RELEASE // Reservation released (operation failed/cancelled)
  ADJUSTMENT          // Manual admin adjustment (grant/revoke)
  EXPIRY              // Credits expired per policy
}
```

### AICreditReservationStatus

```prisma
enum AICreditReservationStatus {
  PENDING    // Reserved, awaiting operation result
  COMMITTED  // Operation succeeded, credits deducted
  RELEASED   // Operation failed/cancelled, credits returned
  EXPIRED    // Reservation timed out without commit
}
```

## Models

### AICreditWallet

One wallet per business. Tracks all credit balances and lifetime totals.

```prisma
model AICreditWallet {
  id                   String   @id @default(cuid())
  businessId           String   @unique

  // Balances
  balance              Int      @default(0)
  reservedBalance      Int      @default(0)
  monthlyAllocation    Int      @default(0)
  purchasedCredits     Int      @default(0)
  bonusCredits         Int      @default(0)

  // Lifetime totals
  lifetimeConsumed     Int      @default(0)
  lifetimePurchased    Int      @default(0)
  lifetimeAllocated    Int      @default(0)

  // Renewal cycle
  lastRenewalAt        DateTime?
  nextRenewalAt        DateTime?

  // Limits
  maxBalance           Int?

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  business             Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  ledgerEntries        AICreditLedgerEntry[]
  reservations         AICreditReservation[]

  @@index([nextRenewalAt])
}
```

**Key relationships:**
- `business` — One-to-one with Business (cascade delete)
- `ledgerEntries` — One-to-many with AICreditLedgerEntry
- `reservations` — One-to-many with AICreditReservation

### AICreditLedgerEntry

Immutable, append-only transaction record.

```prisma
model AICreditLedgerEntry {
  id              String                  @id @default(cuid())
  walletId        String
  businessId      String

  entryType       AICreditLedgerEntryType
  feature         String?
  operation       String?

  credits         Int
  balanceBefore   Int
  balanceAfter    Int

  requestId       String?
  userId          String?
  aiProvider      String?
  tokensUsed      Int?
  costUSD         Float?
  metadata        Json?

  idempotencyKey  String?   @unique

  createdAt       DateTime  @default(now())

  wallet          AICreditWallet  @relation(fields: [walletId], references: [id])

  @@index([walletId, createdAt])
  @@index([businessId, createdAt])
  @@index([entryType, createdAt])
  @@index([feature, createdAt])
  @@index([requestId])
}
```

### AICreditReservation

Holds credits during async AI operations.

```prisma
model AICreditReservation {
  id              String                    @id @default(cuid())
  walletId        String
  businessId      String

  feature         String
  operation       String?
  creditsReserved Int
  status          AICreditReservationStatus @default(PENDING)

  requestId       String                    @unique
  userId          String?

  expiresAt       DateTime
  committedAt     DateTime?
  releasedAt      DateTime?

  metadata        Json?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  wallet          AICreditWallet  @relation(fields: [walletId], references: [id])

  @@index([walletId, status])
  @@index([businessId, status])
  @@index([status, expiresAt])
  @@index([feature])
}
```

### AIFeatureCost

Configurable credit cost per AI feature.

```prisma
model AIFeatureCost {
  id              String   @id @default(cuid())
  featureKey      String   @unique
  featureName     String
  description     String?

  creditsCost     Int      @default(1)
  isDynamic       Boolean  @default(false)
  minCredits      Int?
  maxCredits      Int?

  category        String?
  isActive        Boolean  @default(true)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([category])
  @@index([isActive])
}
```

### AICreditPackage

Purchasable credit bundles.

```prisma
model AICreditPackage {
  id              String   @id @default(cuid())
  code            String   @unique
  name            String
  description     String?

  credits         Int
  priceCents      Int
  currency        String   @default("RWF")

  bonusCredits    Int      @default(0)
  isActive        Boolean  @default(true)
  sortOrder       Int      @default(0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([isActive, sortOrder])
}
```

### AICreditPolicy

Data-driven policy rules.

```prisma
model AICreditPolicy {
  id              String   @id @default(cuid())
  policyKey       String   @unique
  policyName      String
  description     String?

  value           String
  dataType        String   @default("string")
  appliesTo       String   @default("all")
  isActive        Boolean  @default(true)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([policyKey])
  @@index([appliesTo, isActive])
}
```

## Business Model Addition

The `Business` model has a new optional relation:

```prisma
model Business {
  // ... existing fields ...
  aiCreditWallet          AICreditWallet?
  // ...
}
```

## Migration Notes

1. Run `npx prisma generate` after schema changes
2. Run `npx prisma db push` or create a migration
3. The monthly cron job seeds default feature costs, policies, and packages on first run
4. Existing businesses get wallets created lazily on first access (checkAICredits, getOrCreateWallet)
5. Legacy `aiCreditsUsed`, `aiCreditsLimit`, `aiResetDate` fields on Business are kept for backward compatibility but the new platform is the source of truth
