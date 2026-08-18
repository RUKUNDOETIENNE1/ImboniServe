# PAY-001 — InTouch Questions and Evidence Register

**Project:** ImboniServe PAY-001
**Provider:** InTouch (intouchpay.co.rw)
**Document Type:** Questions and Evidence Register
**Date:** 2026-08-13

---

## 1. Overview

This register catalogues every open question regarding the InTouch payment integration
for ImboniServe PAY-001. The principle governing this document is simple:
**every unknown must become a question.** No assumption is left implicit; each is
either resolved with evidence or recorded as an open question requiring further
investigation.

Each question is paired with an evidence classification drawn from the controlled
vocabulary defined in Section 2. Where evidence exists, the source (code, documentation,
sandbox observation, production observation, or support confirmation) is noted.
Where evidence does not yet exist, the question is marked `UNKNOWN` and remains an
actionable item for follow-up.

The register is intended to be a living document: as questions are answered through
testing, documentation review, or support engagement, their evidence status is updated
and the resolution recorded.

---

## 2. Evidence Vocabulary

The following controlled vocabulary is used throughout this register to classify the
evidence supporting each answer. No other terms are permitted.

| Classification | Definition |
|---|---|
| **VERIFIED** | Directly demonstrated by an executed test. |
| **DOCUMENTED** | Explicitly stated in authoritative provider documentation. |
| **SUPPORT-CONFIRMED** | Confirmed by InTouch support but not independently demonstrated. |
| **SANDBOX-VERIFIED** | Observed in the sandbox environment. |
| **PRODUCTION-VERIFIED** | Observed in production. |
| **UNVERIFIED** | Potentially true but not established. |
| **UNKNOWN** | Insufficient evidence. |
| **NOT SUPPORTED** | Provider explicitly confirms capability is unavailable. |

---

## 3. Payment Questions

### 3.1 What exactly constitutes payment success?

**Evidence:** `DOCUMENTED`

Response codes `01`, `1110`, and `2001` are mapped to success in the ImboniServe
code. A payment is considered successful when the InTouch response or webhook
callback carries one of these response codes.

### 3.2 What provider status values exist?

**Evidence:** `DOCUMENTED` (partial)

The following status values are mapped in code: `successful`, `successfull`,
`pending`, `failed`, `cancelled`. Any additional status values that InTouch may
return are `UNKNOWN`.

### 3.3 What is the unique provider transaction ID?

**Evidence:** `DOCUMENTED`

The `transactionid` field in the response, together with `requesttransactionid`,
identifies the provider transaction. The `transactionid` is the provider-assigned
unique identifier; `requesttransactionid` is the ImboniServe-assigned identifier
sent in the original request.

### 3.4 Is transaction status queryable?

**Evidence:** `DOCUMENTED`

The `paymentstatus` endpoint exists in the code and is used to query the current
status of a transaction by its `requesttransactionid`.

### 3.5 How long can a payment remain pending?

**Evidence:** `UNKNOWN`

No documentation or test observation establishes the maximum pending duration.
This affects timeout and reconciliation polling strategies.

### 3.6 What is the minimum/maximum transaction amount?

**Evidence:** `DOCUMENTED` (existence) / `UNKNOWN` (values)

Response codes `1103` and `1104` reference amount limits (below minimum and above
maximum respectively), confirming that limits exist. However, the actual numeric
values of the minimum and maximum are `UNKNOWN`.

---

## 4. Webhook Questions

### 4.1 What events are sent?

**Evidence:** `DOCUMENTED`

The webhook payload is a payment status callback containing the following fields:
`requesttransactionid`, `transactionid`, `responsecode`, `status`, `statusdesc`,
`referenceno`. No other event types have been observed or documented.

### 4.2 How are webhooks authenticated?

**Evidence:** `DOCUMENTED`

Webhooks are authenticated via HTTP Basic Auth using `INTOUCH_WEBHOOK_USERNAME`
and `INTOUCH_WEBHOOK_PASSWORD` environment variables. An optional HMAC signature
mechanism is supported via the `x-intouch-signature` header.

