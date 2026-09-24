# PAY-002 — InTouch Document Forensic Review

| Field | Value |
|---|---|
| Document ID | PAY-002-DOCUMENT-FORENSIC-REVIEW |
| Date | 2026-08-14 |
| Source Document | `http_intouchpay_api_v1.2.pdf` (15 pages, supplied by founder) |
| Extraction Method | `pypdf` text extraction, page-by-page, cross-checked against tables and examples |
| Governance | VERIFY — DO NOT ASSUME. No provider behavior invented where the document is silent. |

## 1. Purpose

This document is the authoritative extraction of everything the supplied InTouch API document states, organized by topic (A–Q per the PAY-002 mission brief). It is the single source of truth that all other PAY-002 deliverables cite back to. Where the document itself is internally inconsistent (example contradicts table, or one section contradicts another), both statements are recorded and the contradiction is flagged — no attempt is made to silently resolve it in the provider's favor.

## 2. Document Structure

| Page | Section |
|---|---|
| 1 | Title page |
| 2 | 1. API Functions, 1.1 Parameter requirement levels, 1.2 Request Format, 1.3 Response Format |
| 3 | 2. Receiving Payment Request — 2.1 Function, sequence diagram |
| 4 | 2.2 Request URI, 2.3 Request example, 2.4 Password Generation, 2.5 Request Parameters (start) |
| 5 | 2.5 Request Parameters (end), 2.6 Receiving Payment Response, 2.7 Receiving Payment Request Completion |
| 6 | 2.8 Complete Receiving Payment Request Completion Response, 2.9 Response Codes |
| 7 | 3. Sending Payment Request (RequestDeposit) — 3.1 Function, sequence diagram, 3.2 Request URI, 3.3 Request example (start) |
| 8 | 3.3 Request example (end), 3.4 Password Generation, 3.5 Request Parameters, 3.6 Making Payment Response |
| 9 | 3.7 Response Codes (start) |
| 10 | 3.7 Response Codes (end) |
| 11 | 4. Get Transaction Status — 4.1 Function, 4.2 Request URI, 4.3 Request example, 4.4 Password Generation |
| 12 | 4.5 Request Parameters, 4.6 Get Transaction Status Response |
| 13 | 4.7 Response Codes, 5. Balance Inquiry — 5.1–5.3 |
| 14 | 5.4 Password Generation, 5.5 Request Parameters, 5.6 Making Payment Response (mislabeled — should read "Get Balance Response") |
| 15 | 5.7 Response Codes |

## 3. Extracted Behavior by Topic (A–Q)

### A. RequestPayment

- **Purpose:** App (client) invokes RequestPayment to initiate a payment request to a subscriber. InTouch (server) responds `Pending`, then invokes the App's callback URL with the final status after subscriber USSD approval.
- **Endpoint:** `http://IP:Port/api/requestpayment/` (documented generically; the worked example uses `https://www.intouchpay.co.rw/api/requestpayment/`)
- **Timing:** "Intouchpay sends a response within 60 seconds by default" — this refers to the initial `Pending` acknowledgment, not the final USSD-confirmed outcome (which depends on subscriber action).
- **Encoding:** Section 1.2 states "Parameters are submitted to the intouchpay url as http-form post." The Section 2.3 example uses `requests.post(url, data=data)`, which is form-encoding in Python's `requests` library — consistent with 1.2.

### B. Payment completion callback (webhook)

- InTouch acts as **client**; it invokes the App (our server) via HTTP POST once the subscriber has confirmed or the transaction otherwise reaches a terminal state.
- Payload is wrapped: `{"jsonpayload": {requesttransactionid, transactionid, responsecode, status, statusdesc, referenceno}}`.
- Two documented request variants (Section 2.7):
  1. `requests.post(url, json={'jsonpayload': data}, headers={'content-type': 'application/json'}, verify=False)` — **no Basic Auth**.
  2. `requests.post(url, json={'jsonpayload': data}, auth=(username, password), headers={'content-type': 'application/json'}, verify=False)` — **with Basic Auth**.
