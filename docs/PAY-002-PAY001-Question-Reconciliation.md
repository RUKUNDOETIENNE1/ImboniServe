# PAY-002 — PAY-001 Question Reconciliation

| Field | Value |
|---|---|
| Document ID | PAY-002-PAY001-QUESTION-RECONCILIATION |
| Date | 2026-08-14 |
| Source | `PAY-001-InTouch-Questions-and-Evidence-Register.md` (41 questions, 10 answered / 6 partial / 26 unanswered before PAY-002) |

## 1. Method

Every one of PAY-001's 41 questions is re-evaluated against the newly supplied `http_intouchpay_api_v1.2.pdf`. Each is reclassified as:
- **ANSWERED BY DOCUMENT** — the document directly and unambiguously answers it.
- **PARTIALLY ANSWERED** — the document narrows the question but leaves a residual gap.
- **NOT ANSWERED** — the document is silent; status unchanged from PAY-001.
- **CONTRADICTED BY DOCUMENT** — the document reveals the PAY-001 assumption was wrong.

No question is discarded. Wording is improved where the document supplies better terminology.

## 2. Payment Questions (Section 3, PAY-001)

| # | Question | PAY-001 Status | PAY-002 Reclassification | Detail |
|---|---|---|---|---|
| 3.1 | What exactly constitutes payment success? | DOCUMENTED (codes `01`, `1110`, `2001` all treated as success) | **CONTRADICTED BY DOCUMENT** | The document (4.7) shows `01` = payment success and `2001` = **deposit** success — a different transaction type. `1110` is not a success code at all (it's RequestDeposit's "Duplicate Remit ID," Section 3.7). Only `01` is a valid payment-success code. Code fixed accordingly (PAY-002-TransactionStatus-Audit.md). |
| 3.2 | What provider status values exist? | DOCUMENTED (partial) | **NOT ANSWERED (unchanged)** | The document's webhook example only shows `status: "Successfull"`. No failure/pending/cancelled status string examples exist anywhere in the 15 pages. The code's tolerance for `successful`/`success`/`completed`/`failed`/`cancelled` variants remains an assumption, not document-derived. |
| 3.3 | What is the unique provider transaction ID? | DOCUMENTED | **ANSWERED BY DOCUMENT (confirmed)** | `transactionid` (provider-assigned) vs. `requesttransactionid` (App-assigned) — confirmed exactly as PAY-001 stated, across RequestPayment (2.6), the webhook callback (2.7), and GetTransactionStatus (4.3/4.5). |
| 3.4 | Is transaction status queryable? | DOCUMENTED ("`paymentstatus` endpoint") | **CONTRADICTED BY DOCUMENT (endpoint name)** | The correct documented name and path is `gettransactionstatus` (`/api/gettransactionstatus/`), not `paymentstatus`. This was a real code defect (wrong endpoint), now fixed. The underlying question ("is it queryable") is confirmed yes. |
| 3.5 | How long can a payment remain pending? | UNKNOWN | **PARTIALLY ANSWERED** | The document states InTouch's own API response window is "60 seconds by default" for the *initial* RequestPayment/GetTransactionStatus call — but this is not the same as how long a `Pending` transaction can remain unresolved while awaiting subscriber USSD approval, which remains UNKNOWN. ImboniServe's own 20-minute reconciler timeout is a self-imposed business rule, not a documented provider limit. |
| 3.6 | What is the minimum/maximum transaction amount? | DOCUMENTED (existence) / UNKNOWN (values) | **NOT ANSWERED (values still unknown)** | Response codes `2200`/`2300` (RequestPayment) and `1103`/`1104` (RequestDeposit) confirm limits exist; no numeric values are given anywhere in the document. |

## 3. Webhook Questions (Section 4, PAY-001)

