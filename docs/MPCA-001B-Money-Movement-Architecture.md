# MPCA-001B — Money Movement & Settlement Intelligence Architecture

**Date:** 2026-08-12
**Phase:** MPCA-001B
**Status:** DESIGN — implementation follows this document

---

## 1. Core Principle

> **PAYMENT TELLS US MONEY MOVED.**
> **SETTLEMENT TELLS US WHERE THE MONEY WENT.**
> **RECONCILIATION TELLS US THE STORY IS TRUE.**

A successful payment does NOT automatically mean:
- merchant funds are settled
- merchant funds are withdrawable
- merchant funds were withdrawn
- merchant received the funds

These are **separate concepts** represented by **separate states**.

---

## 2. Two Fundamental Money Flows

### A. PLATFORM MONEY (Business → ImboniServe)

```
Business → ImboniServe
```

Examples: subscription, platform fee, transaction fee, other ImboniServe charges.

**LedgerDomain:** SUBSCRIPTION, PLATFORM

### B. MERCHANT MONEY (Guest → Hospitality Business)

```
Guest → Hospitality Business
```

Examples: restaurant sale, cafe sale, hotel sale, bar sale.

**LedgerDomain:** SALES, MARKETPLACE

**Architectural Rule:** Restaurant revenue must NEVER appear as ImboniServe revenue. ImboniServe subscription payments must NEVER appear as restaurant sales revenue. The existing `LedgerDomain` enum enforces this separation.

---

## 3. Provider-Neutral Money States

### 3.1 Payment States (EXISTING — PaymentTransactionStatus)
```
PAYMENT_PENDING
PAYMENT_SUCCESS
PAYMENT_FAILED
PAYMENT_CANCELLED
```

### 3.2 Funds Availability States (NEW)
```
FUNDS_PENDING       — funds not yet available (settlement not complete)
FUNDS_AVAILABLE     — funds available to merchant
FUNDS_UNKNOWN       — provider does not expose availability information
```

### 3.3 Settlement States (NEW)
```
SETTLEMENT_PENDING       — settlement initiated but not complete
SETTLEMENT_PROCESSING    — settlement in progress
SETTLEMENT_COMPLETED     — funds settled to merchant account
SETTLEMENT_FAILED        — settlement failed
SETTLEMENT_NOT_REQUIRED  — provider has no separate settlement concept
SETTLEMENT_UNKNOWN       — provider does not expose settlement information
```

### 3.4 Withdrawal States (NEW)
```
WITHDRAWAL_REQUESTED     — merchant requested withdrawal
WITHDRAWAL_PROCESSING    — withdrawal in progress
WITHDRAWAL_COMPLETED     — funds withdrawn to destination
WITHDRAWAL_FAILED        — withdrawal failed
WITHDRAWAL_NOT_SUPPORTED — provider does not support withdrawal API
WITHDRAWAL_UNKNOWN       — provider does not expose withdrawal information
```

### 3.5 Funds Received States (NEW)
```
FUNDS_RECEIVED       — merchant confirmed receipt of funds
FUNDS_RECEIVED_UNKNOWN — receipt not verifiable
```

### 3.6 Reconciliation States (NEW)
```
RECONCILED                — settlement matches payment, story is true
RECONCILIATION_VARIANCE   — discrepancy detected
RECONCILIATION_PENDING    — not yet reconciled
RECONCILIATION_NOT_APPLICABLE — no settlement data to reconcile
```

### 3.7 Provider Capability Verification States (NEW)
```
UNKNOWN                — insufficient evidence
NOT_VERIFIED           — possible but not established
NOT_SUPPORTED          — provider explicitly confirms unavailable
SUPPORTED              — provider confirms available
SUPPORTED_BUT_UNTESTED — declared available but not production-verified
VERIFIED               — directly demonstrated in production
DOCUMENTED             — explicitly stated in authoritative documentation
SUPPORT_CONFIRMED      — confirmed by provider support, not yet API-verified
```

---

## 4. Provider Lifecycle Mapping

The architecture permits each provider to map its actual lifecycle into the common model.

