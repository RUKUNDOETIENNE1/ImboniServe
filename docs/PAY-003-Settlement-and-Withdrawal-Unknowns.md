# PAY-003 — Settlement and Withdrawal Unknowns

| Field | Value |
|---|---|
| Document ID | PAY-003-SETTLEMENT-AND-WITHDRAWAL-UNKNOWNS |
| Date | 2026-08-15 |
| Mission | PAY-003 |
| Source | Code inspection (`provider-capability-registry.ts`) + InTouch API v1.2 document |

## 1. Executive Statement

**InTouch's settlement and withdrawal capabilities are UNKNOWN.** This is not a gap in our code — it is a gap in the provider documentation and a gap in our verified knowledge. No assumption is made about how (or whether) funds collected via RequestPayment reach the merchant's bank or Mobile Money account.

The `ProviderCapabilityRegistry` (`src/lib/settlement/provider-capability-registry.ts`) explicitly marks all InTouch settlement and withdrawal capabilities as `UNKNOWN` or `NOT_VERIFIED`. This is a deliberate architectural choice: **no capability is assumed. Unknown remains unknown.**

## 2. What the InTouch API Document Does NOT Say

The InTouch API document (v1.2, 15 pages) describes four API operations:

1. **RequestPayment** — debit a customer's Mobile Money account (Section 2).
2. **RequestDeposit** — credit a Mobile Money subscriber (Section 3).
3. **GetTransactionStatus** — query a transaction's status (Section 4).
4. **GetBalance** — query the merchant's InTouch account balance (Section 5).

The document does **NOT** describe:

- How or when funds collected via RequestPayment are settled to the merchant.
- Whether there is a settlement API endpoint.
- Whether there is a settlement webhook.
- Whether settlement is automatic, manual, or on a schedule.
- What the settlement schedule is (daily, weekly, on-demand).
- Whether RequestDeposit can target the merchant's own account (withdrawal).
- Whether there are fees associated with settlement or withdrawal.
- Whether there is a funds-availability notification.
- Whether there is a reconciliation API.
- Whether there is a settlement history or report API.

## 3. What the Code Does NOT Assume

### 3.1 ProviderCapabilityRegistry (InTouch profile)

| Capability | Status | Notes |
|---|---|---|
| `PAYMENT_COLLECTION` | `SUPPORT_CONFIRMED` | Webhook handler implemented |
| `MERCHANT_BALANCE` | `UNKNOWN` | |
| `MERCHANT_BALANCE_API` | `UNKNOWN` | |
| `IMMEDIATE_FUNDS_AVAILABILITY` | `UNKNOWN` | |
| `SAME_DAY_AVAILABILITY` | `NOT_VERIFIED` | Verbal info only: "business can withdraw same day" |
| `FUNDS_AVAILABILITY_API` | `UNKNOWN` | |
| `FUNDS_AVAILABILITY_WEBHOOK` | `UNKNOWN` | |
| `AUTOMATIC_SETTLEMENT` | `UNKNOWN` | |
| `MERCHANT_INITIATED_SETTLEMENT` | `UNKNOWN` | |
| `SETTLEMENT_API` | `UNKNOWN` | |
| `SETTLEMENT_WEBHOOK` | `UNKNOWN` | |
| `SETTLEMENT_HISTORY_API` | `UNKNOWN` | |
| `SETTLEMENT_REPORT` | `UNKNOWN` | |
| `WITHDRAWAL_API` | `UNKNOWN` | |
| `WITHDRAWAL_WEBHOOK` | `UNKNOWN` | |
| `BANK_WITHDRAWAL` | `UNKNOWN` | |
| `MOBILE_MONEY_WITHDRAWAL` | `UNKNOWN` | |
| `DAILY_WITHDRAWAL` | `NOT_VERIFIED` | Verbal info only: "business can withdraw every day" |
| `FEE_VISIBILITY` | `UNKNOWN` | |
| `PLATFORM_FEE_DEDUCTION` | `UNKNOWN` | |
| `SPLIT_SETTLEMENT` | `UNKNOWN` | |
| `REFUND_EVENTS` | `UNKNOWN` | |
| `REVERSAL_EVENTS` | `UNKNOWN` | |
| `RECONCILIATION_API` | `UNKNOWN` | |
| `TRANSACTION_REPORT` | `UNKNOWN` | |
| `WITHDRAWAL_REPORT` | `UNKNOWN` | |

