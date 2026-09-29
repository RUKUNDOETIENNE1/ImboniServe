# MPCA-001A InTouch Webhook Idempotency Assessment

| Field | Value |
|---|---|
| Date | 2026-08-12 |

## Idempotency Architecture

### Layer 1: Webhook Handler Level

**Check:** `if (transaction.webhookVerified && transaction.status === PaymentTransactionStatus.SUCCESS)`
**Location:** `src/pages/api/webhooks/intouch.ts` line 127
**Behavior:** If the transaction is already SUCCESS and webhookVerified, return 200 "Already processed" immediately. No further processing.

**Strength:** Prevents all downstream processing for duplicate successful webhooks.
**Weakness:** Application-level check only. If the check passes but processing fails, a retry could reprocess.

### Layer 2: PaymentCompletionService Level

**Check 1:** `tx.sale.updateMany({ where: { id: saleId, paymentStatus: { not: 'COMPLETED' } } })`
**Location:** `src/lib/services/payment-completion.service.ts` line 59
**Behavior:** If Sale is already COMPLETED, `updateMany` returns `count: 0`. The service detects this and returns early (line 70-74). No ledger entry is created.

**Strength:** Database-level guard. Even if two webhooks pass Layer 1 simultaneously, only one can update the Sale (the other gets count: 0).

**Check 2:** `idempotencyKey: ${tx2.id}:${BillingEventType.PAYMENT_SUCCESS}:${sec}`
**Location:** `src/lib/services/payment-completion.service.ts` line 115
**Behavior:** The FinancialLedgerEntry has a unique `idempotencyKey`. If a duplicate entry is created (same transaction + event type + second), Prisma throws P2002 (unique constraint violation), which is caught and ignored (line 142).

**Strength:** Database-level uniqueness constraint. Prevents duplicate ledger entries even in race conditions.

### Layer 3: PaymentTransaction Update Level

**Check:** `tx.paymentTransaction.updateMany({ where: { id: effectiveTxnId, status: { not: 'SUCCESS' } } })`
**Location:** `src/lib/services/payment-completion.service.ts` line 95
**Behavior:** If PaymentTransaction is already SUCCESS, `updateMany` returns `count: 0`. No duplicate update.

## Duplicate Webhook Safety Proof

### Scenario: Webhook delivered 3 times

| Webhook | Layer 1 | Layer 2 | Result |
|---|---|---|---|
| #1 | Transaction PENDING → passes | Sale PENDING → updateMany count: 1 → Sale COMPLETED, Ledger created | One financial completion |
| #2 | Transaction SUCCESS + webhookVerified → 200 "Already processed" | Not reached | No mutation |
| #3 | Transaction SUCCESS + webhookVerified → 200 "Already processed" | Not reached | No mutation |

### Scenario: Two webhooks arrive simultaneously (race condition)

| Webhook | Layer 1 | Layer 2 | Result |
|---|---|---|---|
| #1 | Transaction PENDING → passes | Sale PENDING → updateMany count: 1 → SUCCESS | One financial completion |
| #2 | Transaction PENDING → passes | Sale COMPLETED → updateMany count: 0 → idempotent skip | No mutation |

Even in a race condition, the `updateMany` guard ensures only one webhook can complete the Sale. The second webhook's `updateMany` returns count: 0, triggering the idempotent skip path.

### Scenario: Webhook arrives after manual confirmation

| Source | Layer 2 | Result |
|---|---|---|
| Manual confirmation | Sale PENDING → updateMany count: 1 → COMPLETED + Ledger | One financial completion |
| InTouch webhook | Transaction SUCCESS + webhookVerified → 200 "Already processed" | No mutation |

## Conclusion

The idempotency architecture is **strong** with three layers of protection:
1. Application-level early return (fast path)
2. Database-level `updateMany` guard (race condition safe)
3. Database-level unique `idempotencyKey` constraint (ledger duplicate prevention)

**Duplicate webhooks are harmless.** One financial completion, regardless of delivery count.
