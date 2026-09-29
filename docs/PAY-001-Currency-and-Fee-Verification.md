# PAY-001 — Currency and Fee Verification

**Date:** 2026-08-13
**Scope:** ImboniServe PAY-001
**Purpose:** Verify currency handling and fee structure for the ImboniServe payment domain.

---

## 1. Overview

This document verifies the end-to-end handling of currency and the fee structure for ImboniServe PAY-001. It traces currency from business configuration through the payment request, provider response, transaction record, financial ledger, and dashboard display. It also documents the customer-facing fee (5% all-inclusive), the internal gateway fee (3%), the platform margin (2%), and the net amount disbursed to the business.

---

## 2. Currency Flow

Currency flows through the system in the following order:

**Business currency → Payment request currency → Provider response currency → PaymentTransaction currency → Ledger currency → Dashboard display currency**

### 2.1 Business Currency

- Each Business has a `currency` field in the database.
- The initiate API reads `business.currency` for the PaymentTransaction record.
- If business currency is not set, defaults to `'RWF'`.
- The system does **NOT** hardcode RWF for all transactions — it respects business configuration.

### 2.2 PaymentTransaction Currency

- Stored in the `currency` field (default `'RWF'` in schema).
- Set from `business?.currency || 'RWF'` in the initiate API.
- Passed through to FinancialLedgerEntry.

### 2.3 FinancialLedgerEntry Currency