| # | Question | PAY-001 Status | PAY-002 Reclassification | Detail |
|---|---|---|---|---|
| 4.1 | What events are sent? | DOCUMENTED | **ANSWERED BY DOCUMENT (confirmed)** | Only a payment-completion callback is documented. No other webhook event type (settlement, withdrawal, refund) appears anywhere in the 15 pages. |
| 4.2 | How are webhooks authenticated? | DOCUMENTED (Basic Auth mandatory) | **PARTIALLY ANSWERED — important nuance found** | The document shows **two** variants: with and without Basic Auth (Section 2.7). It does not state Basic Auth is mandatory — that was ImboniServe's own design decision (per `PAY-001-InTouch-Sandbox-Integration-Report.md` Section 9.1), not a provider requirement. This raises a new, higher-priority open question: which variant will our account actually receive? See PAY-002-Webhook-Compatibility-Audit.md. |
| 4.3 | Are signatures provided? | UNVERIFIED | **NOT ANSWERED (unchanged)** | The document does not mention any HMAC or cryptographic signature mechanism for the webhook at all — only the two Basic Auth variants. ImboniServe's `x-intouch-signature` support is defense-in-depth for a mechanism the document does not describe; it should not be relied upon as a primary control. |
| 4.4 | What retry policy exists? | UNKNOWN | **NOT ANSWERED (unchanged)** | No retry behavior is documented anywhere. |
| 4.5 | What is the unique event ID? | UNKNOWN | **NOT ANSWERED (unchanged)** | No dedicated webhook event ID field exists in the documented payload; `transactionid`/`requesttransactionid` are transaction identifiers, not event identifiers. |
| 4.6 | How long are retries performed? | UNKNOWN | **NOT ANSWERED (unchanged)** | Depends on 4.4, still unknown. |
| 4.7 | Can webhook delivery be duplicated? | UNKNOWN | **NOT ANSWERED (unchanged)** | Not addressed; ImboniServe's own idempotency guards (verified sound, see MPCA-001A) remain the only protection regardless of the answer. |

## 4. Reconciliation Questions (Section 5, PAY-001)