### 4.3 Are signatures provided?

**Evidence:** `UNVERIFIED`

The code supports verification of an `x-intouch-signature` header. However,
`InTouchProvider.validateWebhook` always returns `{ valid: true }` regardless of
signature content. It has not been independently demonstrated that InTouch sends
a signature, nor that the signature algorithm matches the implementation.

### 4.4 What retry policy exists?

**Evidence:** `UNKNOWN`

No documentation or observation establishes whether InTouch retries failed webhook
deliveries, nor the conditions under which retries occur.

### 4.5 What is the unique event ID?

**Evidence:** `UNKNOWN`

No event ID field is present in the observed webhook payload. It is unknown
whether InTouch provides a unique identifier per webhook event that could be used
for deduplication at the provider level.

### 4.6 How long are retries performed?

**Evidence:** `UNKNOWN`

Depends on the answer to 4.4. No information is available on retry duration or
total retry count.

### 4.7 Can webhook delivery be duplicated?

**Evidence:** `UNKNOWN`

ImboniServe implements idempotency safeguards (transaction status state machine
prevents duplicate processing). However, whether InTouch itself can deliver the
same webhook event more than once is `UNKNOWN`.

---

## 5. Reconciliation Questions

### 5.1 Can transactions be queried?

**Evidence:** `DOCUMENTED`

The `paymentstatus` endpoint allows querying the status of an individual
transaction by `requesttransactionid`.

### 5.2 Can transaction history be downloaded?

**Evidence:** `UNKNOWN`

No endpoint or documentation for bulk transaction history export has been found.

### 5.3 Is there a merchant balance API?

**Evidence:** `DOCUMENTED`

The `getbalance` endpoint exists in the code and returns the current merchant
balance.

### 5.4 Is there a settlement report?

**Evidence:** `UNKNOWN`

No settlement report endpoint or documentation has been found.

### 5.5 Is there a withdrawal report?

**Evidence:** `UNKNOWN`

No withdrawal report endpoint or documentation has been found.

### 5.6 Can individual payments be reconciled to settlements?

**Evidence:** `UNKNOWN`

Without a settlement report (5.4) or transaction history download (5.2), it is
not known whether individual payments can be traced through to settlement.

---

## 6. Funds Questions

### 6.1 When do funds become available?

**Evidence:** `UNKNOWN`

No information on fund availability timing (e.g., T+0, T+1, T+2) is available.

### 6.2 Is same-day withdrawal supported?

**Evidence:** `UNKNOWN`

### 6.3 Is withdrawal manual or automatic?

**Evidence:** `UNKNOWN`

### 6.4 Can merchants withdraw every day?

**Evidence:** `UNKNOWN`

### 6.5 Are weekends/holidays different?

**Evidence:** `UNKNOWN`

No information on whether fund availability or withdrawal processing differs on
weekends or Rwandan public holidays.

### 6.6 Are there withdrawal fees?

**Evidence:** `UNKNOWN`

### 6.7 Are there minimum/maximum withdrawal limits?

**Evidence:** `UNKNOWN`

### 6.8 What withdrawal destinations are supported?

**Evidence:** `UNKNOWN`

It is not known whether withdrawals can be directed to bank accounts, mobile money
wallets, or other destinations.

---

## 7. Fee Questions

### 7.1 What gateway fee applies?

**Evidence:** `DOCUMENTED` (estimate) / `UNKNOWN` (actual)

A 3% gateway fee is estimated in the code. The actual fee charged by InTouch has
not been confirmed from the sandbox or production environment.

### 7.2 Is the fee included in the API response?

**Evidence:** `NOT SUPPORTED`

The observed webhook payload does not include any fee-related fields. InTouch does
not return gateway fee information in the payment response or callback.

### 7.3 When is the fee deducted?

**Evidence:** `UNKNOWN`

It is not known whether the fee is deducted at transaction time, at settlement,
or at withdrawal.