- The document does not state which variant a given partner/account will actually receive, nor whether this is configurable. This is a genuine open question, not a code defect (see PAY-002-Webhook-Compatibility-Audit.md).
- Only a **success** example payload is shown (`responsecode: '01'`, `status: 'Successfull'`). **No failure/cancelled example payload is documented anywhere in the 15 pages.**
- Expected App acknowledgment (Section 2.8): `{"message": "success", "success": true, "request_id": "4522233"}` — HTTP 200. Note the field is `request_id` (underscore), not `requesttransactionid`.

### C. GetTransactionStatus

- **Purpose:** App queries the status of a previously submitted transaction.
- **Endpoint:** `http://IP:Port/api/gettransactionstatus/` (example: `https://www.intouchpay.co.rw/api/gettransactionstatus/`).
- **Encoding:** Section 4.3 example uses `requests.post(url, json=data)` — **JSON encoding**, which contradicts the blanket "http-form post" statement in Section 1.2. This is a genuine internal document contradiction (see Section 5 below).
- **Required parameters (4.5):** `username`, `timestamp`, `requesttransactionid`, `transactionid`, `password` — all marked Mandatory ("Yes").
- **Response codes distinguish payment vs. deposit success:** `01` = "Transaction Successful for Payment Transaction"; `2001` = "Transaction Successful for Deposit Transaction" (Section 4.7). This distinction is load-bearing for PAY-002 Phase 6.

### D. RequestDeposit

- **Purpose:** App invokes RequestDeposit to send money **to** a subscriber (the reverse direction of RequestPayment). InTouch is the server; it attempts the deposit and reports a status.
- **Endpoint:** `http://IP:Port/api/requestdeposit/`.
- **Encoding:** Section 3.3 example uses `requests.post(url, data=data)` — form-encoded, consistent with Section 1.2.
- **Additional parameters not present in RequestPayment:** `withdrawcharge` (integer, "Set to 1 to include Withdraw Charges in amount sent to subscriber"), `reason` (string), `sid` (integer, "Service ID. Set to 1 For Bulk Payments"). None of these three carry an explicit "Yes" in the Mandatory column (see Section 3.5 verbatim table — only `username`, `amount`, `mobilephoneno`, `requesttransactionid`, `accountno`, `password` are marked Yes).
- **Success response:** `{"requesttransactionid": "...", "referenceid": "...", "responsecode": "2001", "success": true}` — `referenceid` is documented to appear **only on success**.
- The document does **not** state that RequestDeposit is a merchant withdrawal/settlement mechanism. It documents a generic "send money to a subscriber" capability. See PAY-002-RequestDeposit-Assessment.md.

### E. GetBalance

- **Purpose:** App queries "account balance."
- **Endpoint:** `http://IP:Port/api/getbalance/`.
- **Encoding:** Section 5.3 example uses `requests.post(url, data=data)` — form-encoded.
- **Response:** `{"balance": "0.0", "success": true}` on success.
- The document does **not** state whether this balance represents the partner/merchant's spendable funds, a provider-side settlement wallet, or something else. See PAY-002-Sandbox-Readiness / GetBalance assessment in this review's Section 6.

### F. Authentication

- All five APIs (RequestPayment, RequestDeposit, GetTransactionStatus, GetBalance, and implicitly the callback response) use the same SHA256 password-hash scheme for the **outbound App → InTouch requests**. The inbound InTouch → App webhook callback is optionally protected by HTTP Basic Auth (Section 2.7), which is a *different* mechanism (plain username/password pair sent as an `Authorization` header, not a hash).

### G. Password/hash generation

- Formula (stated identically in Sections 2.4, 3.4, 4.4, 5.4):
  1. `username + accountno + partnerpassword + timestamp`
  2. SHA256 encrypt
  3. Hex digest
