# PAY-001 — Founder Sandbox Payment Runbook

**Date:** 2026-08-13
**Owner:** Founder
**Purpose:** Hands-on sandbox payment testing for ImboniServe PAY-001, verifying the full payment lifecycle from customer checkout through financial reconciliation.

> ⚠️ **Confidentiality:** This document contains NO secrets, credentials, or passwords. Never paste real credential values into this runbook. Always reference `.env` variables by name only.

---

## 1. Overview

This runbook guides the founder through an end-to-end sandbox payment test against a locally running ImboniServe instance using the InTouch Mobile Money integration. The goal is to verify that a single real sandbox payment flows correctly through every layer of the financial truth chain:

1. Customer places an order and pays via Mobile Money (MTN or Airtel).
2. InTouch sends a webhook callback confirming the payment.
3. The Sale is marked `COMPLETED`.
4. A `PaymentTransaction` with status `SUCCESS` is recorded.
5. A `FinancialLedgerEntry` with `eventType = PAYMENT_SUCCESS` and `domain = SALES` is created.
6. Dashboard revenue, Z-Report (Close-Day), and Executive views all reflect the payment.
7. All figures reconcile with **VARIANCE = 0**.

Optional failure and duplicate-callback tests verify that failed payments do not create revenue and that idempotency holds.

---

## 2. Prerequisites

Before starting, confirm ALL of the following are true.

### 2.1 Environment & Server

- [ ] ImboniServe is running locally via `npm run dev` on **http://localhost:3000**.
- [ ] The dev server starts without errors in the terminal.

### 2.2 InTouch API Credentials (in `.env`)

- [ ] `INTOUCH_USERNAME` is set.
- [ ] `INTOUCH_ACCOUNT_NO` is set.
- [ ] `INTOUCH_PASSWORD` is set.

### 2.3 FOUNDER-ACTION-REQUIRED: Webhook Credentials

> 🔧 **The founder MUST set these before starting the server.** If these are missing, webhook callbacks from InTouch will fail authentication and the payment will never be marked as paid.

- [ ] `INTOUCH_WEBHOOK_USERNAME` is set in `.env`.
- [ ] `INTOUCH_WEBHOOK_PASSWORD` is set in `.env`.

### 2.4 Test Data

- [ ] A test business exists with:
  - [ ] At least one menu item with a price.
  - [ ] At least one table.
  - [ ] At least one QR code generated for a table.
- [ ] A test phone number is registered for Mobile Money (MTN or Airtel) and has sufficient balance for sandbox testing.

### 2.5 Founder Access

- [ ] The founder has login credentials for a **Business Owner** account.
- [ ] The founder has physical access to the test phone (to approve USSD prompts).

### 2.6 Pre-Flight Checklist

- [ ] All checkboxes above are ticked.
- [ ] A notepad or text file is open to record exact error messages, payment IDs, and amounts during the run.
- [ ] Database access (e.g., Prisma Studio, psql, or a DB GUI) is available for Steps 14 and 18.

---

## 3. Steps

### STEP 1: Login as Business Owner

- **URL:** http://localhost:3000/login
- **Action:** Enter Business Owner credentials and submit.

**EXPECTED:** The dashboard opens at `/dashboard`.

**IF PASS:** Continue to Step 2.

**IF FAIL:** STOP. Record the exact error. Check that:
- The dev server is running (`npm run dev`).
- The credentials are correct for a Business Owner account (not a customer or staff account).
- There are no console errors on the login page.

---

### STEP 2: Open Settings → Payments

- **URL:** http://localhost:3000/dashboard/payment-settings
- **Action:** Navigate to the payment settings page.

**EXPECTED:** InTouch payment configuration is visible. Fields for **username**, **account number**, and **callback URL** are present.

**IF PASS:** Continue to Step 3.

**IF FAIL:** STOP and diagnose. Check that:
- The `payment-settings` page compiles without errors.
- The InTouch integration module is enabled.
- No TypeScript or runtime errors appear in the terminal or browser console.

---

### STEP 3: Verify InTouch Configuration

- **Action:** Check that the InTouch credentials shown on the page match what is configured in `.env`.
- **Note:** The password should be **masked** (never displayed in plain text).

**EXPECTED:** Username and account number are populated. Password is masked/hidden.

**IF PASS:** Continue to Step 4.

**IF FAIL:** STOP. Verify that `.env` has `INTOUCH_USERNAME` and `INTOUCH_ACCOUNT_NO` set. Restart the dev server after editing `.env`.