### 7.4 Can the platform fee be represented separately?

**Evidence:** `DOCUMENTED`

The `platformFeeCents` field is stored separately in `PaymentTransaction` and
corresponding `FinancialLedgerEntry` records, allowing the platform fee to be
tracked independently of the gateway fee.

### 7.5 Is split settlement supported?

**Evidence:** `UNKNOWN`

No information on whether InTouch supports split settlement (routing portions of
a payment to multiple recipients) is available.

---

## 8. Currency Questions

### 8.1 What currencies are supported?

**Evidence:** `UNKNOWN` (inferred: RWF)

The code assumes RWF (Rwandan Francs) throughout. The InTouch API URL uses the
`.co.rw` domain, suggesting Rwanda-only operations and RWF as the sole currency.
This has not been independently confirmed.

### 8.2 Can merchant currency differ from platform currency?

**Evidence:** `UNVERIFIED`

The code does not account for currency differences between merchant and platform.
It is potentially true that all merchants operate in RWF, but this is not
established.

### 8.3 How are currency conversions handled?

**Evidence:** `UNKNOWN`

No currency conversion mechanism has been documented or observed. If only RWF is
supported (per 8.1), conversion may not be applicable.

---

## 9. Production Questions

### 9.1 What changes between sandbox and production?

**Evidence:** `UNKNOWN`

No documentation describes the differences between sandbox and production
environments (e.g., rate limits, feature parity, webhook delivery behavior).

### 9.2 Are production credentials different?

**Evidence:** `UNKNOWN` (likely yes)

Production credentials are expected to differ from sandbox credentials, but this
has not been confirmed.

### 9.3 Are production endpoints different?

**Evidence:** `UNKNOWN` (same URL used in code)

The same base URL is used in code for both sandbox and production. It is unknown
whether InTouch provides separate production endpoints or whether the environment
is selected via credentials.

### 9.4 What merchant onboarding/KYC is required?

**Evidence:** `UNKNOWN`

No information on merchant onboarding requirements, KYC documentation, or
verification timelines is available.

### 9.5 What production webhook configuration is required?

**Evidence:** `UNKNOWN`

It is not known how webhooks are configured in production (e.g., URL registration,
IP allowlisting, retry settings).

### 9.6 What transaction limits apply?

**Evidence:** `UNKNOWN`

Production transaction limits (volume, value, frequency) have not been documented
or observed. Sandbox limits (per 3.6) are also unknown in numeric terms.

---

## 10. Summary: Answered vs Unanswered

### 10.1 Answered (with evidence)

| # | Question | Evidence |
|---|---|---|
| 3.1 | What exactly constitutes payment success? | `DOCUMENTED` |
| 3.2 | What provider status values exist? | `DOCUMENTED` (partial) |
| 3.3 | What is the unique provider transaction ID? | `DOCUMENTED` |
| 3.4 | Is transaction status queryable? | `DOCUMENTED` |
| 3.6 | What is the minimum/maximum transaction amount? | `DOCUMENTED` (existence) / `UNKNOWN` (values) |
| 4.1 | What events are sent? | `DOCUMENTED` |
| 4.2 | How are webhooks authenticated? | `DOCUMENTED` |
| 5.1 | Can transactions be queried? | `DOCUMENTED` |
| 5.3 | Is there a merchant balance API? | `DOCUMENTED` |
| 7.1 | What gateway fee applies? | `DOCUMENTED` (estimate) / `UNKNOWN` (actual) |
| 7.2 | Is the fee included in the API response? | `NOT SUPPORTED` |
| 7.4 | Can the platform fee be represented separately? | `DOCUMENTED` |

### 10.2 Partially Answered (require further evidence)