| # | Question | PAY-001 Status | PAY-002 Reclassification | Detail |
|---|---|---|---|---|
| 5.1 | Can transactions be queried? | DOCUMENTED | **ANSWERED BY DOCUMENT (confirmed, endpoint corrected)** | Yes, via GetTransactionStatus (corrected endpoint). |
| 5.2 | Can transaction history be downloaded? | UNKNOWN | **NOT ANSWERED (unchanged)** | No such endpoint appears in the document. |
| 5.3 | Is there a merchant balance API? | DOCUMENTED | **PARTIALLY ANSWERED — whose balance is unclear** | GetBalance exists and is documented (Section 5), but the document never states whose balance it represents (merchant's collected funds vs. a provider-side operating account). See PAY-002-Sandbox-Readiness-Report.md / GetBalance findings. |
| 5.4 | Is there a settlement report? | UNKNOWN | **NOT ANSWERED (unchanged)** | No settlement concept appears anywhere in the document. |
| 5.5 | Is there a withdrawal report? | UNKNOWN | **NOT ANSWERED (unchanged)** | No withdrawal-report concept appears; only RequestDeposit (a generic send-to-subscriber capability) exists — see PAY-002-RequestDeposit-Assessment.md. |
| 5.6 | Can individual payments be reconciled to settlements? | UNKNOWN | **NOT ANSWERED (unchanged)** | No settlement concept exists in the document to reconcile against. |

## 5. Funds Questions (Section 6, PAY-001)

| # | Question | PAY-001 Status | PAY-002 Reclassification | Detail |
|---|---|---|---|---|
| 6.1 | When do funds become available? | UNKNOWN | **NOT ANSWERED (unchanged)** | Not addressed anywhere in the document. |
| 6.2 | Is same-day withdrawal supported? | UNKNOWN | **NOT ANSWERED (unchanged)** | No withdrawal concept documented distinct from RequestDeposit. |
| 6.3 | Is withdrawal manual or automatic? | UNKNOWN | **NOT ANSWERED (unchanged)** | — |
| 6.4 | Can merchants withdraw every day? | UNKNOWN | **NOT ANSWERED (unchanged)** | — |
| 6.5 | Are weekends/holidays different? | UNKNOWN | **NOT ANSWERED (unchanged)** | — |
| 6.6 | Are there withdrawal fees? | UNKNOWN | **NOT ANSWERED (unchanged)** | RequestDeposit's `withdrawcharge` parameter ("Set to 1 to include Withdraw Charges in amount sent to subscriber") confirms a charge concept exists for deposits, but does not quantify it or confirm it applies to merchant withdrawal specifically (which remains an unproven concept — see 5.5/5.6 and PAY-002-RequestDeposit-Assessment.md). Reclassify as **PARTIALLY ANSWERED**. |
| 6.7 | Are there minimum/maximum withdrawal limits? | UNKNOWN | **NOT ANSWERED (unchanged)** | — |
| 6.8 | What withdrawal destinations are supported? | UNKNOWN | **PARTIALLY ANSWERED** | RequestDeposit only documents Mobile Money subscriber numbers as a destination — no bank account or other destination type is mentioned. This narrows (but does not fully answer) the original question. |

## 6. Fee Questions (Section 7, PAY-001)

| # | Question | PAY-001 Status | PAY-002 Reclassification | Detail |
|---|---|---|---|---|
| 7.1 | What gateway fee applies? | DOCUMENTED (estimate) / UNKNOWN (actual) | **NOT ANSWERED (unchanged)** | No fee percentage or amount is stated anywhere in the document. |
| 7.2 | Is the fee included in the API response? | NOT SUPPORTED | **ANSWERED BY DOCUMENT (confirmed)** | Neither the RequestPayment response, RequestDeposit response, GetTransactionStatus response, nor the webhook callback contains any fee-related field. |
| 7.3 | When is the fee deducted? | UNKNOWN | **NOT ANSWERED (unchanged)** | — |
| 7.4 | Can the platform fee be represented separately? | DOCUMENTED (code-level, unrelated to provider) | **UNCHANGED — this was always a code-architecture fact, not a provider question** | — |
| 7.5 | Is split settlement supported? | UNKNOWN | **NOT ANSWERED (unchanged)** | No settlement concept exists in the document at all. |

## 7. Currency Questions (Section 8, PAY-001)

| # | Question | PAY-001 Status | PAY-002 Reclassification | Detail |
|---|---|---|---|---|
| 8.1 | What currencies are supported? | UNKNOWN (inferred RWF) | **PARTIALLY ANSWERED** | Every worked example uses a Rwandan phone number format (`250...`) and the sandbox host is `intouchpay.co.rw`. The document never states RWF explicitly as the only currency, but nothing contradicts the RWF inference either. |
| 8.2 | Can merchant currency differ from platform currency? | UNVERIFIED | **NOT ANSWERED (unchanged)** | — |
| 8.3 | How are currency conversions handled? | UNKNOWN | **NOT ANSWERED (unchanged)** | No conversion mechanism is documented; `amount` is a bare numeric field with no currency code parameter anywhere in any of the five APIs. |

## 8. Production Questions (Section 9, PAY-001)

| # | Question | PAY-001 Status | PAY-002 Reclassification | Detail |
|---|---|---|---|---|
| 9.1 | What changes between sandbox and production? | UNKNOWN | **NOT ANSWERED (unchanged)** | The document makes no sandbox/production distinction at all — it describes one API, one host pattern (`IP:Port`, exemplified as `www.intouchpay.co.rw`). |
| 9.2 | Are production credentials different? | UNKNOWN (likely yes) | **NOT ANSWERED (unchanged)** | — |
| 9.3 | Are production endpoints different? | UNKNOWN (same URL used in code) | **NOT ANSWERED (unchanged)** | Document's generic URI format `http://IP:Port/api/...` suggests IP/port may be assigned per-partner ("Contact carriers to obtain the IP address and port number" — Sections 2.2, 3.2, 4.2, 5.2), which could imply sandbox and production use different IP:Port pairs. This is a plausible inference, not a confirmed answer. |
| 9.4 | What merchant onboarding/KYC is required? | UNKNOWN | **NOT ANSWERED (unchanged)** | — |
| 9.5 | What production webhook configuration is required? | UNKNOWN | **NOT ANSWERED (unchanged)** | — |
| 9.6 | What transaction limits apply? | UNKNOWN | **NOT ANSWERED (unchanged)** | — |

## 9. Updated Counts

| Category | Total | Answered (incl. reclassified) | Partially Answered | Contradicted | Unanswered |
|---|---|---|---|---|---|
| Payment | 6 | 2 | 2 | 2 | 1 |
| Webhook | 7 | 1 | 2 | 0 | 4 |
| Reconciliation | 6 | 1 | 1 | 0 | 4 |
| Funds | 8 | 0 | 2 | 0 | 6 |
| Fees | 5 | 1 | 0 | 0 | 4 (incl. one unchanged code-level fact) |
| Currency | 3 | 0 | 1 | 0 | 2 |
| Production | 6 | 0 | 1 | 0 | 5 |
| **Total** | **41** | **5** | **9** | **2** | **26** (with overlapping reclassification of prior "answered" items) |

**Net effect:** the document meaningfully improves precision on webhook authentication (revealing our "mandatory Basic Auth" assumption is ImboniServe's own choice, not provider-confirmed) and corrects two previously-wrong assumptions (endpoint name, success-code set) — both of which are now fixed in code. It does **not** answer any of the settlement, withdrawal, funds-availability, fee-amount, or production-difference questions, which remain the dominant open surface (26 of 41 questions still fully unanswered).

## 10. Prioritized Final Question List

See `PAY-002-InTouch-Provider-Questions.md` for the consolidated, prioritized list to send to InTouch, organized by what blocks (1) sandbox payment, (2) webhook verification, (3) settlement/funds availability, (4) reconciliation, (5) production activation, (6) Tap & Leave/future disbursement.