---

### STEP 4: Open Menu Management

- **URL:** http://localhost:3000/dashboard/menu
- **Action:** Navigate to the menu management page.

**EXPECTED:** Menu items are visible, each with a price.

**IF PASS:** Continue to Step 5.

**IF FAIL:** STOP. Create at least one menu item with a price before continuing. Confirm the menu is published/active.

---

### STEP 5: Open Table Management

- **URL:** http://localhost:3000/dashboard/tables
- **Action:** Navigate to the table management page.

**EXPECTED:** At least one table is visible.

**IF PASS:** Continue to Step 6.

**IF FAIL:** STOP. Create at least one table before continuing.

---

### STEP 6: Generate QR Code for Table

- **URL:** http://localhost:3000/dashboard/qr-builder
- **Action:** Generate a QR code for the table created in Step 5.

**EXPECTED:** A QR code can be generated for the selected table and is downloadable/scannable.

**IF PASS:** Continue to Step 7.

**IF FAIL:** STOP. Check the QR builder configuration and that the table is properly linked.

---

### STEP 7: Open Customer Ordering Page

- **URL:** Scan the QR code, or navigate directly to `/order` or `/q/[token]`.
- **Action:** Open the customer-facing ordering page (use a separate browser tab or incognito window, or scan with the test phone).

**EXPECTED:** The menu appears and items can be added to the cart.

**IF PASS:** Continue to Step 8.

**IF FAIL:** STOP. Check that:
- The QR token is valid and not expired.
- The menu is published.
- The ordering page compiles without errors.

---

### STEP 8: Add Items to Cart and Checkout

- **Action:** Add 1–2 items to the cart.
- **Action:** Click **"Checkout"** or **"Pay"**.

**EXPECTED:** The checkout page appears showing the order total and available payment options.

**IF PASS:** Continue to Step 9.

**IF FAIL:** STOP. Check the checkout page for errors (browser console and server terminal). Verify cart state is being passed correctly.

---

### STEP 9: Select Mobile Money Payment

- **Action:** Choose **MTN Mobile Money** or **Airtel Money**.
- **Action:** Enter the test phone number (e.g., `250788XXXXXX`).
- **Action:** Click **"Pay"** or **"Initiate Payment"**.

**EXPECTED:**
- A payment request is sent to InTouch.
- A **pending payment** message appears in the UI.
- The customer receives a **USSD prompt** on the test phone.
- **Record the payment ID** returned (for later status checks).

**IF PASS:** Continue to Step 10.

**IF FAIL:** STOP. Record the exact error message. Check that:
- InTouch credentials are correct (Step 3).
- The phone number is in the correct format (country code prefix, no spaces).
- The InTouch API is reachable from the dev server (check network logs).
- The server terminal shows the outgoing InTouch request.

---

### STEP 10: Approve Payment via USSD

- **Action:** On the test phone, approve the payment:
  - **MTN:** Dial `*182#` and follow the prompts.
  - **Airtel:** Dial `*185#` and follow the prompts.

**EXPECTED:** Payment is approved. A USSD confirmation message appears on the phone.

**IF PASS:** Continue to Step 11.

**IF FAIL:** STOP. Check that:
- The test phone has sufficient Mobile Money balance.
- The correct USSD code is used for the carrier.
- The USSD prompt is still valid (not timed out).

---

### STEP 11: Wait for Webhook Callback

- **Action:** Wait 10–30 seconds for InTouch to send the webhook callback.

**EXPECTED:** Payment status changes to **"Paid"** or **"Completed"** in the UI.

**IF PASS:** Continue to Step 12.

**IF FAIL (payment stays pending):**
1. Use the status polling API to check manually. Navigate to:
   `http://localhost:3000/api/payments/intouch/status/[paymentId]`
   (replace `[paymentId]` with the ID recorded in Step 9).
2. If still pending, wait longer (up to 60 seconds).
3. If the webhook credentials are not set, the webhook will fail — set `INTOUCH_WEBHOOK_USERNAME` and `INTOUCH_WEBHOOK_PASSWORD` in `.env`, restart the server, and re-test from Step 9.
4. Check server logs for webhook authentication failures or signature errors.
5. If the status polling API returns a terminal failure, record the exact response and STOP.

---

### STEP 12: Verify Sale Status

- **URL:** http://localhost:3000/dashboard/sales
- **Action:** Navigate to the sales list.

