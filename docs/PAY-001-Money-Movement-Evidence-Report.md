# PAY-001 — Money Movement & Settlement Evidence Report

**Project:** ImboniServe PAY-001
**Architecture Reference:** MPCA-001B
**Date:** 2026-08-13
**Author:** Devin (subagent)
**Status:** Evidence report — not a production settlement claim

---

## 1. Overview

This document reports on money movement and settlement evidence for
ImboniServe **PAY-001**, using the **MPCA-001B** architecture as the
analytical frame.

The purpose of this report is to inventory, classify, and document the
evidence available — from code inspection and (where applicable) sandbox
verification — for each stage of the money-movement lifecycle. It is
**not** a claim that any particular settlement, withdrawal, or fund-flow
behavior is supported in production by the InTouch gateway.

Where evidence is absent, the report says so explicitly. The absence of
an API or a verified behavior in the sandbox is **not** interpreted as
proof that the capability is impossible in production — only that it is
not evidenced here.

---

## 2. MPCA-001B Architecture Context

The MPCA-001B architecture distinguishes the following stages of the
money-movement lifecycle:

```
PAYMENT → FUNDS AVAILABILITY → SETTLEMENT → WITHDRAWAL → RECONCILIATION
```

Each stage is treated as a distinct concern with its own evidence
requirements. A verified code path at the PAYMENT stage does **not**
constitute evidence at the SETTLEMENT or WITHDRAWAL stages.

This report inspects each stage against the InTouch integration code and
classifies the available evidence accordingly (see Section 5).

---

## 3. Settlement Intelligence Integration

From code inspection of `PaymentCompletionService.onPaymentSuccess`
(line 335–378):

- After a successful payment, `SettlementIntelligenceService.onPaymentSuccess()`
  is called.
- This call is **non-blocking**: errors are caught and logged, and do
  **not** affect the payment truth chain. The payment truth chain
  remains the authoritative record of payment state.
- The call records the following fields:
  - `paymentTransactionId`
  - `businessId`
  - `gateway`
  - `amountCents`
  - `currency`
  - `providerFeeCents`
  - `platformFeeCents`
  - `netAmountCents`
- For **CASH** sales: the service records the entry with an empty
  `transactionId` and `gateway='CASH'`.

### Settlement Intelligence behavior (per MPCA-001B)

- Creates a `SettlementRecord` with status:
  - `SETTLEMENT_UNKNOWN` — if the provider does not expose settlement
    information.
  - `SETTLEMENT_PENDING` — if the provider does expose settlement
    information.
- The settlement record sits **alongside** the payment truth chain. It
  does **not** modify the payment truth chain.
- Any errors raised by the settlement intelligence layer are
  **non-blocking** with respect to payment confirmation.

This design ensures that settlement observability can be added,
refined, or repaired without compromising the integrity of the payment
truth chain.

---

## 4. InTouch API Capabilities Inspected

The following capabilities were inspected against the InTouch
integration code. Each is classified by the strongest evidence
available.

### 4.1 MERCHANT BALANCE

- `InTouchService.getBalance()` exists (line 182–216).
- Issues a `POST` to the `/getbalance/` endpoint.
- Returns: `{ responsecode, responsemsg, balance }`.
- **EVIDENCE:** DOCUMENTED (code exists) but **NOT SANDBOX-VERIFIED**
  (not tested against the live API in this engagement).

### 4.2 PAYMENT STATUS QUERY

- `InTouchService.getPaymentStatus()` exists (line 221–257).
- Issues a `POST` to the `/paymentstatus/` endpoint.
- Returns: `{ responsecode, responsemsg, transactionid, requesttransactionid }`.
- **EVIDENCE:** DOCUMENTED (code exists; used by the status polling
  API).

### 4.3 DEPOSIT / PAYOUT

- `InTouchService.requestDeposit()` exists (line 131–177).
- Issues a `POST` to the `/requestdeposit/` endpoint.
- Used for refunds or payouts to customer accounts.
- **EVIDENCE:** DOCUMENTED (code exists) but **NOT SANDBOX-VERIFIED**.

### 4.4 SETTLEMENT REPORT

- No settlement report API found in the InTouch integration code.
- **EVIDENCE:** UNKNOWN.

### 4.5 WITHDRAWAL

- No withdrawal API found in the InTouch integration code.
- The `/requestdeposit/` endpoint may serve this purpose, but this is
  **not confirmed**.
- **EVIDENCE:** UNKNOWN.

### 4.6 SETTLEMENT STATUS

- `SettlementIntelligenceService` records `SETTLEMENT_UNKNOWN` for
  InTouch.
- **EVIDENCE:** UNVERIFIED.