### 3.2 SettlementIntelligenceService

When a payment succeeds, `SettlementIntelligenceService.onPaymentSuccess()` creates a `SettlementRecord` with status `SETTLEMENT_UNKNOWN` (because `ProviderCapabilityRegistry.isSettlementDataAvailable('INTOUCH')` returns `false`). This record is **additive** — it does not affect the financial truth chain. It exists to track that a payment occurred and its settlement status is not yet known.

### 3.3 GetBalance

`InTouchService.getBalance()` calls `${INTOUCH_API_URL}/getbalance/` and returns the merchant's InTouch account balance. This is the **InTouch account balance** (funds held by InTouch on behalf of the merchant), not necessarily the settled balance. The relationship between this balance and actual settlement is UNKNOWN.

## 4. What We Know from Verbal Support Info (NOT Verified)

Two pieces of verbal information were recorded in the `ProviderCapabilityRegistry` with `NOT_VERIFIED` status:

1. **"Business can withdraw same day"** — recorded as `SAME_DAY_AVAILABILITY: NOT_VERIFIED`.
2. **"Business can withdraw every day"** — recorded as `DAILY_WITHDRAWAL: NOT_VERIFIED`.

These are **not production API contracts**. They are verbal statements from InTouch support, recorded for traceability but not relied upon for any code behavior.

## 5. Questions That Must Be Answered Before Production

See `PAY-003-Provider-Questions-Register.md`:

- **S1:** Does InTouch provide a settlement API or webhook? [P0 for production]
- **S2:** Can RequestDeposit target the merchant's own account (withdrawal)? [P0 for production]
- **S3:** Is there a funds-availability notification? [P1]

## 6. Impact on the Financial Truth Chain

The financial truth chain (`Sale → COMPLETED + PaymentTransaction → SUCCESS + FinancialLedgerEntry`) records **that a payment occurred and its amount**. It does NOT record **that the funds were settled to the merchant**. This is by design — settlement is a separate concern that depends on provider capabilities we have not verified.

**What this means for the founder:**

- The `FinancialLedgerEntry` proves a customer paid.
- The `SettlementRecord` (with `SETTLEMENT_UNKNOWN` status) tracks that settlement has not been confirmed.
- Until settlement capabilities are verified, there is a gap between "customer paid" and "merchant received funds."
- This gap is a **P0 production blocker** — not because the code is broken, but because we cannot verify the business outcome (merchant getting paid) without provider confirmation.

## 7. What Would Change If Settlement Capabilities Are Confirmed

If InTouch confirms a settlement API/webhook:

1. `ProviderCapabilityRegistry` would update the relevant capabilities from `UNKNOWN` to `SUPPORT_CONFIRMED` or `VERIFIED`.
2. `SettlementIntelligenceService` would create `SettlementRecord` entries with `SETTLEMENT_PENDING` instead of `SETTLEMENT_UNKNOWN`.
3. A settlement webhook handler would be implemented (if InTouch provides a settlement webhook).
4. A settlement reconciliation job would be implemented (if InTouch provides a settlement history API).
5. The `FinancialLedgerEntry` would be extended (or a companion record created) to link payments to their settlement records.

None of this is built today, because none of the prerequisites are confirmed.

## 8. What Would Change If Settlement Is Manual (No API)

If InTouch confirms that settlement is manual (e.g., the merchant withdraws via a portal or by calling InTouch support):

1. `ProviderCapabilityRegistry` would mark `AUTOMATIC_SETTLEMENT: NOT_SUPPORTED` and `MERCHANT_INITIATED_SETTLEMENT: NOT_SUPPORTED` (via API).
2. `SettlementRecord` entries would remain `SETTLEMENT_UNKNOWN` until manually reconciled.
3. A manual reconciliation workflow would be needed (admin marks settlements as received based on bank/MoMo statements).
4. The financial truth chain would remain unchanged — it still proves the customer paid; settlement would be tracked separately.

## 9. Recommendation

**Do not proceed to production until S1 and S2 are answered.** The financial truth chain is sound for proving "customer paid," but production requires also proving "merchant received funds." Without settlement confirmation, this second proof is impossible.

The sandbox test (PAY-003 runbook) does not require settlement answers — it tests the forward payment flow only. Settlement questions can be asked in parallel with the sandbox test.