| # | Question | Evidence | Gap |
|---|---|---|---|
| 3.2 | What provider status values exist? | `DOCUMENTED` (partial) | Additional status values `UNKNOWN` |
| 3.6 | What is the minimum/maximum transaction amount? | `DOCUMENTED` / `UNKNOWN` | Numeric limit values unknown |
| 4.3 | Are signatures provided? | `UNVERIFIED` | Signature sending and algorithm not confirmed |
| 7.1 | What gateway fee applies? | `DOCUMENTED` / `UNKNOWN` | Actual fee not confirmed from sandbox |
| 8.1 | What currencies are supported? | `UNKNOWN` (inferred RWF) | Not independently confirmed |
| 8.2 | Can merchant currency differ from platform currency? | `UNVERIFIED` | Not established |

### 10.3 Unanswered (UNKNOWN)

| # | Question | Evidence |
|---|---|---|
| 3.5 | How long can a payment remain pending? | `UNKNOWN` |
| 4.4 | What retry policy exists? | `UNKNOWN` |
| 4.5 | What is the unique event ID? | `UNKNOWN` |
| 4.6 | How long are retries performed? | `UNKNOWN` |
| 4.7 | Can webhook delivery be duplicated? | `UNKNOWN` |
| 5.2 | Can transaction history be downloaded? | `UNKNOWN` |
| 5.4 | Is there a settlement report? | `UNKNOWN` |
| 5.5 | Is there a withdrawal report? | `UNKNOWN` |
| 5.6 | Can individual payments be reconciled to settlements? | `UNKNOWN` |
| 6.1 | When do funds become available? | `UNKNOWN` |
| 6.2 | Is same-day withdrawal supported? | `UNKNOWN` |
| 6.3 | Is withdrawal manual or automatic? | `UNKNOWN` |
| 6.4 | Can merchants withdraw every day? | `UNKNOWN` |
| 6.5 | Are weekends/holidays different? | `UNKNOWN` |
| 6.6 | Are there withdrawal fees? | `UNKNOWN` |
| 6.7 | Are there minimum/maximum withdrawal limits? | `UNKNOWN` |
| 6.8 | What withdrawal destinations are supported? | `UNKNOWN` |
| 7.3 | When is the fee deducted? | `UNKNOWN` |
| 7.5 | Is split settlement supported? | `UNKNOWN` |
| 8.3 | How are currency conversions handled? | `UNKNOWN` |
| 9.1 | What changes between sandbox and production? | `UNKNOWN` |
| 9.2 | Are production credentials different? | `UNKNOWN` |
| 9.3 | Are production endpoints different? | `UNKNOWN` |
| 9.4 | What merchant onboarding/KYC is required? | `UNKNOWN` |
| 9.5 | What production webhook configuration is required? | `UNKNOWN` |
| 9.6 | What transaction limits apply? | `UNKNOWN` |

### 10.4 Counts

| Category | Total Questions | Answered | Partially Answered | Unanswered |
|---|---|---|---|---|
| Payment | 6 | 4 | 2 | 1 |
| Webhook | 7 | 2 | 1 | 4 |
| Reconciliation | 6 | 2 | 0 | 4 |
| Funds | 8 | 0 | 0 | 8 |
| Fees | 5 | 2 | 1 | 2 |
| Currency | 3 | 0 | 2 | 1 |
| Production | 6 | 0 | 0 | 6 |
| **Total** | **41** | **10** | **6** | **26** |

---

## 11. Certification

This register was compiled from a review of the ImboniServe codebase for PAY-001
and represents the state of knowledge as of the date below. Every question marked
`UNKNOWN` or `UNVERIFIED` is an actionable item requiring resolution through one or
more of the following means:

- Review of authoritative InTouch documentation
- Execution of targeted sandbox tests (`SANDBOX-VERIFIED`)
- Observation in production (`PRODUCTION-VERIFIED`)
- Direct confirmation from InTouch support (`SUPPORT-CONFIRMED`)

No question in this register has been left implicit. Where an assumption exists in
the code, it has been surfaced as a question with the appropriate evidence
classification.

**Compiled by:** ImboniServe Engineering
**Date:** 2026-08-13
**Status:** Living document — update as evidence is gathered.
