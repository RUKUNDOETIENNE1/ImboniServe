# FOUNDER-GPV-001 — Payment and Tap & Leave Journey

| Field | Value |
|---|---|
| Document ID | FOUNDER-GPV-001-PAYMENT-TAP-LEAVE |
| Date | 2026-08-14 |
| Source | `src/pages/api/checkout/tap-and-leave.ts`, `src/lib/services/dining-session-slip.service.ts`, `src/lib/services/smart-dining-slip.service.ts`, `src/pages/order/checkout.tsx`, `src/components/TapAndLeaveButton.tsx` |

## Overview

This document maps the complete payment journey including Tap & Leave, Smart Dining Slip, and the InTouch sandbox integration. It includes the current certification status (YELLOW) and known defects.

## Payment Journey: Complete Flow

```
GUEST CHECKOUT
     │
     ▼
/order/checkout?sessionId=...
     │
     ├── LiveOrderSummary (running bill from DiningSessionSlip)
     ├── Phone input (Mobile Money number)
     ├── Fee display (DIGITAL_PAYMENT_FEE %)
     │
     ▼
TAP & LEAVE BUTTON
     │
     ▼
POST /api/checkout/tap-and-leave
     │
     ├── STEP 1: Fetch Smart Dining Slip (live ledger)
     ├── STEP 2: Initiate Checkout (freeze state: active → checkout_initiated)
     ├── STEP 3: Finalize Bill (lock amount: checkout_initiated → bill_finalized)
     ├── STEP 4: Trigger Payment via InTouch
     │    ├── Calculate fee (DIGITAL_PAYMENT_FEE %)
     │    ├── Calculate tip (optional)
     │    ├── Convert to RWF if business currency != RWF
     │    ├── Create PaymentTransaction (PENDING)
     │    ├── Mark payment triggered in slip
     │    ├── Request payment from InTouch API
     │    └── Update PaymentTransaction with response
     │
     ├── IF SUCCESS: Return success, await webhook
     ├── IF PENDING: Return pending, await USSD approval + webhook
     └── IF FAILED: Mark payment failed, return error
          │
          ▼
     USSD PROMPT ON PHONE (*182# for MTN)
          │
          ▼
     POST /api/webhooks/intouch (callback)
          │
          ├── Basic Auth validation (INTOUCH_WEBHOOK_USERNAME/PASSWORD)
          ├── Idempotency check
          ├── PaymentCompletionService.processCallback()
          │    ├── Update PaymentTransaction → SUCCESS
          │    ├── Update Sale → COMPLETED
          │    ├── Create FinancialLedgerEntry (PAYMENT_SUCCESS)
          │    ├── Update DiningSessionSlip → checkout_completed
          │    └── Generate Smart Dining Slip (final receipt)
          │
          ▼
     REDIRECT TO /order/receipt?sessionId=...
     │
     ⚠️ MISSING PAGE (FGPV-D001) → 404
```

## Tap & Leave Assessment

### 1. Does the code exist?
**YES** — `src/pages/api/checkout/tap-and-leave.ts` (287 lines), `src/components/TapAndLeaveButton.tsx` (13KB)

### 2. What user-facing UI exists?
- `/order/checkout` page with LiveOrderSummary, phone input, fee display, TapAndLeaveButton
- TapAndLeaveButton component with loading states, success/error callbacks

### 3. What data model supports it?
- `DiningSessionSlip` — live ledger during dining
- `SmartDiningSlip` — final receipt after payment
- `PaymentTransaction` — payment record
- `FinancialLedgerEntry` — financial truth entry
- `TableSession` — dining session

### 4. Does it use Smart Dining Slip?
**YES** — Tap & Leave fetches the DiningSessionSlip (live ledger), freezes it, finalizes the bill, then triggers payment. After payment success, SmartDiningSlipService.generateSlip() creates the final receipt.

### 5. Does it connect to payment?
**YES** — Uses InTouchService.requestPayment() to initiate Mobile Money payment. Creates PaymentTransaction with PENDING status, updates on callback.

### 6. Does it close the dining session?
**PARTIALLY** — Payment completion updates slip status to `checkout_completed`. Session close API exists at `/api/session/close`. However, the redirect to `/order/receipt` fails (missing page).

### 7. Does it affect table availability?
**NOT DIRECTLY IN THE CHECKOUT FLOW** — Table status is managed separately. Session close should release the table, but this depends on the session close API being called.

### 8. Does it generate a receipt?
**YES (data)** — SmartDiningSlipService.generateSlip() creates the receipt data model with line items, costs, margins, VAT, referral links. SlipPDFGeneratorService can generate PDF.
**NO (UI)** — The `/order/receipt` page does not exist, so the guest cannot view the receipt after payment.

### 9. Does it preserve financial truth?
**YES** — PaymentCompletionService creates FinancialLedgerEntry on PAYMENT_SUCCESS. Sale = PaymentTransaction = FinancialLedgerEntry chain is preserved.

### 10. Can it be included in founder-led GPV now?
**PARTIALLY** — The payment initiation and backend processing work, but the guest cannot see the receipt due to FGPV-D001. The founder can verify:
- Checkout page loads correctly
- Live order summary displays running bill
- Tap & Leave button triggers payment
- Payment appears in dashboard transactions
- Financial ledger entry is created
- Sale status updates to COMPLETED