**EXPECTED:** The order appears with:
- Sale status: **`COMPLETED`**
- Payment status: **`COMPLETED`**

**IF PASS:** Continue to Step 13.

**IF FAIL:** STOP. Check server logs for `PaymentCompletionService` errors. Verify the webhook handler correctly triggers sale completion.

---

### STEP 13: Verify Payment Transaction

- **URL:** http://localhost:3000/dashboard/transactions
- **Action:** Navigate to the transactions list.

**EXPECTED:** A `PaymentTransaction` record appears with:
- Status: **`SUCCESS`**
- Amount: matches the order total from Step 8.

**IF PASS:** Continue to Step 14.

**IF FAIL:** STOP. Check the database directly for a `PaymentTransaction` record. If none exists, the webhook handler did not persist the transaction — investigate server logs.

---

### STEP 14: Verify Financial Ledger Entry

- **Action:** Check the database (via Prisma Studio, psql, or DB GUI) for a `FinancialLedgerEntry` with `eventType = PAYMENT_SUCCESS`.
- **Action:** Confirm the amount matches the `PaymentTransaction` amount.

**EXPECTED:**
- Exactly **one** `FinancialLedgerEntry` exists for this payment.
- `eventType` = `PAYMENT_SUCCESS`.
- `domain` = `SALES`.
- Amount matches the `PaymentTransaction` amount.

**IF PASS:** Continue to Step 15.

**IF FAIL:** STOP. This indicates a **financial truth chain break**. Do not continue. Investigate:
- Whether the `PaymentCompletionService` emits a ledger event.
- Whether a ledger event was created but with the wrong amount or domain.
- Server logs for ledger creation errors.

---

### STEP 15: Verify Dashboard Revenue

- **URL:** http://localhost:3000/dashboard
- **Action:** Navigate to the main dashboard.

**EXPECTED:** Today's revenue figure **includes** the payment amount.

**IF PASS:** Continue to Step 16.

**IF FAIL:** STOP. Check the dashboard revenue query — it must filter by `status = COMPLETED`. Verify the query is not excluding the sale or double-counting.

---

### STEP 16: Verify Close-Day (Z-Report)

- **URL:** Navigate to the Close-Day or Z-Report page.
- **Action:** Open today's Z-Report.

**EXPECTED:** The payment appears in today's Z-Report with the correct amount.

**IF PASS:** Continue to Step 17.

**IF FAIL:** STOP. Check the Z-Report query — it must source from `FinancialLedgerEntry`, not from raw sales. Verify the ledger entry from Step 14 is included in the report's date range.

---

### STEP 17: Verify Executive Views

- **URL:** http://localhost:3000/admin/executive/ceo (or `/admin/executive/cfo`)
- **Action:** Navigate to the executive dashboard.

**EXPECTED:** Revenue figures include the payment amount.

**IF PASS:** Continue to Step 18.

**IF FAIL:** STOP. Check executive dashboard queries for incorrect filters, wrong date ranges, or aggregation errors.

---

### STEP 18: Financial Reconciliation

- **Action:** Compare all figures recorded during the run:

| Source | Amount |
|---|---|
| Sale total (Step 8 order total) | _________ |
| PaymentTransaction amount (Step 13) | _________ |
| FinancialLedgerEntry amount (Step 14) | _________ |
| Dashboard revenue (Step 15) | _________ |
| Z-Report revenue (Step 16) | _________ |
| Executive revenue (Step 17) | _________ |

**EXPECTED:** **VARIANCE = 0** — all six figures match exactly.

**IF PASS:** Payment lifecycle verified. Continue to the optional Failure Test (Section 4) and Duplicate Callback Test (Section 5).

**IF FAIL:** STOP. A variance means the financial truth chain is broken. Document the exact discrepancy (which sources differ and by how much). Do not certify PAY-001 until resolved.

---

## 4. Failure Test (Optional)

### STEP F1: Initiate a Payment with Insufficient Funds

- **Action:** Use a phone number with **no Mobile Money balance** (or an invalid/empty wallet).
- **Action:** Repeat Steps 7–9 to place an order and initiate payment.
- **Action:** Attempt to approve via USSD (it should fail or be rejected).

**EXPECTED:**
- Payment fails.
- Sale status becomes **`FAILED`**.
- **No revenue is recognized** (no `FinancialLedgerEntry` with `PAYMENT_SUCCESS` is created).
- Dashboard and Z-Report revenue do **not** increase.

**IF PASS:** Failure handling verified. Continue to the Duplicate Callback Test (Section 5).