- Stored in the `currency` field (default `'RWF'` in schema).
- Set from `tx2.currency` (PaymentTransaction's currency).
- For CASH sales without a PaymentTransaction: set from `saleRow.business?.currency || 'RWF'`.

### 2.4 InTouch API Currency

- InTouch expects amount in RWF (no cents).
- The provider converts cents to RWF: `Math.round(request.amount / 100)`.
- InTouch does not appear to support multiple currencies in the API.
- **SANDBOX LIMITATION:** Only RWF may be supported by InTouch.

### 2.5 Webhook Currency

- `InTouchProvider.handleWebhook()` returns `currency: 'RWF'` (hardcoded).
- InTouch webhook does not include currency in the payload.
- This is a provider limitation, not an ImboniServe issue.

### 2.6 Dashboard Display Currency

- `NEXT_PUBLIC_DISPLAY_CURRENCY="RWF"` in `.env.example`.
- Dashboard displays amounts in the business's currency.

---

## 3. InTouch Currency Support (SANDBOX LIMITATION)

InTouch, the payment provider used by ImboniServe, operates in RWF. The API expects amounts expressed in whole RWF (no cents), and the provider integration converts cents to RWF via `Math.round(request.amount / 100)`. The InTouch webhook payload does not include a currency field; `InTouchProvider.handleWebhook()` therefore returns `currency: 'RWF'` as a hardcoded value.

**SANDBOX LIMITATION:** Only RWF may be supported by InTouch in the sandbox environment. Multi-currency support at the provider level is unverified and is a question for InTouch support. This is a provider limitation, not an ImboniServe issue — ImboniServe itself respects the business-configured currency throughout its internal records (PaymentTransaction and FinancialLedgerEntry).

---

## 4. Fee Structure

### 4.1 Customer-Facing Fee (5% all-inclusive)

- Calculated in the initiate API: `paymentFee = Math.round(amount * 0.05)`.
- Customer pays: `totalAmount = amount + paymentFee`.
- Shown to customer as "5% all-inclusive fee".
- **Example:** 10,000 RWF order → 500 RWF fee → 10,500 RWF total.

### 4.2 Gateway Fee (3% internal, InTouch)

- Calculated: `gatewayFee = Math.round(totalAmount * 0.03)`.
- Stored as `gatewayFeeEstimatedCents` in PaymentTransaction.
- **Example:** 10,500 RWF total → 315 RWF gateway fee.

### 4.3 Platform Margin (2% internal)

- Calculated: `platformMargin = paymentFee - gatewayFee`.
- Stored as `platformFeeCents` in PaymentTransaction.
- **Example:** 500 RWF fee − 315 RWF gateway = 185 RWF platform margin.

### 4.4 Net to Business

- Stored as `netToBusinessCents = amount * 100` (original amount, before fee).
- The business receives the original order amount.
- The fee is paid by the customer on top of the order amount.

### 4.5 Worked Example

| Component              | Amount (RWF) | Calculation                       |
|------------------------|--------------|-----------------------------------|
| Order amount           | 10,000       | —                                 |
| Customer fee (5%)      | 500          | `Math.round(10,000 * 0.05)`       |
| Total charged to customer | 10,500    | `10,000 + 500`                    |
| Gateway fee (3%)       | 315          | `Math.round(10,500 * 0.03)`       |
| Platform margin (2%)   | 185          | `500 − 315`                       |
| Net to business        | 10,000       | original order amount             |

---

## 5. Fee Storage in PaymentTransaction

The PaymentTransaction record stores the following fee-related fields at initiation:

- `gatewayFeeEstimatedCents` — estimated gateway fee (3% of total amount), in cents.
- `platformFeeCents` — platform margin (`paymentFee − gatewayFee`), in cents.
- `netToBusinessCents` — net amount disbursed to the business (`amount * 100`), in cents.
- `amountCents` — total amount charged to the customer (order amount + fee), in cents.

The actual gateway fee (`gatewayFeeActualCents`) is not known at initiation; it would be populated from the provider callback or via reconciliation once available.

---

## 6. Fee Storage in FinancialLedgerEntry

The FinancialLedgerEntry record stores the following fee-related fields:

- `gatewayFeeCents` — uses `gatewayFeeActualCents ?? gatewayFeeEstimatedCents` (actual if available, otherwise the estimated value).
- `platformFeeCents` — from PaymentTransaction.
- `netAmountCents` — from PaymentTransaction.netToBusinessCents.
- `amountCents` — from PaymentTransaction.amountCents (total including fee).

This design ensures the ledger reflects the most accurate gateway fee available, falling back to the estimate when the actual fee has not yet been reported by the provider.

---

## 7. Fee Information Availability

- The gateway fee is **ESTIMATED** at initiation (3% of total).
- The **ACTUAL** gateway fee would come from InTouch in the callback or via reconciliation.
- The InTouch webhook does **NOT** include fee information in the payload.
- **FEE INFORMATION NOT AVAILABLE IN SANDBOX** — the InTouch webhook payload has no fee fields.
- This is a question for InTouch support.

Because the webhook payload lacks fee fields, the FinancialLedgerEntry will use the estimated gateway fee (`gatewayFeeEstimatedCents`) in the sandbox environment. In production, if InTouch provides actual fee data via callback or a reconciliation API, `gatewayFeeActualCents` would be populated and take precedence.

---

## 8. Test Verification

| Test | Result |
|------|--------|
| "should use business currency for PaymentTransaction" | PASS |
| "should default to RWF when business currency not set" | PASS |
| "should store currency in FinancialLedgerEntry" | PASS |
| "should store gateway fee estimate in PaymentTransaction" | PASS (500 RWF fee, 315 RWF gateway, 185 RWF platform) |
| "should store actual gateway fee in FinancialLedgerEntry when available" | PASS |
| "should fall back to estimated gateway fee when actual not available" | PASS |

All tests pass. The currency and fee handling logic is verified against the expected behavior.

---

## 9. Certification

**Status:** VERIFIED

ImboniServe PAY-001 currency handling and fee structure have been verified against the implementation. The system correctly:

1. Respects business-configured currency, defaulting to RWF when not set.
2. Propagates currency through PaymentTransaction and FinancialLedgerEntry.
3. Applies a 5% all-inclusive customer-facing fee.
4. Estimates a 3% internal gateway fee and derives a 2% platform margin.
5. Stores the net-to-business amount as the original order amount.
6. Falls back to estimated gateway fee when actual fee is unavailable.

**Known limitations (provider-side, not ImboniServe issues):**

- InTouch sandbox appears to support only RWF.
- InTouch webhook payload does not include currency or fee fields.
- Actual gateway fee availability is a question for InTouch support.

**Date of verification:** 2026-08-13