### Example: Provider A (immediate funds)
```
PAYMENT_SUCCESS → FUNDS_AVAILABLE → (no settlement needed) → WITHDRAWAL_REQUESTED → WITHDRAWAL_COMPLETED
```

### Example: Provider B (delayed settlement)
```
PAYMENT_SUCCESS → FUNDS_PENDING → SETTLEMENT_PENDING → SETTLEMENT_PROCESSING → SETTLEMENT_COMPLETED → FUNDS_AVAILABLE → WITHDRAWAL_REQUESTED → WITHDRAWAL_COMPLETED
```

### Example: Provider C (no settlement API)
```
PAYMENT_SUCCESS → FUNDS_UNKNOWN → SETTLEMENT_UNKNOWN → WITHDRAWAL_UNKNOWN
```

**All three are representable without changing the core business architecture.**

---

## 5. Architectural Topology

```
                    IMBONISERVE
                         │
              Money Movement Domain
                         │
          ┌──────────────┴──────────────┐
          │                             │
    Payment Engine              Settlement Engine
          │                             │
          └──────────────┬──────────────┘
                         │
                  Provider Adapter
                         │
             ┌───────────┼───────────┐
             │           │           │
          InTouch    IremboPay    Future
```

### 5.1 Payment Engine (EXISTING)
- IPaymentProvider interface
- PaymentProviderFactory
- PaymentCompletionService
- Handles: payment initiation, verification, webhook, status

### 5.2 Settlement Engine (NEW)
- ISettlementProvider interface (optional on providers)
- SettlementService (domain logic)
- Handles: settlement records, funds availability, withdrawal, settlement reconciliation

### 5.3 Provider Adapter (EXISTING pattern, EXTENDED)
- Each provider implements IPaymentProvider (required)
- Each provider MAY implement ISettlementProvider (optional)
- Provider declares its capabilities via ProviderCapability
- Core domain logic is provider-neutral
- Provider-specific complexity stays at the edge

---

## 6. New Domain Entities

### 6.1 SettlementRecord

Records a provider settlement event — when the provider makes funds available/settled to the merchant.

```
model SettlementRecord {
  id                    String   @id @default(cuid())
  businessId            String
  provider              PaymentGateway
  providerSettlementId  String?  // Provider's settlement ID (if available)
  internalSettlementId  String   @unique  // ImboniServe's internal ID
  currency              String
  grossAmountCents      Int      // Total settled
  providerFeeCents      Int      @default(0)  // Fee deducted by provider
  platformFeeCents      Int      @default(0)  // ImboniServe fee
  otherDeductionsCents  Int      @default(0)
  netAmountCents        Int      // Net to merchant
  status                SettlementStatus
  fundsAvailabilityStatus FundsAvailabilityStatus
  requestedAt           DateTime?
  processingAt          DateTime?
  completedAt           DateTime?
  expectedAvailabilityAt DateTime?  // Only if provider actually supplies this
  destinationReference  String?  // Where funds went (if safe to expose)
  providerMetadata      Json?    // Raw provider settlement data
  reconciliationStatus  SettlementReconciliationStatus @default(PENDING)
  reconciledAt          DateTime?
  reconciliationVarianceCents Int?
  idempotencyKey        String?  @unique
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Links to source transactions (many-to-many via SettlementTransactionLink)
  transactionLinks      SettlementTransactionLink[]

  @@index([businessId, occurredAt])
  @@index([provider, status])
  @@index([reconciliationStatus])
}
```

### 6.2 SettlementTransactionLink

Links a SettlementRecord to the PaymentTransactions it covers.

```
model SettlementTransactionLink {
  id                  String   @id @default(cuid())
  settlementRecordId  String
  paymentTransactionId String
  allocatedAmountCents Int    // How much of the settlement covers this transaction
  createdAt           DateTime @default(now())

  settlementRecord    SettlementRecord  @relation(fields: [settlementRecordId], references: [id], onDelete: Cascade)
  paymentTransaction  PaymentTransaction @relation(fields: [paymentTransactionId], references: [id])

  @@unique([settlementRecordId, paymentTransactionId])
  @@index([settlementRecordId])
  @@index([paymentTransactionId])
}
```