### 4.7 FUNDS AVAILABILITY

- No funds availability API found.
- **EVIDENCE:** UNKNOWN.

### 4.8 DISBURSEMENT

- No disbursement API found.
- **EVIDENCE:** UNKNOWN.

---

## 5. Evidence Classification Table

The table below summarizes the evidence classification for each
capability. Classifications, in descending order of strength:

- **SANDBOX-VERIFIED** — exercised against the sandbox and observed.
- **DOCUMENTED** — code exists; not exercised against the sandbox.
- **UNVERIFIED** — referenced in code or architecture but not
  confirmed.
- **UNKNOWN** — no evidence found in code or sandbox.
- **NOT SUPPORTED** — affirmatively absent (e.g., not present in a
  webhook payload that would be expected to carry it).

| Capability | Evidence | Classification |
|-----------|----------|---------------|
| Payment initiation | Code + tests | SANDBOX-VERIFIED (code path) |
| Payment status query | Code exists | DOCUMENTED |
| Merchant balance | Code exists | DOCUMENTED |
| Deposit/payout | Code exists | DOCUMENTED |
| Settlement report | Not found | UNKNOWN |
| Withdrawal | Not found | UNKNOWN |
| Settlement status | Not found | UNKNOWN |
| Funds availability | Not found | UNKNOWN |
| Disbursement | Not found | UNKNOWN |
| Settlement reference | Not found | UNKNOWN |
| Withdrawal reference | Not found | UNKNOWN |
| Transaction fee in callback | Not in webhook payload | NOT SUPPORTED (in webhook) |
| Split settlement | Not found | UNKNOWN |

---

## 6. Money Movement Questions (Unanswered)

The following questions about money movement and settlement remain
**unanswered** by the evidence gathered in this report. They are
recorded here so that future work can target them explicitly.

1. **Funds availability** — Does InTouch expose an API to query when
   collected funds become available to the merchant? No such API was
   found in the integration code.
2. **Settlement report** — Does InTouch provide a settlement report
   (per-batch, per-day, or per-transaction) that can be reconciled
   against the payment truth chain? No such API was found.
3. **Settlement status** — Can the settlement status of a specific
   payment be queried, or is it permanently `SETTLEMENT_UNKNOWN` for
   InTouch?
4. **Withdrawal** — Is there a dedicated withdrawal API, or is
   `/requestdeposit/` the intended mechanism for moving funds out of
   the merchant balance?
5. **Disbursement** — Is there a disbursement API distinct from
   deposit/payout? No such API was found.
6. **Settlement reference** — Does InTouch return a settlement
   reference (batch ID, settlement ID) that can be stored on the
   `SettlementRecord`? No such reference was observed.
7. **Withdrawal reference** — Does InTouch return a withdrawal
   reference that can be stored and reconciled? No such reference was
   observed.
8. **Transaction fee in callback** — The webhook payload does not
   appear to carry the provider transaction fee. Fees are currently
   recorded from the payment-initiation response, not the callback.
   Confirm whether the callback ever carries fee data.
9. **Split settlement** — Is split settlement (e.g., platform fee
   retained at the gateway) supported? No evidence found.

These questions are **not** blockers for PAY-001. They are gaps in
settlement observability, not gaps in payment correctness. The payment
truth chain remains intact regardless of how these questions are
resolved.

---

## 7. Sandbox Limitations

The sandbox environment may not expose all of the capabilities listed
above. This is **acceptable**. Specifically:

- Capabilities classified as **DOCUMENTED** have code paths but were
  not exercised against the sandbox in this engagement.
- Capabilities classified as **UNKNOWN** may exist in production but
  are not evidenced in code or sandbox behavior.
- The absence of a capability in the sandbox is **not** proof of its
  absence in production.

**IMPORTANT:** Do not convert sandbox behavior into a production claim.
A capability that works in the sandbox is not guaranteed to behave
identically in production, and a capability absent from the sandbox is
not guaranteed to be absent in production. Production settlement
behavior must be confirmed with the provider directly, ideally with
written documentation, before any production claim is made.

This report records what is evidenced; it does not speculate beyond the
evidence.

---

## 8. Certification

I certify that this report was produced by code inspection of the
ImboniServe PAY-001 codebase and, where stated, by reference to the
MPCA-001B architecture. It does **not** constitute a production
settlement claim. Every classification above reflects the strongest
evidence available at the time of writing (2026-08-13) and may be
revised as new evidence (sandbox tests, provider documentation, or
production observation) becomes available.

- **Report date:** 2026-08-13
- **Architecture reference:** MPCA-001B
- **Scope:** PAY-001 money movement and settlement evidence
- **Method:** Code inspection + architecture reference
- **Production claim made:** None