**CANNOT verify**:
- Guest sees a receipt after payment (404 error)

### 11. What is missing?
- **`/order/receipt` page** — Must be created to complete the guest experience
- **Table release on session close** — Should be verified that closing the session releases the table

## Smart Dining Slip Assessment

### 1. Does the code exist?
**YES** — Two services:
- `src/lib/services/dining-session-slip.service.ts` (609 lines) — LIVE LEDGER
- `src/lib/services/smart-dining-slip.service.ts` (401 lines) — FINAL RECEIPT

### 2. Current implementation status
**IMPLEMENTED** — Both services are fully implemented with:
- Slip creation on QR scan
- Order items added to slip with running totals
- VAT calculation (INCLUSIVE/EXCLUSIVE modes)
- Checkout flow (active → checkout_initiated → bill_finalized → payment_triggered → checkout_completed)
- Final receipt generation with cost/margin analysis
- PDF generation capability
- Referral link generation

### 3. Data model
- `DiningSessionSlip` — sessionId, businessId, tableId, status, runningSubtotalCents, runningVatCents, runningTotalCents, finalBillCents, taxMode, taxRate
- `SmartDiningSlip` — saleId, slipNumber, businessName, subtotalCents, vatCents, grandTotalCents, lineItems, clientPhone, referralLinkId
- `SlipLineItem` — itemName, quantity, unitPriceCents, totalPriceCents, costCents, marginCents, marginPercent, costSource

### 4. Relationship to order/sale
- DiningSessionSlip is linked to a TableSession (dining session)
- Multiple Sales (orders) can be added to one DiningSessionSlip
- SmartDiningSlip is generated from a Sale after payment completion
- One SmartDiningSlip per Sale (enforced by unique saleId)

### 5. Running bill behavior
- Each order adds items to the slip
- Running subtotal, VAT, and total are recalculated on each addition
- Tax mode (INCLUSIVE/EXCLUSIVE) determines VAT calculation
- Bill is frozen at checkout (status → checkout_initiated)

### 6. Multiple-order behavior
- Multiple orders (Sales) can be added to one DiningSessionSlip
- All items accumulate in the slip
- Running total reflects all orders
- One payment covers the entire session

### 7. Tax/fee display
- VAT calculated based on business taxMode and taxRate
- Payment fee (DIGITAL_PAYMENT_FEE %) added at checkout
- Optional tip
- Total = finalBillCents + paymentFee + tipCents

### 8. Payment readiness
- canCheckout = slip.status === 'active' && slip.runningTotalCents > 0
- Checkout requires phone number validation
- Phone must match Rwandan format (078/079/072/073)

### 9. Session closure
- Payment success → slip.status → checkout_completed
- Session close API: POST `/api/session/close`
- Table should be released on session close

## Payment Configuration Prerequisites

| Config | Current State | Required For |
|---|---|---|
| `PAYMENTS_PROVIDER` | ⚠️ "irembo" (should be "intouch") | Payment routing |
| `INTOUCH_API_URL` | ✅ Configured | InTouch API endpoint |
| `INTOUCH_USERNAME` | ✅ "testa" (sandbox) | InTouch authentication |
| `INTOUCH_ACCOUNT_NO` | ✅ "123456" | InTouch account |
| `INTOUCH_PASSWORD` | ✅ Configured | InTouch partner password |
| `INTOUCH_WEBHOOK_USERNAME` | ❌ MISSING | Webhook Basic Auth |
| `INTOUCH_WEBHOOK_PASSWORD` | ❌ MISSING | Webhook Basic Auth |
| `INTOUCH_CALLBACK_URL` | ❌ MISSING | Webhook URL for callbacks |
| `NEXTAUTH_URL` | ✅ "http://localhost:3000" | Callback URL base |
| Webhook tunnel | ❌ REQUIRED | InTouch → localhost webhook |

## Payment Failure Branch

| Scenario | Expected Behavior |
|---|---|
| Payment FAILED | PaymentTransaction → FAILED, DiningSessionSlip → payment_failed, no FinancialLedgerEntry, Sale remains PENDING |
| Payment PENDING | PaymentTransaction → PENDING, await USSD approval + webhook, slip → payment_triggered |
| Payment CANCELLED | Same as FAILED — no ledger entry, sale remains PENDING |
| Duplicate webhook | Idempotency check prevents double processing |
| Amount mismatch | Webhook handler validates amount against PaymentTransaction |
| Webhook auth failure | 401 Unauthorized if INTOUCH_WEBHOOK_USERNAME/PASSWORD missing or wrong |

## Dev Simulate Mode

In non-production environment, Tap & Leave supports a simulate mode:
- Query param `?simulate=1` or body `{ simulate: true }`
- Bypasses InTouch API call
- Returns pending status immediately
- Useful for testing checkout flow without real payment

## Customer #1 Relevance

**CRITICAL** — Payment is the core monetization path. Without working payment:
- No revenue can be collected
- Financial truth chain cannot be verified
- Close-day Z-Report will show zero revenue
- Executive dashboards will show no data

The payment journey MUST work end-to-end before Customer #1 activation.