### 6.3 WithdrawalRecord

Records a merchant-initiated withdrawal of available funds.

```
model WithdrawalRecord {
  id                    String   @id @default(cuid())
  businessId            String
  provider              PaymentGateway
  providerWithdrawalId  String?  // Provider's withdrawal ID
  internalWithdrawalId  String   @unique
  currency              String
  amountCents           Int      // Amount requested
  feeCents              Int      @default(0)  // Withdrawal fee (if any)
  netAmountCents        Int      // Amount merchant receives
  status                WithdrawalStatus
  destinationType       String?  // "BANK_ACCOUNT" | "MOBILE_MONEY" | etc.
  destinationReference  String?  // Account reference (masked/truncated)
  requestedAt           DateTime @default(now())
  processingAt          DateTime?
  completedAt           DateTime?
  failedAt              DateTime?
  failureReason         String?
  providerMetadata      Json?
  idempotencyKey        String?  @unique
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([businessId, status])
  @@index([provider, status])
}
```

### 6.4 ProviderCapabilityRecord

Records what capabilities each provider supports, with verification status.

```
model ProviderCapabilityRecord {
  id              String   @id @default(cuid())
  provider        PaymentGateway
  capability      String   // e.g., "MERCHANT_BALANCE", "SETTLEMENT_API"
  verificationStatus ProviderCapabilityVerification
  evidence        String?  // How we know (doc URL, support ticket, API test)
  lastVerifiedAt  DateTime?
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([provider, capability])
  @@index([provider])
}
```

---

## 7. Fee Separation Model

The existing FinancialLedgerEntry already separates fees:

```
Gross Sale:     amountCents
Gateway Fee:    gatewayFeeCents
Platform Fee:   platformFeeCents
Merchant Net:   netAmountCents
```

SettlementRecord mirrors this:

```
Gross Amount:       grossAmountCents
Provider Fee:       providerFeeCents
Platform Fee:       platformFeeCents
Other Deductions:   otherDeductionsCents
Net to Merchant:    netAmountCents
```

**No hardcoded fees.** All fees come from FeeConfiguration or provider API responses.

---

## 8. Currency Discipline

Per EGR-016 (geography is configuration, never code):

- SettlementRecord.currency comes from `business.currency` or provider API response
- WithdrawalRecord.currency comes from `business.currency` or provider API response
- NEVER hardcoded "RWF", "USD", etc.
- The system CAN represent provider currency ≠ merchant currency if the provider architecture requires it

---

## 9. Business Isolation

Every SettlementRecord, WithdrawalRecord, and ProviderCapabilityRecord has `businessId`.

- Settlement queries filter by `businessId`
- Withdrawal queries filter by `businessId`
- Cross-business access attempts return 403
- Regression tests verify isolation

---

## 10. Idempotency

Settlement and withdrawal events may be retried. Every new entity has `idempotencyKey` with unique constraint.

- Duplicate settlement webhook → P2002 → safely ignored
- Duplicate withdrawal event → P2002 → safely ignored
- Same provider event never creates duplicate financial effects
- Uses the existing idempotencyKey pattern from FinancialLedgerEntry

---

## 11. Integration with Existing Financial Truth

```
Payment (EXISTING)
→ PaymentCompletionService (EXISTING — MPCA-001A verified)
→ Sale COMPLETED (EXISTING)
→ PaymentTransaction SUCCESS (EXISTING)
→ FinancialLedgerEntry SALES (EXISTING)
→ [NEW] SettlementIntelligenceService.onPaymentSuccess()
  → Create SettlementRecord (status=SETTLEMENT_UNKNOWN or provider-mapped)
  → Emit Heart Pulse settlement event
  → Non-blocking — does NOT break the payment truth chain
```

**The settlement intelligence layer sits ALONGSIDE the financial truth chain, not on top of it.**

---

## 12. Heart Pulse Integration

New event types (added to existing catalog):