**IF FAIL:** STOP. Failed payments must **not** create revenue. Investigate:
- Whether the webhook handler correctly distinguishes failed callbacks.
- Whether a `PaymentTransaction` with status `FAILED` was created without a ledger entry.
- Whether the sale was correctly transitioned to `FAILED` (not `COMPLETED`).

---

## 5. Duplicate Callback Test (Optional)

### STEP D1: Replay the Same Webhook Callback

- **Action:** Capture the webhook payload from Step 11 (from server logs or InTouch dashboard).
- **Action:** Using `curl` or Postman, replay the **exact same** webhook payload to the webhook endpoint.

**Example (structure only — replace placeholders):**

```bash
curl -X POST http://localhost:3000/api/payments/intouch/webhook \
  -u "$INTOUCH_WEBHOOK_USERNAME:$INTOUCH_WEBHOOK_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '<replay the exact webhook JSON body from Step 11>'
```

**EXPECTED:**
- The endpoint returns an **"Already processed"** response (HTTP 200 with an idempotency message).
- **No duplicate** `FinancialLedgerEntry` is created.
- **No duplicate** sale completion occurs.
- The `PaymentTransaction` count for this payment remains at **1**.

**IF PASS:** Idempotency verified. Proceed to the Post-Test Checklist (Section 6).

**IF FAIL:** STOP. Duplicate callbacks must **not** create duplicate financial effects. Investigate:
- Whether the webhook handler checks for an existing `PaymentTransaction` status before processing.
- Whether idempotency is keyed on the InTouch transaction reference.
- Whether a second `FinancialLedgerEntry` was created (check the database).

---

## 6. Post-Test Checklist

After completing all steps (including optional tests), confirm:

- [ ] All 18 core steps passed with VARIANCE = 0.
- [ ] Failure Test (Step F1) passed — failed payments create no revenue.
- [ ] Duplicate Callback Test (Step D1) passed — idempotency holds.
- [ ] All payment IDs, amounts, and any error messages have been recorded.
- [ ] No secrets or credentials were written into this runbook or any shared document.
- [ ] The `.env` webhook credentials (`INTOUCH_WEBHOOK_USERNAME`, `INTOUCH_WEBHOOK_PASSWORD`) remain set and are not reverted.
- [ ] Server logs from the test session have been saved (for audit trail).

---

## 7. What to Do If Something Fails

1. **STOP immediately** at the failing step. Do not continue to later steps — later verifications depend on earlier ones succeeding.
2. **Record the exact error** — copy the full error message from:
   - The browser console.
   - The server terminal output.
   - The API response body (for API failures).
3. **Identify the layer** where the failure occurred:
   - UI / page compilation → check Next.js build and component code.
   - InTouch API call → check credentials, phone format, and network reachability.
   - Webhook callback → check `INTOUCH_WEBHOOK_USERNAME` / `INTOUCH_WEBHOOK_PASSWORD`, server logs, and InTouch dashboard.
   - `PaymentCompletionService` → check server logs for sale completion logic.
   - `FinancialLedgerEntry` → check ledger service and database constraints.
   - Dashboard / Z-Report / Executive queries → check the specific query filters and aggregations.
4. **Do not hack around the failure.** A failure in this runbook indicates a real defect in the payment or financial truth chain. File an issue with:
   - The step number.
   - The exact error.
   - The relevant server log excerpt.
   - The payment ID and amount.
5. **Re-run from the beginning** after fixing. Do not resume mid-run unless the failure was purely environmental (e.g., server not started).

---

## 8. Certification

Upon successful completion of all core steps (1–18) with **VARIANCE = 0**, and optionally the Failure and Duplicate Callback tests, the founder certifies PAY-001.

| Field | Value |
|---|---|
| Runbook | PAY-001-Founder-Sandbox-Payment-Runbook |
| Date | 2026-08-13 |
| Founder Name | ___________________________ |
| Test Phone Number (last 4 digits only) | ****_______ |
| Payment Amount Tested | ___________________________ |
| VARIANCE | 0 |
| Core Steps (1–18) | ☐ All PASS |
| Failure Test (F1) | ☐ PASS  ☐ SKIP  ☐ FAIL |
| Duplicate Callback Test (D1) | ☐ PASS  ☐ SKIP  ☐ FAIL |
| Certification | ☐ **CERTIFIED** |
| Signature / Initials | ___________________________ |
| Notes | ___________________________ |

---

*End of runbook.*
