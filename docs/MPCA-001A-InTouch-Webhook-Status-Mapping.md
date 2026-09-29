# MPCA-001A InTouch Webhook Status Mapping

| Field | Value |
|---|---|
| Date | 2026-08-12 |

## Provider Status → Internal Status Mapping

### Layer 1: InTouch Raw Status → TransactionStatus

| InTouch Raw Status | TransactionStatus | Action |
|---|---|---|
| successful | SUCCESS | Complete payment (if Sale linked) |
| successfull | SUCCESS | (InTouch typo in docs — handled) |
| success | SUCCESS | Complete payment (if Sale linked) |
| completed | SUCCESS | Complete payment (if Sale linked) |
| pending | PROCESSING | Do NOT complete Sale |
| failed | FAILED | Do NOT complete Sale |
| failure | FAILED | Do NOT complete Sale |
| cancelled | CANCELLED | Do NOT complete Sale |
| canceled | CANCELLED | Do NOT complete Sale (alternate spelling) |
| (any other value) | PENDING | Do NOT complete Sale (safe default) |

**Source:** `src/lib/payments/providers/intouch.provider.ts` lines 306-327

### Layer 2: TransactionStatus → PaymentTransactionStatus

| TransactionStatus | PaymentTransactionStatus | Action |
|---|---|---|
| SUCCESS | SUCCESS | Route to PaymentCompletionService (if Sale linked) |
| PROCESSING | PROCESSING | Direct update, no Sale completion |
| CANCELLED | CANCELLED | Direct update, no Sale completion |
| REFUNDED | REFUNDED | Direct update, no Sale completion |
| (anything else) | FAILED | Direct update, no Sale completion |

**Source:** `src/pages/api/webhooks/intouch.ts` lines 133-142

## Critical Safety Properties

1. **Only SUCCESS triggers Sale completion:** No other status can mark a Sale as COMPLETED or create a FinancialLedgerEntry with PAYMENT_SUCCESS.

2. **Unknown statuses default to PENDING/FAILED:** The provider maps unknown statuses to PENDING (TransactionStatus), which the webhook maps to FAILED (PaymentTransactionStatus). This is a safe default — it cannot accidentally complete a payment.

3. **No status can bypass PaymentCompletionService:** The canonical path is only invoked when `mappedStatus === PaymentTransactionStatus.SUCCESS`. All other statuses use the direct update path which does not touch Sale or Ledger.

4. **Failed payments are terminal:** Once a PaymentTransaction is FAILED, the idempotency check at the top of the webhook handler will NOT skip it (it only skips SUCCESS). However, a subsequent SUCCESS webhook CAN complete the payment — this is correct behavior (payment may succeed on retry).