```
settlement.created      — SettlementRecord created
settlement.processing   — Settlement status → PROCESSING
settlement.completed    — Settlement status → COMPLETED
settlement.failed       — Settlement status → FAILED
withdrawal.requested    — WithdrawalRecord created
withdrawal.processing   — Withdrawal status → PROCESSING
withdrawal.completed    — Withdrawal status → COMPLETED
withdrawal.failed       — Withdrawal status → FAILED
funds.available         — Funds availability → AVAILABLE
```

These use the existing HeartPulseEvent envelope and channel naming.

---

## 13. Service Replay Integration

New ReplayEventType values (added to existing types):

```
SETTLEMENT_CREATED
SETTLEMENT_PROCESSING
SETTLEMENT_COMPLETED
SETTLEMENT_FAILED
WITHDRAWAL_REQUESTED
WITHDRAWAL_PROCESSING
WITHDRAWAL_COMPLETED
WITHDRAWAL_FAILED
FUNDS_AVAILABLE
```

These use the existing ReplayEventCategory 'payment' (or a new 'settlement' category).

---

## 14. Reconciliation Architecture

### 14.1 Existing (Payment-vs-Sale)
- ReconciliationService: payment SUCCESS vs Sale COMPLETED
- Z-Report: Sale total vs FinancialLedgerEntry total

### 14.2 New (Settlement-vs-Payment)
- SettlementReconciliationService: SettlementRecord vs PaymentTransaction
- Detects: missing settlement, duplicate settlement, amount variance, fee variance, settlement without payment, payment with no settlement

### 14.3 Reconciliation States
```
RECONCILED                — settlement matches payment
RECONCILIATION_VARIANCE   — discrepancy detected
RECONCILIATION_PENDING    — not yet reconciled
RECONCILIATION_NOT_APPLICABLE — no settlement data (provider doesn't expose it)
```

**Do NOT implement speculative reconciliation logic where provider data is unavailable.** If settlement status is UNKNOWN, reconciliation status is NOT_APPLICABLE.

---

## 15. Provider Capability Matrix

See: `MPCA-001B-Provider-Capability-Matrix.md`

All unknown capabilities are explicitly `UNKNOWN`. No guessing.

---

## 16. What This Architecture Does NOT Do

- Does NOT hardcode InTouch settlement timing (T+1, T+3, etc.)
- Does NOT assume automatic settlement
- Does NOT assume manual withdrawal
- Does NOT assume split settlement
- Does NOT hardcode withdrawal fees, minimums, or maximums
- Does NOT claim InTouch production settlement behavior
- Does NOT break MPCA-001A's PaymentCompletionService fix
- Does NOT replace FinancialLedgerEntry as canonical financial truth
- Does NOT deploy production infrastructure
- Does NOT activate Customer #1

---

## 17. Acceptance Criteria Mapping

| Criterion | How Addressed |
|---|---|
| Payment and settlement explicitly separated | Separate entities, separate states, separate interfaces |
| Platform money and merchant money separated | LedgerDomain (existing) + SettlementRecord.businessId |
| Provider-neutral settlement architecture | ISettlementProvider + SettlementRecord |
| Provider capability abstraction | ProviderCapabilityRecord + ISettlementProvider |
| InTouch behavior NOT invented | All capabilities UNKNOWN until verified |
| Unknown capabilities remain unknown | ProviderCapabilityVerification enum |
| Settlement/withdrawal lifecycle represents different providers | State mapping per provider adapter |
| Fee and net-amount separated | SettlementRecord fee fields |
| Currency configuration-driven | business.currency, no hardcoding |
| Business isolation protected | businessId on all entities + tests |
| Idempotency addressed | idempotencyKey on all entities |
| Existing financial truth intact | PaymentCompletionService unchanged, additive only |
| Domain tests pass | 19 scenarios A-S |
| Existing regression tests pass | MPCA-001A + reliability + security + payment |
| Production build succeeds | Verified |
| No new TypeScript errors | Verified |
| InTouch questionnaire complete | MPCA-001B-InTouch-Verification-Questionnaire.md |
| Documentation complete | 10 deliverable documents |
| No production infrastructure changed | Design + implementation + local verification only |

---

*Architecture design complete. Proceeding to implementation.*