- Example: `password = hashlib.sha256(username+accountno+partnerpassword+timestamp).hexdigest()`
- **The illustrative example password value** (`'d3cfd05492a2376003f5af9e2e6643b67'`, used identically in every section's example) **is only 33 characters long. A valid SHA256 hexdigest is always exactly 64 lowercase hexadecimal characters.** This value is not a verifiable test vector — it is a placeholder. No worked example in the document allows independent verification of the hash algorithm against known-good input/output. See PAY-002-RequestPayment-Audit.md Section 3.

### H. Required parameters

See per-API tables above (A–E). Cross-API note: `username`, `accountno`, `password`, `timestamp` are mandatory across all five APIs. `requesttransactionid` is mandatory for RequestPayment, RequestDeposit, and GetTransactionStatus. `mobilephoneno` is mandatory for RequestPayment and RequestDeposit (not applicable to GetTransactionStatus/GetBalance).

### I. Optional parameters

- `callbackurl` — RequestPayment only, explicitly marked "No" (not mandatory) in Section 2.5.
- `withdrawcharge`, `reason`, `sid` — RequestDeposit only, not marked "Yes" in Section 3.5 (implicitly optional, though the document never uses the literal word "Optional" for them the way Section 1.1 defines the term).

### J. Timestamp requirements

- Format: `yyyymmddhhmmss`, "preferably" UTC (Sections 2.5, per RequestPayment). Note: Sections 4.5 (GetTransactionStatus) and 5.5 (GetBalance) literally print the format as `yyyymmddss` — missing `hhmm`. This is almost certainly a typographical omission in the source document rather than an intentional different format, but per governance this is recorded as written, not silently "corrected." See Section 5 below (document self-contradictions).

### K. Amount format

- RequestPayment (2.5): `amount` is "string/Float/Integer" — the document accepts multiple representations. Example value: `100` (bare integer).
- No minimum/maximum values are stated anywhere in the document (only the *existence* of limits is implied by response codes 2200 "Amount below minimum" / 2300 "Amount above maximum" for RequestPayment, and 1103/1104 for RequestDeposit).

### L. Transaction identifiers

- `requesttransactionid` — assigned by the App (our system), "Unique."
- `transactionid` — assigned by InTouch, returned in the RequestPayment response and required as an input to GetTransactionStatus.
- `referenceno` — appears in the payment completion callback (Section 2.7); relationship to `transactionid` is not explained.
- `referenceid` — appears in the RequestDeposit success response (Section 3.6); spelled differently from `referenceno` in the payment callback. The document does not clarify whether `referenceid` and `referenceno` are the same concept with inconsistent spelling or genuinely distinct fields.

### M. Callback format

See B above. Wrapped in `jsonpayload`. `Content-Type: application/json`.

### N. HTTP authentication

- Webhook callback: HTTP Basic Auth, optional per the two documented example variants (Section 2.7). No indication in the document of how a partner configures which variant they will receive.
- Outbound requests (App → InTouch): no HTTP-level authentication; only the SHA256 password field within the payload.

### O. Response codes

Full code tables extracted in PAY-002-Response-Code-Mapping.md. Critical finding: **response codes are not globally unique across APIs.** The same numeric code carries different meanings depending on which API returned it (e.g., `1100` = "Number not supported on this Mobile money network" for RequestPayment (2.9) vs. `1100` = "Error in Request" for RequestDeposit (3.7); `2600` = "Operation Not Allowed" for RequestPayment vs. `2600` = "Network Failure - Request Timed Out" for RequestDeposit).

### P. Pending/success/failure semantics

- RequestPayment initial response is always `status: "Pending"` with `responsecode: "1000"` on acceptance — the terminal outcome is never in the initial response (doc 2.6).
- Terminal success for a **payment** is `responsecode: "01"`.
- Terminal success for a **deposit** is `responsecode: "2001"`.
- The document defines these two as explicitly distinct in the GetTransactionStatus code table (4.7) but does not repeat the distinction in the RequestPayment code table (2.9), which only lists `01` = "Successfull" without mentioning `2001` at all (2001 is absent from the 2.9 table). This means: `2001` is not a documented possible outcome of a RequestPayment status check, and its appearance in a RequestPayment context would be unexpected per the document.
- No failure/cancelled webhook example exists (see B).

### Q. Provider timeout behavior

- "Intouchpay sends a response within 60 seconds by default" is stated for RequestPayment, RequestDeposit, and GetTransactionStatus (Sections 2.1, 3.1, 4.1, 5.1) — this describes the synchronous HTTP response window for the initial API call, not the total time the subscriber has to approve a USSD prompt (which is unbounded in the document).
- No retry policy is documented for the webhook callback (whether InTouch retries a failed callback delivery, how many times, or with what backoff).

## 4. Cross-Reference: Examples vs. Tables (Discrepancies Found)

Per the governance instruction "do not rely only on the examples… compare examples with the parameter tables and response-code tables," the following discrepancies were found **within the document itself**:

| # | Location | Example says | Table/other section says | Status |
|---|---|---|---|---|
| 1 | RequestPayment (2.3 vs 2.5) | Example omits `accountno` entirely | Table (2.5) marks `accountno` as Mandatory ("Yes") | CONTRADICTION — table treated as authoritative |
| 2 | RequestPayment (2.3 vs 2.5) | Example uses key `mobilephone` | Table (2.5) names the field `mobilephoneno` | CONTRADICTION — genuinely ambiguous, PROVIDER-CONFIRMATION-REQUIRED |
| 3 | GetTransactionStatus (4.3 vs 1.2) | Example uses `requests.post(url, json=data)` (JSON) | Section 1.2 states all requests are "http-form post" | CONTRADICTION — API-specific example vs. generic statement |
| 4 | GetTransactionStatus (4.6 vs 4.7) | Failure example shows `"responsecode": "3200"` for "Transaction Doesn't Exist" | Table (4.7) maps `3200` = "Missing Request Transaction ID Information" and `3100` = "Transaction Doesn't Exist" | DIRECT CONTRADICTION within the same section |
| 5 | GetBalance (5.3 vs 5.5) | Example omits `accountno` entirely | Table (5.5) marks `accountno` as Mandatory ("Yes") | CONTRADICTION — same pattern as #1 |
| 6 | GetBalance failure response (5.6) | `"responsecode": "007"` | Section 5.7 table lists the code as `"0007"` | Likely typo — three-digit vs four-digit code string |
| 7 | Password example value (2.4, 3.4, 4.4, 5.4) | `'d3cfd05492a2376003f5af9e2e6643b67'` (33 chars) | A valid SHA256 hexdigest is 64 hex characters | Illustrative placeholder, not a valid hash — cannot be used as a test vector |
| 8 | Timestamp format (2.5 vs 4.5/5.5) | RequestPayment table states `yyyymmddhhmmss` | GetTransactionStatus (4.5) and GetBalance (5.5) tables state `yyyymmddss` | Likely typo (missing `hhmm`) in 4.5/5.5 |
| 9 | Response code `1100` | RequestPayment table (2.9): "Number not supported on this Mobile money network" | RequestDeposit table (3.7): "Error in Request" | Same code, different API, different meaning — codes are NOT globally unique |
| 10 | Response code `2600` | RequestPayment table (2.9): "Operation Not Allowed" | RequestDeposit table (3.7): "Network Failure - Request Timed Out" | Same code, different API, different meaning |
| 11 | Section 5.6 heading | Literally titled "MAKING PAYMENT RESPONSE" | Content describes GetBalance's response, not a payment | Copy-paste heading error in the document; content is unambiguous, no code impact |

None of these are resolved by assumption. Each is carried forward into the relevant audit document with an explicit PROVIDER-CONFIRMATION-REQUIRED or INFO classification.

## 5. What This Review Does NOT Establish

- Whether InTouch's live sandbox/production servers actually behave as documented (this document is provider-authored specification, not an observed behavior log).
- Which of the two documented webhook auth variants (with/without Basic Auth) our specific partner account will receive.
- Which of `mobilephone` / `mobilephoneno` is the field name the server actually parses.
- Whether RequestDeposit constitutes a merchant settlement/withdrawal mechanism (it does not say this — see PAY-002-RequestDeposit-Assessment.md).
- Minimum/maximum transaction amounts, fee percentages, settlement timing, or funds availability — none of these are covered anywhere in this 15-page document.

## 6. Certification of This Review

This review is a faithful, page-by-page transcription and cross-check of the supplied document. It introduces no assumptions about InTouch's actual runtime behavior beyond what is written. All downstream PAY-002 deliverables cite this document as their source of truth for "what InTouch says," and cite the codebase separately for "what ImboniServe does."
